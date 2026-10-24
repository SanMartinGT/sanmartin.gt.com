import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { link, lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import test from 'node:test';
import { verifySqlSources } from './verificar-sql-vigente.mjs';

// Fixtures sintéticos en una carpeta creada por esta prueba. Sin red, claves,
// base de datos ni escrituras en fuentes/artefactos de la tienda.
const PROJECT_REF = 'beasfybalepkdlomzazf';
const BASELINE_FILE = 'supabase/baseline/h01-test.json';
const MANIFEST_FILE = 'supabase/historico/manifest.json';
const ARCHIVED_FILE = 'supabase/historico/2026-10-23/supabase-antiguo.sql.historico';
const PROPOSAL_FILE = 'scripts/activar-webhook-catalogo.sql';
const MIGRATION_FILE = 'supabase/migrations/20261023000000_ajuste_diferencial.sql';
const REVIEW_FILE = 'supabase/revisiones/20261023000000_ajuste_diferencial.json';
const LEGACY = '-- SQL histórico sintético\nselect 1;\n';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const baseline = {
  kind: 'h01_read_only_catalog_snapshot', project_ref: PROJECT_REF,
  migration_history: [{ version: '20261022013039', name: 'baseline_sintetico' }],
  latest_migration: { version: '20261022013039', name: 'baseline_sintetico' }, metadata: {},
};

async function put(root, path, value) {
  const target = join(root, ...path.split('/'));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, value);
}

async function putJson(root, path, value) {
  await put(root, path, JSON.stringify(value, null, 2) + '\n');
}

async function readJson(root, path) {
  return JSON.parse(await readFile(join(root, ...path.split('/')), 'utf8'));
}

async function fixture(run) {
  const tempRoot = await realpath(tmpdir());
  const root = await mkdtemp(join(tempRoot, 'sanmartin-sql-vigente-'));
  try {
    await putJson(root, BASELINE_FILE, baseline);
    const baselineHash = sha256(await readFile(join(root, BASELINE_FILE)));
    await put(root, ARCHIVED_FILE, LEGACY);
    await put(root, PROPOSAL_FILE, '-- Propuesta sintética, no aplicada.\nselect 2;\n');
    await putJson(root, MANIFEST_FILE, {
      format_version: 1, project_ref: PROJECT_REF, archived_on: '2026-10-23',
      expected_legacy_count: 1, baseline_file: BASELINE_FILE, baseline_sha256: baselineHash,
      files: [{ original_path: 'supabase-antiguo.sql', archived_path: ARCHIVED_FILE,
        sha256: sha256(LEGACY), reason: 'Regla histórica de prueba.', current_contract: 'Contrato de prueba actual.' }],
      proposals: [{ path: PROPOSAL_FILE, state: 'proposal_not_applied' }],
    });
    await run(root);
  } finally {
    // Validar el destino final antes del único borrado recursivo de la prueba.
    const target = resolve(root), rel = relative(tempRoot, target), info = await lstat(target);
    assert.ok(rel && rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel)
      && !rel.includes(sep) && rel.startsWith('sanmartin-sql-vigente-'), 'Destino temporal de limpieza inválido.');
    assert.equal(info.isSymbolicLink(), false, 'La raíz temporal no puede sustituirse por un enlace.');
    assert.equal(await realpath(target), target, 'La raíz temporal resolvió a otro destino.');
    await rm(target, { recursive: true, force: true });
  }
}

async function addMigration(root, sql = '-- Cambio nuevo sintético\nselect 3;\n', changes = {}) {
  await put(root, MIGRATION_FILE, sql);
  await putJson(root, REVIEW_FILE, {
    format_version: 1, project_ref: PROJECT_REF, migration_file: MIGRATION_FILE,
    migration_sha256: sha256(sql), baseline_file: BASELINE_FILE,
    baseline_sha256: sha256(await readFile(join(root, BASELINE_FILE))),
    based_on_migration: baseline.latest_migration.version,
    reason: 'Cambio pequeño de prueba.', before_after: 'Antes: 2. Después: 3.',
    verification: 'Comprobación offline sintética; no se ejecuta SQL.', ...changes,
  });
}

async function rejects(root, code) {
  await assert.rejects(verifySqlSources(root), error => {
    assert.equal(error.code, code, error.message);
    return true;
  });
}

test('baseline: un histórico íntegro y una propuesta pendiente', () => fixture(async root => {
  assert.deepEqual(await verifySqlSources(root), {
    project_ref: PROJECT_REF, archived_count: 1, migration_count: 0,
    proposal_count: 1, baseline_file: BASELINE_FILE,
  });
}));

test('rechaza SQL raíz aunque se renombre', () => fixture(async root => {
  await put(root, 'otra-instalacion.sql', LEGACY);
  await rejects(root, 'UNAPPROVED_SQL');
}));

test('rechaza SQL fuera de migraciones y allowlist', () => fixture(async root => {
  await put(root, 'otra-carpeta/instalar.sql', 'select 4;');
  await rejects(root, 'UNAPPROVED_SQL');
}));

test('rechaza SQL ejecutable dentro del histórico', () => fixture(async root => {
  await put(root, 'supabase/historico/2026-10-23/reinstalar.SQL', LEGACY);
  await rejects(root, 'EXECUTABLE_HISTORY');
}));

test('rechaza histórico adicional no declarado', () => fixture(async root => {
  await put(root, 'supabase/historico/2026-10-23/extra.sql.historico', LEGACY);
  await rejects(root, 'UNMANIFESTED_HISTORY');
}));

test('rechaza hash alterado de archivo histórico', () => fixture(async root => {
  await put(root, ARCHIVED_FILE, LEGACY + 'select 5;');
  await rejects(root, 'HASH_MISMATCH');
}));

test('comprueba tamaño en bytes cuando el manifiesto lo declara', () => fixture(async root => {
  const manifest = await readJson(root, MANIFEST_FILE);
  manifest.files[0].bytes = Buffer.byteLength(LEGACY);
  await putJson(root, MANIFEST_FILE, manifest);
  assert.equal((await verifySqlSources(root)).archived_count, 1);
  manifest.files[0].bytes++;
  await putJson(root, MANIFEST_FILE, manifest);
  await rejects(root, 'SIZE_MISMATCH');
}));

test('rechaza histórico faltante', () => fixture(async root => {
  await rm(join(root, ARCHIVED_FILE));
  await rejects(root, 'MISSING_FILE');
}));

test('rechaza duplicados y conteo desigual en manifiesto', () => fixture(async root => {
  const manifest = await readJson(root, MANIFEST_FILE);
  manifest.files.push(manifest.files[0]);
  await putJson(root, MANIFEST_FILE, manifest);
  await rejects(root, 'MANIFEST_INVALID');
  manifest.expected_legacy_count = 2;
  await putJson(root, MANIFEST_FILE, manifest);
  await rejects(root, 'MANIFEST_INVALID');
}));

test('rechaza rutas de traversal en manifiesto', () => fixture(async root => {
  const manifest = await readJson(root, MANIFEST_FILE);
  manifest.files[0].archived_path = '../fuera.sql.historico';
  await putJson(root, MANIFEST_FILE, manifest);
  await rejects(root, 'UNSAFE_PATH');
}));

test('rechaza ampliar la allowlist desde el manifiesto', () => fixture(async root => {
  const manifest = await readJson(root, MANIFEST_FILE);
  manifest.proposals.push({ path: 'scripts/nueva-instalacion.sql', state: 'proposal_not_applied' });
  await put(root, 'scripts/nueva-instalacion.sql', 'select 6;');
  await putJson(root, MANIFEST_FILE, manifest);
  await rejects(root, 'PROPOSAL_INVALID');
}));

test('rechaza migración sin revisión', () => fixture(async root => {
  await put(root, MIGRATION_FILE, 'select 7;');
  await rejects(root, 'MIGRATION_REVIEW_REQUIRED');
}));

test('rechaza copia histórica con otro nombre y cambios CRLF/espacios', () => fixture(async root => {
  await addMigration(root, '\r\n' + LEGACY.replace(/\n/g, '\r\n') + '\r\n');
  await rejects(root, 'LEGACY_COPY');
}));

test('rechaza revisión con archivo/hash/proyecto distintos', () => fixture(async root => {
  await addMigration(root, 'select 8;', { migration_file: 'supabase/migrations/20261023000001_otro.sql' });
  await rejects(root, 'REVIEW_MISMATCH');
  await addMigration(root, 'select 8;', { migration_sha256: '0'.repeat(64) });
  await rejects(root, 'HASH_MISMATCH');
  await addMigration(root, 'select 8;', { project_ref: 'otro_proyecto' });
  await rejects(root, 'REVIEW_MISMATCH');
}));

test('rechaza revisión sin motivo/verificación y con ancla distinta', () => fixture(async root => {
  await addMigration(root, 'select 9;', { verification: ' ' });
  await rejects(root, 'REVIEW_MISMATCH');
  await addMigration(root, 'select 9;', { based_on_migration: '20200101000000' });
  await rejects(root, 'REVIEW_MISMATCH');
}));

test('rechaza baseline fuera de carpeta o con hash distinto', () => fixture(async root => {
  await addMigration(root, 'select 10;', { baseline_file: 'otro/baseline.json' });
  await rejects(root, 'BASELINE_INVALID');
  await addMigration(root, 'select 10;', { baseline_sha256: '0'.repeat(64) });
  await rejects(root, 'HASH_MISMATCH');
}));

test('rechaza baseline cuyo latest no coincide con historial', () => fixture(async root => {
  const changed = structuredClone(baseline);
  changed.latest_migration.name = 'otro';
  await putJson(root, BASELINE_FILE, changed);
  const manifest = await readJson(root, MANIFEST_FILE);
  manifest.baseline_sha256 = sha256(await readFile(join(root, BASELINE_FILE)));
  await putJson(root, MANIFEST_FILE, manifest);
  await rejects(root, 'BASELINE_INVALID');
}));

test('rechaza nombre inválido de migración y revisión huérfana', () => fixture(async root => {
  await put(root, 'supabase/migrations/ajuste.sql', 'select 11;');
  await rejects(root, 'UNAPPROVED_SQL');
  await rm(join(root, 'supabase/migrations/ajuste.sql'));
  await putJson(root, REVIEW_FILE, {});
  await rejects(root, 'ORPHAN_REVIEW');
}));

test('rechaza enlaces duros dentro de las fuentes', () => fixture(async root => {
  await link(join(root, ARCHIVED_FILE), join(root, 'copia-enlazada.txt'));
  await rejects(root, 'LINK_NOT_ALLOWED');
}));

test('excluye solo carpetas derivadas de primer nivel', () => fixture(async root => {
  for (const top of ['.git', '_site', 'work', 'node_modules']) await put(root, `${top}/fixture.sql`, LEGACY);
  assert.equal((await verifySqlSources(root)).archived_count, 1);
  await put(root, 'fuentes/work/fixture.sql', LEGACY);
  await rejects(root, 'UNAPPROVED_SQL');
}));

test('acepta delta nuevo con revisión completa e íntegra', () => fixture(async root => {
  await addMigration(root);
  const result = await verifySqlSources(root);
  assert.equal(result.migration_count, 1);
  assert.equal(result.archived_count, 1);
}));

test('H02: una ficha válida no permite reinstalar el trigger antiguo con otro nombre', () => fixture(async root => {
  await addMigration(root, `create trigger nombre_nuevo before update of estado on public.pedidos_ecommerce
    for each row execute function public.procesar_estado_pedido_ecommerce();`);
  await rejects(root, 'LEGACY_ORDER_FLOW');
}));

test('H02: la propuesta SQL también se comprueba aunque esté en la allowlist H01', () => fixture(async root => {
  await put(root, PROPOSAL_FILE, `create trigger pedidos_ecommerce_procesar_reserva
    before update on public.pedidos_ecommerce for each row execute function public.otra_funcion();`);
  await rejects(root, 'LEGACY_ORDER_FLOW');
}));

test('H02: admite retirar el trigger y revocar la función antigua con ficha íntegra', () => fixture(async root => {
  await addMigration(root, `drop trigger if exists pedidos_ecommerce_procesar_reserva on public.pedidos_ecommerce;
    revoke all on function public.procesar_estado_pedido_ecommerce() from public;`);
  assert.equal((await verifySqlSources(root)).migration_count, 1);
}));

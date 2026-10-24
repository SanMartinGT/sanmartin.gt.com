import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertNoLegacyOrderSql } from './reglas-pedidos-sql.mjs';

// Guardia local de integridad. No ejecuta SQL, consulta la red ni demuestra
// que una migración sea semánticamente diferencial o que su baseline sea reciente.
const PROJECT_REF = 'beasfybalepkdlomzazf';
const MANIFEST_FILE = 'supabase/historico/manifest.json';
const EXCLUDED_TOP = new Set(['.git', '_site', 'work', 'node_modules']);
const PROPOSALS = new Set(['scripts/activar-webhook-catalogo.sql']);
const HASH = /^[a-f0-9]{64}$/;
const MIGRATION = /^supabase\/migrations\/(\d{14})_([a-z0-9]+(?:_[a-z0-9]+)*)\.sql$/;
const VERSION = /^\d{14}$/;

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonempty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function safePath(value, label) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes(':')
      || /[\u0000-\u001f\u007f]/.test(value) || isAbsolute(value)
      || value.split('/').some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part))) {
    fail('UNSAFE_PATH', `Ruta relativa no segura en ${label}.`);
  }
  return value;
}

function baselinePath(value) {
  const path = safePath(value, 'baseline_file');
  if (!path.startsWith('supabase/baseline/') || !path.endsWith('.json')) {
    fail('BASELINE_INVALID', 'baseline_file debe estar bajo supabase/baseline/ y terminar en .json.');
  }
  return path;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function normalizedSql(bytes) {
  return bytes.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
}

function within(root, path) {
  const rel = relative(root, path);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
}

async function inventory(root) {
  const rootPath = resolve(root);
  let rootInfo;
  try { rootInfo = await lstat(rootPath); }
  catch { fail('ROOT_INVALID', 'La raíz de fuentes no existe o no es accesible.'); }
  if (rootInfo.isSymbolicLink()) fail('LINK_NOT_ALLOWED', 'La raíz de fuentes no puede ser un enlace.');
  if (!rootInfo.isDirectory()) fail('ROOT_INVALID', 'La raíz de fuentes debe ser una carpeta.');
  const realRoot = await realpath(rootPath);
  const files = new Map(), casePaths = new Set();

  async function walk(directory, prefix = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
    for (const entry of entries) {
      if (!prefix && EXCLUDED_TOP.has(entry.name)) continue;
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      safePath(name, 'fuentes');
      const folded = name.toLowerCase();
      if (casePaths.has(folded)) fail('PATH_COLLISION', `Rutas que solo difieren en mayúsculas: ${name}.`);
      casePaths.add(folded);
      const path = resolve(directory, entry.name), info = await lstat(path);
      if (info.isSymbolicLink() || (info.isFile() && info.nlink > 1)) {
        fail('LINK_NOT_ALLOWED', `No se permiten enlaces en fuentes: ${name}.`);
      }
      if (!within(realRoot, await realpath(path))) fail('UNSAFE_PATH', `Ruta fuera de fuentes: ${name}.`);
      if (info.isDirectory()) await walk(path, name);
      else if (info.isFile()) files.set(name, path);
      else fail('FILE_TYPE_INVALID', `Tipo de archivo no permitido: ${name}.`);
    }
  }

  await walk(realRoot);
  return files;
}

/**
 * Verifica fuentes SQL sin red ni escrituras. Devuelve conteos si todo coincide;
 * lanza un Error con code estable si falta un archivo o falla una regla.
 * El manifiesto y las revisiones deben revisarse en Git: sus hashes no son firmas.
 */
export async function verifySqlSources(root = process.cwd()) {
  const files = await inventory(root);
  async function bytes(path) {
    safePath(path, 'archivo requerido');
    if (!files.has(path)) fail('MISSING_FILE', `Falta el archivo requerido: ${path}.`);
    try { return await readFile(files.get(path)); }
    catch { fail('READ_FAILED', `No se pudo leer: ${path}.`); }
  }
  async function json(path) {
    const content = await bytes(path);
    try { return { value: JSON.parse(content.toString('utf8')), content }; }
    catch { fail('JSON_INVALID', `JSON inválido: ${path}.`); }
  }
  function checkHash(content, expected, path) {
    if (typeof expected !== 'string' || !HASH.test(expected)) {
      fail('HASH_INVALID', `SHA-256 inválido para ${path}.`);
    }
    if (sha256(content) !== expected) fail('HASH_MISMATCH', `SHA-256 distinto del registrado: ${path}.`);
  }

  const { value: manifest } = await json(MANIFEST_FILE);
  if (!record(manifest) || manifest.format_version !== 1 || manifest.project_ref !== PROJECT_REF
      || !Number.isSafeInteger(manifest.expected_legacy_count) || manifest.expected_legacy_count < 1
      || !Array.isArray(manifest.files) || manifest.files.length !== manifest.expected_legacy_count
      || !Array.isArray(manifest.proposals) || typeof manifest.archived_on !== 'string'
      || !/^\d{4}-\d{2}-\d{2}$/.test(manifest.archived_on)
      || !Number.isFinite(Date.parse(manifest.archived_on + 'T00:00:00Z'))
      || new Date(manifest.archived_on + 'T00:00:00Z').toISOString().slice(0, 10) !== manifest.archived_on) {
    fail('MANIFEST_INVALID', 'El manifiesto debe tener formato/proyecto/fecha/conteo válidos y listas de archivos/propuestas.');
  }

  const baselineCache = new Map();
  async function readBaseline(pathValue, expectedHash) {
    const path = baselinePath(pathValue);
    let parsed = baselineCache.get(path);
    if (!parsed) {
      parsed = await json(path);
      const value = parsed.value;
      if (!record(value) || value.kind !== 'h01_read_only_catalog_snapshot' || value.project_ref !== PROJECT_REF
          || !Array.isArray(value.migration_history) || !value.migration_history.length
          || !record(value.latest_migration) || !record(value.metadata)) {
        fail('BASELINE_INVALID', `Baseline sin estructura de catálogo válida: ${path}.`);
      }
      const versions = new Set();
      for (const migration of value.migration_history) {
        if (!record(migration) || typeof migration.version !== 'string' || !VERSION.test(migration.version)
            || !nonempty(migration.name) || versions.has(migration.version)) {
          fail('BASELINE_INVALID', `Historial de migraciones inválido: ${path}.`);
        }
        versions.add(migration.version);
      }
      const latest = [...value.migration_history].sort((a, b) => a.version.localeCompare(b.version)).at(-1);
      if (value.latest_migration.version !== latest.version || value.latest_migration.name !== latest.name) {
        fail('BASELINE_INVALID', `latest_migration no coincide con el historial: ${path}.`);
      }
      baselineCache.set(path, parsed);
    }
    checkHash(parsed.content, expectedHash, path);
    return parsed.value;
  }
  await readBaseline(manifest.baseline_file, manifest.baseline_sha256);

  const originals = new Set(), archives = new Set(), legacySql = new Set();
  for (const item of manifest.files) {
    if (!record(item) || !nonempty(item.reason) || !nonempty(item.current_contract)) {
      fail('MANIFEST_INVALID', 'Cada archivo histórico requiere motivo y contrato vigente.');
    }
    const original = safePath(item.original_path, 'original_path');
    const archived = safePath(item.archived_path, 'archived_path');
    if (!/^supabase-[a-z0-9]+(?:-[a-z0-9]+)*\.sql$/.test(original)
        || archived !== `supabase/historico/${manifest.archived_on}/${original}.historico`
        || originals.has(original.toLowerCase()) || archives.has(archived.toLowerCase())) {
      fail('MANIFEST_INVALID', 'Los históricos deben mapear 1:1 de SQL raíz a su archivo .sql.historico fechado.');
    }
    originals.add(original.toLowerCase());
    archives.add(archived.toLowerCase());
    const content = await bytes(archived);
    checkHash(content, item.sha256, archived);
    if (item.bytes !== undefined && (!Number.isSafeInteger(item.bytes) || item.bytes !== content.length)) {
      fail('SIZE_MISMATCH', `Tamaño distinto del registrado: ${archived}.`);
    }
    if (!normalizedSql(content)) fail('MANIFEST_INVALID', `Archivo histórico vacío: ${archived}.`);
    legacySql.add(normalizedSql(content));
  }

  const proposals = new Set();
  for (const proposal of manifest.proposals) {
    if (!record(proposal)) fail('PROPOSAL_INVALID', 'Propuesta SQL inválida en manifiesto.');
    const path = safePath(proposal.path, 'propuesta');
    if (!PROPOSALS.has(path) || proposal.state !== 'proposal_not_applied' || proposals.has(path)) {
      fail('PROPOSAL_INVALID', 'Solo se permiten las propuestas explícitas y pendientes autorizadas.');
    }
    proposals.add(path);
    await bytes(path);
  }

  const migrations = [], migrationVersions = new Set();
  for (const path of files.keys()) {
    const lower = path.toLowerCase();
    if (/\.sql\.historico$/i.test(path) && !archives.has(lower)) {
      fail('UNMANIFESTED_HISTORY', `Histórico no declarado en manifiesto: ${path}.`);
    }
    if (!/\.sql$/i.test(path)) continue;
    if (lower.startsWith('supabase/historico/')) {
      fail('EXECUTABLE_HISTORY', `SQL ejecutable dentro de históricos: ${path}.`);
    }
    if (proposals.has(path)) {
      assertNoLegacyOrderSql((await bytes(path)).toString('utf8'), { path });
      continue;
    }
    const match = MIGRATION.exec(path);
    if (!match) fail('UNAPPROVED_SQL', `SQL activo fuera de migraciones/propuestas autorizadas: ${path}.`);
    assertNoLegacyOrderSql((await bytes(path)).toString('utf8'), { path });
    if (migrationVersions.has(match[1])) fail('MIGRATION_INVALID', `Versión de migración duplicada: ${match[1]}.`);
    migrationVersions.add(match[1]);
    migrations.push({ path, version: match[1], stem: path.slice('supabase/migrations/'.length, -4) });
  }

  const expectedReviews = new Set();
  for (const migration of migrations) {
    const content = await bytes(migration.path), sql = normalizedSql(content);
    if (!sql) fail('MIGRATION_INVALID', `Migración vacía: ${migration.path}.`);
    if (legacySql.has(sql)) fail('LEGACY_COPY', `Una migración copia exactamente un SQL histórico: ${migration.path}.`);
    const reviewPath = `supabase/revisiones/${migration.stem}.json`;
    expectedReviews.add(reviewPath);
    if (!files.has(reviewPath)) fail('MIGRATION_REVIEW_REQUIRED', `Falta revisión de migración: ${reviewPath}.`);
    const { value: review } = await json(reviewPath);
    if (!record(review) || review.format_version !== 1 || review.project_ref !== PROJECT_REF
        || review.migration_file !== migration.path || !nonempty(review.reason)
        || !nonempty(review.before_after) || !nonempty(review.verification)) {
      fail('REVIEW_MISMATCH', `Revisión incompleta o de otro archivo/proyecto: ${reviewPath}.`);
    }
    checkHash(content, review.migration_sha256, migration.path);
    const baseline = await readBaseline(review.baseline_file, review.baseline_sha256);
    if (review.based_on_migration !== baseline.latest_migration.version) {
      fail('REVIEW_MISMATCH', `based_on_migration no coincide con el baseline: ${reviewPath}.`);
    }
    if (migration.version <= baseline.latest_migration.version) {
      fail('MIGRATION_INVALID', `La migración debe ser posterior a su baseline: ${migration.path}.`);
    }
  }
  for (const path of files.keys()) {
    if (path.startsWith('supabase/revisiones/') && /\.json$/i.test(path) && !expectedReviews.has(path)) {
      fail('ORPHAN_REVIEW', `Revisión sin migración correspondiente: ${path}.`);
    }
  }

  return {
    project_ref: PROJECT_REF,
    archived_count: archives.size,
    migration_count: migrations.length,
    proposal_count: proposals.size,
    baseline_file: manifest.baseline_file,
  };
}

const samePath = (a, b) => process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
if (process.argv[1] && samePath(resolve(process.argv[1]), fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('Uso: node scripts/verificar-sql-vigente.mjs [raíz de fuentes]\nVerifica hashes, rutas y revisiones; no ejecuta SQL ni valida su semántica/frescura.');
  } else {
    try {
      if (args.length > 1 || args[0]?.startsWith('--')) fail('USAGE', 'Uso: node scripts/verificar-sql-vigente.mjs [raíz de fuentes]');
      const result = await verifySqlSources(args[0] || process.cwd());
      console.log(`SQL vigentes: ${result.archived_count} históricos íntegros; ${result.migration_count} migraciones con ficha; ${result.proposal_count} propuestas pendientes. No se ejecutó SQL.`);
    } catch (error) {
      console.error(`SQL_SOURCE_GUARD [${error.code || 'UNEXPECTED'}]: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

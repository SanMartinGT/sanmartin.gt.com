import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodeTest from 'node:test';
import vm from 'node:vm';

// Casos aislados: no usan sesiones, red, credenciales ni carritos reales.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const test = (name, fn) => nodeTest(name, { timeout: 3000 }, fn);
const sources = await Promise.all(['presentaciones.js', 'carrito-estado.js'].map(async file => [file, await readFile(path.join(root, file), 'utf8')]));
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const P = '33333333-3333-4333-8333-333333333333';
const Q = '44444444-4444-4444-8444-444444444444';
const PACK = '55555555-5555-4555-8555-555555555555';
const FRACTIONAL = '66666666-6666-4666-8666-666666666666';
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const item = (producto_id = P, cantidad = 1, presentacion_id = null) => ({ producto_id, presentacion_id, cantidad, nombre: 'Producto de prueba', precio: 100, verificado: true });
const amounts = values => clone(values).map(({ producto_id, presentacion_id, cantidad }) => ({ producto_id, presentacion_id: presentacion_id || null, cantidad })).sort((a, b) => `${a.producto_id}:${a.presentacion_id}`.localeCompare(`${b.producto_id}:${b.presentacion_id}`));
const deferred = () => { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; };
const turn = async () => { for (let index = 0; index < 20; index++) await Promise.resolve(); };

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return { map, getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) };
}

function timers() {
  let id = 0;
  const jobs = new Map();
  return {
    jobs,
    set: (fn, delay = 0) => { const key = ++id; jobs.set(key, { fn, delay }); return key; },
    clear: key => jobs.delete(key),
    async run(maximumDelay = Infinity) {
      for (let round = 0; round < 30; round++) {
        await turn();
        const available = [...jobs.entries()].filter(([, job]) => job.delay <= maximumDelay);
        if (!available.length) return;
        for (const [key, job] of available) { if (jobs.delete(key)) void job.fn(); }
      }
      throw new Error('El temporizador no se estabilizó.');
    }
  };
}

function fakeClient(actor = null, initial = {}) {
  let currentActor = actor, nextVersion = 0;
  const records = new Map(Object.entries(initial).map(([key, items]) => [key, { items: clone(items), actualizado_en: `base-${++nextVersion}` }]));
  const reads = [], writes = [], listeners = [], pendingReads = new Map(), pendingWrites = new Map();
  let readError = null, initialUser = null, catalogGate = null;
  function setRemote(key, items) { const row = { items: clone(items), actualizado_en: `version-${++nextVersion}` }; records.set(key, row); return clone(row); }
  const client = {
    auth: {
      async getUser() { if (initialUser) return await initialUser; return { data: { user: currentActor ? { id: currentActor } : null }, error: null }; },
      onAuthStateChange(fn) { listeners.push(fn); return { data: { subscription: { unsubscribe() {} } } }; }
    },
    async rpc(name, args) {
      if (name === 'catalogo_presentaciones') return { data: args.p_producto_ids.includes(P) ? [{ id: PACK, producto_id: P, nombre: 'Paquete', cantidad_base: 10, precio: 20, precio_ecommerce: 20 }] : [], error: null };
      assert.equal(name, 'validar_disponibilidad_presentaciones');
      return { data: [...new Set(args.p_items.map(entry => entry.producto_id))].map(producto_id => ({ producto_id, estado: 'DISPONIBLE' })), error: null };
    },
    from(table) {
      if (['catalogo_productos', 'ofertas_producto'].includes(table)) {
        const result = { data: table === 'catalogo_productos' ? [P, Q, FRACTIONAL].map(id => ({ id, nombre: 'Producto de prueba', precio_base: 5, venta_fraccionada: id === FRACTIONAL, unidad_permite_fraccion: id === FRACTIONAL, unidad_decimales_permitidos: id === FRACTIONAL ? 3 : 0 })) : [], error: null };
        const query = { select: () => query, in: () => query, eq: () => query, then: (resolve, reject) => (async () => { if (catalogGate) await catalogGate; return result; })().then(resolve, reject) };
        return query;
      }
      assert.equal(table, 'carritos_ecommerce');
      let mode = 'read', values, executed;
      const filters = new Map();
      const execute = () => executed ||= (async () => {
        const key = filters.get('cliente_id') ?? values?.cliente_id;
        assert.ok(key === A || key === B, 'Cada consulta de cuenta debe llevar su propietario.');
        if (mode === 'read') {
          reads.push(key);
          if (pendingReads.has(key)) return clone(await pendingReads.get(key).promise);
          return readError ? { data: null, error: { message: readError } } : { data: clone(records.get(key) ?? null), error: null };
        }
        writes.push({ mode, actor: key, items: clone(values.items), filters: Object.fromEntries(filters) });
        if (pendingWrites.has(key)) await pendingWrites.get(key).promise;
        if (mode === 'insert') {
          if (records.has(key)) return { data: null, error: { code: '23505', message: 'duplicate key' } };
          return { data: setRemote(key, values.items), error: null };
        }
        assert.ok(filters.has('actualizado_en'), 'Las actualizaciones deben comprobar la versión remota (CAS).');
        const row = records.get(key);
        if (!row || row.actualizado_en !== filters.get('actualizado_en')) return { data: null, error: null };
        return { data: setRemote(key, values.items), error: null };
      })();
      const query = {
        select() { return query; },
        eq(key, value) { filters.set(key, value); return query; },
        insert(payload) { mode = 'insert'; values = payload; return query; },
        update(payload) { mode = 'update'; values = payload; return query; },
        maybeSingle: execute,
        single: execute,
        then(resolve, reject) { return execute().then(resolve, reject); }
      };
      return query;
    }
  };
  return {
    client, records, reads, writes, pendingReads, pendingWrites, setRemote,
    failReads(message = 'Sin conexión') { readError = message; },
    recoverReads() { readError = null; },
    deferInitialUser(promise) { initialUser = promise; },
    deferCatalog(promise) { catalogGate = promise; },
    emit(nextActor, event = nextActor ? 'SIGNED_IN' : 'SIGNED_OUT') {
      currentActor = nextActor;
      for (const fn of listeners) fn(event, nextActor ? { user: { id: nextActor } } : null);
    }
  };
}

function harness({ actor = null, remote = {}, storage = memoryStorage(), backend = fakeClient(actor, remote) } = {}) {
  const clock = timers(), idleClock = timers();
  const window = { localStorage: memoryStorage(), addEventListener() {}, removeEventListener() {}, setTimeout: idleClock.set, clearTimeout: idleClock.clear };
  const context = vm.createContext({ window, localStorage: window.localStorage, setTimeout: idleClock.set, clearTimeout: idleClock.clear, console });
  for (const [file, source] of sources) vm.runInContext(source, context, { filename: file });
  const cart = window.SanMartinCrearCarrito({ client: backend.client, storage, setTimer: clock.set, clearTimer: clock.clear });
  return { cart, storage, backend, clock, async settle() { await clock.run(0); await turn(); } };
}

async function ready(options) {
  const h = harness(options);
  await h.settle();
  assert.equal(h.cart.state().status, 'ready');
  return h;
}

test('el invitado usa su propio ámbito y las lecturas no permiten mutarlo por referencia', async () => {
  const { cart, storage } = await ready();
  const token = cart.capture();
  cart.replace([item()], token);
  const read = cart.read();
  read[0].cantidad = 99;
  assert.equal(cart.read()[0].cantidad, 1);
  assert.ok(storage.getItem('sanmartin_ecommerce_cart_v2:guest'));
  assert.equal(cart.isCurrent(token), false, 'Una edición invalida la revisión capturada.');
});

test('A → cerrar sesión → B limpia de inmediato y conserva únicamente el carrito de cada cuenta', async () => {
  const h = await ready({ actor: A, remote: { [A]: [item(P, 2)], [B]: [item(Q, 5)] } });
  const tokenA = h.cart.capture();
  h.backend.emit(null);
  assert.deepEqual(amounts(h.cart.read()), []);
  assert.equal(h.cart.isCurrent(tokenA), false);
  await h.settle();
  assert.equal(h.cart.state().status, 'ready');
  h.backend.emit(B);
  assert.deepEqual(amounts(h.cart.read()), [], 'B no debe ver el contenido de A mientras carga.');
  await h.settle();
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 5)]));
  assert.equal(h.backend.writes.length, 0);
});

test('una respuesta tardía de A no sustituye el carrito de B', async () => {
  const backend = fakeClient(A, { [B]: [item(Q, 7)] });
  const delayed = deferred(); backend.pendingReads.set(A, delayed);
  const h = harness({ backend });
  await h.settle();
  backend.emit(B); await h.settle();
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 7)]));
  delayed.resolve({ data: { items: [item(P, 9)], actualizado_en: 'late-A' }, error: null });
  await h.settle();
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 7)]));
  assert.equal(backend.writes.length, 0);
});

test('un getUser inicial tardío no revierte un cambio de cuenta posterior', async () => {
  const backend = fakeClient(A, { [A]: [item(P, 8)], [B]: [item(Q, 3)] });
  const delayed = deferred(); backend.deferInitialUser(delayed.promise);
  const h = harness({ backend }); await h.settle();
  backend.emit(B); await h.settle();
  delayed.resolve({ data: { user: { id: A } }, error: null }); await h.settle();
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 3)]));
  assert.equal(h.cart.state().actor, B);
});

test('un guardado pendiente de A se cancela al cambiar a B', async () => {
  const h = await ready({ actor: A, remote: { [A]: [item(P)], [B]: [item(Q, 2)] } });
  h.cart.replace([item(P, 6)], h.cart.capture());
  h.backend.emit(B);
  await h.clock.run(); await h.settle();
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 2)]));
  assert.equal(h.backend.writes.length, 0);
  assert.throws(() => h.cart.replace([item(P, 9)], { actor: A, generation: -1, revision: -1 }));
});

test('entrar con carrito invitado exige elegir y fusiona sin confundir presentaciones', async () => {
  const h = await ready();
  h.cart.replace([item(P, 2), item(P, 1, PACK)]);
  h.backend.setRemote(A, [item(P, 3), item(Q, 4)]);
  h.backend.emit(A); await h.settle();
  assert.equal(h.cart.state().status, 'decision');
  assert.equal(h.backend.writes.length, 0, 'No se fusiona ni escribe por el mero inicio de sesión.');
  await assert.rejects(h.cart.ensureReady(A));
  await h.cart.choose('merge'); await h.cart.flush();
  assert.equal(h.cart.state().status, 'ready');
  assert.deepEqual(amounts(h.cart.read()), amounts([item(P, 5), item(P, 1, PACK), item(Q, 4)]));
  assert.deepEqual(amounts(h.backend.records.get(A).items), amounts(h.cart.read()));
  const before = clone(h.cart.state()), readCount = h.backend.reads.length;
  h.backend.emit(A, 'TOKEN_REFRESHED'); await h.settle();
  assert.equal(h.cart.state().generation, before.generation);
  assert.equal(h.backend.reads.length, readCount);
  assert.equal(h.cart.state().status, 'ready');
});

test('la elección separate conserva el invitado y usa el remoto de la cuenta', async () => {
  const h = await ready(); h.cart.replace([item(P, 2)]);
  h.backend.setRemote(A, [item(Q, 4)]); h.backend.emit(A); await h.settle();
  await h.cart.choose('separate'); await h.settle();
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 4)]));
  assert.equal(h.backend.writes.length, 0);
  h.backend.emit(null); await h.settle();
  assert.deepEqual(amounts(h.cart.read()), amounts([item(P, 2)]));
});

test('la elección replace requiere confirmación y sustituye solo el remoto del actor', async () => {
  const h = await ready(); h.cart.replace([item(P, 2)]);
  h.backend.setRemote(A, [item(Q, 4)]); h.backend.emit(A); await h.settle();
  assert.equal(h.backend.writes.length, 0);
  await h.cart.choose('replace'); await h.cart.flush();
  assert.deepEqual(amounts(h.backend.records.get(A).items), amounts([item(P, 2)]));
  assert.ok(h.backend.writes.every(write => write.actor === A));
  h.backend.emit(null); await h.settle();
  assert.deepEqual(amounts(h.cart.read()), []);
});

test('un remoto vacío gana a una copia local limpia de esa misma cuenta', async () => {
  const storage = memoryStorage(), backend = fakeClient(A, { [A]: [item(P, 3)] });
  const first = await ready({ storage, backend });
  assert.deepEqual(amounts(first.cart.read()), amounts([item(P, 3)]));
  backend.setRemote(A, []);
  const second = await ready({ storage, backend });
  assert.deepEqual(amounts(second.cart.read()), []);
  assert.equal(backend.writes.length, 0, 'Una copia limpia nunca resucita líneas eliminadas remotamente.');
});

test('un error de lectura bloquea ediciones y jamás crea o sobrescribe el remoto', async () => {
  const backend = fakeClient(A, { [A]: [item(P, 3)] }); backend.failReads();
  const h = harness({ backend }); await h.settle();
  assert.equal(h.cart.state().status, 'error');
  assert.deepEqual(amounts(h.cart.read()), []);
  await assert.rejects(h.cart.ensureReady(A));
  assert.throws(() => h.cart.replace([item(P, 99)]));
  await h.cart.flush(); await h.clock.run();
  assert.equal(backend.writes.length, 0);
  backend.recoverReads(); const retry = h.cart.retry(); await h.settle(); await retry;
  assert.equal(h.cart.state().status, 'ready');
  assert.deepEqual(amounts(h.cart.read()), amounts([item(P, 3)]));
});

test('un conflicto CAS conserva el remoto hasta decidir y permite aceptar su versión', async () => {
  const h = await ready({ actor: A, remote: { [A]: [item(P, 1)] } });
  h.cart.replace([item(P, 2)]);
  h.backend.setRemote(A, [item(Q, 6)]);
  await h.cart.flush(); await h.settle();
  assert.equal(h.cart.state().status, 'decision');
  assert.deepEqual(amounts(h.backend.records.get(A).items), amounts([item(Q, 6)]));
  await h.cart.choose('remote'); await h.settle();
  assert.equal(h.cart.state().status, 'ready');
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 6)]));
});

test('elegir la recuperación local tras conflicto vuelve a escribir con la nueva versión CAS', async () => {
  const h = await ready({ actor: A, remote: { [A]: [item(P, 1)] } });
  h.cart.replace([item(P, 2)]);
  h.backend.setRemote(A, [item(Q, 6)]);
  await h.cart.flush(); await h.settle();
  const writesBeforeChoice = h.backend.writes.length;
  await h.cart.choose('local'); await h.cart.flush();
  assert.ok(h.backend.writes.length > writesBeforeChoice);
  assert.deepEqual(amounts(h.backend.records.get(A).items), amounts([item(P, 2)]));
});

test('el carrito v1 queda aislado sin asignarlo automáticamente al invitado ni a una cuenta', async () => {
  const legacyKey = 'sanmartin_ecommerce_cart_v1';
  const storage = memoryStorage({ [legacyKey]: JSON.stringify([item(P, 4)]) });
  const h = harness({ storage }); await h.settle();
  assert.deepEqual(amounts(h.cart.read()), []);
  assert.equal(h.cart.state().status, 'decision');
  assert.equal(storage.getItem(legacyKey), null);
  assert.ok(storage.getItem('sanmartin_ecommerce_cart_v2:legacy'));
  await h.cart.choose('later'); await h.settle();
  assert.equal(h.cart.state().status, 'ready');
  assert.deepEqual(amounts(h.cart.read()), []);
  assert.equal(h.backend.writes.length, 0);
});

test('la importación del carrito heredado exige una elección explícita', async () => {
  const storage = memoryStorage({ sanmartin_ecommerce_cart_v1: JSON.stringify([item(P, 4)]) });
  const h = harness({ storage }); await h.settle();
  await h.cart.choose('import'); await h.settle();
  assert.deepEqual(amounts(h.cart.read()), amounts([item(P, 4)]));
  assert.equal(storage.getItem('sanmartin_ecommerce_cart_v2:legacy'), null);
});

test('reiniciar después de fusionar no vuelve a sumar el carrito invitado', async () => {
  const storage = memoryStorage(), backend = fakeClient();
  const h = await ready({ storage, backend }); h.cart.replace([item(P, 2)]);
  backend.setRemote(A, [item(P, 3)]); backend.emit(A); await h.settle();
  await h.cart.choose('merge'); await h.cart.flush();
  const restarted = await ready({ storage, backend });
  assert.deepEqual(amounts(restarted.cart.read()), amounts([item(P, 5)]));
  assert.equal(storage.getItem('sanmartin_ecommerce_cart_v2:guest'), null);
});

test('los cambios sin guardar de A se recuperan solo al volver a A', async () => {
  const h = await ready({ actor: A, remote: { [A]: [item(P)], [B]: [item(Q, 3)] } });
  h.cart.replace([item(P, 7)]);
  h.backend.emit(B); await h.settle();
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 3)]));
  h.backend.emit(A); await h.settle();
  assert.deepEqual(amounts(h.cart.read()), amounts([item(P, 7)]));
  assert.equal(h.backend.writes.length, 0);
  await h.cart.flush();
  assert.deepEqual(amounts(h.backend.records.get(A).items), amounts([item(P, 7)]));
  assert.deepEqual(amounts(h.backend.records.get(B).items), amounts([item(Q, 3)]));
});

test('una respuesta de guardado de A ya iniciada no altera ni persiste datos dentro de B', async () => {
  const h = await ready({ actor: A, remote: { [A]: [item(P)], [B]: [item(Q, 3)] } });
  const delayed = deferred(); h.backend.pendingWrites.set(A, delayed);
  h.cart.replace([item(P, 7)]); const writing = h.cart.flush(); await turn();
  assert.equal(h.backend.writes.length, 1);
  h.backend.emit(B); await h.settle();
  delayed.resolve(); await writing; await h.settle();
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 3)]));
  assert.ok(h.backend.writes.every(write => write.actor === A));
  assert.deepEqual(amounts(h.backend.records.get(B).items), amounts([item(Q, 3)]));
});

test('un cambio de otra pestaña exige decidir antes de sobrescribir cambios pendientes', async () => {
  const h = await ready({ actor: A, remote: { [A]: [item(P)] } });
  h.cart.replace([item(P, 7)]);
  const key = `sanmartin_ecommerce_cart_v2:account:${A}`;
  const envelope = JSON.parse(h.storage.getItem(key));
  h.storage.setItem(key, JSON.stringify({ ...envelope, items: [item(Q, 6)] }));
  h.cart.onStorage({ key });
  assert.equal(h.cart.state().status, 'decision');
  assert.equal(h.cart.state().decision.kind, 'tabs');
  await h.clock.run();
  assert.equal(h.backend.writes.length, 0);
  await h.cart.choose('remote');
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 6)]));
});

test('fusionar conserva cantidades fraccionarias permitidas por el catálogo', async () => {
  const h = await ready(); h.cart.replace([item(FRACTIONAL, 0.25)]);
  h.backend.setRemote(A, [item(FRACTIONAL, 0.5)]); h.backend.emit(A); await h.settle();
  await h.cart.choose('merge'); await h.cart.flush();
  assert.equal(h.cart.state().status, 'ready');
  assert.deepEqual(amounts(h.cart.read()), amounts([item(FRACTIONAL, 0.75)]));
});

test('descartar el carrito heredado lo elimina sin asignarlo a la cuenta', async () => {
  const storage = memoryStorage({ sanmartin_ecommerce_cart_v1: JSON.stringify([item(P, 4)]) });
  const h = harness({ actor: A, remote: { [A]: [item(Q, 6)] }, storage }); await h.settle();
  assert.equal(h.cart.state().status, 'decision');
  await h.cart.choose('discard');
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 6)]));
  assert.equal(storage.getItem('sanmartin_ecommerce_cart_v2:legacy'), null);
  assert.equal(h.backend.writes.length, 0);
});

test('cambiar de cuenta mientras se valida la fusión no consume el invitado ni escribe en la nueva cuenta', async () => {
  const h = await ready(); h.cart.replace([item(P, 2)]);
  h.backend.setRemote(A, [item(P, 3)]); h.backend.setRemote(B, [item(Q, 6)]);
  h.backend.emit(A); await h.settle();
  const delayed = deferred(); h.backend.deferCatalog(delayed.promise);
  const choosing = h.cart.choose('merge'); await turn();
  assert.equal(h.cart.state().status, 'loading');
  h.backend.emit(B); await h.settle();
  delayed.resolve(); await choosing; await h.settle();
  assert.equal(h.cart.state().actor, B);
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 6)]));
  assert.equal(h.cart.state().status, 'decision', 'B debe resolver por sí mismo la elección del invitado.');
  assert.ok(h.storage.getItem('sanmartin_ecommerce_cart_v2:guest'));
  assert.equal(h.backend.writes.length, 0);
});

test('un fallo al verificar la sesión no consulta ni escribe un carrito de cuenta', async () => {
  const backend = fakeClient(A, { [A]: [item(P, 3)] });
  backend.deferInitialUser(Promise.resolve({ data: { user: null }, error: { message: 'Sesión no verificable' } }));
  const h = harness({ backend }); await h.settle();
  assert.equal(h.cart.state().status, 'error');
  assert.equal(backend.reads.length, 0);
  assert.equal(backend.writes.length, 0);
  await assert.rejects(h.cart.ensureReady());
});

test('actualizar solo precios verificados no crea un guardado de cantidades en la cuenta', async () => {
  const h = await ready({ actor: A, remote: { [A]: [item(P, 3)] } });
  const next = h.cart.read().map(entry => ({ ...entry, precio: 10, verificado: true }));
  h.cart.replace(next); await h.cart.flush(); await h.clock.run();
  assert.equal(h.backend.writes.length, 0);
  assert.equal(h.cart.read()[0].precio, 10);
});

test('un nuevo invitado con los mismos productos de una fusión anterior requiere una nueva elección', async () => {
  const h = await ready(); h.cart.replace([item(P, 2)]);
  h.backend.setRemote(A, [item(P, 3)]); h.backend.emit(A); await h.settle();
  await h.cart.choose('merge'); await h.cart.flush();
  assert.deepEqual(amounts(h.backend.records.get(A).items), amounts([item(P, 5)]));
  h.backend.emit(null); await h.settle();
  assert.deepEqual(amounts(h.cart.read()), []);
  h.cart.replace([item(P, 2)]);
  h.backend.emit(A); await h.settle();
  assert.equal(h.cart.state().status, 'decision', 'Una fusión previa no autoriza consumir un nuevo carrito idéntico.');
  assert.equal(h.cart.state().decision.kind, 'guest');
  assert.ok(h.storage.getItem('sanmartin_ecommerce_cart_v2:guest'), 'El nuevo origen debe conservarse hasta decidir.');
  assert.deepEqual(amounts(h.backend.records.get(A).items), amounts([item(P, 5)]));
  await h.cart.choose('merge'); await h.cart.flush();
  assert.deepEqual(amounts(h.backend.records.get(A).items), amounts([item(P, 7)]));
});

test('un rechazo tardío del getUser inicial no convierte una sesión B válida en error', async () => {
  const backend = fakeClient(A, { [B]: [item(Q, 3)] });
  const delayed = deferred(); backend.deferInitialUser(delayed.promise);
  const h = harness({ backend }); await h.settle();
  backend.emit(B); await h.settle();
  assert.equal(h.cart.state().status, 'ready');
  delayed.reject(new Error('Fallo tardío de la consulta inicial')); await h.settle();
  assert.equal(h.cart.state().actor, B);
  assert.equal(h.cart.state().status, 'ready');
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 3)]));
  assert.equal(backend.writes.length, 0);
});

test('los cambios de identidad y la recarga invalidan tokens aunque los items tengan JSON idéntico', async () => {
  const h = await ready({ actor: A, remote: { [A]: [item(P, 3)], [B]: [item(P, 3)] } });
  const itemsA = clone(h.cart.read()), tokenA = h.cart.capture();
  h.backend.emit(B);
  assert.equal(h.cart.isCurrent(tokenA), false);
  await h.settle();
  assert.deepEqual(clone(h.cart.read()), itemsA);
  assert.equal(h.cart.isCurrent(tokenA), false);
  assert.equal(h.cart.sameActor(tokenA), false);
  const tokenB = h.cart.capture();
  h.cart.onStorage({ key: `sanmartin_ecommerce_cart_v2:account:${B}` });
  assert.equal(h.cart.isCurrent(tokenB), false);
  await h.settle();
  assert.deepEqual(clone(h.cart.read()), itemsA);
  assert.equal(h.cart.isCurrent(tokenB), false);
  assert.equal(h.cart.isCurrent(h.cart.capture()), true);
});

test('AuthSessionMissingError identifica al invitado válido y permite conservar su carrito', async () => {
  const backend = fakeClient();
  backend.deferInitialUser(Promise.resolve({ data: { user: null }, error: { name: 'AuthSessionMissingError', message: 'Auth session missing!' } }));
  const h = harness({ backend }); await h.settle();
  assert.equal(h.cart.state().status, 'ready');
  assert.equal(h.cart.state().actor, null);
  h.cart.replace([item(P, 2)]);
  const retry = h.cart.retry(); await h.settle(); await retry;
  assert.equal(h.cart.state().status, 'ready');
  assert.deepEqual(amounts(h.cart.read()), amounts([item(P, 2)]));
  assert.equal(backend.reads.length, 0);
  assert.equal(backend.writes.length, 0);
});

test('un evento storage antes de conocer la identidad no sustituye la comprobación inicial de sesión', async () => {
  const backend = fakeClient(A, { [A]: [item(P, 3)] });
  const delayed = deferred(); backend.deferInitialUser(delayed.promise);
  const h = harness({ backend }); await h.settle();
  h.cart.onStorage({ key: null }); await h.settle();
  assert.equal(h.cart.state().status, 'loading');
  assert.equal(backend.reads.length, 0);
  delayed.resolve({ data: { user: { id: A } }, error: null }); await h.settle();
  assert.equal(h.cart.state().actor, A);
  assert.equal(h.cart.state().status, 'ready');
  assert.deepEqual(amounts(h.cart.read()), amounts([item(P, 3)]));
});

test('un fallo del almacenamiento al elegir no deja una selección aparentemente guardada', async () => {
  const h = await ready(); h.cart.replace([item(P, 2)]);
  h.backend.setRemote(A, [item(Q, 6)]); h.backend.emit(A); await h.settle();
  h.storage.setItem = () => { throw new Error('Almacenamiento no disponible'); };
  assert.equal(await h.cart.choose('separate'), false);
  assert.equal(h.cart.state().status, 'error');
  await assert.rejects(h.cart.ensureReady(A));
  assert.ok(h.storage.getItem('sanmartin_ecommerce_cart_v2:guest'));
  assert.deepEqual(amounts(h.backend.records.get(A).items), amounts([item(Q, 6)]));
  assert.equal(h.backend.writes.length, 0);
});

test('un guardado A detenido en la red no bloquea el guardado independiente de B', async () => {
  const h = await ready({ actor: A, remote: { [A]: [item(P)], [B]: [item(Q, 3)] } });
  const delayed = deferred(); h.backend.pendingWrites.set(A, delayed);
  h.cart.replace([item(P, 7)]); const writingA = h.cart.flush(); await turn();
  assert.equal(h.backend.writes.length, 1);
  h.backend.emit(B); await h.settle();
  h.cart.replace([item(Q, 8)]);
  let completedB = false;
  const writingB = h.cart.flush().then(result => { completedB = true; return result; });
  await turn();
  try {
    assert.equal(completedB, true, 'B debe terminar sin esperar que responda el guardado de A.');
    assert.deepEqual(amounts(h.backend.records.get(B).items), amounts([item(Q, 8)]));
  } finally {
    delayed.resolve();
    await Promise.all([writingA, writingB]);
  }
  assert.equal(h.cart.state().actor, B);
  assert.deepEqual(amounts(h.cart.read()), amounts([item(Q, 8)]));
});

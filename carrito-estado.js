/* Carritos separados por identidad. El navegador nunca decide la propiedad de un carrito antiguo. */
(function () {
  'use strict';
  const PREFIX = 'sanmartin_ecommerce_cart_v2:', GUEST = PREFIX + 'guest', LEGACY = PREFIX + 'legacy';
  const clone = value => JSON.parse(JSON.stringify(value));
  const missingSession = result => !result.data?.user && result.error?.name === 'AuthSessionMissingError';
  function crear({ client = null, storage = window.localStorage, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
    const commercial = window.SanMartinPresentaciones;
    const listeners = new Set();
    let actor, generation = 0, revision = 0, status = 'loading', items = [], error = '', decision = null;
    let base = null, remote = [], dirty = false, cache = {}, timer, settling = Promise.resolve(), syncing = null, reviewable = false;
    const newStamp = () => `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const scope = id => id ? PREFIX + 'account:' + id : GUEST;
    const canonical = value => commercial.readCart(value);
    const signature = value => JSON.stringify(canonical(value).map(item => [commercial.key(item), item.cantidad]).sort());
    const read = key => { try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; } };
    const envelope = key => {
      const value = read(key);
      if (value?.version !== 2 || !Array.isArray(value.items)) return { version: 2, items: [] };
      if (!value.stamp) { value.stamp = newStamp(); storage.setItem(key, JSON.stringify(value)); }
      return value;
    };
    const guestStamp = value => value.stamp ? `${value.stamp}:${signature(value.items)}` : '';
    const capture = () => ({ actor, generation, revision });
    const sameActor = token => token && token.actor === actor && token.generation === generation;
    const isCurrent = token => sameActor(token) && token.revision === revision && status === 'ready';
    const state = () => ({ actor: actor ?? null, generation, revision, status, items: clone(items), error, reviewable,
      decision: decision ? { kind: decision.kind, count: decision.other?.length || 0, accountCount: items.length, items: clone(decision.other || []) } : null });
    function emit(reason) { for (const listener of listeners) listener(state(), reason); }
    function fail(message) { revision++; status = 'error'; error = message; decision = null; clearTimer(timer); emit('error'); }
    function persist() {
      cache = { ...cache, version: 2, stamp: cache.stamp && signature(cache.items) === signature(items) ? cache.stamp : newStamp(), items: canonical(items), dirty, base };
      storage.setItem(scope(actor), JSON.stringify(cache));
    }
    function schedule() { clearTimer(timer); if (actor && dirty && status === 'ready') timer = setTimer(() => { void flush(); }, 500); }
    function offers() {
      revision++; decision = null; status = 'ready'; error = '';
      const guest = envelope(GUEST);
      let legacy = read(LEGACY);
      // Una importación interrumpida se recupera en la cuenta destinataria; no se ofrece dos veces.
      if (actor && cache.consumedGuest && guestStamp(guest) === cache.consumedGuest) storage.removeItem(GUEST);
      if (cache.consumedLegacy && legacy && signature(legacy) === cache.consumedLegacy) storage.removeItem(LEGACY);
      if (cache.consumedGuest || cache.consumedLegacy) { delete cache.consumedGuest; delete cache.consumedLegacy; persist(); }
      legacy = read(LEGACY);
      const sourceGuest = envelope(GUEST), availableGuest = sourceGuest.items;
      if (actor && availableGuest.length && cache.separateGuest !== guestStamp(sourceGuest)) {
        decision = { kind: 'guest', other: canonical(availableGuest), stamp: guestStamp(sourceGuest) }; status = 'decision';
      } else if (Array.isArray(legacy) && legacy.length && cache.deferredLegacy !== signature(legacy)) {
        decision = { kind: 'legacy', other: canonical(legacy) }; status = 'decision';
      }
      reviewable = status === 'ready' && Boolean((actor && availableGuest.length) || (Array.isArray(legacy) && legacy.length));
      emit('load'); schedule();
    }
    async function load(started) {
      const currentActor = actor;
      try {
        cache = envelope(scope(currentActor));
        dirty = Boolean(currentActor && cache.dirty);
        if (!currentActor) { items = canonical(cache.items); base = null; offers(); return; }
        const result = await client.from('carritos_ecommerce').select('items,actualizado_en').eq('cliente_id', currentActor).maybeSingle();
        if (generation !== started || actor !== currentActor) return;
        if (result.error) throw new Error('No pudimos cargar el carrito de esta cuenta. Reintenta antes de modificarlo.');
        remote = canonical(result.data?.items || []); base = result.data?.actualizado_en ?? null;
        if (dirty && signature(cache.items) !== signature(remote) && (cache.base ?? null) !== base) {
          items = canonical(cache.items); status = 'decision'; decision = { kind: 'conflict', other: remote };
          emit('load'); return;
        }
        items = dirty ? canonical(cache.items) : remote;
        if (signature(items) === signature(remote)) dirty = false;
        persist(); offers();
      } catch (problem) { if (generation === started) fail(problem.message || 'No pudimos recuperar el carrito.'); }
    }
    function transition(next, force = false) {
      if (!force && actor === next) return;
      clearTimer(timer); syncing = null; actor = next; generation++; revision++; items = []; base = null; dirty = false;
      remote = []; cache = {}; decision = null; error = ''; reviewable = false; status = 'loading';
      emit('identity');
      const started = generation;
      // Ninguna consulta Supabase se ejecuta dentro del callback de Auth.
      settling = new Promise(resolve => setTimer(resolve, 0)).then(() => generation === started ? load(started) : undefined);
    }
    async function ensureReady(expectedActor) {
      await settling;
      if (status !== 'ready') throw new Error(error || 'Resuelve la selección del carrito antes de continuar.');
      if (expectedActor !== undefined && expectedActor !== actor) throw new Error('La cuenta cambió. Vuelve a intentar desde tu carrito.');
      return capture();
    }
    function replace(next, token = capture()) {
      if (!isCurrent(token)) throw new Error('El carrito o la cuenta cambió. Revisa el carrito y vuelve a intentar.');
      const previous = items;
      dirty = Boolean(actor && (dirty || signature(next) !== signature(previous)));
      items = clone(next); revision++;
      try { persist(); } catch { items = previous; fail('No pudimos guardar el carrito en este navegador.'); throw new Error(error); }
      emit('edit'); schedule(); return true;
    }
    async function authorized(token) {
      const result = await client.auth.getUser();
      if (!sameActor(token)) return false;
      if (result.error && !missingSession(result)) { fail('No pudimos verificar la sesión. Reintenta para guardar tu carrito.'); return false; }
      const next = result.data?.user?.id || null;
      if (next !== actor) { transition(next); return false; }
      return true;
    }
    async function flush() {
      clearTimer(timer);
      if (syncing) { await syncing; if (dirty && status === 'ready') return flush(); return false; }
      if (!actor || !dirty || status !== 'ready') return false;
      const token = capture(), desired = canonical(items), expectedBase = base;
      const operation = (async () => {
        try {
          if (!await authorized(token) || !isCurrent(token)) { schedule(); return false; }
          const payload = { items: desired, actualizado_en: new Date(Math.max(Date.now(), (Date.parse(expectedBase) || 0) + 1)).toISOString() };
          const query = expectedBase === null
            ? client.from('carritos_ecommerce').insert({ ...payload, cliente_id: token.actor })
            : client.from('carritos_ecommerce').update(payload).eq('cliente_id', token.actor).eq('actualizado_en', expectedBase);
          const result = await query.select('actualizado_en').maybeSingle();
          if (!sameActor(token)) return false;
          if ((result.error && result.error.code === '23505') || (!result.error && !result.data)) {
            // Otro dispositivo/pestaña guardó primero. No sobrescribirlo automáticamente.
            settling = load(generation); await settling; return false;
          }
          if (result.error) throw new Error('No pudimos guardar el carrito en tu cuenta. Los cambios quedan guardados para esta cuenta en el navegador.');
          base = result.data.actualizado_en; remote = desired;
          dirty = revision !== token.revision;
          persist(); emit('saved'); schedule(); return true;
        } catch (problem) { if (sameActor(token)) fail(problem.message || 'No pudimos sincronizar el carrito.'); return false; }
      })();
      syncing = operation;
      try { return await operation; } finally { if (syncing === operation) syncing = null; }
    }
    async function decide(action) {
      if (status !== 'decision' || !decision) return false;
      const selected = decision, token = capture();
      if (selected.kind === 'conflict' || selected.kind === 'tabs') {
        if (!['remote', 'local'].includes(action)) return false;
        if (action === 'remote') {
          items = clone(selected.other);
          if (selected.kind === 'tabs') { cache = selected.cache; base = cache.base ?? null; dirty = Boolean(actor && cache.dirty); }
          else dirty = false;
        } else dirty = Boolean(actor);
        revision++; decision = null; status = 'ready'; persist(); offers(); return true;
      }
      const isGuest = selected.kind === 'guest', key = isGuest ? GUEST : LEGACY;
      const latest = isGuest ? envelope(key).items : read(key);
      if (signature(latest) !== signature(selected.other) || (isGuest && guestStamp(envelope(key)) !== selected.stamp)) { offers(); return false; }
      if ((isGuest && action === 'separate') || (!isGuest && action === 'later')) {
        cache[isGuest ? 'separateGuest' : 'deferredLegacy'] = isGuest ? selected.stamp : signature(selected.other);
        persist(); offers(); return true;
      }
      if (!isGuest && action === 'discard') { storage.removeItem(key); offers(); return true; }
      if (!(isGuest ? ['merge', 'replace'] : ['import']).includes(action)) return false;
      try {
        // Agrupar primero; hydrate valida fracciones y límites con las unidades vigentes.
        const next = canonical([...(action === 'replace' ? [] : items), ...selected.other]);
        status = 'loading'; emit('verifying');
        const verified = await commercial.hydrate(client, next);
        commercial.requirements(verified);
        if (!sameActor(token)) return false;
        const newest = isGuest ? envelope(key).items : read(key);
        if (signature(newest) !== signature(selected.other) || (isGuest && guestStamp(envelope(key)) !== selected.stamp)) { offers(); return false; }
        items = verified; dirty = Boolean(actor); revision++;
        cache[isGuest ? 'consumedGuest' : 'consumedLegacy'] = isGuest ? selected.stamp : signature(selected.other);
        // Guardar primero la recuperación en su destino; después retirar el origen elegido.
        persist(); storage.removeItem(key); offers(); return true;
      } catch (problem) {
        if (sameActor(token)) { status = 'decision'; decision = selected; error = problem.message || 'No pudimos combinar los carritos.'; emit('choice-error'); }
        return false;
      }
    }
    async function choose(action) {
      try { return await decide(action); }
      catch { fail('No pudimos guardar la selección del carrito en este navegador. Reintenta.'); return false; }
    }
    async function retry() {
      if (!client) { transition(null, true); return settling; }
      const started = ++generation;
      clearTimer(timer); syncing = null; revision++; status = 'loading'; error = ''; emit('verifying');
      try {
        const result = await client.auth.getUser();
        if (started !== generation) return;
        if (result.error && !missingSession(result)) throw result.error;
        transition(result.data?.user?.id || null, true); await settling;
      } catch { if (started === generation) fail('No pudimos verificar la cuenta. Reintenta.'); }
    }
    function reviewPending() {
      if (status !== 'ready') return;
      delete cache.separateGuest; delete cache.deferredLegacy; persist(); offers();
    }
    function storageChanged(event) {
      if (actor === undefined) return; // La lectura inicial recogerá el estado más reciente.
      if (event.key === null || event.key === scope(actor)) {
        const incoming = envelope(scope(actor));
        if (dirty && signature(incoming.items) !== signature(items)) {
          clearTimer(timer); syncing = null; generation++; revision++; status = 'decision';
          decision = { kind: 'tabs', other: canonical(incoming.items), cache: incoming }; emit('conflict');
        } else transition(actor ?? null, true);
      } else if ([GUEST, LEGACY].includes(event.key) && ['ready', 'decision'].includes(status) && decision?.kind !== 'conflict' && decision?.kind !== 'tabs') offers();
    }
    function onStorage(event) { try { storageChanged(event); } catch { fail('No pudimos leer el cambio de carrito en otra pestaña. Reintenta.'); } }
    try {
      const old = storage.getItem('sanmartin_ecommerce_cart_v1');
      if (old !== null) {
        if (!storage.getItem(LEGACY)) storage.setItem(LEGACY, JSON.stringify(canonical(old)));
        storage.removeItem('sanmartin_ecommerce_cart_v1');
      }
    } catch { fail('Este navegador no permite guardar el carrito.'); }
    if (client) {
      client.auth.onAuthStateChange((_event, session) => transition(session?.user?.id || null));
      const started = generation;
      const initializing = client.auth.getUser().then(result => {
        if (generation !== started) return;
        if (result.error && !missingSession(result)) { fail('No pudimos verificar la cuenta. Reintenta antes de abrir el carrito.'); return; }
        transition(result.data?.user?.id || null);
        return settling;
      }).catch(() => { if (generation === started) fail('No pudimos verificar la cuenta.'); });
      if (actor === undefined) settling = initializing;
    } else transition(null);
    return { read: () => clone(items), state, capture, isCurrent, sameActor, ensureReady, replace, choose, retry, flush, onStorage, reviewPending,
      subscribe(listener) { listeners.add(listener); listener(state(), 'initial'); return () => listeners.delete(listener); } };
  }
  window.SanMartinCrearCarrito = crear;
  if (window.SanMartinPresentaciones) {
    window.SanMartinCarrito = crear({ client: window.supabaseClient });
    window.addEventListener('storage', event => window.SanMartinCarrito.onStorage(event));
  }
})();

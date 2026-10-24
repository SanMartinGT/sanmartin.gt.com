/* Una solicitud conserva su UUID hasta recibir una respuesta válida del servidor. */
(function () {
  'use strict';
  const prefix = 'san-martin:solicitud:v1:';
  const inFlight = new Map();
  let generation = 0;
  function canonical(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + Array.from(value, item => item === undefined ? 'null' : canonical(item)).join(',') + ']';
    return '{' + Object.keys(value).filter(key => value[key] !== undefined).sort()
      .map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  }
  async function storageKey(actorId, operation, payload) {
    if (!actorId) throw new Error('Inicia sesión antes de registrar una operación.');
    const bytes = new TextEncoder().encode(canonical({ actorId, operation, payload }));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return prefix + Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
  }
  async function requestId(actorId, operation, payload) {
    const key = await storageKey(actorId, operation, payload);
    return requestIdFromKey(key);
  }
  function requestIdFromKey(key) {
    let id;
    try {
      id = localStorage.getItem(key);
      if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        throw new Error('El identificador guardado no es válido.');
      }
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
        if (localStorage.getItem(key) !== id) throw new Error('No se conservó la solicitud.');
      }
    } catch (_) {
      throw new Error('No se pudo guardar el identificador de la operación. Habilita el almacenamiento del sitio y vuelve a intentarlo.');
    }
    return { key, id };
  }
  async function pending(actorId, operation, payload) {
    const key = await storageKey(actorId, operation, payload);
    try {
      const id = localStorage.getItem(key);
      return Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
    } catch (_) { return false; }
  }
  async function invoke(client, actorId, operation, payload, {
    idField = 'p_solicitud_id', idPrefix = '',
    validateResult = data => data !== null && data !== undefined,
    beforeSend = () => true
  } = {}) {
    const startedIn = generation;
    const key = await storageKey(actorId, operation, payload);
    if (startedIn !== generation) return {
      data: null,
      error: { code: 'ACCESS_CHANGED', message: 'El acceso cambió antes de enviar la operación. Vuelve a iniciar sesión.' }
    };
    if (beforeSend() !== true) return {
      data: null,
      error: { code: 'CONTEXT_CHANGED', message: 'Cambió tu selección antes de enviar el pedido. Revisa sucursal, abastecimiento y entrega.' }
    };
    // Entre el guard y el envío no hay otra espera. No crear UUID para una
    // selección cancelada; conservar cualquier UUID pendiente ya existente.
    const saved = requestIdFromKey(key);
    if (inFlight.has(saved.key)) return inFlight.get(saved.key);
    const pending = (async () => {
      const result = await client.rpc(operation, { ...payload, [idField]: payload[idField] || idPrefix + saved.id });
      if (startedIn !== generation) return {
        data: null,
        error: { code: 'ACCESS_CHANGED', message: 'El acceso cambió mientras se procesaba la operación. Al volver a entrar, reintenta con los mismos datos para recuperar su resultado.' }
      };
      if (result?.error) return result;
      // La ausencia de error no confirma que la operación haya sido recibida.
      // Cada integración puede exigir además la forma de su respuesta esperada.
      if (!result || validateResult(result.data) !== true) return {
        ...result,
        error: { code: 'UNCONFIRMED_RESULT', message: 'No se recibió confirmación de la operación. Vuelve a intentar con los mismos datos.' }
      };
      // Si el navegador se cierra antes de este punto, el UUID sigue disponible.
      // Borrar después del éxito permite que el usuario inicie otra operación igual.
      try { if (localStorage.getItem(saved.key) === saved.id) localStorage.removeItem(saved.key); }
      catch (_) { /* conservar el UUID sólo convierte el próximo intento en una lectura */ }
      return result;
    })();
    inFlight.set(saved.key, pending);
    try { return await pending; }
    finally { if (inFlight.get(saved.key) === pending) inFlight.delete(saved.key); }
  }
  function reset() { generation++; inFlight.clear(); }
  window.SanMartinRequests = { invoke, requestId, pending, reset };
})();

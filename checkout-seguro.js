/* Checkout compartido: importes y elegibilidad se comprueban en el servidor. */
(function () {
  'use strict';
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let generation = 0, actor;
  function reset() { generation++; window.SanMartinRequests?.reset(); }
  function normalizarItems(items) {
    if (!Array.isArray(items) || !items.length || items.length > 100) throw new Error('El carrito debe contener entre 1 y 100 líneas.');
    const grouped = new Map();
    for (const item of items) {
      const id = String(item?.producto_id || '').toLowerCase(), presentationId = item?.presentacion_id ? String(item.presentacion_id).toLowerCase() : null, quantity = Number(item?.cantidad);
      if (!uuid.test(id)) throw new Error('El carrito contiene un producto no válido.');
      if (presentationId && !uuid.test(presentationId)) throw new Error('El carrito contiene una presentación no válida.');
      if (!Number.isFinite(quantity) || quantity <= 0 || Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 0.000001) throw new Error('Escribe cantidades positivas con un máximo de tres decimales.');
      if (presentationId && !Number.isInteger(quantity)) throw new Error('La cantidad de presentaciones debe ser entera.');
      const key = `${id}:${presentationId || ''}`, units = (grouped.get(key)?.units || 0) + Math.round(quantity * 1000);
      if (!Number.isSafeInteger(units)) throw new Error('La cantidad solicitada es demasiado grande.');
      grouped.set(key, { producto_id: id, presentacion_id: presentationId, units });
    }
    return [...grouped].sort(([a], [b]) => a.localeCompare(b)).map(([, item]) => ({ producto_id: item.producto_id, ...(item.presentacion_id ? { presentacion_id: item.presentacion_id } : {}), cantidad: item.units / 1000 }));
  }
  function attach(client) {
    client?.auth?.onAuthStateChange((event, session) => {
      const next = session?.user?.id || null;
      if (event === 'SIGNED_OUT' || (actor !== undefined && actor !== next)) reset();
      actor = next;
    });
  }
  function normalizarOpciones(options) {
    if (!options || !['SUCURSAL','OMNICANAL'].includes(options.modo)) throw new Error('Selecciona cómo abastecer tu pedido.');
    const {modo,ubicacionId}=options;
    if (modo==='SUCURSAL' && ubicacionId !== null) throw new Error('La modalidad de tienda usa su sucursal asignada.');
    if (modo==='OMNICANAL' && !uuid.test(String(ubicacionId))) throw new Error('Selecciona una sucursal de destino válida.');
    return Object.freeze({modo,ubicacionId:modo==='OMNICANAL'?String(ubicacionId).toLowerCase():null});
  }
  function solicitud(items, delivery, payment, options) {
    const {modo,ubicacionId}=normalizarOpciones(options);
    const normalized = normalizarItems(items);
    return {
      rpc: normalized.some(item => item.presentacion_id) ? 'crear_pedido_checkout_presentaciones' : 'crear_pedido_checkout',
      payload: { p_items: normalized, p_modo_inventario: modo, p_ubicacion_destino_id: ubicacionId,
        p_metodo_entrega: delivery, p_metodo_pago: payment, p_minutos_expiracion: 30 }
    };
  }
  async function tienePendiente(actorId, items, delivery, payment, options) {
    const request = solicitud(items, delivery, payment, options);
    return window.SanMartinRequests.pending(actorId, request.rpc, request.payload);
  }
  async function crear(client, actorId, items, delivery, payment, options, {isCurrent=()=>true}={}) {
    const started = generation;
    if (!actorId) throw new Error('Inicia sesión antes de confirmar el pedido.');
    if (actor !== undefined && actor !== actorId) throw new Error('La sesión cambió. Actualiza la página antes de confirmar el pedido.');
    if (!['RETIRO_TIENDA', 'DOMICILIO'].includes(delivery)) throw new Error('Selecciona la forma de entrega.');
    if (payment !== 'CONTRA_ENTREGA') throw new Error('Selecciona pago contra entrega.');
    const {modo,ubicacionId}=normalizarOpciones(options);
    const request = solicitud(items, delivery, payment, { modo, ubicacionId });
    const result = await window.SanMartinRequests.invoke(client, actorId, request.rpc, request.payload,
      { idField: 'p_clave_idempotencia', beforeSend:isCurrent, validateResult: receipt => uuid.test(String(receipt?.id)) && receipt?.pedido_id === receipt?.id
      && typeof receipt?.numero === 'string' && receipt.numero.trim().length > 0
      && typeof receipt?.total === 'number' && Number.isFinite(receipt.total) && receipt.total > 0
      && ['PENDIENTE', 'PAGADO', 'REEMBOLSO_PENDIENTE'].includes(receipt.estado_pago)
      && ['PENDIENTE', 'PREPARADO', 'ENVIADO', 'ENTREGADO', 'RETORNO_PENDIENTE', 'RETORNADO', 'CANCELADO'].includes(receipt.estado_entrega) });
    if (started !== generation) throw new Error('La sesión cambió. Vuelve a entrar y reintenta con el mismo carrito para consultar el resultado.');
    if (result?.error) throw new Error(result.error.message || 'No se pudo confirmar el pedido. Reintenta con el mismo carrito.');
    return result.data;
  }
  window.SanMartinCheckout = { crear, normalizarItems, normalizarOpciones, tienePendiente, reset };
  attach(window.supabaseClient);
})();

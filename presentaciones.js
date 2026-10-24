/* Cantidades comerciales: cada presentación comparte las existencias de su producto. */
(function () {
  'use strict';
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const key = item => `${String(item.producto_id).toLowerCase()}:${String(item.presentacion_id || '').toLowerCase()}`;
  const round = value => Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
  const decimals = product => product?.venta_fraccionada === true && product?.unidad_permite_fraccion === true
    ? Math.min(3, Math.max(0, Number(product.unidad_decimales_permitidos ?? 3))) : 0;
  const step = product => 10 ** -decimals(product);
  function validQuantity(quantity, product, presentationId) {
    const value = Number(quantity), places = presentationId ? 0 : decimals(product), scale = 10 ** places;
    return Number.isFinite(value) && value > 0 && value <= 100
      && Math.abs(value * scale - Math.round(value * scale)) < 0.000001;
  }
  function readCart(raw) {
    try {
      const items = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(items)) return [];
      const accepted = items.filter(item => item && uuid.test(String(item.producto_id))
        && (!item.presentacion_id || uuid.test(String(item.presentacion_id)))
        && Number.isFinite(Number(item.cantidad)) && Number(item.cantidad) > 0).map(item => ({
        producto_id: String(item.producto_id).toLowerCase(), presentacion_id: item.presentacion_id ? String(item.presentacion_id).toLowerCase() : null,
        nombre: String(item.nombre || 'Producto'), image: String(item.image || ''), cantidad: Number(item.cantidad),
        // Nunca reutilizar precios, factores ni permisos guardados en el navegador o la cuenta.
        precioOriginal: 0, precioOferta: null, precio: 0, factor_presentacion: 1, verificado: false
      }));
      const grouped = new Map();
      for (const item of accepted) {
        const previous = grouped.get(key(item));
        if (previous) previous.cantidad += item.cantidad; else grouped.set(key(item), item);
      }
      return [...grouped.values()];
    } catch { return []; }
  }
  async function loadPresentations(client, productIds) {
    const ids = [...new Set(productIds)], rows = [];
    for (let index = 0; index < ids.length; index += 100) {
      const result = await client.rpc('catalogo_presentaciones', { p_producto_ids: ids.slice(index, index + 100) });
      if (result.error || !Array.isArray(result.data)) throw new Error('No pudimos verificar las presentaciones. Inténtalo nuevamente.');
      rows.push(...result.data);
    }
    const map = new Map(ids.map(id => [String(id), []]));
    for (const row of rows) {
      if (!uuid.test(String(row.id)) || !map.has(String(row.producto_id)) || !(Number(row.cantidad_base) > 0)
        || row.precio === null || row.precio === undefined || !Number.isFinite(Number(row.precio)) || Number(row.precio) < 0
        || !Number.isFinite(Number(row.precio_ecommerce ?? row.precio)) || Number(row.precio_ecommerce ?? row.precio) < 0) continue;
      map.get(String(row.producto_id)).push({ ...row, cantidad_base: Number(row.cantidad_base), precio: Number(row.precio), precio_ecommerce: Number(row.precio_ecommerce ?? row.precio) });
    }
    for (const values of map.values()) values.sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || a.nombre.localeCompare(b.nombre));
    return map;
  }
  function options(product, presentations, basePrice, baseOriginal = basePrice) {
    const result = product.precio_base !== null && Number.isFinite(Number(basePrice)) && Number(basePrice) >= 0
      ? [{ id: null, nombre: product.unidad_nombre || 'Unidad', cantidad_base: 1, precio: Number(baseOriginal), precio_ecommerce: Number(basePrice) }] : [];
    return [...result, ...(presentations || [])];
  }
  function line(product, option, quantity, image = '') {
    if (!option || !validQuantity(quantity, product, option.id)) throw new Error(option?.id ? 'La cantidad de presentaciones debe ser entera.' : 'Revisa la cantidad y los decimales permitidos para este producto.');
    return {
      producto_id: String(product.id), presentacion_id: option.id || null, nombre: product.nombre_corto || product.nombre || product.name,
      image, cantidad: Number(quantity), presentacion_nombre: option.id ? option.nombre : '', factor_presentacion: Number(option.cantidad_base),
      precioOriginal: Number(option.precio), precio: Number(option.precio_ecommerce),
      precioOferta: Number(option.precio_ecommerce) < Number(option.precio) ? Number(option.precio_ecommerce) : null,
      venta_fraccionada: product.venta_fraccionada === true, unidad_permite_fraccion: product.unidad_permite_fraccion === true,
      unidad_decimales_permitidos: decimals(product), unidad_nombre: product.unidad_nombre || 'unidades', unidad_simbolo: product.unidad_simbolo || '', verificado: true
    };
  }
  function merge(cart, item) {
    const existing = cart.find(entry => key(entry) === key(item)), quantity = round((existing ? Number(existing.cantidad) : 0) + item.cantidad);
    if (!validQuantity(quantity, item, item.presentacion_id)) throw new Error('La cantidad solicitada es demasiado grande o no es válida.');
    if (existing) Object.assign(existing, item, { cantidad: quantity }); else cart.push({ ...item });
    return cart;
  }
  function requirements(items) {
    const grouped = new Map();
    for (const item of items) {
      if (!item.verificado || !validQuantity(item.cantidad, item, item.presentacion_id)) throw new Error('Revisa los productos pendientes de verificar en tu carrito.');
      const factor=item.presentacion_id?Number(item.factor_presentacion):1,base=Number(item.cantidad)*factor,scale=10**decimals(item);
      if(!Number.isFinite(factor)||factor<=0||!Number.isFinite(base)||base<=0||Math.abs(base*scale-Math.round(base*scale))>0.000001)throw new Error('La presentación no corresponde a la cantidad y los decimales de su unidad base.');
      grouped.set(item.producto_id, round((grouped.get(item.producto_id) || 0) + base));
    }
    return grouped;
  }
  function totals(items) {
    const original = items.reduce((sum, item) => sum + Math.round((Number(item.precioOriginal || 0) * item.cantidad + Number.EPSILON) * 100), 0);
    const current = items.reduce((sum, item) => sum + Math.round((Number(item.precio || 0) * item.cantidad + Number.EPSILON) * 100), 0);
    return { subtotal: original / 100, total: current / 100, descuento: (original - current) / 100 };
  }
  async function hydrate(client, items) {
    if (!items.length) return [];
    const ids = [...new Set(items.map(item => item.producto_id))];
    const [productResult, presentations, offerResult] = await Promise.all([
      client.from('catalogo_productos').select('*').in('id', ids), loadPresentations(client, ids),
      client.from('ofertas_producto').select('producto_id,oferta_porcentaje,fecha_inicio,fecha_fin,activo,aplica_ecommerce').in('producto_id', ids).eq('activo', true).eq('aplica_ecommerce', true)
    ]);
    if (productResult.error || offerResult.error) throw new Error('No pudimos actualizar los precios del carrito. Inténtalo nuevamente.');
    const products = new Map((productResult.data || []).map(product => [String(product.id), product])), now = new Date();
    return items.map(item => {
      const product = products.get(item.producto_id);
      const invalid = message => ({ ...item, precio: 0, precioOriginal: 0, precioOferta: null, factor_presentacion: 1, verificado: false, error: message });
      if (!product) return invalid('Este producto ya no está disponible. Retíralo del carrito.');
      const original = Number(product.precio_base), discount = Math.max(0, ...(offerResult.data || []).filter(offer => offer.producto_id === product.id && new Date(offer.fecha_inicio) <= now && (!offer.fecha_fin || new Date(offer.fecha_fin) >= now)).map(offer => Number(offer.oferta_porcentaje) || 0));
      const price = Math.round(original * (1 - Math.min(100, discount) / 100) * 100) / 100;
      const option = options(product, presentations.get(item.producto_id), price, original).find(option => (option.id || null) === (item.presentacion_id || null));
      if (!option) return invalid('Esta presentación ya no está disponible. Elige otra en la ficha del producto.');
      if (!validQuantity(item.cantidad, product, item.presentacion_id)) return invalid('La cantidad no corresponde a los decimales o presentaciones permitidos.');
      return line(product, option, item.cantidad, item.image);
    });
  }
  async function availability(client, items, options) {
    requirements(items);
    const context=window.SanMartinCheckout.normalizarOpciones(options),normalized=window.SanMartinCheckout.normalizarItems(items);
    const result=await client.rpc('validar_disponibilidad_presentaciones_contextual',{p_items:normalized,p_modo_inventario:context.modo,p_ubicacion_destino_id:context.ubicacionId});
    if(result.error||!Array.isArray(result.data))throw new Error(result.error?.message||'No pudimos verificar la disponibilidad para esta selección.');
    const ids=new Set(normalized.map(item=>item.producto_id)),states=new Map();let effectiveDestination;
    for(const row of result.data){
      if(!row||!ids.has(row.producto_id)||states.has(row.producto_id)||!['DISPONIBLE','AGOTADO','NO_DISPONIBLE'].includes(row.estado)
        ||row.modo_inventario!==context.modo||!uuid.test(String(row.ubicacion_destino_id))||typeof row.requiere_traslado!=='boolean'
        ||(context.modo==='OMNICANAL'&&row.ubicacion_destino_id!==context.ubicacionId)
        ||(context.modo==='SUCURSAL'&&row.requiere_traslado)
        ||(row.estado!=='DISPONIBLE'&&row.requiere_traslado)
        ||(effectiveDestination!==undefined&&effectiveDestination!==row.ubicacion_destino_id))throw new Error('La disponibilidad recibida no corresponde al carrito y destino elegidos.');
      effectiveDestination=row.ubicacion_destino_id;states.set(row.producto_id,row);
    }
    if(states.size!==ids.size)throw new Error('No pudimos confirmar la disponibilidad de todos los productos.');
    const unavailable=[...states.values()].find(row=>row.estado!=='DISPONIBLE');
    if(unavailable)throw new Error(unavailable.mensaje||'Revisa los productos y la disponibilidad para esta selección.');
    return states;
  }
  window.SanMartinPresentaciones = { key, round, decimals, step, validQuantity, readCart, loadPresentations, options, line, merge, requirements, totals, hydrate, availability };
})();

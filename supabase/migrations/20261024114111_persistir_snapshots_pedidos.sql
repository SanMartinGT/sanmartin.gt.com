-- H08: delta contra el catálogo vivo. No rellena ni reescribe pedidos existentes.
-- Creado con Supabase CLI 2.122.0 migration new persistir_snapshots_pedidos.
SET LOCAL lock_timeout = '5s';

DO $h08_guard$
BEGIN
 IF (SELECT md5(pg_get_functiondef(to_regprocedure('erp_private.crear_pedido_checkout(jsonb,text,uuid,character varying,character varying,uuid,integer)')))) IS DISTINCT FROM '150dbd79ca4716e0a4f8decc9cd7f1c6' THEN RAISE EXCEPTION 'H08: cambió erp_private.crear_pedido_checkout; comparar nuevamente el esquema vivo'; END IF;
 IF (SELECT md5(pg_get_functiondef(to_regprocedure('erp_private.crear_pedido_checkout_presentaciones(jsonb,text,uuid,character varying,character varying,uuid,integer)')))) IS DISTINCT FROM 'c0e7d6953f489cd3d15c037e27064557' THEN RAISE EXCEPTION 'H08: cambió erp_private.crear_pedido_checkout_presentaciones; comparar nuevamente el esquema vivo'; END IF;
 IF (SELECT md5(pg_get_functiondef(to_regprocedure('public.erp_detalle_productos_pedido(uuid)')))) IS DISTINCT FROM '0e33a2bf5f0ed64f8d86a3a0ee30e70f' THEN RAISE EXCEPTION 'H08: cambió public.erp_detalle_productos_pedido; comparar nuevamente el esquema vivo'; END IF;
 IF (SELECT md5(pg_get_functiondef(to_regprocedure('erp_private.emitir_comprobante_cobrado(uuid)')))) IS DISTINCT FROM '455e417b7b2c195bf928a22a8ef9c7c9' THEN RAISE EXCEPTION 'H08: cambió erp_private.emitir_comprobante_cobrado; comparar nuevamente el esquema vivo'; END IF;
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid='public.pedidos_ecommerce_detalle'::regclass AND attname IN('producto_snapshot','unidad_medida_snapshot') AND NOT attisdropped)
  OR to_regprocedure('erp_private.capturar_identidad_pedido()') IS NOT NULL
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid='public.pedidos_ecommerce_detalle'::regclass AND tgname='h08_snapshot_identidad_pedido') THEN
  RAISE EXCEPTION 'H08: los snapshots ya existen; comparar antes de reaplicar';
 END IF;
END $h08_guard$;

ALTER TABLE public.pedidos_ecommerce_detalle ADD COLUMN producto_snapshot jsonb;
ALTER TABLE public.pedidos_ecommerce_detalle ADD COLUMN unidad_medida_snapshot jsonb;
COMMENT ON COLUMN public.pedidos_ecommerce_detalle.producto_snapshot IS 'Identidad comercial capturada al insertar esta línea (H08). NULL en filas anteriores; no reconstruir desde el catálogo actual.';
COMMENT ON COLUMN public.pedidos_ecommerce_detalle.unidad_medida_snapshot IS 'Unidad de inventario capturada al insertar esta línea (H08). NULL significa que no fue registrada, no la unidad actual.';

CREATE FUNCTION erp_private.capturar_identidad_pedido()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO ''
AS $function$
DECLARE capturado timestamptz:=statement_timestamp();
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.producto_id IS DISTINCT FROM OLD.producto_id
   OR NEW.producto_snapshot IS DISTINCT FROM OLD.producto_snapshot
   OR NEW.unidad_medida_snapshot IS DISTINCT FROM OLD.unidad_medida_snapshot THEN
   RAISE EXCEPTION 'La identidad comercial registrada de una línea de pedido es inmutable' USING ERRCODE='22023';
  END IF;
  RETURN NEW;
 END IF;
 -- Una sola lectura coherente de producto/unidad. El checkout y su trigger de
 -- cantidades ya mantienen los bloqueos de producto/unidad del motor existente.
 -- Nunca aceptar una supuesta identidad histórica enviada por el cliente.
 SELECT jsonb_build_object('version',1,'capturado_en',capturado,'id',p.id,'nombre',p.nombre,'sku',p.sku),
  jsonb_build_object('version',1,'capturado_en',capturado,'id',um.id,'nombre',um.nombre,'abreviatura',um.abreviatura,
   'permite_fraccion',um.permite_fraccion,'decimales_permitidos',um.decimales_permitidos,'venta_fraccionada',p.venta_fraccionada)
 INTO NEW.producto_snapshot,NEW.unidad_medida_snapshot
 FROM public.productos p JOIN public.unidades_medida um ON um.id=p.unidad_medida_id WHERE p.id=NEW.producto_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'No se pudo registrar la identidad comercial del producto y su unidad' USING ERRCODE='23503'; END IF;
 RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION erp_private.capturar_identidad_pedido() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER h08_snapshot_identidad_pedido BEFORE INSERT OR UPDATE ON public.pedidos_ecommerce_detalle
 FOR EACH ROW EXECUTE FUNCTION erp_private.capturar_identidad_pedido();

CREATE OR REPLACE FUNCTION erp_private.crear_pedido_checkout(p_items jsonb, p_modo_inventario text, p_ubicacion_destino_id uuid, p_metodo_entrega character varying, p_metodo_pago character varying, p_clave_idempotencia uuid, p_minutos_expiracion integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$

declare

  cliente uuid:=auth.uid(); perfil public.perfiles%rowtype; destino public.ubicaciones%rowtype; configurada uuid;

  anterior public.pedidos_ecommerce%rowtype; item record; producto record; fuente record;

  pedido_id uuid; numero_pedido varchar; reserva_id uuid; traslado_id uuid; numero_traslado text;

  solicitado numeric; tomar numeric; v_total numeric:=0; v_costo_envio numeric:=0; precio numeric; descuento numeric; maximo numeric:=100;

  direccion jsonb; normalizados jsonb; hash_solicitud text; vencimiento timestamptz; productos_ids uuid[]; existencias_ids uuid[];

begin

  if cliente is null or not public.erp_sesion_autorizada() or not public.erp_usuario_activo() then raise exception 'Inicia sesión con una cuenta activa para confirmar tu pedido' using errcode='42501'; end if;

  if p_modo_inventario is null or p_modo_inventario not in('SUCURSAL','OMNICANAL') then raise exception 'Modo de inventario inválido'; end if;
  if p_clave_idempotencia is null then raise exception 'Envía una clave de idempotencia para confirmar el pedido'; end if;

  if p_minutos_expiracion is null or p_minutos_expiracion<1 or p_minutos_expiracion>1440 then raise exception 'La reserva debe vencer entre 1 y 1440 minutos'; end if;

  if p_metodo_entrega is null or p_metodo_entrega not in('RETIRO_TIENDA','DOMICILIO') then raise exception 'Selecciona retiro en tienda o envío a domicilio'; end if;

  if p_metodo_pago is distinct from 'CONTRA_ENTREGA' then raise exception 'Selecciona pago contra entrega'; end if;

  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'El carrito debe contener de 1 a 100 líneas'; end if;

  if exists(select 1 from jsonb_array_elements(p_items) x

    where jsonb_typeof(x)<>'object' or jsonb_typeof(x->'cantidad') is distinct from 'number'

      or jsonb_typeof(x->'producto_id') is distinct from 'string'

      or round((x->>'cantidad')::numeric,3)<>(x->>'cantidad')::numeric
      or (x->>'cantidad')::numeric<=0 or (x->>'cantidad')::numeric::text in('NaN','Infinity','-Infinity')) then

    raise exception 'Cada línea necesita producto_id y cantidad numérica positiva con máximo 3 decimales'; end if;

  select jsonb_agg(jsonb_build_object('producto_id',producto_id,'cantidad',cantidad) order by producto_id),

    array_agg(producto_id order by producto_id) into normalizados,productos_ids

    from (select producto_id,trim_scale(sum(cantidad)) cantidad from jsonb_to_recordset(p_items) x(producto_id uuid,cantidad numeric) group by producto_id) q;

  if p_modo_inventario='SUCURSAL' then
    select ubicacion_ecommerce_id into configurada from public.configuracion_ecommerce where id=true;
    if configurada is null then raise exception 'Configura la sucursal de ecommerce'; end if;
    if p_ubicacion_destino_id is not null and p_ubicacion_destino_id is distinct from configurada then raise exception 'La modalidad SUCURSAL usa la sucursal configurada de ecommerce'; end if;
    p_ubicacion_destino_id:=configurada;
  end if;
  if exists(select 1 from public.perfiles p where p.id=cliente and p.rol_id is not null) then
    perform erp_private.require_staff('pedidos.crear',p_ubicacion_destino_id);
  end if;
  hash_solicitud:=md5(jsonb_build_object('items',normalizados,'destino',p_ubicacion_destino_id,'modo',p_modo_inventario,

    'entrega',p_metodo_entrega,'pago',p_metodo_pago,'minutos',p_minutos_expiracion)::text);

  perform pg_advisory_xact_lock(hashtextextended('checkout:'||cliente::text||':'||p_clave_idempotencia::text,0));

  select * into anterior from public.pedidos_ecommerce where cliente_id=cliente and clave_idempotencia=p_clave_idempotencia for update;

  if found then

    if anterior.solicitud_omnicanal_hash is distinct from hash_solicitud then raise exception 'La clave ya se usó para un pedido diferente'; end if;

    return erp_private.omnicanal_respuesta(anterior.id);

  end if;

  select * into destino from public.ubicaciones where id=p_ubicacion_destino_id and activo

    and permite_inventario and permite_venta;

  if not found then raise exception 'Selecciona una sucursal habilitada para inventario y venta'; end if;

  select * into perfil from public.perfiles where id=cliente;

  if p_metodo_entrega='DOMICILIO' and (nullif(btrim(perfil.direccion_completa),'') is null or nullif(btrim(perfil.departamento),'') is null or nullif(btrim(perfil.municipio),'') is null) then

    raise exception 'Agrega tu dirección de entrega antes de finalizar el pedido'; end if;

  direccion:=(case when p_metodo_entrega='DOMICILIO' then jsonb_build_object('nombre',perfil.nombre_direccion,'departamento',perfil.departamento,'municipio',perfil.municipio,'direccion_completa',perfil.direccion_completa,'referencia',perfil.referencia_direccion)

    else jsonb_build_object('tipo','RETIRO_TIENDA','ubicacion_id',destino.id,'sucursal',destino.nombre) end) || jsonb_build_object('version_snapshot',1,'destinatario',nullif(concat_ws(' ',nullif(btrim(perfil.nombre),''),nullif(btrim(perfil.segundo_nombre),''),nullif(btrim(perfil.apellido),''),nullif(btrim(perfil.segundo_apellido),'')),''),'nombre_completo',nullif(concat_ws(' ',nullif(btrim(perfil.nombre),''),nullif(btrim(perfil.segundo_nombre),''),nullif(btrim(perfil.apellido),''),nullif(btrim(perfil.segundo_apellido),'')),''),'telefono',nullif(btrim(perfil.telefono),''));

  select greatest(1,coalesce(max_cantidad_por_linea,100)) into maximo from public.configuracion_ecommerce where id=true;

  maximo:=coalesce(maximo,100);

  -- Orden único: producto/unidad antes de existencias, igual que POS y compras.
  perform p.id from public.productos p where p.id=any(productos_ids) order by p.id for no key update;
  perform um.id from public.unidades_medida um where exists(select 1 from public.productos p where p.id=any(productos_ids) and p.unidad_medida_id=um.id) order by um.id for share;
  select coalesce(array_agg(q.id),'{}'::uuid[]) into existencias_ids from (

    select e.id from public.existencias e join public.ubicaciones u on u.id=e.ubicacion_id

    where e.producto_id=any(productos_ids) and e.activo and u.activo and u.permite_inventario

      and (u.id=destino.id or (p_modo_inventario='OMNICANAL' and destino.permite_recepcion and destino.permite_transferencia and u.permite_transferencia))

    order by e.producto_id,e.ubicacion_id,e.id for update of e

  ) q;

  vencimiento:=clock_timestamp()+make_interval(mins=>p_minutos_expiracion);

  perform set_config('sanmartin.ecommerce_checkout','true',true);
  numero_pedido:=case when p_modo_inventario='OMNICANAL' then 'OMNI-' else 'EC-' end||to_char(current_date,'YYYYMMDD')||'-'||nextval('public.pedidos_ecommerce_numero_seq')::text;

  insert into public.pedidos_ecommerce(numero,ubicacion_id,total,cliente_id,direccion_envio,costo_envio,metodo_entrega,metodo_pago,modo_inventario,clave_idempotencia,solicitud_omnicanal_hash,fecha_expiracion_reserva)

    values(numero_pedido,destino.id,0,cliente,direccion,0,p_metodo_entrega,p_metodo_pago,p_modo_inventario,p_clave_idempotencia,hash_solicitud,vencimiento) returning id into pedido_id;

  for item in select * from jsonb_to_recordset(normalizados) x(producto_id uuid,cantidad numeric) order by producto_id loop

    select p.*,u.permite_fraccion,greatest(0,least(3,u.decimales_permitidos)) decimales into producto

      from public.productos p join public.unidades_medida u on u.id=p.unidad_medida_id and u.activo

      join public.categorias c on c.id=p.categoria_id and c.activo and c.visible_ecommerce

      where p.id=item.producto_id and p.activo and not p.descontinuado and p.es_vendible and p.es_comprable and p.controla_inventario and p.publicado_ecommerce and p.visible_ecommerce
      and (p.marca_id is null or exists(select 1 from public.marcas marca where marca.id=p.marca_id and marca.activo));

    if not found then raise exception 'Uno de los productos ya no está disponible para la venta'; end if;

    perform erp_private.validar_cantidad_producto(item.producto_id,item.cantidad);
    if item.cantidad is null or item.cantidad<=0 or item.cantidad::text in('NaN','Infinity','-Infinity') or item.cantidad>maximo then raise exception 'Cantidad inválida para %; máximo por producto %',producto.nombre,maximo; end if;

    if exists(select 1 from jsonb_to_recordset(p_items) raw(producto_id uuid,cantidad numeric) where raw.producto_id=producto.id and round(raw.cantidad,case when producto.venta_fraccionada and producto.permite_fraccion then producto.decimales else 0 end)<>raw.cantidad) then raise exception 'Cada línea debe respetar la unidad antes de consolidarse' using errcode='22023'; end if;
    if not (producto.venta_fraccionada and producto.permite_fraccion) and item.cantidad<>trunc(item.cantidad) then raise exception '% solo se vende en unidades completas',producto.nombre; end if;

    if producto.venta_fraccionada and producto.permite_fraccion and round(item.cantidad,producto.decimales::integer)<>item.cantidad then raise exception '% permite como máximo % decimales',producto.nombre,producto.decimales; end if;

    if producto.precio_base<0 or producto.precio_base::text in('NaN','Infinity','-Infinity') then raise exception 'Precio inválido para %',producto.nombre; end if;

    if exists(select 1 from public.ofertas_producto oferta where oferta.producto_id=producto.id and oferta.activo and oferta.aplica_ecommerce and oferta.fecha_inicio<=now() and (oferta.fecha_fin is null or oferta.fecha_fin>=now()) and (oferta.oferta_porcentaje<0 or oferta.oferta_porcentaje>100 or oferta.oferta_porcentaje::text in('NaN','Infinity','-Infinity'))) then raise exception 'Oferta inválida para %',producto.nombre; end if;
    select max(oferta_porcentaje) into descuento from public.ofertas_producto

      where producto_id=producto.id and activo and aplica_ecommerce and fecha_inicio<=now() and (fecha_fin is null or fecha_fin>=now());

    if descuento is not null and (descuento<0 or descuento>100 or descuento::text in('NaN','Infinity','-Infinity')) then raise exception 'Oferta inválida para %',producto.nombre; end if;

    precio:=round(producto.precio_base*(1-coalesce(descuento,0)/100),2);

    insert into public.pedidos_ecommerce_detalle(pedido_id,producto_id,cantidad,precio_unitario,total_linea)

      values(pedido_id,producto.id,item.cantidad,precio,round(item.cantidad*precio,2));

    v_total:=v_total+round(item.cantidad*precio,2); solicitado:=item.cantidad;

    -- Ya bloqueadas todas las filas en orden de producto/ubicación; ahora asignar

    -- primero el stock de la sucursal elegida, luego las fuentes por orden/código.

    for fuente in select e.*,u.nombre ubicacion_nombre,u.codigo ubicacion_codigo

      from public.existencias e join public.ubicaciones u on u.id=e.ubicacion_id

      where e.id=any(existencias_ids) and e.producto_id=producto.id and e.activo and e.stock_disponible>0 and u.activo and u.permite_inventario

        and (u.id=destino.id or (p_modo_inventario='OMNICANAL' and destino.permite_recepcion and destino.permite_transferencia and u.permite_transferencia))

      order by (e.ubicacion_id=destino.id) desc,u.orden,u.codigo,e.ubicacion_id loop

      exit when solicitado<=0;

      tomar:=least(solicitado,fuente.stock_disponible);

      update public.existencias set stock_reservado=stock_reservado+tomar,stock_disponible=stock_disponible-tomar,

        fecha_ultimo_movimiento=now(),actualizado_por=cliente where id=fuente.id and stock_disponible>=tomar;

      if not found then raise exception 'El inventario cambió; vuelve a confirmar tu carrito'; end if;

      insert into public.reservas(producto_id,ubicacion_id,cantidad,estado,origen,referencia_tipo,referencia_id,referencia_numero,fecha_expiracion,creado_por)

        values(producto.id,fuente.ubicacion_id,tomar,'ACTIVA','ECOMMERCE','pedido_ecommerce',pedido_id,numero_pedido,vencimiento,cliente) returning id into reserva_id;

      insert into public.movimientos(producto_id,ubicacion_id,tipo_movimiento,cantidad,stock_anterior,stock_posterior,origen,referencia_tipo,referencia_id,referencia_numero,grupo_movimiento_id,usuario_id)

        values(producto.id,fuente.ubicacion_id,'RESERVA',tomar,fuente.stock_disponible,fuente.stock_disponible-tomar,'ECOMMERCE','pedido_ecommerce',pedido_id,numero_pedido,pedido_id,cliente);

      if fuente.ubicacion_id<>destino.id then

        traslado_id:=gen_random_uuid(); numero_traslado:='TR-OMNI-'||substring(traslado_id::text,1,8)||'-'||substring(traslado_id::text,25,12);

        insert into public.transferencias_omnicanal(id,numero,pedido_id,producto_id,cantidad,ubicacion_origen_id,ubicacion_destino_id,reserva_origen_id)

          values(traslado_id,numero_traslado,pedido_id,producto.id,tomar,fuente.ubicacion_id,destino.id,reserva_id);

        insert into public.notificaciones_omnicanal(pedido_id,transferencia_id,tipo,titulo,mensaje,ubicacion_origen_id,ubicacion_destino_id,creado_por)

          values(pedido_id,traslado_id,'TRANSFERENCIA_GENERADA','Transferencia automática pendiente',

            format('Pedido %s: trasladar %s unidades de %s desde %s a %s. Stock reservado hasta %s.',numero_pedido,tomar,producto.nombre,fuente.ubicacion_nombre,destino.nombre,vencimiento),

            fuente.ubicacion_id,destino.id,cliente);

      end if;

      solicitado:=solicitado-tomar;

    end loop;

    if solicitado>0 then raise exception 'Stock insuficiente en la red para %; faltan % unidades',producto.nombre,solicitado; end if;

  end loop;

  if p_metodo_entrega='DOMICILIO' and v_total<100 then raise exception 'El pedido mínimo para envío a domicilio es de Q100.00'; end if;

  if p_metodo_entrega='RETIRO_TIENDA' and v_total<1 then raise exception 'El pedido mínimo para recoger en tienda es de Q1.00'; end if;

  if p_metodo_entrega='DOMICILIO' and v_total<=200 then v_costo_envio:=25; end if;

  update public.pedidos_ecommerce set total=v_total+v_costo_envio,costo_envio=v_costo_envio where id=pedido_id;

  return erp_private.omnicanal_respuesta(pedido_id);

end;

$function$
;

CREATE OR REPLACE FUNCTION erp_private.crear_pedido_checkout_presentaciones(p_items jsonb, p_modo_inventario text, p_ubicacion_destino_id uuid, p_metodo_entrega character varying, p_metodo_pago character varying, p_clave_idempotencia uuid, p_minutos_expiracion integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$

declare

  cliente uuid:=auth.uid(); perfil public.perfiles%rowtype; destino public.ubicaciones%rowtype; configurada uuid;

  anterior public.pedidos_ecommerce%rowtype; item record; producto record; fuente record;

  pedido_id uuid; numero_pedido varchar; reserva_id uuid; traslado_id uuid; numero_traslado text;

  solicitado numeric; tomar numeric; v_total numeric:=0; v_costo_envio numeric:=0; precio numeric; descuento numeric; maximo numeric:=100;

  resolved jsonb; baseqty numeric; factor numeric; direccion jsonb; normalizados jsonb; hash_solicitud text; vencimiento timestamptz; productos_ids uuid[]; existencias_ids uuid[];

begin

  if cliente is null or not public.erp_sesion_autorizada() or not public.erp_usuario_activo() then raise exception 'Inicia sesión con una cuenta activa para confirmar tu pedido' using errcode='42501'; end if;

  if p_modo_inventario is null or p_modo_inventario not in('SUCURSAL','OMNICANAL') then raise exception 'Modo de inventario inválido'; end if;
  if p_clave_idempotencia is null then raise exception 'Envía una clave de idempotencia para confirmar el pedido'; end if;

  if p_minutos_expiracion is null or p_minutos_expiracion<1 or p_minutos_expiracion>1440 then raise exception 'La reserva debe vencer entre 1 y 1440 minutos'; end if;

  if p_metodo_entrega is null or p_metodo_entrega not in('RETIRO_TIENDA','DOMICILIO') then raise exception 'Selecciona retiro en tienda o envío a domicilio'; end if;

  if p_metodo_pago is distinct from 'CONTRA_ENTREGA' then raise exception 'Selecciona pago contra entrega'; end if;

  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'El carrito debe contener de 1 a 100 líneas'; end if;

  if exists(select 1 from jsonb_array_elements(p_items) x

    where jsonb_typeof(x)<>'object' or jsonb_typeof(x->'cantidad') is distinct from 'number'

      or jsonb_typeof(x->'producto_id') is distinct from 'string'

      or round((x->>'cantidad')::numeric,3)<>(x->>'cantidad')::numeric
      or (x->>'cantidad')::numeric<=0 or (x->>'cantidad')::numeric::text in('NaN','Infinity','-Infinity')) then

    raise exception 'Cada línea necesita producto_id y cantidad numérica positiva con máximo 3 decimales'; end if;

  normalizados:=erp_private.normalizar_lineas_presentaciones(p_items,100);
  select array_agg(distinct producto_id order by producto_id) into productos_ids from jsonb_to_recordset(normalizados)x(producto_id uuid);

  if p_modo_inventario='SUCURSAL' then
    select ubicacion_ecommerce_id into configurada from public.configuracion_ecommerce where id=true;
    if configurada is null then raise exception 'Configura la sucursal de ecommerce'; end if;
    if p_ubicacion_destino_id is not null and p_ubicacion_destino_id is distinct from configurada then raise exception 'La modalidad SUCURSAL usa la sucursal configurada de ecommerce'; end if;
    p_ubicacion_destino_id:=configurada;
  end if;
  if exists(select 1 from public.perfiles p where p.id=cliente and p.rol_id is not null) then
    perform erp_private.require_staff('pedidos.crear',p_ubicacion_destino_id);
  end if;
  hash_solicitud:=md5(jsonb_build_object('version','PRESENTACIONES_V1','items',normalizados,'destino',p_ubicacion_destino_id,'modo',p_modo_inventario,

    'entrega',p_metodo_entrega,'pago',p_metodo_pago,'minutos',p_minutos_expiracion)::text);

  perform pg_advisory_xact_lock(hashtextextended('checkout:'||cliente::text||':'||p_clave_idempotencia::text,0));

  select * into anterior from public.pedidos_ecommerce where cliente_id=cliente and clave_idempotencia=p_clave_idempotencia for update;

  if found then

    if anterior.solicitud_omnicanal_hash is distinct from hash_solicitud then raise exception 'La clave ya se usó para un pedido diferente'; end if;

    return erp_private.omnicanal_respuesta(anterior.id);

  end if;

  select * into destino from public.ubicaciones where id=p_ubicacion_destino_id and activo

    and permite_inventario and permite_venta;

  if not found then raise exception 'Selecciona una sucursal habilitada para inventario y venta'; end if;

  select * into perfil from public.perfiles where id=cliente;

  if p_metodo_entrega='DOMICILIO' and (nullif(btrim(perfil.direccion_completa),'') is null or nullif(btrim(perfil.departamento),'') is null or nullif(btrim(perfil.municipio),'') is null) then

    raise exception 'Agrega tu dirección de entrega antes de finalizar el pedido'; end if;

  direccion:=(case when p_metodo_entrega='DOMICILIO' then jsonb_build_object('nombre',perfil.nombre_direccion,'departamento',perfil.departamento,'municipio',perfil.municipio,'direccion_completa',perfil.direccion_completa,'referencia',perfil.referencia_direccion)

    else jsonb_build_object('tipo','RETIRO_TIENDA','ubicacion_id',destino.id,'sucursal',destino.nombre) end) || jsonb_build_object('version_snapshot',1,'destinatario',nullif(concat_ws(' ',nullif(btrim(perfil.nombre),''),nullif(btrim(perfil.segundo_nombre),''),nullif(btrim(perfil.apellido),''),nullif(btrim(perfil.segundo_apellido),'')),''),'nombre_completo',nullif(concat_ws(' ',nullif(btrim(perfil.nombre),''),nullif(btrim(perfil.segundo_nombre),''),nullif(btrim(perfil.apellido),''),nullif(btrim(perfil.segundo_apellido),'')),''),'telefono',nullif(btrim(perfil.telefono),''));

  select greatest(1,coalesce(max_cantidad_por_linea,100)) into maximo from public.configuracion_ecommerce where id=true;

  maximo:=coalesce(maximo,100);

  -- Orden único: producto/unidad antes de existencias, igual que POS y compras.
  perform p.id from public.productos p where p.id=any(productos_ids) order by p.id for no key update;
  perform um.id from public.unidades_medida um where exists(select 1 from public.productos p where p.id=any(productos_ids) and p.unidad_medida_id=um.id) order by um.id for share;
  select coalesce(array_agg(q.id),'{}'::uuid[]) into existencias_ids from (

    select e.id from public.existencias e join public.ubicaciones u on u.id=e.ubicacion_id

    where e.producto_id=any(productos_ids) and e.activo and u.activo and u.permite_inventario

      and (u.id=destino.id or (p_modo_inventario='OMNICANAL' and destino.permite_recepcion and destino.permite_transferencia and u.permite_transferencia))

    order by e.producto_id,e.ubicacion_id,e.id for update of e

  ) q;

  vencimiento:=clock_timestamp()+make_interval(mins=>p_minutos_expiracion);

  perform set_config('sanmartin.ecommerce_checkout','true',true);
  numero_pedido:=case when p_modo_inventario='OMNICANAL' then 'OMNI-' else 'EC-' end||to_char(current_date,'YYYYMMDD')||'-'||nextval('public.pedidos_ecommerce_numero_seq')::text;

  insert into public.pedidos_ecommerce(numero,ubicacion_id,total,cliente_id,direccion_envio,costo_envio,metodo_entrega,metodo_pago,modo_inventario,clave_idempotencia,solicitud_omnicanal_hash,fecha_expiracion_reserva)

    values(numero_pedido,destino.id,0,cliente,direccion,0,p_metodo_entrega,p_metodo_pago,p_modo_inventario,p_clave_idempotencia,hash_solicitud,vencimiento) returning id into pedido_id;

  for item in select * from jsonb_to_recordset(normalizados) x(producto_id uuid,presentacion_id uuid,cantidad numeric) order by producto_id,presentacion_id nulls first loop

    select p.*,u.permite_fraccion,greatest(0,least(3,u.decimales_permitidos)) decimales into producto

      from public.productos p join public.unidades_medida u on u.id=p.unidad_medida_id and u.activo

      join public.categorias c on c.id=p.categoria_id and c.activo and c.visible_ecommerce

      where p.id=item.producto_id and p.activo and not p.descontinuado and p.es_vendible and p.es_comprable and p.controla_inventario and p.publicado_ecommerce and p.visible_ecommerce
      and (p.marca_id is null or exists(select 1 from public.marcas marca where marca.id=p.marca_id and marca.activo));

    if not found then raise exception 'Uno de los productos ya no está disponible para la venta'; end if;

    if item.cantidad>maximo then raise exception 'Cantidad de unidades o presentaciones superior al máximo por línea %',maximo; end if;
    resolved:=erp_private.resolver_linea_presentacion(producto.id,item.presentacion_id,item.cantidad,'ECOMMERCE');
    baseqty:=(resolved->>'cantidad_base')::numeric; factor:=(resolved->>'factor')::numeric; precio:=(resolved->>'precio')::numeric;
    insert into public.pedidos_ecommerce_detalle(pedido_id,producto_id,cantidad,precio_unitario,total_linea,presentacion_id,presentacion_nombre,cantidad_presentaciones,factor_presentacion,precio_presentacion)
    values(pedido_id,producto.id,baseqty,precio/factor,round(item.cantidad*precio,2),item.presentacion_id,resolved->>'presentacion_nombre',
      case when item.presentacion_id is not null then item.cantidad end,case when item.presentacion_id is not null then factor end,case when item.presentacion_id is not null then precio end);
    v_total:=v_total+round(item.cantidad*precio,2); solicitado:=baseqty;

    -- Ya bloqueadas todas las filas en orden de producto/ubicación; ahora asignar

    -- primero el stock de la sucursal elegida, luego las fuentes por orden/código.

    for fuente in select e.*,u.nombre ubicacion_nombre,u.codigo ubicacion_codigo

      from public.existencias e join public.ubicaciones u on u.id=e.ubicacion_id

      where e.id=any(existencias_ids) and e.producto_id=producto.id and e.activo and e.stock_disponible>0 and u.activo and u.permite_inventario

        and (u.id=destino.id or (p_modo_inventario='OMNICANAL' and destino.permite_recepcion and destino.permite_transferencia and u.permite_transferencia))

      order by (e.ubicacion_id=destino.id) desc,u.orden,u.codigo,e.ubicacion_id loop

      exit when solicitado<=0;

      tomar:=least(solicitado,fuente.stock_disponible);

      update public.existencias set stock_reservado=stock_reservado+tomar,stock_disponible=stock_disponible-tomar,

        fecha_ultimo_movimiento=now(),actualizado_por=cliente where id=fuente.id and stock_disponible>=tomar;

      if not found then raise exception 'El inventario cambió; vuelve a confirmar tu carrito'; end if;

      insert into public.reservas(producto_id,ubicacion_id,cantidad,estado,origen,referencia_tipo,referencia_id,referencia_numero,fecha_expiracion,creado_por)

        values(producto.id,fuente.ubicacion_id,tomar,'ACTIVA','ECOMMERCE','pedido_ecommerce',pedido_id,numero_pedido,vencimiento,cliente) returning id into reserva_id;

      insert into public.movimientos(producto_id,ubicacion_id,tipo_movimiento,cantidad,stock_anterior,stock_posterior,origen,referencia_tipo,referencia_id,referencia_numero,grupo_movimiento_id,usuario_id)

        values(producto.id,fuente.ubicacion_id,'RESERVA',tomar,fuente.stock_disponible,fuente.stock_disponible-tomar,'ECOMMERCE','pedido_ecommerce',pedido_id,numero_pedido,pedido_id,cliente);

      if fuente.ubicacion_id<>destino.id then

        traslado_id:=gen_random_uuid(); numero_traslado:='TR-OMNI-'||substring(traslado_id::text,1,8)||'-'||substring(traslado_id::text,25,12);

        insert into public.transferencias_omnicanal(id,numero,pedido_id,producto_id,cantidad,ubicacion_origen_id,ubicacion_destino_id,reserva_origen_id)

          values(traslado_id,numero_traslado,pedido_id,producto.id,tomar,fuente.ubicacion_id,destino.id,reserva_id);

        insert into public.notificaciones_omnicanal(pedido_id,transferencia_id,tipo,titulo,mensaje,ubicacion_origen_id,ubicacion_destino_id,creado_por)

          values(pedido_id,traslado_id,'TRANSFERENCIA_GENERADA','Transferencia automática pendiente',

            format('Pedido %s: trasladar %s unidades de %s desde %s a %s. Stock reservado hasta %s.',numero_pedido,tomar,producto.nombre,fuente.ubicacion_nombre,destino.nombre,vencimiento),

            fuente.ubicacion_id,destino.id,cliente);

      end if;

      solicitado:=solicitado-tomar;

    end loop;

    if solicitado>0 then raise exception 'Stock insuficiente en la red para %; faltan % unidades',producto.nombre,solicitado; end if;

  end loop;

  if p_metodo_entrega='DOMICILIO' and v_total<100 then raise exception 'El pedido mínimo para envío a domicilio es de Q100.00'; end if;

  if p_metodo_entrega='RETIRO_TIENDA' and v_total<1 then raise exception 'El pedido mínimo para recoger en tienda es de Q1.00'; end if;

  if p_metodo_entrega='DOMICILIO' and v_total<=200 then v_costo_envio:=25; end if;

  update public.pedidos_ecommerce set total=v_total+v_costo_envio,costo_envio=v_costo_envio where id=pedido_id;

  return erp_private.omnicanal_respuesta(pedido_id);

end;

$function$
;

CREATE OR REPLACE FUNCTION public.erp_detalle_productos_pedido(p_pedido_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE pedido public.pedidos_ecommerce%rowtype; resultado jsonb;
BEGIN
 IF auth.uid() IS NULL OR public.erp_sesion_autorizada() IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'Sesión autorizada requerida' USING ERRCODE='42501'; END IF;
 SELECT * INTO pedido FROM public.pedidos_ecommerce WHERE id=p_pedido_id;
 IF NOT FOUND OR NOT(coalesce(pedido.cliente_id=auth.uid(),false) OR
  (public.tiene_permiso('pedidos.ver') AND erp_private.tiene_acceso_ubicacion_historica(pedido.ubicacion_id))) THEN
  RAISE EXCEPTION 'Pedido no disponible para esta cuenta y sucursal' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',d.id,'pedido_id',d.pedido_id,'producto_id',d.producto_id,
  'cantidad',d.cantidad,'precio_unitario',d.precio_unitario,'total_linea',d.total_linea,'presentacion_id',d.presentacion_id,'presentacion_nombre',d.presentacion_nombre,'cantidad_presentaciones',d.cantidad_presentaciones,'factor_presentacion',d.factor_presentacion,'precio_presentacion',d.precio_presentacion,
  'unidad_medida_snapshot',d.unidad_medida_snapshot,
  'producto_snapshot',d.producto_snapshot,
  'identidad_origen',CASE WHEN d.producto_snapshot IS NOT NULL THEN 'SNAPSHOT' ELSE 'REFERENCIA_ACTUAL' END,
  'productos',CASE WHEN d.producto_snapshot IS NOT NULL THEN
    jsonb_build_object('id',d.producto_id,'nombre',d.producto_snapshot->>'nombre','sku',d.producto_snapshot->>'sku')
   ELSE jsonb_build_object('id',d.producto_id,'nombre',coalesce(p.nombre,'Nombre no registrado en el pedido'),'sku',p.sku) END) ORDER BY d.id),'[]'::jsonb)
 INTO resultado FROM public.pedidos_ecommerce_detalle d LEFT JOIN public.productos p ON p.id=d.producto_id WHERE d.pedido_id=pedido.id;
 RETURN resultado;
END; $function$
;

CREATE OR REPLACE FUNCTION erp_private.emitir_comprobante_cobrado(p_pedido_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$

declare

  v_pedido public.pedidos_ecommerce%rowtype;

  v_id uuid;

  v_config jsonb;

  v_empresa jsonb;

  v_zona_horaria text;

  v_cliente jsonb;

  v_lineas jsonb;

begin

  select * into v_pedido

  from public.pedidos_ecommerce

  where id = p_pedido_id

  for update;

  if not found or v_pedido.estado_pago <> 'PAGADO' OR v_pedido.estado <> 'PAGADO' then

    raise exception 'Solo se emiten comprobantes para pedidos con pago confirmado.';

  end if;



  select id into v_id

  from public.facturas_ecommerce

  where pedido_id = p_pedido_id;

  if v_id is not null then

    return v_id;

  end if;



  select coalesce(jsonb_object_agg(clave, valor->>'valor'), '{}'::jsonb)

    into v_config

  from public.configuracion_erp

  where clave in (

    'empresa_nombre', 'empresa_nit', 'empresa_correo', 'empresa_telefono',

    'empresa_direccion', 'zona_horaria'

  );

  v_empresa := jsonb_build_object(

    'empresa_nombre', coalesce(nullif(btrim(v_config->>'empresa_nombre'), ''), 'San Martín'),

    'empresa_nit', coalesce(nullif(btrim(v_config->>'empresa_nit'), ''), '42299039'),

    'empresa_correo', coalesce(nullif(btrim(v_config->>'empresa_correo'), ''), 'sanmartinlibreriapapeleria@gmail.com'),

    'empresa_telefono', coalesce(nullif(btrim(v_config->>'empresa_telefono'), ''), '+502 4902-7035'),

    'empresa_direccion', coalesce(nullif(btrim(v_config->>'empresa_direccion'), ''),

      '5ta c. 7-01 col. Belén apto. A av. La Brigada z. 7, Mixco, Guatemala')

  );

  -- La pantalla de configuración sólo ofrece esta zona. Se guarda en la

  -- instantánea para que un cambio futuro no altere la hora de emisión.

  v_zona_horaria := case

    when v_config->>'zona_horaria' = 'America/Guatemala' then 'America/Guatemala'

    else 'America/Guatemala'

  end;



  select jsonb_build_object(

    'nombre', concat_ws(' ', nombre, segundo_nombre, apellido, segundo_apellido),

    'correo', correo, 'telefono', telefono,

    'direccion_completa', direccion_completa,

    'municipio', municipio, 'departamento', departamento,

    'referencia_direccion', referencia_direccion

  ) into v_cliente

  from public.perfiles

  where id = v_pedido.cliente_id;



  select coalesce(jsonb_agg(jsonb_build_object(
    'producto_id',d.producto_id,
    'sku',CASE WHEN d.producto_snapshot IS NOT NULL THEN d.producto_snapshot->>'sku' ELSE p.sku END,
    'nombre',CASE WHEN d.producto_snapshot IS NOT NULL THEN d.producto_snapshot->>'nombre' ELSE coalesce(p.nombre,'Nombre no registrado en el pedido') END,
    'medida',d.unidad_medida_snapshot->>'abreviatura',
    'producto_snapshot',d.producto_snapshot,
    'identidad_origen',CASE WHEN d.producto_snapshot IS NOT NULL THEN 'SNAPSHOT' ELSE 'REFERENCIA_ACTUAL' END,
    'cantidad',d.cantidad,'precio_unitario',d.precio_unitario,
    'unidad_medida_snapshot',d.unidad_medida_snapshot,
    'presentacion_id',d.presentacion_id,'presentacion_nombre',d.presentacion_nombre,
    'cantidad_presentaciones',d.cantidad_presentaciones,'factor_presentacion',d.factor_presentacion,'precio_presentacion',d.precio_presentacion,
    'total_linea',d.total_linea
  ) order by d.id),'[]'::jsonb)
  into v_lineas
  from public.pedidos_ecommerce_detalle d LEFT JOIN public.productos p on p.id=d.producto_id
  where d.pedido_id=p_pedido_id;

  insert into public.facturas_ecommerce

    (pedido_id, ubicacion_id, fecha_emision, datos)

  values (

    p_pedido_id,

    v_pedido.ubicacion_id,

    coalesce(v_pedido.fecha_pago, now()),

    jsonb_build_object(

      'empresa', v_empresa,

      'moneda', 'GTQ',

      'zona_horaria', v_zona_horaria,

      'cliente', coalesce(v_cliente, '{}'::jsonb),

      'pedido', to_jsonb(v_pedido),

      'lineas', v_lineas

    )

  ) returning id into v_id;

  return v_id;

end;

$function$
;

NOTIFY pgrst, 'reload schema';

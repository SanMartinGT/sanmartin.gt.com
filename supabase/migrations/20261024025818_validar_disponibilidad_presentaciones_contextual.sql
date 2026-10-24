-- H05: delta contra el catálogo vivo; no modifica pedidos, reservas, existencias ni el motor de checkout.
-- Generado inicialmente con Supabase CLI 2.122.0 migration new.
DO $h05_guard$
BEGIN
  IF (SELECT md5(pg_get_functiondef(to_regprocedure('erp_private.normalizar_lineas_presentaciones(jsonb,integer)')))) IS DISTINCT FROM 'f009f110ac01a8e44855e6ea6b2d0689' THEN RAISE EXCEPTION 'H05: cambió la dependencia normalizar_lineas_presentaciones; volver a comparar el esquema vivo'; END IF;
  IF (SELECT md5(pg_get_functiondef(to_regprocedure('erp_private.resolver_linea_presentacion(uuid,uuid,numeric,text)')))) IS DISTINCT FROM '668de105051eb25b6b4fc59fd7a1ec51' THEN RAISE EXCEPTION 'H05: cambió la dependencia resolver_linea_presentacion; volver a comparar el esquema vivo'; END IF;
  IF (SELECT md5(pg_get_functiondef(to_regprocedure('erp_private.validar_cantidad_producto(uuid,numeric,boolean)')))) IS DISTINCT FROM '685dbac965a0623cc25c65da02ad38ca' THEN RAISE EXCEPTION 'H05: cambió la dependencia validar_cantidad_producto; volver a comparar el esquema vivo'; END IF;
  IF (SELECT md5(pg_get_functiondef(to_regprocedure('public.validar_disponibilidad_presentaciones(jsonb)')))) IS DISTINCT FROM 'a1e4525c434fc3d40800515fa3936c8c' THEN RAISE EXCEPTION 'H05: cambió la dependencia validar_disponibilidad_presentaciones; volver a comparar el esquema vivo'; END IF;
 IF to_regprocedure('erp_private.resolver_linea_presentacion_consulta(uuid,uuid,numeric,text)') IS NOT NULL
  OR to_regprocedure('erp_private.validar_disponibilidad_presentaciones_contextual(jsonb,text,uuid)') IS NOT NULL
  OR to_regprocedure('public.validar_disponibilidad_presentaciones_contextual(jsonb,text,uuid)') IS NOT NULL THEN
  RAISE EXCEPTION 'H05: el contrato nuevo ya existe; comparar antes de reaplicar'; END IF;
END $h05_guard$;

CREATE OR REPLACE FUNCTION erp_private.resolver_linea_presentacion_consulta(p_producto_id uuid, p_presentacion_id uuid, p_cantidad numeric, p_canal text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY INVOKER
 SET search_path TO ''
AS $function$
DECLARE p public.productos%rowtype; s public.producto_presentaciones%rowtype; u public.unidades_medida%rowtype;
 factor numeric:=1; precio numeric; descuento numeric; base numeric;
BEGIN
 SELECT * INTO p FROM public.productos WHERE id=p_producto_id;
 SELECT * INTO u FROM public.unidades_medida WHERE id=p.unidad_medida_id;
 IF p.id IS NULL OR NOT p.activo OR p.descontinuado OR NOT p.es_vendible OR NOT p.controla_inventario OR u.id IS NULL OR NOT u.activo
  OR p_canal NOT IN('POS','ECOMMERCE') OR (p_canal='POS' AND NOT p.disponible_pos)
  OR (p_canal='ECOMMERCE' AND (NOT p.publicado_ecommerce OR NOT p.visible_ecommerce OR NOT p.es_comprable
   OR NOT EXISTS(SELECT 1 FROM public.categorias c WHERE c.id=p.categoria_id AND c.activo AND c.visible_ecommerce)
   OR (p.marca_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.marcas m WHERE m.id=p.marca_id AND m.activo)))) THEN
  RAISE EXCEPTION 'Producto no disponible para este canal' USING ERRCODE='22023'; END IF;
 precio:=p.precio_base;
 IF p_presentacion_id IS NOT NULL THEN
  SELECT * INTO s FROM public.producto_presentaciones WHERE id=p_presentacion_id AND producto_id=p.id;
  IF NOT FOUND OR NOT s.activo OR (p_canal='POS' AND NOT s.disponible_pos) OR (p_canal='ECOMMERCE' AND NOT s.disponible_ecommerce) THEN
   RAISE EXCEPTION 'La presentación ya no está disponible para este producto' USING ERRCODE='22023'; END IF;
  IF trunc(p_cantidad)<>p_cantidad THEN RAISE EXCEPTION 'Indica un número entero de presentaciones' USING ERRCODE='22023'; END IF;
  factor:=s.cantidad_base; precio:=s.precio;
 END IF;
 base:=p_cantidad*factor;
 IF p_cantidad IS NULL OR p_cantidad<=0 OR p_cantidad::text IN('NaN','Infinity','-Infinity') OR base>99999999999.999
  OR round(base,3)<>base OR (NOT(p.venta_fraccionada AND u.permite_fraccion) AND trunc(base)<>base) THEN
  RAISE EXCEPTION 'Cantidad incompatible con la unidad base del producto' USING ERRCODE='22023'; END IF;
 -- Equivalente de validar_cantidad_producto sin FOR NO KEY UPDATE / FOR SHARE.
 IF base IS NULL OR base::text IN('NaN','Infinity','-Infinity') OR abs(base)>=100000000000 OR round(base,3)<>base
  OR round(base,CASE WHEN u.permite_fraccion THEN least(3,greatest(0,u.decimales_permitidos)) ELSE 0 END)<>base THEN
  RAISE EXCEPTION 'Cantidad incompatible con la unidad base del producto' USING ERRCODE='22023'; END IF;
 IF precio IS NULL OR precio<0 OR precio::text IN('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Precio inválido'; END IF;
 SELECT max(oferta_porcentaje) INTO descuento FROM public.ofertas_producto WHERE producto_id=p.id AND activo
  AND ((p_canal='POS' AND aplica_pos) OR (p_canal='ECOMMERCE' AND aplica_ecommerce)) AND fecha_inicio<=now() AND (fecha_fin IS NULL OR fecha_fin>=now());
 IF descuento IS NOT NULL AND (descuento<0 OR descuento>100 OR descuento::text IN('NaN','Infinity','-Infinity')) THEN RAISE EXCEPTION 'Oferta inválida'; END IF;
 precio:=round(precio*(1-coalesce(descuento,0)/100),2);
 RETURN jsonb_build_object('producto_id',p.id,'presentacion_id',p_presentacion_id,'presentacion_nombre',s.nombre,
  'cantidad',p_cantidad,'cantidad_base',base,'factor',factor,'precio',precio,'total',round(p_cantidad*precio,2));
END $function$;

CREATE FUNCTION erp_private.validar_disponibilidad_presentaciones_contextual(
 p_items jsonb, p_modo_inventario text, p_ubicacion_destino_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $h05$
DECLARE
 normalizados jsonb; destino public.ubicaciones%rowtype; configurada uuid;
 linea record; resuelto jsonb; sumas jsonb:='{}'::jsonb; invalidos jsonb:='{}'::jsonb;
 resultado jsonb:='[]'::jsonb; clave text; solicitado numeric; disponible numeric; local numeric;
 maximo numeric:=100; estado text; mensaje text; traslado boolean;
BEGIN
 IF p_modo_inventario IS NULL OR p_modo_inventario NOT IN('SUCURSAL','OMNICANAL') THEN
  RAISE EXCEPTION 'Modo de inventario inválido' USING ERRCODE='22023'; END IF;
 normalizados:=erp_private.normalizar_lineas_presentaciones(p_items,100);
 IF p_modo_inventario='SUCURSAL' THEN
  SELECT ubicacion_ecommerce_id INTO configurada FROM public.configuracion_ecommerce WHERE id=true;
  IF configurada IS NULL THEN RAISE EXCEPTION 'La tienda no tiene una sucursal configurada' USING ERRCODE='22023'; END IF;
  IF p_ubicacion_destino_id IS NOT NULL AND p_ubicacion_destino_id IS DISTINCT FROM configurada THEN
   RAISE EXCEPTION 'La modalidad SUCURSAL usa la sucursal asignada de la tienda' USING ERRCODE='22023'; END IF;
  p_ubicacion_destino_id:=configurada;
 END IF;
 SELECT * INTO destino FROM public.ubicaciones WHERE id=p_ubicacion_destino_id AND activo AND permite_inventario AND permite_venta;
 IF NOT FOUND THEN RAISE EXCEPTION 'Selecciona una sucursal habilitada para inventario y venta' USING ERRCODE='22023'; END IF;
 SELECT greatest(1,coalesce(max_cantidad_por_linea,100)) INTO maximo FROM public.configuracion_ecommerce WHERE id=true;
 maximo:=coalesce(maximo,100);
 FOR linea IN SELECT * FROM jsonb_to_recordset(normalizados)x(producto_id uuid,presentacion_id uuid,cantidad numeric)
  ORDER BY producto_id,presentacion_id NULLS FIRST LOOP
  clave:=linea.producto_id::text;
  IF linea.cantidad>maximo THEN invalidos:=jsonb_set(invalidos,ARRAY[clave],'true'::jsonb); CONTINUE; END IF;
  BEGIN
   resuelto:=erp_private.resolver_linea_presentacion_consulta(linea.producto_id,linea.presentacion_id,linea.cantidad,'ECOMMERCE');
   sumas:=jsonb_set(sumas,ARRAY[clave],to_jsonb(coalesce((sumas->>clave)::numeric,0)+(resuelto->>'cantidad_base')::numeric));
  EXCEPTION WHEN raise_exception OR invalid_parameter_value THEN
   invalidos:=jsonb_set(invalidos,ARRAY[clave],'true'::jsonb);
  END;
 END LOOP;
 FOR clave IN SELECT DISTINCT (x->>'producto_id') FROM jsonb_array_elements(normalizados)x ORDER BY 1 LOOP
  traslado:=false;
  IF invalidos?clave THEN
   estado:='NO_DISPONIBLE'; mensaje:='Revisa el producto, la presentación y las cantidades permitidas.';
  ELSE
   solicitado:=(sumas->>clave)::numeric;
   SELECT coalesce(sum(e.stock_disponible),0),
    coalesce(sum(e.stock_disponible) FILTER(WHERE e.ubicacion_id=destino.id),0)
    INTO disponible,local FROM public.existencias e JOIN public.ubicaciones u ON u.id=e.ubicacion_id
    WHERE e.producto_id=clave::uuid AND e.activo AND e.stock_disponible>0 AND u.activo AND u.permite_inventario
     AND (u.id=destino.id OR (p_modo_inventario='OMNICANAL' AND destino.permite_recepcion AND destino.permite_transferencia AND u.permite_transferencia));
   IF disponible>=solicitado THEN
    estado:='DISPONIBLE'; traslado:=local<solicitado;
    mensaje:=CASE WHEN traslado THEN 'Hay disponibilidad mediante abastecimiento entre sucursales; espera el aviso de la tienda.'
     ELSE 'Cantidad disponible en la sucursal de destino; se confirma al finalizar.' END;
   ELSE estado:='AGOTADO'; mensaje:='No hay disponibilidad suficiente para todas las unidades y presentaciones en este contexto.';
   END IF;
  END IF;
  resultado:=resultado||jsonb_build_array(jsonb_build_object('producto_id',clave,'estado',estado,'mensaje',mensaje,
   'requiere_traslado',traslado,'modo_inventario',p_modo_inventario,'ubicacion_destino_id',destino.id));
 END LOOP;
 RETURN resultado;
END $h05$;

REVOKE ALL ON FUNCTION erp_private.resolver_linea_presentacion_consulta(uuid,uuid,numeric,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION erp_private.validar_disponibilidad_presentaciones_contextual(jsonb,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION erp_private.validar_disponibilidad_presentaciones_contextual(jsonb,text,uuid) TO anon,authenticated,service_role;

CREATE FUNCTION public.validar_disponibilidad_presentaciones_contextual(
 p_items jsonb,p_modo_inventario text,p_ubicacion_destino_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $h05$ SELECT erp_private.validar_disponibilidad_presentaciones_contextual(p_items,p_modo_inventario,p_ubicacion_destino_id); $h05$;
REVOKE ALL ON FUNCTION public.validar_disponibilidad_presentaciones_contextual(jsonb,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validar_disponibilidad_presentaciones_contextual(jsonb,text,uuid) TO anon,authenticated,service_role;

-- La firma antigua mantiene JSON array y sus tres campos, mediante el mismo núcleo.
CREATE OR REPLACE FUNCTION public.validar_disponibilidad_presentaciones(p_items jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $h05$
 SELECT coalesce(jsonb_agg(jsonb_build_object('producto_id',x->>'producto_id','estado',x->>'estado','mensaje',x->>'mensaje')
  ORDER BY x->>'producto_id'),'[]'::jsonb)
 FROM jsonb_array_elements(erp_private.validar_disponibilidad_presentaciones_contextual(p_items,'SUCURSAL',NULL))x;
$h05$;
REVOKE ALL ON FUNCTION public.validar_disponibilidad_presentaciones(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validar_disponibilidad_presentaciones(jsonb) TO anon,authenticated,service_role;
COMMENT ON FUNCTION public.validar_disponibilidad_presentaciones_contextual(jsonb,text,uuid)
 IS 'Consulta de disponibilidad sin reservas: modalidad/destino y presentaciones resueltas en servidor. H05.';
NOTIFY pgrst, 'reload schema';

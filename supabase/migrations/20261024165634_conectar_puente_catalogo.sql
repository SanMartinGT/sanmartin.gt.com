-- H09: delta preparado contra el catálogo vivo de 24-10-2026, NO aplicado.
-- Creado primero con Supabase CLI 2.122.0 migration new conectar_puente_catalogo.
-- Instalar sólo después de configurar y probar Edge, repositorio y publicación.
-- Falta actualmente Vault catalogo_webhook_secret: este guard debe rechazarlo.
-- No ejecutar además webhooks estándar del Dashboard sobre estas tablas.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $h09_preflight$
DECLARE table_name text; id_type regtype; schema_name text; role_name text;
 secret_count bigint; secret_valid boolean;
BEGIN
 IF current_user <> 'postgres' THEN RAISE EXCEPTION 'H09: se requiere el propietario administrativo revisado'; END IF;
 FOREACH schema_name IN ARRAY ARRAY['erp_private','vault','net'] LOOP
  IF to_regnamespace(schema_name) IS NULL THEN RAISE EXCEPTION 'H09: falta un esquema de integración'; END IF;
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF has_schema_privilege(role_name,schema_name,'CREATE') THEN RAISE EXCEPTION 'H09: un cliente puede crear objetos en un esquema privado'; END IF;
  END LOOP;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_extension WHERE extname='pg_net' AND extversion='0.20.4')
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_extension WHERE extname='supabase_vault' AND extversion='0.3.1')
  OR to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NULL THEN
  RAISE EXCEPTION 'H09: extensiones o firma pg_net distintas del baseline; revisar antes de activar';
 END IF;
 IF to_regprocedure('erp_private.notificar_catalogo_webhook()') IS NOT NULL THEN
  RAISE EXCEPTION 'H09: el helper ya existe; comparar el esquema antes de aplicar';
 END IF;
 FOREACH table_name IN ARRAY ARRAY['productos','producto_imagenes','ofertas_producto','categorias','marcas','existencias','configuracion_ecommerce','producto_presentaciones','unidades_medida'] LOOP
  SELECT a.atttypid::regtype INTO id_type FROM pg_catalog.pg_class c
   JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
   JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
   WHERE n.nspname='public' AND c.relname=table_name AND c.relkind='r'
    AND a.attname='id' AND a.attnum>0 AND NOT a.attisdropped;
  IF NOT FOUND OR id_type<>(CASE WHEN table_name='configuracion_ecommerce' THEN 'boolean'::regtype ELSE 'uuid'::regtype END) THEN
   RAISE EXCEPTION 'H09: tabla o ID no coincide con el baseline: %',table_name;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid
   WHERE t.tgrelid=to_regclass('public.'||table_name) AND NOT t.tgisinternal
    AND (t.tgname='catalogo_webhook_notificar' OR p.proname IN('http_request','notificar_catalogo_webhook'))) THEN
   RAISE EXCEPTION 'H09: existe otro webhook en una tabla del catálogo; evitar duplicar eventos';
  END IF;
 END LOOP;
 IF to_regclass('vault.secrets') IS NULL OR to_regclass('vault.decrypted_secrets') IS NULL
  OR to_regclass('net.http_request_queue') IS NULL THEN RAISE EXCEPTION 'H09: faltan objetos privados de Vault/pg_net'; END IF;
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF has_column_privilege(role_name,'vault.decrypted_secrets','decrypted_secret','SELECT')
   OR has_column_privilege(role_name,'net.http_request_queue','headers','SELECT') THEN
   RAISE EXCEPTION 'H09: un cliente puede leer secretos o encabezados privados';
  END IF;
 END LOOP;
 SELECT count(*) INTO secret_count FROM vault.secrets WHERE name='catalogo_webhook_secret';
 IF secret_count<>1 THEN RAISE EXCEPTION 'H09: configurar exactamente un secreto Vault catalogo_webhook_secret antes de activar'; END IF;
 SELECT count(*),bool_and(decrypted_secret IS NOT NULL AND length(decrypted_secret) BETWEEN 32 AND 256 AND decrypted_secret !~ '[[:space:]]')
  INTO secret_count,secret_valid FROM vault.decrypted_secrets WHERE name='catalogo_webhook_secret';
 IF secret_count<>1 OR secret_valid IS DISTINCT FROM true THEN RAISE EXCEPTION 'H09: secreto de integración ausente o inválido'; END IF;
END;
$h09_preflight$;

-- El secreto sólo se utiliza como encabezado hacia el endpoint fijo.
-- No es RPC: no acepta URL, contenido, tabla ni credenciales del usuario.
CREATE FUNCTION erp_private.notificar_catalogo_webhook()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE webhook_secret text; current_row jsonb:='null'::jsonb; previous_row jsonb:='null'::jsonb;
BEGIN
 IF TG_TABLE_SCHEMA<>'public' OR TG_NAME<>'catalogo_webhook_notificar' OR TG_WHEN<>'AFTER' OR TG_LEVEL<>'ROW'
  OR TG_NARGS<>0 OR TG_OP NOT IN('INSERT','UPDATE','DELETE')
  OR TG_TABLE_NAME NOT IN('productos','producto_imagenes','ofertas_producto','categorias','marcas','existencias','configuracion_ecommerce','producto_presentaciones','unidades_medida') THEN
  RAISE LOG 'catalogo_webhook: invocación no permitida; aviso omitido'; RETURN NULL;
 END IF;
 SELECT s.decrypted_secret INTO STRICT webhook_secret FROM vault.decrypted_secrets s WHERE s.name='catalogo_webhook_secret';
 IF webhook_secret IS NULL OR length(webhook_secret) NOT BETWEEN 32 AND 256 OR webhook_secret ~ '[[:space:]]' THEN
  RAISE LOG 'catalogo_webhook: configuración no disponible; cambio conservado, reconstruir manualmente'; RETURN NULL;
 END IF;
 IF TG_OP IN('INSERT','UPDATE') THEN current_row:=pg_catalog.jsonb_build_object('id',NEW.id); END IF;
 IF TG_OP IN('UPDATE','DELETE') THEN previous_row:=pg_catalog.jsonb_build_object('id',OLD.id); END IF;
 PERFORM net.http_post(
  url:='https://beasfybalepkdlomzazf.supabase.co/functions/v1/catalogo-actualizado',
  body:=pg_catalog.jsonb_build_object('type',TG_OP,'schema','public','table',TG_TABLE_NAME,'record',current_row,'old_record',previous_row),
  params:='{}'::jsonb,
  headers:=pg_catalog.jsonb_build_object('Content-Type','application/json','x-webhook-secret',webhook_secret),
  timeout_milliseconds:=15000);
 -- pg_net procesa su cola después del COMMIT; encolar no confirma publicación.
 RETURN NULL;
EXCEPTION WHEN OTHERS THEN
 -- No registrar SQLERRM, filas, respuestas, headers o contenido de Vault.
 RAISE LOG 'catalogo_webhook: aviso no encolado; cambio conservado, revisar integración y reconstruir manualmente';
 RETURN NULL;
END;
$function$;
ALTER FUNCTION erp_private.notificar_catalogo_webhook() OWNER TO postgres;
REVOKE ALL ON FUNCTION erp_private.notificar_catalogo_webhook() FROM PUBLIC,anon,authenticated,service_role;
COMMENT ON FUNCTION erp_private.notificar_catalogo_webhook() IS 'H09: trigger privado de catálogo, Vault por nombre y evento mínimo al endpoint fijo; no RPC ni confirmación de publicación.';

CREATE TRIGGER catalogo_webhook_notificar AFTER INSERT OR UPDATE OR DELETE ON public.productos FOR EACH ROW EXECUTE FUNCTION erp_private.notificar_catalogo_webhook();
CREATE TRIGGER catalogo_webhook_notificar AFTER INSERT OR UPDATE OR DELETE ON public.producto_imagenes FOR EACH ROW EXECUTE FUNCTION erp_private.notificar_catalogo_webhook();
CREATE TRIGGER catalogo_webhook_notificar AFTER INSERT OR UPDATE OR DELETE ON public.ofertas_producto FOR EACH ROW EXECUTE FUNCTION erp_private.notificar_catalogo_webhook();
CREATE TRIGGER catalogo_webhook_notificar AFTER INSERT OR UPDATE OR DELETE ON public.categorias FOR EACH ROW EXECUTE FUNCTION erp_private.notificar_catalogo_webhook();
CREATE TRIGGER catalogo_webhook_notificar AFTER INSERT OR UPDATE OR DELETE ON public.marcas FOR EACH ROW EXECUTE FUNCTION erp_private.notificar_catalogo_webhook();
CREATE TRIGGER catalogo_webhook_notificar AFTER INSERT OR UPDATE OR DELETE ON public.existencias FOR EACH ROW EXECUTE FUNCTION erp_private.notificar_catalogo_webhook();
CREATE TRIGGER catalogo_webhook_notificar AFTER INSERT OR UPDATE OR DELETE ON public.configuracion_ecommerce FOR EACH ROW EXECUTE FUNCTION erp_private.notificar_catalogo_webhook();
CREATE TRIGGER catalogo_webhook_notificar AFTER INSERT OR UPDATE OR DELETE ON public.producto_presentaciones FOR EACH ROW EXECUTE FUNCTION erp_private.notificar_catalogo_webhook();
CREATE TRIGGER catalogo_webhook_notificar AFTER INSERT OR UPDATE OR DELETE ON public.unidades_medida FOR EACH ROW EXECUTE FUNCTION erp_private.notificar_catalogo_webhook();

DO $h09_verify$
BEGIN
 IF has_function_privilege('anon','erp_private.notificar_catalogo_webhook()','EXECUTE')
  OR has_function_privilege('authenticated','erp_private.notificar_catalogo_webhook()','EXECUTE')
  OR has_function_privilege('service_role','erp_private.notificar_catalogo_webhook()','EXECUTE') THEN
  RAISE EXCEPTION 'H09: el helper tiene permisos de ejecución inesperados';
 END IF;
 IF (SELECT count(*) FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid
  JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname IN('productos','producto_imagenes','ofertas_producto','categorias','marcas','existencias','configuracion_ecommerce','producto_presentaciones','unidades_medida')
   AND t.tgname='catalogo_webhook_notificar' AND t.tgfoid='erp_private.notificar_catalogo_webhook()'::regprocedure
   AND t.tgenabled='O' AND t.tgtype=29 AND t.tgnargs=0 AND octet_length(t.tgargs)=0)<>9 THEN
  RAISE EXCEPTION 'H09: no quedaron exactamente nueve triggers AFTER ROW sin argumentos';
 END IF;
END;
$h09_verify$;

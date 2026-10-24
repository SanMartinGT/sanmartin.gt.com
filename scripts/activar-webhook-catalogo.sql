-- Proyecto: beasfybalepkdlomzazf / sanmartingmca.com.
-- Preparado el 17-10-2026. Este archivo no se ha ejecutado en produccion.
-- H01 (23-10-2026): propuesta separada, no migracion aplicada ni instalador.
-- Antes de instalar, preparar el delta contra el esquema vivo segun
-- supabase/MIGRACIONES.md. No se ejecuta desde el build ni desde el control H01.
-- Ejecutar completo como postgres DESPUES de revisar y configurar la Edge Function.
-- Requisitos externos: net, vault y erp_private NO expuestos en la Data API.
-- Vault debe contener exactamente un secreto llamado catalogo_webhook_secret,
-- igual al secreto CATALOGO_WEBHOOK_SECRET de la Edge Function. No pegar su valor aqui.
-- No crear los webhooks estandar del Dashboard ademas de estos disparadores.
-- Este script conserva permisos de tablas y del esquema erp_private y otros triggers.
-- Durante la fase autorizada, Actions debe generar el sitio sin subirlo a Hostinger.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $preflight$
declare
  v_table text;
  v_type pg_catalog.regtype;
begin
  if current_user <> 'postgres' then
    raise exception 'Ejecuta este archivo como postgres en el proyecto correcto.';
  end if;
  if pg_catalog.to_regnamespace('erp_private') is null then
    raise exception 'Falta erp_private; revisar el proyecto antes de activar.';
  end if;
  if pg_catalog.has_schema_privilege('anon', 'erp_private', 'CREATE')
     or pg_catalog.has_schema_privilege('authenticated', 'erp_private', 'CREATE') then
    raise exception 'erp_private permite CREATE a clientes; revisar sus permisos antes de activar.';
  end if;
  if not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_net')
     or not exists (select 1 from pg_catalog.pg_extension where extname = 'supabase_vault') then
    raise exception 'Se requieren las extensiones pg_net y supabase_vault existentes.';
  end if;
  if pg_catalog.to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then
    raise exception 'La firma instalada de net.http_post no coincide; revisar antes de activar.';
  end if;
  if (select pg_catalog.count(*) from vault.secrets where name = 'catalogo_webhook_secret') <> 1 then
    raise exception 'Falta el secreto Vault catalogo_webhook_secret; crearlo de forma segura antes de activar.';
  end if;
  if not pg_catalog.has_table_privilege('postgres', 'vault.decrypted_secrets', 'SELECT') then
    raise exception 'postgres necesita acceso existente a Vault; revisar administracion del proyecto.';
  end if;

  foreach v_table in array array[
    'productos', 'producto_imagenes', 'ofertas_producto', 'categorias',
    'marcas', 'existencias', 'configuracion_ecommerce'
  ]::text[] loop
    select a.atttypid::pg_catalog.regtype into v_type
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    join pg_catalog.pg_attribute a on a.attrelid = c.oid
    where n.nspname = 'public' and c.relname = v_table and c.relkind = 'r'
      and a.attname = 'id' and a.attnum > 0 and not a.attisdropped;
    if not found or v_type <> case when v_table = 'configuracion_ecommerce'
      then 'boolean'::pg_catalog.regtype else 'uuid'::pg_catalog.regtype end then
      raise exception 'La tabla public.% o su id difiere del esquema revisado; no se activo nada.', v_table;
    end if;
  end loop;
end;
$preflight$;

-- SECURITY DEFINER es intencional: este trigger del backend necesita leer SOLO
-- el secreto nombrado de Vault y encolar una llamada a un endpoint fijo.
-- No es una RPC de usuario, no concede lectura de productos ni permite indicar
-- URL, secreto, payload o tabla por argumentos. El rol del ERP no recibe Vault.
-- El retorno NULL de un trigger AFTER no cancela ni modifica la fila original.
create or replace function erp_private.notificar_catalogo_webhook()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_secret text;
  v_record jsonb := 'null'::jsonb;
  v_old_record jsonb := 'null'::jsonb;
begin
  if tg_table_schema <> 'public' or tg_when <> 'AFTER' or tg_level <> 'ROW'
     or tg_nargs <> 0 or tg_op not in ('INSERT', 'UPDATE', 'DELETE')
     or tg_table_name not in (
       'productos', 'producto_imagenes', 'ofertas_producto', 'categorias',
       'marcas', 'existencias', 'configuracion_ecommerce'
     ) then
    raise log 'catalogo_webhook: invocacion fuera de las tablas/eventos permitidos; se omitio el aviso.';
    return null;
  end if;

  -- Leer exclusivamente el secreto por nombre; no incluirlo en tgargs,
  -- definiciones SQL, cuerpo JSON, mensajes, resultados ni codigo publico.
  select s.decrypted_secret into v_secret
  from vault.decrypted_secrets s
  where s.name = 'catalogo_webhook_secret';

  if v_secret is null or pg_catalog.length(v_secret) < 32
     or pg_catalog.length(v_secret) > 256 or v_secret ~ '[[:space:]]' then
    raise log 'catalogo_webhook: secreto Vault ausente o invalido; cambio conservado, ejecutar reconstruccion manual.';
    return null;
  end if;

  -- Construir cada objeto directamente a partir de id. No serializar NEW/OLD
  -- completos: incluyen costos, proveedores y otros datos internos del ERP.
  if tg_op in ('INSERT', 'UPDATE') then
    v_record := pg_catalog.jsonb_build_object('id', new.id);
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    v_old_record := pg_catalog.jsonb_build_object('id', old.id);
  end if;

  perform net.http_post(
    url := 'https://beasfybalepkdlomzazf.supabase.co/functions/v1/catalogo-actualizado',
    body := pg_catalog.jsonb_build_object(
      'type', tg_op,
      'schema', 'public',
      'table', tg_table_name,
      'record', v_record,
      'old_record', v_old_record
    ),
    params := '{}'::jsonb,
    headers := pg_catalog.jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    timeout_milliseconds := 15000
  );
  -- pg_net solo envia despues del COMMIT; no se espera una respuesta HTTP aqui.
  return null;
exception when others then
  -- No usar SQLERRM/DETAIL/CONTEXT: una excepcion podria contener credenciales.
  -- Un fallo de lectura/encolado habitual no debe abortar la compra/edicion.
  -- OTHERS no captura cancelacion de consultas ni errores de asercion del motor.
  raise log 'catalogo_webhook: no se pudo encolar el aviso; cambio conservado, revisar integracion y ejecutar reconstruccion manual.';
  return null;
end;
$function$;

alter function erp_private.notificar_catalogo_webhook() owner to postgres;
revoke all on function erp_private.notificar_catalogo_webhook()
  from public, anon, authenticated, service_role;
comment on function erp_private.notificar_catalogo_webhook() is
  'Trigger privado: Vault por nombre, endpoint fijo y evento minimo de catalogo; sin acceso RPC para clientes.';

-- Mismo nombre por tabla. No se borran ni reemplazan otros disparadores del ERP.
create or replace trigger catalogo_webhook_notificar
after insert or update or delete on public.productos
for each row execute function erp_private.notificar_catalogo_webhook();

create or replace trigger catalogo_webhook_notificar
after insert or update or delete on public.producto_imagenes
for each row execute function erp_private.notificar_catalogo_webhook();

create or replace trigger catalogo_webhook_notificar
after insert or update or delete on public.ofertas_producto
for each row execute function erp_private.notificar_catalogo_webhook();

create or replace trigger catalogo_webhook_notificar
after insert or update or delete on public.categorias
for each row execute function erp_private.notificar_catalogo_webhook();

create or replace trigger catalogo_webhook_notificar
after insert or update or delete on public.marcas
for each row execute function erp_private.notificar_catalogo_webhook();

create or replace trigger catalogo_webhook_notificar
after insert or update or delete on public.existencias
for each row execute function erp_private.notificar_catalogo_webhook();

create or replace trigger catalogo_webhook_notificar
after insert or update or delete on public.configuracion_ecommerce
for each row execute function erp_private.notificar_catalogo_webhook();

-- Comprobaciones de instalacion; no cambian productos ni hacen llamadas HTTP.
do $verify$
begin
  if pg_catalog.has_function_privilege('anon', 'erp_private.notificar_catalogo_webhook()', 'EXECUTE')
     or pg_catalog.has_function_privilege('authenticated', 'erp_private.notificar_catalogo_webhook()', 'EXECUTE')
     or pg_catalog.has_function_privilege('service_role', 'erp_private.notificar_catalogo_webhook()', 'EXECUTE') then
    raise exception 'El trigger tiene permisos de ejecucion inesperados; se revierte toda la instalacion.';
  end if;
  if (select pg_catalog.count(*)
      from pg_catalog.pg_trigger t
      join pg_catalog.pg_class c on c.oid = t.tgrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in ('productos', 'producto_imagenes', 'ofertas_producto',
                         'categorias', 'marcas', 'existencias', 'configuracion_ecommerce')
        and t.tgname = 'catalogo_webhook_notificar'
        and t.tgfoid = 'erp_private.notificar_catalogo_webhook()'::pg_catalog.regprocedure
        and t.tgenabled = 'O' and t.tgtype = 29 and t.tgnargs = 0
        and pg_catalog.octet_length(t.tgargs) = 0) <> 7 then
    raise exception 'No quedaron exactamente los siete triggers AFTER ROW esperados; se revierte la instalacion.';
  end if;
end;
$verify$;

commit;

select n.nspname as esquema, c.relname as tabla, t.tgname as disparador,
       t.tgenabled as habilitado, t.tgnargs as argumentos,
       t.tgtype = 29 as after_row_insert_update_delete
from pg_catalog.pg_trigger t
join pg_catalog.pg_class c on c.oid = t.tgrelid
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where t.tgfoid = 'erp_private.notificar_catalogo_webhook()'::pg_catalog.regprocedure
order by n.nspname, c.relname;

-- Desactivacion reversible si la integracion causa ejecuciones excesivas:
-- ALTER TABLE public.productos DISABLE TRIGGER catalogo_webhook_notificar;
-- ALTER TABLE public.producto_imagenes DISABLE TRIGGER catalogo_webhook_notificar;
-- ALTER TABLE public.ofertas_producto DISABLE TRIGGER catalogo_webhook_notificar;
-- ALTER TABLE public.categorias DISABLE TRIGGER catalogo_webhook_notificar;
-- ALTER TABLE public.marcas DISABLE TRIGGER catalogo_webhook_notificar;
-- ALTER TABLE public.existencias DISABLE TRIGGER catalogo_webhook_notificar;
-- ALTER TABLE public.configuracion_ecommerce DISABLE TRIGGER catalogo_webhook_notificar;
-- ENABLE TRIGGER con los mismos nombres vuelve a habilitarlos.
-- Conservar cron horario y reconstruccion manual como respaldo: pg_net no es
-- una cola durable y encolar un evento no confirma el exito posterior de Actions.
-- Verificar solo id/status_code/timed_out de net._http_response; nunca imprimir
-- net.http_request_queue.headers, la vista decrypted_secrets ni valores de Vault.
-- Fuentes: https://supabase.com/docs/guides/database/vault
-- https://supabase.com/docs/guides/database/extensions/pg_net
-- https://www.postgresql.org/docs/current/sql-createfunction.html
-- https://www.postgresql.org/docs/current/sql-createtrigger.html
-- https://www.postgresql.org/docs/current/plpgsql-control-structures.html

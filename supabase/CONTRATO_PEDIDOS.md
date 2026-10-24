# H02 — consumo de inventario y estados de pedido

**Estado:** prevención local de reinstalación del flujo antiguo; contrato remoto comprobado por lectura el 23 de octubre de 2026.

## Regla vigente

El checkout reserva disponibilidad. **PREPARAR** consume las reservas y registra la salida física; **COBRAR** registra el dinero recibido sobre el total ya guardado y exige que la mercancía esté entregada. Despachar o entregar no cobra. Cancelar después de salida deja un retorno pendiente; solo recibir físicamente el retorno repone unidades.

El estado general admite RESERVADO, PAGADO y CANCELADO. Pago y entrega tienen sus campos separados. El texto CONFIRMADO puede aparecer para mostrar pedidos históricos u otros módulos: no equivale a una orden de consumir stock.

## Material antiguo

supabase-reservas-pedidos.sql está archivado desde H01 en historico/2026-10-23/ con extensión .sql.historico y contenido/hash originales. No volver a instalar su función ni su trigger. Aquel mecanismo descontaba stock al actualizar estado a CONFIRMADO y duplicaría responsabilidades del motor actual.

En Supabase aún existe public.procesar_estado_pedido_ecommerce(), pero **ningún trigger de ninguna tabla la referencia** en la consulta observada. Tampoco está instalado el trigger de nombre pedidos_ecommerce_procesar_reserva. La función tiene ejecución denegada a PUBLIC, anon y authenticated; service_role conserva su permiso de servidor. H02 no necesita eliminarla ni cambiar ese permiso.

## Protección local añadida

scripts/reglas-pedidos-sql.mjs se integra en verificar-sql-vigente.mjs. Comprueba las migraciones nuevas aunque tengan ficha H01 válida, y también la propuesta SQL permitida por H01.

Rechaza patrones de reinstalación del trigger/función antiguos, referencias a la función antigua desde triggers renombrados y cambios de nombre/esquema que oculten esa función. La regla de CONFIRMADO + escritura de stock se acota al contexto de pedidos: asociación directa de trigger con pedidos_ecommerce en el mismo SQL o referencias explícitas a pedidos/reservas de ecommerce en el cuerpo. Las confirmaciones de compras/recepciones de otros módulos siguen permitidas. DROP/REVOKE y el modelo moderno permanecen válidos.

Comprobaciones desde la raíz del ecommerce:

    node scripts/verificar-sql-vigente.mjs
    node scripts/probar-reglas-pedidos-sql.mjs
    node scripts/probar-sql-vigente.mjs

El workflow ejecuta estos controles antes de construir. El archivo histórico no se analiza como SQL activo y permanece byteidéntico.

**Límite:** es un control preventivo de patrones, no un intérprete completo de PostgreSQL ni un bloqueo de DDL en la base. Las asociaciones sin esquema asumen public; funciones y triggers repartidos en distintos cambios, search_path, alias, llamadas transitivas, SQL dinámico arbitrario y lógica equivalente con otra estructura requieren revisión. Una ficha o un control verde no autoriza aplicar un cambio ni demuestra sus efectos transaccionales.

## Verificación remota reproducible

La [observación guardada](contratos/h02-pedidos-observado-2026-10-23.json) contiene resultados de catálogo y huellas de funciones, sin filas empresariales. La consulta usa la identidad de función tgfoid, además del nombre histórico; incluye triggers deshabilitados y tablas de cualquier esquema. Una función que cambió de identidad o cuerpo requiere revisar esa deriva, aunque la búsqueda de la identidad antigua devuelva cero.

Ejecutar con acceso de lectura al catálogo del proyecto correcto; este SQL solo inspecciona, dentro de una transacción READ ONLY. No crea pedidos ni invoca operaciones comerciales:

```sql
begin read only;
with legacy as (
 select p.oid,p.proowner,p.proacl,p.prosecdef,p.proconfig,
        pg_catalog.pg_get_function_identity_arguments(p.oid) args,
        pg_catalog.pg_get_function_result(p.oid) result
 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='procesar_estado_pedido_ecommerce'
   and pg_catalog.pg_get_function_identity_arguments(p.oid)=''
),
attachments as (
 select n.nspname table_schema,c.relname table_name,t.tgname trigger_name,
        t.tgenabled,t.tgisinternal,fn.nspname function_schema,p.proname function_name,
        pg_catalog.pg_get_triggerdef(t.oid,true) definition
 from pg_catalog.pg_trigger t
 join pg_catalog.pg_class c on c.oid=t.tgrelid
 join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 join pg_catalog.pg_proc p on p.oid=t.tgfoid
 join pg_catalog.pg_namespace fn on fn.oid=p.pronamespace
 where t.tgfoid in(select oid from legacy)
    or (n.nspname='public' and c.relname='pedidos_ecommerce'
        and t.tgname='pedidos_ecommerce_procesar_reserva')
)
select pg_catalog.jsonb_build_object(
 'observed_at_utc',pg_catalog.to_char(pg_catalog.now() at time zone 'utc','YYYY-MM-DD HH24:MI:SS'),
 'read_only',pg_catalog.current_setting('transaction_read_only'),
 'legacy_function_count',(select count(*) from legacy),
 'legacy_function',(select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'signature','public.procesar_estado_pedido_ecommerce()','result',l.result,
  'security_definer',l.prosecdef,'settings',l.proconfig,
  'definition_md5',pg_catalog.md5(pg_catalog.pg_get_functiondef(l.oid)),
  'anon_execute',pg_catalog.has_function_privilege('anon',l.oid,'EXECUTE'),
  'authenticated_execute',pg_catalog.has_function_privilege('authenticated',l.oid,'EXECUTE'),
  'service_role_execute',pg_catalog.has_function_privilege('service_role',l.oid,'EXECUTE'),
  'public_execute',exists(select 1 from pg_catalog.aclexplode(coalesce(l.proacl,pg_catalog.acldefault('f',l.proowner))) acl where acl.grantee=0 and acl.privilege_type='EXECUTE')
 )) from legacy l),
 'legacy_attachment_count',(select count(*) from attachments),
 'legacy_attachments',coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a)) from attachments a),'[]'::jsonb),
 'state_constraints',(select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',co.conname,'definition',pg_catalog.pg_get_constraintdef(co.oid,true))) from pg_catalog.pg_constraint co where co.conrelid='public.pedidos_ecommerce'::pg_catalog.regclass and co.conname in('pedidos_ecommerce_estado_check','pedidos_estado_entrega_check','pedidos_estado_pago_check'))
) h02_readonly_contract;
rollback;
```

La consulta detecta asociaciones directas a la función antigua y el nombre histórico. No prueba por sí sola ausencia de una reescritura equivalente con otra función. Revisar también las funciones/triggers cambiados en cada delta y preservar las pruebas de stock, idempotencia y separación de cobro.

Las huellas de erp_transicionar_pedido (pública/privada), pedido_preparar_inventario, pedido_recibir_retorno y erp_factura_al_confirmar_pago coincidieron con la baseline H01 al corregir H02. Se inspeccionaron los cuerpos de preparación y cobro; no se ejecutaron ventas de prueba en producción.

H02 no genera una migración vacía ni aplica DROP TRIGGER sobre un objeto ausente. Para cambios reales seguir [MIGRACIONES.md](MIGRACIONES.md). Las pruebas de acciones con datos ficticios pertenecen a un entorno aislado compatible, no a escrituras de ensayo en producción.


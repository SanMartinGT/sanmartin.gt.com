# Migraciones diferenciales de San Martín

Actualizado: 23 de octubre de 2026. Proyecto compartido ERP/ecommerce: **beasfybalepkdlomzazf**.

## Estado después de H01

- Los 25 instaladores SQL antiguos están en [historico/](historico/README.md) con extensión .sql.historico y hashes de los originales.
- **No hay una migración nueva para H01:** el cambio necesario es retirar los instaladores de las rutas activas y controlar sus sustituciones. La base ya tiene el contrato moderno; no se aplica SQL ni se registra una migración vacía para marcar el arreglo.
- supabase/migrations/ es la única carpeta para futuras migraciones ejecutables. Contiene el delta diferencial H05 aplicado; .gitkeep se conserva.
- scripts/activar-webhook-catalogo.sql es una propuesta separada; no se aplicó ni forma parte del historial de migraciones. Para instalar una versión futura se prepara su delta bajo el mismo procedimiento.
- El workflow de la tienda comprueba fuentes y construye/publica HTML; no aplica migraciones de Supabase.

## Primer delta aplicado: disponibilidad contextual (H05)

El 23 de octubre de 2026 (Guatemala) se aplicó
`20261024025818_validar_disponibilidad_presentaciones_contextual.sql` al proyecto
compartido. Añade un núcleo de consulta STABLE y sus wrappers; no modifica el
motor de creación ni las tablas de negocio. Conserva la firma antigua de consulta.

El archivo se creó primero con `supabase migration new` usando CLI 2.122.0. Tras
`apply_migration`, se adoptó el prefijo real `20261024025818` del historial remoto;
la ficha conserva el nombre inicial generado por CLI. No se escribió ni reparó el
historial manualmente. El prefijo está en UTC; la fecha local de aplicación es 23-10-2026.

La ficha ancla el delta al catálogo dirigido [baseline/h05-antes-2026-10-23.json](baseline/h05-antes-2026-10-23.json),
con la historia anterior hasta `20261022013039`. Ese baseline tiene funciones,
columnas y uso de esquema del alcance H05; no es una copia completa para reconstrucción.
El SQL comprueba huellas de sus dependencias antes de aplicar y rechaza una
reaplicación sin reconciliar el estado.

Prueba aislada reproducible: `npm ci --ignore-scripts` y `npm run test:sql`.
Usa PGlite 0.5.11 fijado con lockfile para ejecutar PostgreSQL 18.6 con fixtures y
definiciones observadas. La base viva usa PostgreSQL 17.6 y también pasó aceptación
READ ONLY y API pública. No ejecutar el snapshot de dependencias como instalador.
El workflow prueba SQL aislado; no publica migraciones en Supabase.

El delta se conserva en UTF-8/LF para que sus bytes y las huellas de funciones
coincidan con lo aplicado. `.gitattributes` fija ese formato y evita convertir
automáticamente los históricos, baselines y fichas con hashes al cambiar de sistema.

## Invariante de pedidos protegido (H02)

La comprobación de SQL activo incluye [CONTRATO_PEDIDOS.md](CONTRATO_PEDIDOS.md): no reinstalar consumo de inventario por CONFIRMADO ni el trigger/función antiguos, aunque se cambie el nombre del trigger o se adjunte una ficha H01 válida. PREPARAR registra la salida y COBRAR el dinero, por separado. DROP/REVOKE de objetos antiguos siguen permitidos.

El control es de patrones y no reemplaza revisar el delta ni consultar los triggers reales. La observación de Supabase confirmó que el trigger no estaba instalado; H02 añade protección local sin aplicar DDL ni crear una migración vacía.

## Qué contiene la instantánea vigente

[baseline/h01-2026-10-23.json](baseline/h01-2026-10-23.json) se obtuvo mediante consultas de lectura al catálogo de Supabase: 229 funciones de public/erp_private con firma y huella MD5 de definición, 4 vistas con huella/opciones, 103 políticas de public/storage, 82 triggers públicos, grants de tabla y grants de columnas de tablas relevantes.

Registra 26 entradas remotas de migración; la última observada es **20261022013039 — add_product_presentations**. También confirma que el trigger antiguo pedidos_ecommerce_procesar_reserva no está instalado.

Es una instantánea de diagnóstico **no ejecutable**: no contiene el DDL completo, datos ni todos los objetos necesarios para reconstruir una base vacía. Las entradas de historial remoto no equivalen a tener sus archivos SQL locales. Sus hashes describen lo observado en esa fecha; no prueban que mañana no haya cambios.

No usar los SQL históricos para completar supuestos objetos faltantes de una reconstrucción. Obtener el esquema completo y reconciliar su historia es un trabajo distinto antes de probar migraciones sobre una base nueva.

## Preparar un cambio real

1. Identificar el cambio de comportamiento solicitado y los objetos afectados. Obtener de nuevo las definiciones/permisos actuales por consultas de catálogo de solo lectura, incluida la firma exacta de funciones, políticas, vistas y grants por columna. Guardar una instantánea fechada adicional en baseline/; conservar la inicial.
2. Comparar esa lectura con el contrato del ERP y del ecommerce. Especificar qué cambia y qué debe conservarse: propiedad de clientes, permisos del personal, idempotencia, preparación/cobro/retorno y cantidades/presentaciones.
3. Preparar una base de ensayo con esquema e historia compatibles y datos ficticios. entorno.json solo controla dominio/indexación; actualmente no separa por sí solo la conexión fija del navegador de producción.
4. Generar un archivo nuevo con la CLI y escribir únicamente las diferencias necesarias, o generar el diff desde el entorno aislado y revisar su contenido. No renombrar un archivo histórico ni copiar una instalación completa como delta.
5. Probar ese cambio en ensayo y registrar resultados concretos. Si afecta compra, incluir permisos por dueño, reintento con la misma clave, competencia por stock y consistencia de reservas/estados. Revisar también advisors y efectos en ERP.
6. Añadir la ficha de revisión descrita abajo y ejecutar el control offline. Revisar el diff de código y SQL conjuntamente antes de una publicación de base; el workflow actual no la ejecuta.

### CLI y esquema existente

La CLI Supabase no estaba disponible en el PATH durante H01. No se instaló ni se enlazó el proyecto en este arreglo. Cuando se use, comprobar su versión y ayuda antes de elegir comandos:

```text
supabase --version
supabase --help
supabase migration new --help
supabase db diff --help
supabase db pull --help
supabase migration list --help
```

Para crear un archivo, después de confirmar la ayuda de la versión instalada:

```text
supabase migration new descripcion_del_cambio
```

La CLI asigna el prefijo de versión; no inventarlo manualmente. Un diff automático también debe revisarse: su salida puede incluir permisos u objetos que no pertenecen al cambio.

db pull puede generar archivos y ofrecer actualizar la historia de migraciones remota. **No tratarlo como una exportación de lectura sin efectos**, ni confirmar una reparación de historia solo para hacer coincidir archivos locales ausentes. En este arreglo se consultó Supabase mediante lectura de catálogo, sin db pull, db push ni repair.

Referencias oficiales: [crear y probar migraciones](https://supabase.com/docs/guides/deployment/managing-environments), [db pull y sus efectos](https://supabase.com/docs/reference/cli/supabase-db-pull).

## Ficha de cada migración diferencial

Por cada supabase/migrations/<version>_<descripcion>.sql se requiere supabase/revisiones/<version>_<descripcion>.json. El nombre de versión debe proceder de la CLI. Este ejemplo describe el formato; **no crearlo como migración de H01 ni usar los marcadores como valores reales**:

```json
{
  "format_version": 1,
  "migration_file": "supabase/migrations/<version>_<descripcion>.sql",
  "migration_sha256": "<SHA-256 del SQL terminado>",
  "project_ref": "beasfybalepkdlomzazf",
  "baseline_file": "supabase/baseline/<instantanea-vigente>.json",
  "baseline_sha256": "<SHA-256 de esa instantánea>",
  "based_on_migration": "<última versión remota de esa instantánea>",
  "reason": "Cambio concreto solicitado y objetos afectados.",
  "before_after": "Contrato anterior observado y diferencia que implementa este SQL.",
  "verification": "Entorno aislado, casos ejecutados y resultados reales."
}
```

La instantánea indicada debe conservar formato de catálogo compatible con la inicial y el mismo project_ref; latest_migration debe coincidir con su último elemento de migration_history. La ficha debe actualizarse si se modifica el SQL y se repiten las pruebas pertinentes.

La comprobación de hashes verifica qué archivos se revisaron; **no demuestra que el SQL sea semánticamente diferencial, que las pruebas descritas se hayan ejecutado ni que la instantánea siga fresca**. Esas comprobaciones requieren revisar el cambio y consultar el entorno correcto. La ficha no sustituye autorización de despliegue ni aplica nada.

## Comprobaciones locales

Desde la raíz del ecommerce, con Node 22 o posterior y Python 3.12 o posterior para la prueba del publicador:

```text
node scripts/verificar-sql-vigente.mjs
node scripts/probar-sql-vigente.mjs
node scripts/probar-reglas-pedidos-sql.mjs
python scripts/probar-publicacion-sql.py
```

El primer comando comprueba archivos/manifiesto y migraciones, sin red ni SQL. Los otros prueban regresiones con archivos temporales, sin conectar a Supabase o FTP. CI ejecuta estos controles antes de preparar el sitio.

El control rechaza SQL activos fuera de migrations/, excepto la propuesta identificada; históricos faltantes/alterados/no declarados; copias exactas de históricos convertidas en migración; y migraciones sin ficha o con hashes/proyecto/base inconsistentes. También se impide que SQL, .sql.historico, .sql.bak y sus carpetas privadas entren en una salida de publicación.

## Publicar y verificar una migración futura

El procedimiento de despliegue de base se define para el cambio concreto, separado de la subida de HTML. Antes de aplicarlo, volver a comparar el catálogo vivo con la instantánea usada y detenerse si hay deriva relevante. Después, consultar los objetos modificados y ejecutar las comprobaciones del contrato; guardar el identificador de migración realmente registrado.

Conservar compatibilidad entre versiones de ERP, ecommerce y esquema durante la transición. Si hay incidencias, no restaurar instaladores históricos ni revertir inventario/pedidos con un dump antiguo; preparar una corrección limitada al problema observado.


## Delta H08 aplicado

`20261024114111_persistir_snapshots_pedidos.sql` fue generado inicialmente por
CLI con prefijo `20261024113413` y luego reconciliado con la versión asignada por
Supabase. La ficha conserva ambos nombres y SHA-256; no se alteró el historial
a mano. Añade dos columnas JSONB nullable sin default/backfill y un trigger
privado; actualiza los dos bloques de contacto y las lecturas de identidad.
No reescribe pedidos ni comprobantes existentes. Comparar baseline/historial
vivo y generar otro delta para cambios posteriores; no reaplicar este SQL.

## H09 preparado, no aplicado

`20261024165634_conectar_puente_catalogo.sql` y su ficha son un delta pendiente.
El baseline inspeccionado no tiene helper/triggers ni secretoVault del puente.
La migración rechaza esa configuración incompleta; no aplicarla hasta probar
Edge/repositorio/hosting. Cubre9tablas y evita coexistir con webhooks estándar.
La propuesta `scripts/activar-webhook-catalogo.sql` conserva sus bytes originales
como referencia de7tablas y no debe ejecutarse para la activación actual.

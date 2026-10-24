# Identidad comercial y entrega de pedidos (H08)

Migración aplicada: `20261024114111_persistir_snapshots_pedidos.sql`.
Proyecto: `beasfybalepkdlomzazf`. Fecha local: 24 de octubre de 2026.

## Captura de líneas

`pedidos_ecommerce_detalle.producto_snapshot` guarda versión, fecha de captura,
producto ID, nombre y SKU. `unidad_medida_snapshot` guarda versión/fecha, unidad
ID/nombre/abreviatura, fracciones, decimales y la venta fraccionada del producto.
Ambas columnas son JSONB nullable, sin default ni relleno de filas existentes.

El trigger privado `capturar_identidad_pedido` captura estos valores en el INSERT
desde las tablas del servidor y descarta snapshots enviados por el cliente.
Impide modificar después el producto ID o los snapshots, incluso pasar un vacío
antiguo a un dato actual. Es SECURITY INVOKER con search_path vacío, sin EXECUTE
para PUBLIC, anon, authenticated o service_role. Los permisos de tablas y RLS no
se ampliaron. El checkout mantiene sus bloqueos y reglas de inventario existentes.

Presentación, factor, cantidades comerciales/base e importes continúan en los
campos que el motor ya guardaba. No se copian costos ni otras columnas privadas
del producto. Los snapshots describen la línea insertada, no certifican cambios
posteriores del catálogo.

## Contacto de entrega

Ambos motores de checkout guardan en `direccion_envio`:

- `version_snapshot: 1`.
- `destinatario`: nombres y apellidos del perfil, recortando partes vacías.
- `nombre_completo`: alias compatible del destinatario.
- `telefono`: teléfono del perfil, o null si está vacío.

`nombre` conserva la etiqueta de dirección que ya existía. En domicilio se
conservan dirección, municipio, departamento y referencia; en retiro, sucursal e
ID del destino. La captura usa el mismo registro de perfil leído para ese pedido.
No se añadió una obligación de rellenar nombres/teléfono ausentes ni se inventa
su valor. La operación sigue atómica y un error revierte la compra completa.

El replay ocurre antes de consultar/capturar nuevamente el perfil: conserva el
pedido, contacto, importes y snapshots originales. No cambia el hash de la intención.

## Lectura y comprobantes

`erp_detalle_productos_pedido` mantiene la firma, el control de sesión y el acceso
por dueño o personal autorizado. Su campo `productos` conserva `{id,nombre,sku}`,
tomado del snapshot para líneas nuevas. Devuelve además los dos snapshots y
`identidad_origen: SNAPSHOT`.

Para líneas antiguas, los snapshots y la unidad permanecen null. `productos`
puede ofrecer el nombre/SKU actuales, con `identidad_origen: REFERENCIA_ACTUAL`.
La cuenta y el ERP lo identifican expresamente como referencia actual; no lo
presentan como identidad registrada al comprar. La ausencia de unidad o contacto
se muestra como dato no registrado. La etiqueta de dirección no es el destinatario.

Las nuevas emisiones de comprobantes toman también los snapshots de la línea;
una emisión de un pedido antiguo identifica su referencia actual. Los documentos
ya guardados y su replay no se reescriben. `datos.cliente` continúa describiendo
el perfil al emitir el comprobante; para los pedidos versionados la impresión no
lo usa para rellenar contacto o dirección ausentes del pedido.

La recompra conserva IDs/cantidades y pasa por `readCart` e hidratación actuales.
Un snapshot nunca concede permiso de compra ni fija el precio de una compra nueva.

## Verificación y publicación

Las suites H08 ejecutan checkout y emisión reales en PostgreSQL aislado, con
datos ficticios. Auth/permisos y la envoltura de respuesta se simulan de forma
explícita; no son una prueba de login/MFA ni compras en producción.

```sh
node scripts/probar-snapshots-sql.mjs
node scripts/probar-snapshots-ui.mjs
```

La prueba UI ejecuta los módulos ERP de la carpeta hermana si está disponible;
en el checkout aislado de CI ecommerce esos subcasos se omiten con indicación
explícita. La fuente SQL probada coincide con la enviada a Supabase y las cinco
definiciones compiladas coinciden por MD5 y ACL con el servidor.

La base está actualizada. Las fuentes del ecommerce y los módulos de pedidos y
comprobantes del ERP usan `snapshots-h08-1`; falta publicar esos HTML/JS juntos y
regenerar las fichas SEO. No reaplicar la migración ya registrada.

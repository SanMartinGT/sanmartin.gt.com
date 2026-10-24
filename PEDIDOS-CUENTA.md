# Historial y recompra de la cuenta (H07)

`auth.js` lista pedidos filtrados por el cliente autenticado y obtiene sus líneas
mediante la RPC existente `erp_detalle_productos_pedido({p_pedido_id})`. No consulta
el catálogo público ni la tabla de líneas para resolver los nombres del historial.
La RPC verifica sesión y dueño, o permiso y sucursal del personal. No se añadieron
funciones, grants o políticas en Supabase.

`loadAccountOrderDetails` limita la concurrencia a cuatro consultas, comprueba la
correspondencia de pedido/producto y cancela resultados de una carga anterior.
Cada fallo muestra un mensaje y permite reintentar; los demás pedidos conservan
su detalle. Una respuesta fallida no se presenta como un pedido vacío ni permite
recomprar sus líneas. La interfaz muestra todas las líneas recibidas.

`buildAccountReorder` conserva todos los IDs y cantidades comerciales autorizados:
`cantidad` para la unidad, `cantidad_presentaciones` para un paquete. Una cantidad
inválida se explica y no se reemplaza por uno. El nombre sirve para presentar el
producto; el historial no concede permiso para comprarlo de nuevo.

Los candidatos pasan por `SanMartinPresentaciones.readCart`, sin modificaciones
al helper: precios a cero, factor neutral y `verificado:false`. Se mantienen las
guardas de identidad del almacén antes de guardar y después de sincronizar.
Al regresar, el puente de carrito hidrata también su suscripción inicial si ya
está listo, para cubrir el caso en que la carga terminó antes de suscribirse.
La hidratación utiliza catálogo/precios/presentaciones vigentes: un producto oculto
o una presentación retirada permanece visible con un error y requiere revisión.
La confirmación conserva su comprobación de disponibilidad y validación en servidor.

Los recursos `auth.js`, `producto.js` (loader) y `carrito-cuenta.js` se publican con
la versión `historial-h07-1`, junto con los HTML y las fichas SEO regeneradas.

Pruebas sin servicios externos:

```sh
node scripts/probar-pedidos-cuenta.mjs
npm ci --ignore-scripts
node scripts/probar-historial-sql.mjs
```

La prueba SQL ejecuta en PGlite la definición observada del RPC, conservada en
`supabase/contratos/h07-historial-observado-2026-10-24.json`. Los datos y las fronteras
de sesión/permiso/sucursal del ensayo son ficticios: no equivalen a iniciar una
sesión real, probar MFA o consultar el pedido de un cliente en producción.

H08 quedó aplicado mediante la migración `20261024114111`. Las líneas nuevas
conservan nombre/SKU y unidad capturados en servidor; el contacto de entrega se
guarda al crear el pedido. Los antiguos mantienen snapshots nulos y una referencia
actual identificada expresamente. Consulta [el contrato de snapshots](supabase/CONTRATO_SNAPSHOTS.md).
La paginación integral y los demás cambios de B28/B30 mantienen su alcance pendiente.

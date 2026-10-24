# Checkout por modalidad y destino — H04/H05

H04: interfaz implementada localmente el 23 de octubre de 2026. H05: contrato de
consulta aplicado en Supabase con migración `20261024025818` ese mismo día en Guatemala.
Proyecto compartido: `beasfybalepkdlomzazf`. La publicación de la interfaz sigue pendiente.

## Contrato observado

Las RPC `crear_pedido_checkout` y `crear_pedido_checkout_presentaciones` reciben
`p_modo_inventario` y `p_ubicacion_destino_id`; ambos forman parte de la identidad
de la solicitud, junto con productos, entrega, pago y expiración.

| Selección | Destino enviado | Disponibilidad previa |
| --- | --- | --- |
| `SUCURSAL` | `null` explícito: lo resuelve la configuración de la tienda | `validar_disponibilidad_presentaciones(p_items)` |
| `OMNICANAL` | UUID elegido del catálogo público de sucursales habilitadas | `ecommerce_stock_omnicanal(p_producto_ids, p_ubicacion_destino_id)` |

`SUCURSAL` no permite elegir una ubicación arbitraria: el servidor exige la
ubicación configurada. Se conserva `null` para mantener también la firma de los
reintentos anteriores. La consulta contextual informa el UUID efectivo; la interfaz
conserva la etiqueta **sucursal asignada de la tienda** y no fija un ID ni adivina
que coincide con el nombre o código PRINCIPAL.

El catálogo de destinos se obtiene con `ecommerce_stock_omnicanal([], null)`.
Devuelve solo ubicaciones activas que permiten inventario y venta, con nombre,
dirección y capacidad de recepción/transferencia. La consulta se comprobó como
`anon` dentro de una transacción de solo lectura; el array vacío evita consultar
inventario de productos. No se abren las tablas internas de ubicaciones o de
configuración a los compradores.

## Preflight unificado en servidor (H05)

Ambas modalidades llaman `validar_disponibilidad_presentaciones_contextual` con
`p_items`, `p_modo_inventario` y `p_ubicacion_destino_id`. El navegador envía únicamente
identificadores y cantidades comerciales; no envía factores, precios ni stock.
El servidor normaliza, resuelve las presentaciones actuales y suma la demanda base
por producto, respetando elegibilidad, máximos comerciales y precisión de unidad.

La consulta devuelve una fila por producto con estado, mensaje, necesidad de
abastecimiento y contexto efectivo. Una presentación inválida invalida todo su
producto: no puede quedar ocultada por otra fila DISPONIBLE del mismo producto.
No se exponen cantidades de stock, precios o datos de productos privados.

El núcleo privado usa las mismas condiciones de fuentes que el checkout: destino
activo con inventario/venta, primero su stock local y, para OMNICANAL, fuentes
activas transferibles cuando el destino admite recepción y transferencia. El límite
comercial por línea no se aplica a las unidades base de un paquete de 500.

La resolución de consulta es STABLE y evita los bloqueos de producto/unidad que
utiliza el resolvedor de operaciones. Los originales del checkout se conservan.
La variante de consulta deriva de sus definiciones observadas y tiene pruebas de
paridad; cualquier cambio futuro al resolvedor debe revisar también esta variante.

La firma antigua `validar_disponibilidad_presentaciones(p_items)` delega en el mismo
núcleo con SUCURSAL/null y conserva su array de tres campos. No se creó una sobrecarga
ambigua para PostgREST. Los wrappers públicos son INVOKER; el núcleo privado tiene
permisos explícitos para la consulta pública y el resolvedor de detalle no es
invocable por compradores. Todos fijan `search_path` vacío y no conceden EXECUTE a PUBLIC.

El navegador valida que la respuesta sea completa, única y corresponda al modo/destino
solicitado. No vuelve al cálculo de stock del navegador si falta el contrato nuevo.
La consulta informa; el servidor revalida y reserva al crear el pedido. Abrir el
carrito, elegir una sucursal o consultar no registra reservas.

## Interfaz y operaciones pendientes

`checkout-contexto.js` monta los mismos selectores dentro del carrito de inicio,
catálogo, lema y ficha dinámica/SEO. `checkout-seguro.js` exige opciones explícitas;
ya no adopta silenciosamente un modo para llamadas sin opciones.

Una revisión independiente del carrito invalida consultas cuando cambian modalidad,
destino, entrega o pago. Se capturan opciones inmutables y se pasan iguales a
`tienePendiente`, disponibilidad y `crear`. El guard adicional se comprueba después
del hash asíncrono y antes de enviar la RPC. Cambiar selectores no reinicia ni borra
claves idempotentes.

Si ya había una solicitud pendiente para ese mismo actor/payload, se consulta su
resultado sin exigir nuevamente stock: la reserva propia podría haberlo agotado.
Una selección distinta tiene otra identidad. Si el pedido ya fue enviado y se
cambia la selección mientras responde, se informa el resultado y se conserva el
carrito actual. Un cambio de cuenta sigue invalidando respuestas mediante H03.

Agregar desde catálogo/ficha o importar/fusionar un carrito guarda una intención
comercial validada; deja la comprobación de stock para el contexto elegido y la
confirmación. Esto evita bloquear una intención omnicanal por el stock de la
sucursal asignada antes de que el comprador seleccione dónde abastecerla.

La recuperación automática del contexto después de recarga o cambio de sesión
conserva el alcance pendiente de B22. Para recuperar una solicitud desconocida se
deben volver a elegir el mismo carrito, modalidad, destino, entrega y pago.

## Límites del arreglo

H05 quedó instalado en el servidor y conectado en las fuentes de la interfaz. La
RPC antigua es compatible mediante el núcleo nuevo. La aceptación incluyó PostgreSQL
aislado y llamadas de consulta a la API pública real; no creó pedidos de prueba.
Actualmente no hay presentaciones activas de ecommerce para productos del catálogo
público: los casos de paquetes se ensayaron con datos ficticios en PostgreSQL.

No se modifican reglas monetarias, dirección del perfil, elegibilidad general del
catálogo, permisos, asignación de reservas, traslados, preparación, entrega o cobro.
La publicación y aceptación con cuentas reales y stock de ensayo siguen pendientes.

Referencias verificadas: [RPC JavaScript](https://supabase.com/docs/reference/javascript/rpc),
[funciones de base y permisos](https://supabase.com/docs/guides/database/functions).

## Identidad y contacto guardados (H08)

Migración aplicada `20261024114111`: las líneas nuevas guardan
`producto_snapshot` y `unidad_medida_snapshot` en el INSERT. Ambos checkout
conservan en `direccion_envio` el destinatario completo y teléfono del perfil,
con `version_snapshot:1`, junto con los datos propios de envío/retiro.
No cambia el hash de la intención: el replay devuelve el pedido original sin
recapturar producto/unidad/contacto. El detalle autorizado y las nuevas
emisiones del comprobante consumen la identidad persistida. Ver
[CONTRATO_SNAPSHOTS.md](CONTRATO_SNAPSHOTS.md).

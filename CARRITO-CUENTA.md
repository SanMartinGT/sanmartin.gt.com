# Carrito por identidad — H03

Implementado localmente el 23 de octubre de 2026. No requiere migraciones SQL.

## Propiedad y almacenamiento

`carrito-estado.js` es el único almacén compartido. `script.js`, `producto.js`,
`producto-estatico.js` y la recompra de `auth.js` lo usan para leer y guardar.
`carrito-cuenta.js` muestra las decisiones y conecta los cambios con el catálogo.

- Invitado: `sanmartin_ecommerce_cart_v2:guest`.
- Cada cuenta: `sanmartin_ecommerce_cart_v2:account:<id>`.
- Carrito anterior sin propietario: `sanmartin_ecommerce_cart_v2:legacy`.

La clave compartida v1 se retira y su contenido queda aislado. No se atribuye
automáticamente al invitado ni a quien inicie sesión. La persona debe reconocer
el contenido e importarlo, descartarlo o dejarlo para después.

Al cambiar de identidad se vacían inmediatamente las líneas visibles y las
selecciones de entrega/pago. Se invalidan temporizadores y respuestas pendientes
mediante identidad, generación y revisión. El carrito de A nunca se convierte en
invitado al salir. Los cambios locales pendientes permanecen en el ámbito de A
para recuperarlos únicamente al volver a esa cuenta.

## Entrada a una cuenta

Se consulta siempre `carritos_ecommerce`, incluso si existe una copia local con
líneas. Una copia limpia no prevalece sobre un remoto vacío. Un fallo de lectura
bloquea la edición y permite reintentar; no inicializa ni sobrescribe el remoto.
La ausencia normal de sesión (`AuthSessionMissingError`) permite operar como invitado.
Las consultas de Supabase se difieren fuera del callback de Auth.

Si hay carrito de invitado, se debe elegir:

1. **Combinar ambos**: suma cantidades por producto y presentación.
2. **Usar solo el invitado**: sustituye las líneas de la cuenta.
3. **Conservar separados**: muestra el de la cuenta y conserva el invitado.

Las dos primeras opciones vuelven a consultar productos, presentaciones, precios
y unidades antes de aceptar el cambio. Desde H04 guardan una intención comercial;
la disponibilidad se consulta para la modalidad/destino elegido en el carrito y
se comprueba de nuevo al confirmar. Unidades sueltas y paquetes
mantienen identidades diferentes; se validan fracciones y límites con el catálogo.
La recuperación del destino se guarda antes de retirar el origen elegido.
Cada origen tiene un sello para no volver a sumar una importación interrumpida
ni confundirla con otro carrito nuevo que tenga iguales productos y cantidades.

Los carritos que se dejaron separados pueden volver a abrirse desde **Revisar
carritos que dejé separados**. Un refresco de token de la misma cuenta no reinicia
el carrito ni vuelve a solicitar una decisión ya resuelta.

## Guardados y conflictos

Se envían identificadores y cantidades, sin reutilizar precios/factores guardados.
Una actualización filtra tanto `cliente_id` como el `actualizado_en` observado.
La primera creación usa `insert`; una colisión de la clave única se trata como
conflicto. Se comprueba la identidad con `getUser()` antes de escribir.

Si otro cliente guardó primero, se conservan las alternativas y se pide elegir
entre el remoto y la recuperación local de esa misma cuenta. Los eventos de
almacenamiento entre pestañas invalidan operaciones anteriores; si hay cambios
locales distintos, también exigen una decisión. Un guardado antiguo en vuelo no
bloquea la sincronización de otra identidad.

Esta comprobación de versión protege la convivencia de clientes actualizados.
Las versiones antiguas que hagan `upsert` incondicional no siguen este protocolo;
deben retirarse con la publicación. La actualización local no cambia el esquema
ni añade sincronización de modificaciones remotas en tiempo real.

## Supabase observado y validación

Se consultaron solo metadatos del proyecto `beasfybalepkdlomzazf`:
RLS habilitado, política `ALL` para `authenticated` con propiedad
`cliente_id = auth.uid()` tanto en `USING` como en `WITH CHECK`, clave única
`cliente_id`, columna `actualizado_en` no nula y ningún trigger de usuario en la
tabla. No se leyeron ni modificaron carritos reales, sesiones o pedidos.

Pruebas locales, sin servicios:

```sh
node scripts/probar-carrito-cuenta.mjs
node scripts/probar-carrito-integracion.mjs
node scripts/probar-presentaciones.mjs
```

El workflow ejecuta estas pruebas antes de preparar el sitio. Se comprobó además
el navegador con SDK/datos ficticios y externos bloqueados, y se ejecutaron los
scripts reales de preparación, generación y verificación SEO en una copia aislada.
La publicación y la aceptación con cuentas reales siguen pendientes.

Referencias verificadas para la integración:
[Auth](https://supabase.com/docs/reference/javascript/auth-onauthstatechange),
[update con filtros y retorno](https://supabase.com/docs/reference/javascript/update),
[maybeSingle](https://supabase.com/docs/reference/javascript/maybesingle).

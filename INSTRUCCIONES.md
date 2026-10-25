# San Martín: SEO y publicación automática en Hostinger

Dominio configurado: **https://sanmartingmca.com/**.

Repositorio: [SanMartinGT/sanmartin.gt.com](https://github.com/SanMartinGT/sanmartin.gt.com), rama `main`, con la fuente revisada y el workflow cargados. La automatización H09 está activa y probada: un evento de la base pasó por Edge y Actions hasta Hostinger, con su mismo identificador y 26 archivos críticos comprobados por HTTPS. La Edge `catalogo-actualizado` figura ACTIVE en su revisión remota 5 observada, con el código H09 revisado. La evidencia y sus límites se detallan al final de esta guía.

## Base de datos compartida: SQL históricos retirados (H01)

Los 25 SQL de instalación que estaban en la raíz fueron archivados sin alterar su contenido en [supabase/historico/](supabase/historico/README.md), con extensión `.sql.historico`. Sus comentarios de «ejecutar una vez» son históricos: no instalarlos sobre la base compartida con el ERP.

Para cambios de base, seguir [supabase/MIGRACIONES.md](supabase/MIGRACIONES.md): consultar el esquema vivo y preparar solo una migración diferencial probada. H01 no modifica Supabase ni crea una migración vacía. El workflow valida el archivo histórico y las fichas de futuras migraciones; no aplica SQL.

Antes de generar el sitio, ejecutar `node scripts/verificar-sql-vigente.mjs`. Este control es offline. Cambiar `entorno.json` a staging no cambia por sí solo la conexión del navegador a Supabase de producción.

H02 añade una comprobación específica del [contrato de pedidos](supabase/CONTRATO_PEDIDOS.md): los SQL activos no pueden reinstalar los patrones del consumo antiguo por CONFIRMADO. El flujo vigente mantiene preparación de mercancía y cobro separados; la consulta de catálogo confirmó ausente el trigger antiguo.

El workflow genera y valida HTML de productos, categorías, catálogo, sitemap y robots, y guarda el artefacto descargable. La publicación está habilitada mediante `HOSTINGER_DEPLOY_ENABLED=true`. Si se retira esa variable o se cambia a `false`, sólo se genera el sitio y no se transfiere a Hostinger.

## 1. Dominio y alojamiento configurados

1. `sanmartingmca.com` está alojado como sitio **PHP/HTML personalizado** en el plan Single existente. El editor Website Builder usa otro sistema de publicación.
2. El dominio sirve el sitio por HTTPS y se verificaron sus archivos publicados. Si se cambia de servidor, usar los DNS y el certificado indicados por Hostinger para ese destino.
3. Se configuró una **cuenta FTP dedicada al sitio**, con raíz en la carpeta del dominio, desde donde `/public_html/` es visible. El servidor comprobado es `srv486.hstgr.io:21`. Una cuenta cuya raíz ya sea `public_html` sólo muestra `/` y no es compatible con la validación del publicador actual. Las credenciales permanecen en los secretos de GitHub.

GitHub ejecuta Node y genera el sitio; Hostinger recibe HTML, CSS, JavaScript e imágenes. No necesita ejecutar Node ni disponer de SSH. [Hostinger: FTP y carpeta pública](https://www.hostinger.com/support/1714427-how-to-find-ftp-details-on-hostinger-dashboard-at-hostinger/), [compatibilidad de protocolos y planes](https://www.hostinger.com/support/which-file-transfer-and-server-access-options-are-supported-at-hostinger/).

## 2. Configurar GitHub Actions

Actions está habilitado y publica con `HOSTINGER_DEPLOY_ENABLED=true`. Para generar sólo el artefacto durante un mantenimiento, cambia esa variable a `false`: los commits, eventos del catálogo, horario y ejecución manual seguirán generando el sitio, con **Hostinger omitido** en el resumen.

Para mantener los secretos ya configurados, abre [SanMartinGT/sanmartin.gt.com](https://github.com/SanMartinGT/sanmartin.gt.com) → **Settings → Secrets and variables → Actions**. Actualízalos directamente en GitHub; no los guardes en archivos ni los pegues en el chat:

| Secret | Valor |
| --- | --- |
| `HOSTINGER_FTP_SERVER` | `srv486.hstgr.io`, sin protocolo ni puerto. |
| `HOSTINGER_FTP_USERNAME` | Usuario FTP de la tienda. |
| `HOSTINGER_FTP_PASSWORD` | Contraseña FTP. |

En la pestaña **Variables**, la configuración actual y sus valores de transporte son:

| Variable | Valor |
| --- | --- |
| `HOSTINGER_DEPLOY_ENABLED` | `true`, habilitado y probado. |
| `HOSTINGER_FTP_PORT` | `21` |
| `HOSTINGER_FTP_DIR` | `/public_html/` |
| `HOSTINGER_FTP_PROTOCOL` | `ftps` |
| `SITE_URL` | `https://sanmartingmca.com/`, también definido en `entorno.json`. |

El workflow exige **FTPS explícito con certificado verificado**. Su guard de destino rechaza cualquier protocolo distinto de `ftps` antes de escribir; no configurar `HOSTINGER_FTP_PROTOCOL=ftp` en esta automatización. El publicador Python conserva parámetros de compatibilidad en su código, pero eso no habilita FTP sin cifrado en el pipeline. No se desactiva la validación del certificado ni se cambia automáticamente de protocolo. Single no dispone de SFTP/SSH según la documentación actual de Hostinger.

La carpeta remota debe ser absoluta, visible desde la sesión de la cuenta FTP dedicada y terminar en `/public_html/`; también se permite la ruta completa del sitio que termine así. No se crea una carpeta remota que no exista. No cambies `SITE_URL` a una subcarpeta.

## 3. Subir el código y generar el sitio

La carga inicial está completada. Para publicar actualizaciones de fuente:

1. Reemplaza los archivos de la raíz del repositorio con esta versión, incluyendo `.github/workflows/publicar.yml`, `scripts/` y `supabase/`. Conserva la carpeta `.github`, aunque tu explorador la oculte. No subas una carpeta contenedora, `work/`, `_site/`, `.env` ni los ZIP.
   Al actualizar un repositorio existente, retira las antiguas copias `supabase-*.sql` de su raíz y conserva el archivo histórico de `supabase/`. Superponer un ZIP no elimina esos SQL viejos; el control H01 fallará si reaparecen.
2. Elimina del repositorio `scripts/preparar-pages.mjs` y las tres fichas antiguas dentro de `producto/`. Las fichas se generan en cada ejecución; no necesitas mantenerlas a mano. Un ZIP de reemplazo no borra por sí solo archivos antiguos en GitHub.
3. Haz commit en la rama predeterminada `main`. En **Actions → Generar SEO y publicar en Hostinger (opcional)** comprueba el resultado. También puedes usar **Run workflow**.
4. Revisa que preparación, generación y validación terminen correctamente. Descarga `sitio-hostinger` desde **Artifacts** si quieres revisar los archivos; se conserva durante siete días.
5. Mientras `HOSTINGER_DEPLOY_ENABLED` no sea `true`, el paso **Publicar en Hostinger** queda omitido y el resumen lo confirma. No necesitas configurar ni probar credenciales FTP para este modo.

La publicación ya está activa. Antes de escribir, el guard de sólo lectura compara la cuenta FTPS con la evidencia y el hash de `index.html` del sitio HTTPS vigente. Las publicaciones siguientes comparan hashes y envían archivos cambiados. Las fichas y categorías retiradas se eliminan únicamente si estaban en el manifiesto anterior y conservan su contenido generado. Nunca se hace una limpieza completa de `public_html`. Después de publicar se verifican por HTTPS los archivos críticos del artefacto nuevo. Volver a `false` detiene las siguientes transferencias y conserva lo que ya exista en el alojamiento.

Si más adelante eliges una primera carga manual, extrae el contenido de `public_html-hostinger.zip` **dentro** de `public_html`, con `index.html` y `.htaccess` directamente allí. No subas el paquete de código fuente al alojamiento. La carga manual y ejecutar el publicador por terminal son acciones de publicación separadas; la variable anterior solo controla el workflow de Actions.

## 4. Retirar la publicación anterior

En el repositorio abre **Settings → Pages → Build and deployment**. Selecciona **Deploy from a branch**, luego **None** como rama y **Save**, incluso si antes figuraba Actions. Esto desactiva el sitio anterior y conserva el repositorio y Actions. [Procedimiento oficial de GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/deleting-a-github-pages-site).

Si existía un archivo `CNAME`, una rama de publicación antigua, un workflow adicional o registros DNS dirigidos al alojamiento anterior, retira solo los que correspondan a esa publicación. No se detectó `CNAME` en la carpeta local. Este paquete ya no usa permisos, entornos ni acciones de publicación de aquel alojamiento.

## 5. Actualizar al agregar o modificar productos

El puente de [scripts/ACTIVAR-WEBHOOK.md](scripts/ACTIVAR-WEBHOOK.md) ya está instalado con nueve triggers privados de notificación. No crear además Database Webhooks estándar del Dashboard sobre esas tablas. El token de GitHub queda en Edge Secrets. Una modificación del catálogo activa `catalogo_actualizado`; Actions lee el catálogo actual, reconstruye sus fichas y sitemap, guarda el artefacto y publica con `HOSTINGER_DEPLOY_ENABLED=true`.

La migración del puente aplicada es `20261025043945`. `scripts/activar-webhook-catalogo.sql` sigue siendo una propuesta anterior sin aplicar y no debe ejecutarse. Los cambios futuros de SQL requieren un delta contra el esquema vivo según la guía de migraciones.

Sin ese webhook todavía funcionan los commits, **Run workflow** y la reconstrucción programada cada hora al minuto 17. GitHub puede retrasar los trabajos programados; no hay una promesa de actualización inmediata. El horario también renueva promociones que comienzan o vencen sin editar registros.

Las tres exclusiones manuales de `seo-config.json` ya se retiraron: `excludeProductIds` está vacío. La generación real del 24 de octubre de 2026 produjo **3 fichas, 2 categorías y 20 URLs de sitemap**. Los filtros del catálogo público siguen vigentes. La publicación automática por evento se verificó y se documenta al final.

## 6. Login y buscadores

En Supabase → **Authentication → URL Configuration** establece **Site URL** en `https://sanmartingmca.com/` y añade estos **Redirect URLs** usados por cuenta, favoritos y checkout:

```text
https://sanmartingmca.com/mi-cuenta.html
https://sanmartingmca.com/index.html
https://sanmartingmca.com/catalogo.html
https://sanmartingmca.com/producto.html?slug=*
```

Verifica también el retorno desde productos. Autoriza otras rutas de retorno únicamente si las usa tu tienda. [Supabase: Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

Prueba Google y confirmación de registro después de la migración. Los carritos y sesiones guardados en el navegador pertenecen al dominio donde se crearon.

Agrega el dominio nuevo en Search Console y envía **https://sanmartingmca.com/sitemap.xml**. `.htaccess` prioriza `index.html`, redirige a HTTPS y al dominio principal, y pide revalidar HTML/sitemaps/índices para mostrar las actualizaciones.

## Generar y comprobar localmente

Desde la raíz del proyecto con Node 22 o superior:

```text
node scripts/verificar-sql-vigente.mjs
node scripts/preparar-sitio.mjs
node scripts/generar-seo-productos.mjs
node scripts/verificar-seo.mjs
```

La salida pública queda en `_site/`; los resúmenes y marcadores de trabajo quedan en `work/`. No modifica productos ni inventario en Supabase. Cuando decidas publicar por terminal, agrega las mismas variables FTP en tu entorno y usa `python scripts/publicar-hostinger.py --site-dir _site` con Python 3.12 o superior. Ese comando sí transfiere archivos y no consulta el interruptor del workflow.

## Carrito por cuenta (H03)

El carrito se administra con `carrito-estado.js`; consulta [CARRITO-CUENTA.md](CARRITO-CUENTA.md)
antes de añadir otro punto de entrada. Catálogo, ficha y recompra deben usar su API,
conservar el contexto de identidad en operaciones asíncronas y cargar el almacén
antes del escritor. No volver a escribir la clave compartida v1.

## Modalidad, sucursal y disponibilidad (H04)

[supabase/CONTRATO_CHECKOUT.md](supabase/CONTRATO_CHECKOUT.md) documenta la selección
compartida y las RPC existentes. `checkout-contexto.js` debe cargarse después del
helper y antes de `script.js`; también se incluye en la ficha dinámica y el generador
SEO. `SUCURSAL` envía destino `null` explícito; `OMNICANAL` exige un destino del
catálogo público. No abrir tablas internas ni fijar una sucursal por su nombre.

Ejecutar las tres suites `scripts/probar-checkout-contexto.mjs`,
`scripts/probar-checkout-omnicanal.mjs` y `scripts/probar-checkout-integracion.mjs`
antes de generar/publicar. El workflow ya las incluye. H04 no aplica SQL.


## Disponibilidad contextual en servidor (H05)

La migración `20261024025818` ya está aplicada en Supabase. Las fuentes llaman la
RPC contextual tanto en SUCURSAL como en OMNICANAL; la llamada antigua permanece
compatible. Consulta [supabase/CONTRATO_CHECKOUT.md](supabase/CONTRATO_CHECKOUT.md).

Antes de generar: `npm ci --ignore-scripts`, `npm run test:sql` y las regresiones
JavaScript existentes. PGlite es una dependencia de desarrollo y no se publica en
el sitio. No reaplicar la migración ni los snapshots de dependencias: comprobar
siempre el historial/esquema vivo y generar un delta posterior para cambios nuevos.

## Imágenes de favoritos y categorías seguras (H06)

Favoritos prioriza `url_publica`; solo resuelve Storage si existen bucket y ruta.
Sin fuente completa conserva el marcador de imagen ausente. Los nombres de
categoría se insertan como texto. Los helpers que producen HTML también escapan
ambas comillas para conservar correctamente los atributos al recargar el menú.

Antes de generar/publicar, ejecutar `node scripts/probar-renderizado-seguro.mjs`.
El workflow ya incluye las 16 pruebas, sin red ni datos reales. Publicar juntos
los HTML y JS con versión `render-h06-1`; las fichas SEO se regeneran desde
su plantilla. Esta corrección no requiere SQL ni cambios de permisos.

## Historial y recompra por dueño (H07)

[PEDIDOS-CUENTA.md](PEDIDOS-CUENTA.md) documenta la lectura autorizada, los errores
por pedido y la revalidación de la recompra. No reinstalar SQL ni ampliar permisos:
se utiliza `erp_detalle_productos_pedido` existente. Las suites
`scripts/probar-pedidos-cuenta.mjs` y `scripts/probar-historial-sql.mjs` ya forman
parte del workflow. Regenerar y publicar juntos HTML y los recursos
`historial-h07-1`; no reutilizar precios históricos para una compra nueva.

## Snapshots comerciales y contacto de entrega (H08)

La migración `20261024114111` ya está aplicada en Supabase. No reaplicarla ni
rellenar snapshots de pedidos antiguos desde productos/perfiles actuales.
[supabase/CONTRATO_SNAPSHOTS.md](supabase/CONTRATO_SNAPSHOTS.md) documenta
la captura, las ausencias históricas y la continuidad al emitir comprobantes.
Ejecutar `node scripts/probar-snapshots-sql.mjs` y
`node scripts/probar-snapshots-ui.mjs` antes de generar/publicar. La suite UI
comprueba ERP si existe su carpeta hermana; CI del ecommerce indica esos casos
como omitidos cuando ERP no está presente. Publicar HTML/JS `snapshots-h08-1`
y actualizar también los dos módulos de pedidos/comprobantes del ERP.

## Puente de catálogo H09 — automático, activo y probado

La Edge activa (revisión remota 5 observada) cubre nueve tablas y correlación
`evento_id`. El código H09 revisado se conserva. El workflow crea evidencia del
artefacto y verifica por HTTPS los archivos críticos después de FTPS. Si hosting
está omitido, registra verified=false; un HTTP202 no demuestra publicación.
La migración `20261025043945` ya está aplicada y registra nueve triggers; el
archivo inicial de CLI `20261024165634` se renombró sin cambiar sus bytes.
El repositorio `SanMartinGT/sanmartin.gt.com` contiene la fuente y el workflow.
Los secretos están configurados y `HOSTINGER_DEPLOY_ENABLED=true`. Se publica
por FTPS con certificado verificado en `srv486.hstgr.io:21`, mediante una cuenta
dedicada al sitio y `/public_html/`; `SITE_URL=https://sanmartingmca.com/`.
La solicitud pg_net 2113 respondió HTTP202 y disparó automáticamente
la [ejecución 40162772575](https://github.com/SanMartinGT/sanmartin.gt.com/actions/runs/40162772575).
El evento `0823d672-b9ed-4cf3-99d6-17fe4b338b5d` llegó al artefacto y al sitio;
HTTPS confirmó `verified:true`, 26 archivos críticos y tres fichas el
`2026-10-25T04:41:32.931Z` (24-10-2026, 22:41 en Guatemala).
La prueba fue un UPDATE técnico con valores iguales en configuración y COMMIT:
los campos conservaron sus valores y se dejó la auditoría normal. No fue una
edición comercial desde la interfaz del ERP. Seguir
[ACTIVAR-WEBHOOK.md](scripts/ACTIVAR-WEBHOOK.md); no
crear además webhooks estándar ni ejecutar la propuesta antigua de7tablas.
Las3exclusiones SEO ya se retiraron: el buildreal tiene3fichas/2categorías/20URLs.
El token de GitHub vence el **22 de enero de 2027**; renovarlo y actualizar
`GITHUB_DISPATCH_TOKEN` en Edge Secrets antes de esa fecha. La recuperación
horaria también pasó FTPS y verificación HTTPS en la [ejecución programada
40162843342](https://github.com/SanMartinGT/sanmartin.gt.com/actions/runs/40162843342).
Esa publicación posterior no tiene `evento_id`; el recibo del evento técnico
permanece en la ejecución 40162772575. La ejecución manual sigue disponible.

### Primera publicación manual verificada — 24-10-2026

Se preparó el alojamiento PHP/HTML del plan existente y se extrajo el paquete
público en public_html. Las3fichas están publicadas y los26archivos críticos
coinciden por SHA256 con publicacion.json. El ZIP de transporte se conservó
con prefijo .hostinger-deploy- y responde403; no hay SQL/docs privados en el sitio.
Esta primera publicación fue manual por el administrador de archivos. Después
se completó y verificó la publicación automática del evento técnico descrito
arriba, con su mismo identificador desde la base hasta el sitio por HTTPS.

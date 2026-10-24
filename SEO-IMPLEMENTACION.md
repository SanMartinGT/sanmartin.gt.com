# Generación SEO y publicación en Hostinger

El dominio configurado es `https://sanmartingmca.com/`. GitHub Actions genera el catálogo y guarda el sitio como artefacto; la publicación en Hostinger es opcional y está deshabilitada por defecto. La puesta en marcha está documentada en [INSTRUCCIONES.md](INSTRUCCIONES.md) y el puente de eventos en [scripts/ACTIVAR-WEBHOOK.md](scripts/ACTIVAR-WEBHOOK.md).

## Protección de SQL históricos (H01, 23-10-2026)

Los 25 instaladores SQL antiguos se conservan sin cambios en `supabase/historico/`, con extensión `.sql.historico` y manifiesto SHA-256. No se ejecutan ni se incluyen en el sitio. [MIGRACIONES.md](supabase/MIGRACIONES.md) describe el procedimiento para futuros deltas contra el esquema vivo y aclara los límites de la instantánea de diagnóstico.

Antes de construir, el workflow ejecuta `verificar-sql-vigente.mjs` y las pruebas offline de integridad/publicación. El verificador SEO rechaza tanto `.sql` como `.sql.historico`/`.sql.bak`, además de las rutas privadas. El publicador directo también rechaza SQL y las carpetas `supabase/` y `scripts/` antes de conectar. Ninguno de estos controles aplica migraciones ni activa webhooks.

## Proceso de construcción

1. `scripts/configuracion-sitio.mjs` lee `entorno.json` y el override opcional `SITE_URL`. Exige un dominio HTTPS en raíz. Preparación, generación y validación comparten esta dirección.
2. `scripts/preparar-sitio.mjs` limpia únicamente `_site/`, copia los archivos públicos y crea `.htaccess`. No copia SQL, documentación, scripts de CI, Edge Functions ni archivos de entorno. Las rutas privadas quedan `noindex, follow`.
3. `scripts/generar-seo-productos.mjs` consulta las vistas y recursos públicos de Supabase, intersecta los productos visibles con sus detalles y aplica `excludeProductIds`. Genera fichas completas en `producto/<slug>/index.html`, categorías con productos y `catalogo-seo/`.
4. La ficha incorpora nombre, descripciones, imágenes, precio con oferta vigente, disponibilidad, especificaciones, canonical, OG/Twitter, datos estructurados Product y BreadcrumbList. `titulo_seo` y `descripcion_seo` tienen prioridad en los metadatos.
5. El generador reconstruye `seo-productos.json`, `sitemap.xml` y `robots.txt` con el dominio propio. Login, cuenta y ficha dinámica no entran en el sitemap. Categorías sin productos tampoco.
6. `scripts/verificar-seo.mjs` verifica canonicals, OG, índice de slugs, archivos de sitemap, precio, stock, breadcrumbs, recursos de las fichas y exclusión de archivos privados. Una verificación fallida impide subir a Hostinger.

La ficha dinámica sirve como alternativa mientras un producto nuevo todavía no tiene HTML generado. `product-links.js` cambia los enlaces a fichas estáticas únicamente cuando su slug aparece en el índice del último despliegue.

Las fichas estáticas conservan el carrito y la revalidación de precio/disponibilidad del comportamiento existente. Ese diseño todavía omite favoritos, zoom y recomendaciones presentes en la ficha dinámica; migrar el alojamiento no añade esas funciones.

## Publicación y cambios del catálogo

El workflow **Generar SEO y publicar en Hostinger (opcional)** conserva push a `main`, ejecución manual, cron horario y `repository_dispatch: catalogo_actualizado`. Todos generan, verifican y guardan `_site/` en el artefacto `sitio-hostinger` durante siete días. Sus permisos son `contents: read`; no necesita permisos de hosting de GitHub.

El paso FTP solo se ejecuta con `vars.HOSTINGER_DEPLOY_ENABLED == 'true'`. Si la variable está ausente o deshabilitada, no se solicitan ni usan credenciales FTP, no se transfieren archivos al alojamiento y el resumen de Actions indica **Hostinger omitido**. Habilitar el webhook no cambia esta condición. Para publicar más adelante hay que configurar los secretos FTP y habilitar explícitamente la variable. Este control pertenece al workflow; ejecutar directamente el publicador Python sí publica.

`scripts/publicar-hostinger.py` sube por FTP/FTPS. Usa un manifiesto de hashes en el servidor, transferencia a temporal y renombrado por archivo. Sube el sitemap después de los demás archivos y confirma el manifiesto solo al terminar. Retira únicamente HTML generado de productos/categorías que desaparezca del manifiesto y siga coincidiendo con su hash. Conserva archivos ajenos. No ofrece una actualización atómica de todo el sitio: durante una subida pueden coexistir archivos de dos versiones. Un fallo exige corregir la causa y volver a ejecutar el workflow.

La función `catalogo-actualizado` autentica un secreto privado, valida eventos de las tablas del catálogo y envía solo tipo/tabla/identificador a GitHub. No consulta ni escribe datos privados del ERP. Los secretos, despliegue y webhooks se configuran en las cuentas correspondientes; su activación permite generar artefactos aunque la publicación en Hostinger siga deshabilitada.

Cambiar slug, ocultar o retirar un producto reconstruye el índice y sitemap sin la URL anterior. Un sitemap no contiene combinaciones de parámetros del catálogo. No se crean redirecciones automáticas entre slugs; para conservar posicionamiento al renombrar un producto, agrega una redirección explícita conocida en el servidor.

## Estado verificado

El 13 de octubre de 2026, la lectura pública produjo 0 productos elegibles tras las tres exclusiones existentes y 15 URLs válidas. Las pruebas aisladas verificaron productos nuevos/modificados/retirados, slugs, metadatos, precios/ofertas, disponibilidad, sitemap, staging y errores de datos/configuración. La subida se prueba con un servidor simulado y el webhook con respuestas GitHub simuladas.

Estas pruebas aisladas no confirman DNS, certificado SSL, credenciales/protocolo FTP del alojamiento, login en el dominio nuevo, webhooks de base de datos ni una publicación remota. No se modificaron RLS, productos, inventario ni autenticación del servidor en esas pruebas. La activación y las ejecuciones remotas deben comprobarse en sus servicios por separado.

## Productos habilitados — 24 de octubre de 2026

Se retiraron las tres exclusiones manuales de `seo-config.json`: la lista
`excludeProductIds` queda vacía. El generador conserva sus filtros de catálogo
público y ahora crea fichas para los tres productos publicados actuales.
Se ejecutaron preparación, generación con Supabase real y verificación: **3 fichas,
2 categorías y 20 URLs de sitemap** para `https://sanmartingmca.com/`.
`_site/seo-productos.json` incluye los tres slugs, y sus fichas tienen canonical,
`index, follow`, Product y BreadcrumbList. El build anterior está respaldado.
Este cambio está generado localmente; no se publicó en Hostinger ni se comprobó
su indexación en buscadores. La comparación automática integral de cobertura
del catálogo mantiene su alcance B32 pendiente.

## Evidencia de publicación H09

El workflow agrega `crear-evidencia-publicacion.mjs` después de verificar SEO.
`publicacion.json` identifica evento/commit/ejecución y hashes de las fichas,
índices, sitemap, robots y JS/CSS. Tras FTPS se ejecuta la comprobación HTTPS:
no se acepta un manifiesto anterior ni una página aparcada con HTTP200.
Una ejecución con hosting deshabilitado conserva estado OMITIDA/verified=false.
La automatización remota permanece pendiente de configuración y aceptación;
[véase la guía actual](scripts/ACTIVAR-WEBHOOK.md).

### Publicación inicial comprobada — 24-10-2026

El sitio generado se publicó manualmente en Hostinger. La comprobación HTTPS
validó las3fichas y26archivos críticos contra el mismo publicacion.json local.
La automatización H09 sigue pendiente de repositorio y secretos: esta verificación
manual no se presenta como prueba de un evento ERP ni de una ejecución Actions.

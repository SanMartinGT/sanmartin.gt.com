# Generación SEO y publicación en Hostinger

El dominio configurado es `https://sanmartingmca.com/`. GitHub Actions genera el catálogo, guarda el artefacto y publica automáticamente en Hostinger con `HOSTINGER_DEPLOY_ENABLED=true`. Se comprobó el recorrido desde un evento de la base hasta los archivos servidos por HTTPS. La configuración está documentada en [INSTRUCCIONES.md](INSTRUCCIONES.md) y el puente de eventos en [scripts/ACTIVAR-WEBHOOK.md](scripts/ACTIVAR-WEBHOOK.md).

## Repositorio y automatización activa — 24-10-2026

El repositorio es [SanMartinGT/sanmartin.gt.com](https://github.com/SanMartinGT/sanmartin.gt.com), rama `main`, con 134 archivos de fuente revisados y sus marcadores de carpeta. Los secretos de GitHub/Supabase y Vault están configurados; la Edge `catalogo-actualizado` figura ACTIVE en la revisión remota 5 observada con el código H09 revisado y los nueve triggers de la migración `20261025043945` están instalados. El destino FTPS comprobado es `srv486.hstgr.io:21`, con cuenta dedicada al sitio, directorio `/public_html/` y certificado verificado. Los valores de credenciales permanecen fuera de la fuente.

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

El paso FTP sólo se ejecuta con `vars.HOSTINGER_DEPLOY_ENABLED == 'true'`, actualmente habilitado y probado. Si la variable se retira o se cambia a `false`, no se usan credenciales FTP ni se transfieren archivos y el resumen indica **Hostinger omitido**. Habilitar el webhook no sustituye esta condición. Este control pertenece al workflow; ejecutar directamente el publicador Python sí publica.

Antes de escribir por FTPS, `comprobar-destino-hostinger.py` exige que la prueba de publicación y el hash de `index.html` leídos de la cuenta FTP coincidan con el sitio vigente por HTTPS. El guard es de sólo lectura y bloquea un destino diferente; después de publicar se valida el artefacto nuevo por HTTPS.

En el workflow, `scripts/publicar-hostinger.py` sube por **FTPS con certificado verificado** después del guard de destino, que rechaza `HOSTINGER_FTP_PROTOCOL=ftp`. Los parámetros de compatibilidad del publicador no habilitan FTP sin cifrado en esta automatización. Usa un manifiesto de hashes en el servidor, transferencia a temporal y renombrado por archivo. Sube el sitemap después de los demás archivos y confirma el manifiesto solo al terminar. Retira únicamente HTML generado de productos/categorías que desaparezca del manifiesto y siga coincidiendo con su hash. Conserva archivos ajenos. No ofrece una actualización atómica de todo el sitio: durante una subida pueden coexistir archivos de dos versiones. Un fallo exige corregir la causa y volver a ejecutar el workflow.

La función activa `catalogo-actualizado` autentica un secreto privado, valida eventos de las nueve tablas del catálogo y envía sólo evento/tipo/tabla/identificador a GitHub. No consulta ni escribe datos privados del ERP. El token GitHub está limitado al repositorio y vence el **22 de enero de 2027**; renovarlo y actualizar `GITHUB_DISPATCH_TOKEN` en Edge Secrets antes de esa fecha.

Cambiar slug, ocultar o retirar un producto reconstruye el índice y sitemap sin la URL anterior. Un sitemap no contiene combinaciones de parámetros del catálogo. No se crean redirecciones automáticas entre slugs; para conservar posicionamiento al renombrar un producto, agrega una redirección explícita conocida en el servidor.

## Referencia de pruebas previas

El 13 de octubre de 2026, la lectura pública produjo 0 productos elegibles tras las tres exclusiones existentes y 15 URLs válidas. Las pruebas aisladas verificaron productos nuevos/modificados/retirados, slugs, metadatos, precios/ofertas, disponibilidad, sitemap, staging y errores de datos/configuración. La subida se prueba con un servidor simulado y el webhook con respuestas GitHub simuladas.

Esas pruebas aisladas no confirmaban DNS, TLS, FTP ni una publicación remota. No modificaron RLS, productos, inventario ni autenticación del servidor. La aceptación remota posterior de H09 se detalla abajo; no incluye probar login o compra de clientes.

## Productos habilitados — 24 de octubre de 2026

Se retiraron las tres exclusiones manuales de `seo-config.json`: la lista
`excludeProductIds` queda vacía. El generador conserva sus filtros de catálogo
público y ahora crea fichas para los tres productos publicados actuales.
Se ejecutaron preparación, generación con Supabase real y verificación: **3 fichas,
2 categorías y 20 URLs de sitemap** para `https://sanmartingmca.com/`.
`_site/seo-productos.json` incluye los tres slugs, y sus fichas tienen canonical,
`index, follow`, Product y BreadcrumbList. El build anterior está respaldado.
Las tres fichas están publicadas en Hostinger y verificadas por HTTPS; no se
comprobó su indexación en buscadores. La comparación automática integral de cobertura
del catálogo mantiene su alcance B32 pendiente.

## Evidencia de publicación H09

El workflow agrega `crear-evidencia-publicacion.mjs` después de verificar SEO.
`publicacion.json` identifica evento/commit/ejecución y hashes de las fichas,
índices, sitemap, robots y JS/CSS. Tras FTPS se ejecuta la comprobación HTTPS:
no se acepta un manifiesto anterior ni una página aparcada con HTTP200.
Una ejecución con hosting deshabilitado conserva estado OMITIDA/verified=false.
La automatización remota está activa y su aceptación correlacionada se completó;
[véase la guía actual](scripts/ACTIVAR-WEBHOOK.md).

### Publicación inicial comprobada — 24-10-2026

El sitio generado se publicó manualmente en Hostinger. La comprobación HTTPS
validó las3fichas y26archivos críticos contra el mismo publicacion.json local.
Esa verificación inicial fue manual. Después se completó la configuración de
H09 y la aceptación automática descrita a continuación.

### Evento de base hasta hosting comprobado — 24-10-2026

La solicitud pg_net **2113** recibió HTTP202 con
`evento_id=0823d672-b9ed-4cf3-99d6-17fe4b338b5d` y disparó la
[ejecución automática 40162772575](https://github.com/SanMartinGT/sanmartin.gt.com/actions/runs/40162772575).
El artefacto y el sitio servido conservaron ese evento. La comprobación por
HTTPS terminó con `verified:true`, **26 archivos críticos y tres fichas**, el
`2026-10-25T04:41:32.931Z` (24-10-2026, 22:41 en Guatemala).

La prueba hizo un UPDATE técnico con los mismos valores en
`configuracion_ecommerce` y COMMIT; los campos quedaron iguales y se conservó
la auditoría normal de la operación. No fue una edición comercial desde la UI
del ERP ni modificó productos, precios o inventario. Las nueve tablas y los tres
tipos de evento se verificaron con fixtures, además de este caso remoto.
La recuperación horaria también se probó: la [ejecución programada
40162843342](https://github.com/SanMartinGT/sanmartin.gt.com/actions/runs/40162843342)
terminó con FTPS y verificación HTTPS exitosos. Esa publicación posterior no
tiene `evento_id`; el recibo histórico del evento técnico permanece en la
ejecución 40162772575. La ejecución manual sigue disponible como recuperación.

# SEO SAN MARTÍN — implementación del 7 de octubre de 2026

La fuente local se actualizó. Este archivo no confirma un despliegue en GitHub.
URL actual: https://sanmartingt.github.io/sanmartin.gt.com/
El cambio conserva esa subruta. No mueve el sitio a la raíz sanmartingt.github.io.

## Publicar los cambios
1. Abre el repositorio sanmartingt/sanmartin.gt.com en GitHub.
2. Reemplaza los archivos incluidos en este paquete en la raíz del repositorio.
   Incluye .github/workflows/publicar.yml y todos los archivos de scripts/.
   No subas una carpeta contenedora, _site/, work/ ni el ZIP.
3. Haz commit en main.
4. En Settings > Pages > Build and deployment, selecciona GitHub Actions.
5. En Actions abre Publicar sitio y actualizar SEO y verifica que termine en verde.
6. Abre /catalogo-seo/, /sitemap.xml y una ficha real /producto/slug/.
7. Comprueba en el código fuente el H1, canonical, Product/Offer y robots index.
8. Envía https://sanmartingt.github.io/sanmartin.gt.com/sitemap.xml a una propiedad
   Search Console de prefijo https://sanmartingt.github.io/sanmartin.gt.com/.

## Cómo funciona
Preparar entorno -> generar HTML desde Supabase -> verificar -> desplegar _site.
Se usan vistas públicas catalogo_productos y catalogo_producto_detalle.
Solo se generan productos presentes en ambas vistas y no excluidos por ID.
Los tres IDs actuales de prueba están excluidos en seo-config.json.
No borra ni modifica productos o inventario en Supabase.
Los nuevos productos necesitan nombre, slug único, precio positivo y estado de
inventario reconocido (DISPONIBLE, POCAS_UNIDADES o AGOTADO).
Se normalizan slugs a minúsculas. No se inventan GTIN, reviews ni variantes.
La categoría y marca se leen de Supabase; categorías vacías no se generan.
El contenido visible, las imágenes, Product/Offer y breadcrumbs están en HTML.
Las categorías y /catalogo-seo/ enlazan a todas las fichas generadas.
Las fichas estáticas mantienen cantidad, carrito y revalidación de precio/stock.
El checkout conserva su validación del servidor en Supabase.
Las fichas estáticas conservan la cabecera y el pie de producto.html; no cargan producto.js.
Favoritos, zoom y recomendaciones de la ficha dinámica no se incluyeron en la
plantilla estática. Requieren una integración posterior si deseas conservarlos.

## Actualización
El workflow se ejecuta en push a main, manualmente y aproximadamente cada hora
(minuto 17 UTC). GitHub puede retrasar o desactivar ejecuciones programadas bajo
sus condiciones; revisa Actions periódicamente. No es una actualización inmediata.
También admite repository_dispatch con tipo catalogo_actualizado. Su invocación
requiere configurar un webhook seguro de servidor; NO se ha conectado Supabase.
No incluyas un token de GitHub en el navegador para activar el workflow.
Los precios y stock del HTML son una instantánea del último despliegue. Antes de
agregar al carrito se revalidan. Para cambios urgentes ejecuta Run workflow.
Las URLs limpias se enlazan solo cuando figuran en seo-productos.json; antes se
usa producto.html?slug=... con noindex, para evitar enlaces a páginas inexistentes.
Los productos retirados desaparecen del siguiente despliegue (404, sin redirección).
Si cambias un slug, la URL antigua desaparece; conserva los slugs permanentes.

## Indexación
entorno.json tiene allowIndexing=true para producción. Staging siempre queda noindex.
Cuenta, login y ficha dinámica quedan noindex y fuera del sitemap.
No se garantiza que Google indexe todos los productos ni que otorgue rich results.
robots.txt dentro de /sanmartin.gt.com/ no controla el rastreo: el archivo efectivo
estaría en https://sanmartingt.github.io/robots.txt. El sitemap se envía directamente
por Search Console. No se ha modificado el repositorio que controla la raíz del host.
Las búsquedas/filtros siguen en catalogo.html y tienen canonical a la URL base;
no se incluyen combinaciones de parámetros en el sitemap.

## Seguridad y validaciones
Se usa la clave publicable que ya utiliza el frontend, nunca service_role.
No se han auditado RLS, pedidos, autenticación ni políticas privadas de Supabase.
Si falla la consulta, un precio, stock o slug, falla el build antes del despliegue.
No se publican scripts, configuración SEO ni work/.
Para probar localmente, desde la raíz:
  node scripts/preparar-pages.mjs
  node scripts/generar-seo-productos.mjs
  node scripts/verificar-seo.mjs

Pruebas realizadas: lectura del catálogo real (3 demos excluidas); generación en
copia de prueba con las 3 fichas reales; 5000 fichas simuladas y sitemap completo;
precio con descuento, agotado, escape de cierre script y canonical único.
Pendiente: revisión visual en navegador, resultados enriquecidos de Google, rendimiento,
prueba completa de carrito/checkout y verificación del despliegue público.

## Hosting
La implementación técnica no cambia la restricción comercial de GitHub Pages.
https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits


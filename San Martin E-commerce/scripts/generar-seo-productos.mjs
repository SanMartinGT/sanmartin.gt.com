import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const siteUrl = (process.env.SITE_URL || 'https://sanmartingt.github.io/sanmartin.gt.com').replace(/\/$/, '');
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const apiKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
if (!supabaseUrl || !apiKey) throw new Error('Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY.');

const headers = { apikey: apiKey, Authorization: `Bearer ${apiKey}` };
const get = async path => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers });
  if (!response.ok) throw new Error(`Supabase respondió ${response.status}: ${await response.text()}`);
  return response.json();
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const xml = value => esc(value);

const products = await get('catalogo_producto_detalle?select=id,nombre,nombre_corto,slug,descripcion_corta,precio_base&slug=not.is.null&order=nombre.asc');
const images = await get('producto_imagenes?select=producto_id,url_publica,storage_bucket,storage_path,es_principal,orden&activo=eq.true&order=es_principal.desc,orden.asc');
const imageByProduct = new Map();
for (const image of images) if (!imageByProduct.has(image.producto_id)) imageByProduct.set(image.producto_id, image.url_publica || `${supabaseUrl}/storage/v1/object/public/${image.storage_bucket}/${image.storage_path}`);

const page = product => {
  const url = `${siteUrl}/producto/${encodeURIComponent(product.slug)}/`;
  const name = product.nombre || product.nombre_corto;
  const description = product.descripcion_corta || `${name} disponible en San Martín.`;
  const image = imageByProduct.get(product.id) || '';
  return `<!doctype html><html lang="es"><head><base href="../../"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(name)} | San Martín</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(url)}"><meta property="og:type" content="product"><meta property="og:title" content="${esc(name)} | San Martín"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url)}">${image ? `<meta property="og:image" content="${esc(image)}">` : ''}<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="producto.css"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Product',name,description,image:image?[image]:undefined,offers:{'@type':'Offer',url,priceCurrency:'GTQ',price:Number(product.precio_base || 0).toFixed(2),availability:'https://schema.org/InStock',itemCondition:'https://schema.org/NewCondition'}})}</script></head><body><main class="container product-page"><div id="productDetail"><p class="catalog-empty">Cargando producto…</p></div></main><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="supabase.js"></script><script src="producto.js"></script></body></html>`;
};

for (const product of products) {
  const directory = join('producto', product.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), page(product));
}

const staticPaths = ['','catalogo.html','envios-entregas.html','cambios-devoluciones.html','contacto.html','terminos-condiciones.html','aviso-privacidad.html'];
const urls = [...staticPaths.map(path => `${siteUrl}/${path}`), ...products.map(product => `${siteUrl}/producto/${encodeURIComponent(product.slug)}/`)];
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${xml(url)}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile('robots.txt', `User-agent: *\nAllow: /\nDisallow: /mi-cuenta.html\nDisallow: /login.html\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
console.log(`SEO generado para ${products.length} productos.`);

import {readFile, readdir} from 'node:fs/promises';
import {join, resolve, relative} from 'node:path';
import {configuracionSitio} from './configuracion-sitio.mjs';

const {site, indexable} = await configuracionSitio();
const root = resolve('_site');
const summary = JSON.parse(await readFile('work/seo-resumen.json', 'utf8'));
const slugs = JSON.parse(await readFile(join(root, 'seo-productos.json'), 'utf8'));
const privatePages = new Set(['login.html', 'mi-cuenta.html', 'producto.html']);
const publicUrls = new Set();
let count = 0;
function ownUrl(value) {
  const url = new URL(value);
  if (url.origin !== site || url.search || url.hash) throw Error('URL fuera del sitio: ' + value);
  return url;
}
async function walk(dir) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { await walk(path); continue; }
    const rel = relative(root, path).replace(/\\/g, '/');
    if (/\.sql(?:$|\.)|\.md$|\.env|^scripts\/|^supabase\//i.test(rel)) throw Error('Archivo privado en salida: ' + rel);
    if (!entry.name.endsWith('.html')) continue;
    const html = await readFile(path, 'utf8');
    if (/github\.io/i.test(html)) throw Error('Dominio anterior en HTML: ' + rel);
    const robots = [...html.matchAll(/<meta\b[^>]*name="robots"[^>]*content="([^"]+)"/gi)];
    if (robots.length !== 1) throw Error('Robots ausente o duplicado: ' + rel);
    const noindex = !indexable || privatePages.has(rel);
    if (robots[0][1] !== (noindex ? 'noindex, follow' : 'index, follow')) throw Error('Indexación incorrecta: ' + rel);
    if (privatePages.has(rel)) continue;
    const canonical = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/gi)];
    const expected = site + '/' + (rel === 'index.html' ? '' : rel.endsWith('/index.html') ? rel.slice(0, -10) : rel);
    if (canonical.length !== 1 || ownUrl(canonical[0][1]).href !== expected) throw Error('Canonical incorrecto: ' + rel);
    if (!html.includes(`property="og:url" content="${expected}"`)) throw Error('OG incorrecto: ' + rel);
    publicUrls.add(expected);
    if (!rel.startsWith('producto/')) continue;
    count++;
    if (!/<h1\b/.test(html) || /Cargando producto/.test(html)) throw Error('Ficha sin contenido: ' + rel);
    const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]));
    const product = scripts.find(s => s['@type'] === 'Product');
    if (!product?.offers || product.offers.url !== expected || !['https://schema.org/InStock', 'https://schema.org/OutOfStock'].includes(product.offers.availability) || !Number.isFinite(Number(product.offers.price)) || Number(product.offers.price) < 0) throw Error('Product inválido: ' + rel);
    const breadcrumb = scripts.find(s => s['@type'] === 'BreadcrumbList');
    if (!breadcrumb?.itemListElement?.length) throw Error('Breadcrumb faltante: ' + rel);
    for (const crumb of breadcrumb.itemListElement) ownUrl(crumb.item);
    const slug = rel.split('/')[1];
    if (!slugs.includes(slug) || !html.includes(`<base href="${site}/">`)) throw Error('Índice o base incorrecto: ' + rel);
    for (const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/gi)) {
      const url = new URL(match[1], site + '/');
      if (url.origin !== site || url.pathname.startsWith('/producto/')) continue;
      await readFile(join(root, decodeURIComponent(url.pathname.slice(1))));
    }
  }
}
await walk(root);
if (count !== summary.productos || slugs.length !== count || new Set(slugs).size !== count) throw Error('Número de fichas incorrecto.');
const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
if (new Set(sitemapUrls).size !== sitemapUrls.length || sitemapUrls.length !== (indexable ? publicUrls.size : 0)) throw Error('Sitemap incompleto o duplicado.');
for (const value of sitemapUrls) {
  const url = ownUrl(value);
  if (!publicUrls.has(value)) throw Error('Sitemap apunta a una página privada o inexistente.');
  const rel = decodeURIComponent(url.pathname.slice(1));
  await readFile(join(root, rel.endsWith('/') ? rel + 'index.html' : rel || 'index.html'));
}
const robots = await readFile(join(root, 'robots.txt'), 'utf8');
if (indexable ? !robots.includes(`Sitemap: ${site}/sitemap.xml`) : robots.includes('Sitemap:')) throw Error('robots.txt inconsistente.');
await readFile(join(root, '.htaccess'));
console.log(`Verificación correcta: ${count} fichas, ${sitemapUrls.length} URLs de sitemap y dominio ${site}.`);

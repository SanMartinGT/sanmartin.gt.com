import {cp, mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const config = JSON.parse(await readFile('entorno.json', 'utf8'));
const base = config.siteUrl.replace(/\/$/, '');
const indexable = config.environment === 'production' && config.allowIndexing === true;
await mkdir('_site', {recursive: true});
for (const entry of await readdir('.', {withFileTypes: true})) {
  if (entry.name.startsWith('.') || ['_site','scripts','entorno.json','INSTRUCCIONES.md'].includes(entry.name) || entry.name.endsWith('.sql')) continue;
  await cp(entry.name, join('_site',entry.name), {recursive: true});
}
let count = 0;
async function visit(dir) {
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    const path = join(dir,entry.name);
    if (entry.isDirectory()) {await visit(path); continue;}
    if (!entry.name.endsWith('.html')) continue;
    let html = await readFile(path,'utf8');
    html = html.replace(/https:\/\/sanmartingt\.github\.io\/sanmartin\.gt\.com/g, base);
    html = html.replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>/gi,'');
    const privatePage = ['login.html','mi-cuenta.html'].includes(entry.name);
    const robots = !indexable || privatePage ? 'noindex, follow' : 'index, follow';
    html = html.replace(/<head\b[^>]*>/i, match => `${match}\n<meta name="robots" content="${robots}">`);
    await writeFile(path,html); count++;
  }
}
await visit('_site');
// robots.txt solo tiene efecto en la raiz del host, no en estas subrutas.
await writeFile('_site/robots.txt', `User-agent: *\nAllow: /\n${indexable ? `\nSitemap: ${base}/sitemap.xml\n` : ''}`);
let sitemap = await readFile('_site/sitemap.xml','utf8');
sitemap = sitemap.replace(/https:\/\/sanmartingt\.github\.io\/sanmartin\.gt\.com/g,base);
if (!indexable) sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n';
await writeFile('_site/sitemap.xml',sitemap);
await writeFile('_site/.nojekyll','');
console.log(`${config.environment}: ${count} paginas; indexacion ${indexable ? 'activada' : 'desactivada'}; ${base}/`);

import {cp, mkdir, readdir, readFile, writeFile, rm} from 'node:fs/promises';
import {join, resolve, dirname, basename} from 'node:path';
import {configuracionSitio} from './configuracion-sitio.mjs';

const config = await configuracionSitio();
const root = resolve('_site');
if (dirname(root) !== resolve('.') || basename(root) !== '_site') throw new Error('Directorio de salida inválido.');
await rm(root, {recursive: true, force: true});
await mkdir(root, {recursive: true});
// Lista de archivos públicos: los scripts de CI, SQL y secretos del servidor quedan fuera.
for (const entry of await readdir('.', {withFileTypes: true})) {
  if ((entry.isFile() && /\.(html|css|js)$/.test(entry.name)) || (entry.isDirectory() && entry.name === 'assets')) {
    await cp(entry.name, join(root, entry.name), {recursive: true});
  }
}
let count = 0;
const privatePages = new Set(['login.html', 'mi-cuenta.html', 'producto.html']);
for (const entry of await readdir(root, {withFileTypes: true})) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const path = join(root, entry.name);
  let html = await readFile(path, 'utf8');
  html = html.replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>/gi, '');
  const robots = !config.indexable || privatePages.has(entry.name) ? 'noindex, follow' : 'index, follow';
  html = html.replace(/<head\b[^>]*>/i, match => `${match}\n<meta name="robots" content="${robots}">`);
  await writeFile(path, html);
  count++;
}
// Hostinger sirve index.html en directorios y admite configuración Apache/LiteSpeed.
const hostPattern = config.siteUrl ? new URL(config.siteUrl).hostname.replace(/\./g, '\\.') : '';
await writeFile(join(root, '.htaccess'), `DirectoryIndex index.html\nOptions -Indexes\n\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteCond %{HTTPS} !=on [OR]\nRewriteCond %{HTTP_HOST} !^${hostPattern}$ [NC]\nRewriteRule ^ https://${new URL(config.siteUrl).hostname}%{REQUEST_URI} [R=301,L,NE]\n</IfModule>\n\n<IfModule mod_headers.c>\n<FilesMatch "\\.(html|json|xml|txt)$">\nHeader set Cache-Control "no-cache, must-revalidate"\n</FilesMatch>\n</IfModule>\n<FilesMatch "^\\.hostinger-deploy-">\nRequire all denied\n</FilesMatch>\n`);
await mkdir('work', {recursive: true});
await writeFile('work/sitio-preparado.json', JSON.stringify(config));
console.log(`${config.environment}: ${count} páginas; indexación ${config.indexable ? 'activada' : 'desactivada'}; ${config.siteUrl}`);

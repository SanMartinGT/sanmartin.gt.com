import {readFile} from 'node:fs/promises';

export async function configuracionSitio() {
  const config = JSON.parse(await readFile('entorno.json', 'utf8'));
  const url = new URL(process.env.SITE_URL || config.siteUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || !/^[a-z0-9.-]+$/.test(url.hostname) || url.port) {
    throw new Error('SITE_URL debe ser la raíz de un dominio HTTPS, sin parámetros ni credenciales.');
  }
  if (url.hostname.endsWith('.github.io')) throw new Error('Configura el dominio propio para publicar.');
  return {
    ...config,
    siteUrl: url.origin + '/',
    site: url.origin,
    indexable: config.environment === 'production' && config.allowIndexing === true,
  };
}

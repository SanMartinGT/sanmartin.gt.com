import {createHash, randomUUID} from 'node:crypto';
import {readFile, writeFile, readdir, lstat, realpath,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {configuracionSitio} from './configuracion-sitio.mjs';

const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HASH=/^[a-f0-9]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BASE_PATHS=['index.html','catalogo-seo/index.html','sitemap.xml','robots.txt','seo-productos.json'];
export const MAX_PROOF_BYTES=512*1024;
export const MAX_CRITICAL_FILE_BYTES=8*1024*1024;
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

export function publicationSite(value){
  let site;try{site=new URL(value);}catch{throw Error('Dominio de publicación inválido.');}
  if(site.protocol!=='https:'||site.username||site.password||site.port||site.search||site.hash||site.pathname!=='/'||!/^[a-z0-9.-]+$/.test(site.hostname))throw Error('La publicación requiere la raíz de un dominio HTTPS sin credenciales.');
  return site.origin;
}
export function criticalPublicationPath(value){
  return typeof value==='string'&&(BASE_PATHS.includes(value)||/^producto\/[a-z0-9]+(?:-[a-z0-9]+)*\/index\.html$/.test(value)||/^[A-Za-z0-9][A-Za-z0-9_.-]*\.(?:js|css)$/.test(value));
}
function slugs(value){
  if(!Array.isArray(value)||value.length>100000||value.some(s=>typeof s!=='string'||!SLUG.test(s))||new Set(value).size!==value.length)throw Error('Índice de productos inválido para la evidencia.');
  return [...value].sort();
}
export function validatePublicationProof(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['format_version','deployment_id','created_at','site','products','product_slugs','files','github','event_id'].includes(k))||value.format_version!==1||typeof value.deployment_id!=='string'||!/^sm-[a-z0-9-]{1,150}$/.test(value.deployment_id)||typeof value.created_at!=='string'||!Number.isFinite(Date.parse(value.created_at))||new Date(value.created_at).toISOString()!==value.created_at)throw Error('Evidencia de publicación inválida.');
  if(publicationSite(value.site)!==value.site)throw Error('El dominio de la evidencia debe ser canónico.');
  const products=slugs(value.product_slugs);
  if(!Number.isSafeInteger(value.products)||value.products!==products.length||!Array.isArray(value.files)||!value.files.length||value.files.length>100512)throw Error('Cobertura de evidencia inválida.');
  const paths=new Set();
  for(const file of value.files){
    if(!file||Object.keys(file).some(k=>!['path','sha256','bytes'].includes(k))||!criticalPublicationPath(file.path)||paths.has(file.path)||typeof file.sha256!=='string'||!HASH.test(file.sha256)||!Number.isSafeInteger(file.bytes)||file.bytes<0||file.bytes>MAX_CRITICAL_FILE_BYTES)throw Error('Archivo crítico inválido o duplicado en la evidencia.');
    paths.add(file.path);
  }
  if([...BASE_PATHS,...products.map(s=>`producto/${s}/index.html`)].some(p=>!paths.has(p)))throw Error('La evidencia no cubre todas las fichas y archivos SEO.');
  if(value.event_id!==undefined&&(typeof value.event_id!=='string'||!UUID.test(value.event_id)))throw Error('Identificador de evento inválido.');
  if(value.github!==undefined){
    const g=value.github;
    if(!g||typeof g!=='object'||Array.isArray(g)||Object.keys(g).some(k=>!['repository','run_id','run_attempt','commit_sha','run_url'].includes(k))||!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(g.repository)||!/^[1-9][0-9]{0,19}$/.test(g.run_id)||!/^[a-f0-9]{40}$/i.test(g.commit_sha)||!/^[1-9][0-9]{0,5}$/.test(g.run_attempt)||g.run_url!==`https://github.com/${g.repository}/actions/runs/${g.run_id}`)throw Error('Referencia de ejecución inválida.');
  }
  return value;
}
async function publicBytes(root,relative){
  const target=path.resolve(root,relative),resolved=await realpath(target);
  const rel=path.relative(root,resolved);
  if(rel.startsWith('..'+path.sep)||rel==='..'||path.isAbsolute(rel))throw Error('Archivo crítico fuera del sitio preparado.');
  const stat=await lstat(target);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink>1||stat.size>MAX_CRITICAL_FILE_BYTES)throw Error('Archivo crítico inseguro o demasiado grande.');
  const bytes=await readFile(target);if(bytes.length>MAX_CRITICAL_FILE_BYTES)throw Error('Archivo crítico demasiado grande.');return bytes;
}
function githubReference(env){
  const repository=env.GITHUB_REPOSITORY,run=env.GITHUB_RUN_ID,commit=env.GITHUB_SHA,attempt=env.GITHUB_RUN_ATTEMPT||'1';
  if(typeof repository!=='string'||!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repository)||typeof run!=='string'||!/^[1-9][0-9]{0,19}$/.test(run)||typeof commit!=='string'||!/^[a-f0-9]{40}$/i.test(commit)||!/^[1-9][0-9]{0,5}$/.test(attempt))return undefined;
  return{repository,run_id:run,run_attempt:attempt,commit_sha:commit.toLowerCase(),run_url:`https://github.com/${repository}/actions/runs/${run}`};
}
export async function createPublicationProof({siteDir=path.resolve('_site'),site,env=process.env,now=()=>new Date(),nonce=randomUUID}={}){
  const original=path.resolve(siteDir),stat=await lstat(original);
  if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Sitio preparado inválido.');
  const root=await realpath(original),domain=publicationSite(site);
  const products=slugs(JSON.parse((await publicBytes(root,'seo-productos.json')).toString('utf8')));
  const paths=new Set([...BASE_PATHS,...products.map(s=>`producto/${s}/index.html`)]);
  for(const entry of await readdir(root,{withFileTypes:true}))if(/^[A-Za-z0-9][A-Za-z0-9_.-]*\.(?:js|css)$/.test(entry.name))paths.add(entry.name);
  const files=[];
  for(const relative of [...paths].sort()){const bytes=await publicBytes(root,relative);files.push({path:relative,sha256:sha256(bytes),bytes:bytes.length});}
  const github=githubReference(env),fresh=nonce();if(typeof fresh!=='string'||!UUID.test(fresh))throw Error('Identidad de publicación inválida.');
  const event=typeof env.EVENTO_CATALOGO_ID==='string'&&UUID.test(env.EVENTO_CATALOGO_ID)?env.EVENTO_CATALOGO_ID.toLowerCase():undefined;
  const manifest=validatePublicationProof({format_version:1,deployment_id:`sm-${github?`${github.run_id}-${github.commit_sha.slice(0,12)}-`:''}${fresh.toLowerCase()}`,created_at:now().toISOString(),site:domain,products:products.length,product_slugs:products,files,...(github?{github}:{}),...(event?{event_id:event}:{})});
  const content=JSON.stringify(manifest,null,2)+'\n';if(Buffer.byteLength(content)>MAX_PROOF_BYTES)throw Error('Evidencia demasiado grande.');
  const destination=path.join(root,'publicacion.json');
  try{const existing=await lstat(destination);if(!existing.isFile()||existing.isSymbolicLink()||existing.nlink>1)throw Error('Destino de evidencia inseguro.');}catch(error){if(error.code!=='ENOENT')throw error;}
  const temporary=path.join(root,`.publicacion-${randomUUID()}.tmp`);
  try{await writeFile(temporary,content,{encoding:'utf8',flag:'wx'});await rename(temporary,destination);}finally{await rm(temporary,{force:true});}
  return manifest;
}

const self=fileURLToPath(import.meta.url);
if(process.argv[1]&&path.resolve(process.argv[1])===self){
  try{
    const {values}=parseArgs({options:{'site-dir':{type:'string',default:'_site'}}});
    const {site}=await configuracionSitio();const manifest=await createPublicationProof({siteDir:values['site-dir'],site});
    console.log(`Evidencia creada: ${manifest.products} productos, ${manifest.files.length} archivos críticos; pendiente verificar el alojamiento.`);
  }catch{console.error('ERROR: No se pudo crear la evidencia pública. Revisa dominio, índice y archivos del sitio preparado.');process.exitCode=1;}
}

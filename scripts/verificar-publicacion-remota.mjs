import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {configuracionSitio} from './configuracion-sitio.mjs';
import {validatePublicationProof,publicationSite,sha256,MAX_PROOF_BYTES,MAX_CRITICAL_FILE_BYTES} from './crear-evidencia-publicacion.mjs';

function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
  return value;
}
async function limitedBytes(response,max){
  const declared=response.headers?.get('content-length');if(declared!==null&&declared!==undefined&&Number(declared)>max){await response.body?.cancel();throw Error('Respuesta pública demasiado grande.');}
  if(!response.body)return Buffer.alloc(0);
  const reader=response.body.getReader(),parts=[];let size=0;
  try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>max){await reader.cancel();throw Error('Respuesta pública demasiado grande.');}parts.push(Buffer.from(next.value));}}finally{reader.releaseLock();}
  return Buffer.concat(parts);
}
async function download(url,{fetchImpl,attempts,timeoutMs,pause,max}){
  for(let attempt=0;attempt<attempts;attempt++){
    let response;
    try{response=await fetchImpl(url,{method:'GET',redirect:'error',cache:'no-store',headers:{'Cache-Control':'no-cache',Accept:'*/*'},signal:AbortSignal.timeout(timeoutMs)});}
    catch{if(attempt+1<attempts){await pause(250*(attempt+1));continue;}throw Error('No se pudo leer el alojamiento configurado.');}
    if(response.redirected)throw Error('El alojamiento redirige la evidencia; no se verificó la publicación.');
    if(response.url){const actual=new URL(response.url);if(actual.origin!==url.origin||actual.pathname!==url.pathname)throw Error('Respuesta fuera de la ruta de publicación.');}
    if(response.status!==200){
      await response.body?.cancel();
      if((response.status===429||response.status>=500)&&attempt+1<attempts){await pause(250*(attempt+1));continue;}
      throw Error('El alojamiento no sirve todos los archivos esperados.');
    }
    try{return await limitedBytes(response,max);}catch{throw Error('No se pudo leer un archivo público completo dentro del límite.');}
  }
  throw Error('No se pudo comprobar el alojamiento.');
}
export async function verifyRemotePublication({manifest,site=manifest?.site,enabled=true,fetchImpl=globalThis.fetch,now=()=>new Date(),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),attempts=3,timeoutMs=10000,concurrency=4}={}){
  if(enabled===false)return{format_version:1,status:'OMITIDA',verified:false,checked_at:now().toISOString(),reason:'La publicación está deshabilitada; no se comprobó el alojamiento.'};
  validatePublicationProof(manifest);const origin=publicationSite(site);
  if(origin!==manifest.site)throw Error('El dominio configurado no coincide con la evidencia local.');
  if(!Number.isInteger(attempts)||attempts<1||attempts>3||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000||!Number.isInteger(concurrency)||concurrency<1||concurrency>8)throw Error('Límites de verificación inválidos.');
  const endpoint=relative=>{const url=new URL(relative,origin+'/');if(url.origin!==origin)throw Error('Ruta pública fuera del dominio.');url.searchParams.set('publicacion',manifest.deployment_id);return url;};
  const options={fetchImpl,attempts,timeoutMs,pause};
  const bytes=await download(endpoint('publicacion.json'),{...options,max:MAX_PROOF_BYTES});
  let remote;try{remote=validatePublicationProof(JSON.parse(bytes.toString('utf8')));}catch{throw Error('La evidencia remota no es válida.');}
  if(JSON.stringify(canonical(remote))!==JSON.stringify(canonical(manifest)))throw Error('El alojamiento tiene una publicación distinta o anterior.');
  let cursor=0,failed=false;const verified=[];
  const worker=async()=>{while(!failed&&cursor<manifest.files.length){const file=manifest.files[cursor++];try{const body=await download(endpoint(file.path),{...options,max:Math.min(MAX_CRITICAL_FILE_BYTES,file.bytes+1)});if(body.length!==file.bytes||sha256(body)!==file.sha256)throw Error('Un archivo del alojamiento no coincide con el artefacto generado.');verified.push(file.path);}catch(error){failed=true;throw error;}}};
  const outcomes=await Promise.allSettled(Array.from({length:Math.min(concurrency,manifest.files.length)},worker));const problem=outcomes.find(item=>item.status==='rejected');if(problem)throw problem.reason;
  if(verified.length!==manifest.files.length)throw Error('No se comprobaron todos los archivos críticos.');
  return{format_version:1,status:'PUBLICACION_VERIFICADA',verified:true,checked_at:now().toISOString(),site:origin,deployment_id:manifest.deployment_id,products:manifest.products,product_slugs:manifest.product_slugs,files_verified:verified.length,critical_paths:verified.sort(),...(manifest.github?{github:manifest.github}:{}),...(manifest.event_id?{event_id:manifest.event_id}:{})};
}

const self=fileURLToPath(import.meta.url);
if(process.argv[1]&&path.resolve(process.argv[1])===self){
  let report;
  try{
    const {values}=parseArgs({options:{'site-dir':{type:'string',default:'_site'},report:{type:'string',default:'work/publicacion-verificada.json'},skip:{type:'boolean',default:false}}});
    if(values.skip){report=await verifyRemotePublication({enabled:false});}
    else{const {site}=await configuracionSitio();const manifest=JSON.parse(await readFile(path.join(values['site-dir'],'publicacion.json'),'utf8'));report=await verifyRemotePublication({manifest,site});}
    await mkdir(path.dirname(path.resolve(values.report)),{recursive:true});await writeFile(values.report,JSON.stringify(report,null,2)+'\n','utf8');
    console.log(report.verified?`Publicación verificada en HTTPS: ${report.products} productos, ${report.files_verified} archivos críticos coinciden con este artefacto.`:'Publicación remota omitida; no se comprobó el alojamiento.');
  }catch{
    // No dejar un informe anterior con estado verde tras un fallo actual.
    try{const {values}=parseArgs({options:{'site-dir':{type:'string',default:'_site'},report:{type:'string',default:'work/publicacion-verificada.json'},skip:{type:'boolean',default:false}}});await mkdir(path.dirname(path.resolve(values.report)),{recursive:true});await writeFile(values.report,JSON.stringify({format_version:1,status:'FALLO',verified:false,checked_at:new Date().toISOString(),reason:'No se confirmó que el alojamiento sirva este artefacto.'},null,2)+'\n','utf8');}catch{}
    console.error('ERROR: No se confirmó la publicación remota de este artefacto. Revisa HTTPS, caché, transferencia y dominio.');process.exitCode=1;
  }
}

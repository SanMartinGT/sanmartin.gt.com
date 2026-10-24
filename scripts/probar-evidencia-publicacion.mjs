import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,readFile,writeFile,rm,link} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createPublicationProof,validatePublicationProof,publicationSite,MAX_PROOF_BYTES} from './crear-evidencia-publicacion.mjs';
import {verifyRemotePublication} from './verificar-publicacion-remota.mjs';

const SITE='https://tienda.example';
const NOW=()=>new Date('2026-10-24T12:00:00.000Z');
const NONCE=()=> '11111111-1111-4111-8111-111111111111';
const EVENT='22222222-2222-4222-8222-222222222222';
const copy=value=>JSON.parse(JSON.stringify(value));
async function removeFixture(folder){const resolved=path.resolve(folder);assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));assert.match(path.basename(resolved),/^sanmartin-(?:publicacion|private)-/);await rm(resolved,{recursive:true,force:true});}
async function fixture(){
  const root=await mkdtemp(path.join(os.tmpdir(),'sanmartin-publicacion-'));
  const bytes=new Map([
    ['index.html','<!doctype html><h1>Tienda</h1>'],
    ['catalogo-seo/index.html','<h1>Catálogo</h1>'],
    ['sitemap.xml','<urlset><url><loc>'+SITE+'/producto/cuaderno/</loc></url></urlset>'],
    ['robots.txt','User-agent: *\nAllow: /\nSitemap: '+SITE+'/sitemap.xml\n'],
    ['seo-productos.json','["cuaderno","lapiz","regla"]'],
    ['producto/cuaderno/index.html','<h1>Cuaderno</h1>'],
    ['producto/lapiz/index.html','<h1>Lápiz</h1>'],
    ['producto/regla/index.html','<h1>Regla</h1>'],
    ['auth.js','/* Cliente público actual */'],['styles.css','body{color:green}'],
    ['.env','SECRET_NEVER_IN_PROOF=private-value'],['.htaccess','private-server-setting'],
    ['supabase/private.sql','select private_data;'],['work/internal.json','{"private":true}']
  ]);
  for(const [relative,text]of bytes){const file=path.join(root,relative);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,text);bytes.set(relative,Buffer.from(text));}
  return{root,bytes,async manifest(options={}){const value=await createPublicationProof({siteDir:root,site:SITE,env:{},now:NOW,nonce:NONCE,...options});bytes.set('publicacion.json',await readFile(path.join(root,'publicacion.json')));return value;},async close(){await removeFixture(root);}};
}
function transport(f,override){
  const calls=[];
  const fetchImpl=async(url,options)=>{const target=new URL(url),relative=target.pathname.slice(1);calls.push({url:target,options,relative});if(override){const result=await override(relative,calls.length);if(result)return result;}
    if(!f.bytes.has(relative))return new Response('missing',{status:404});return new Response(f.bytes.get(relative),{status:200});};
  return{calls,fetchImpl};
}
const verifyOptions={now:NOW,pause:async()=>{},timeoutMs:500,concurrency:2};

test('evidencia incluye las tres fichas y los archivos SEO/JS/CSS, sin archivos privados ni contenido de env',async()=>{
  const f=await fixture();try{
    const manifest=await f.manifest({env:{GITHUB_REPOSITORY:'SanMartinGT/tienda',GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'2',GITHUB_SHA:'a'.repeat(40),EVENTO_CATALOGO_ID:EVENT,GITHUB_TOKEN:'SECRET_TOKEN',HOSTINGER_FTP_PASSWORD:'SECRET_FTP'}});
    assert.equal(manifest.format_version,1);assert.equal(manifest.products,3);assert.deepEqual(manifest.product_slugs,['cuaderno','lapiz','regla']);
    assert.equal(manifest.event_id,EVENT);assert.equal(manifest.github.run_url,'https://github.com/SanMartinGT/tienda/actions/runs/123');assert.match(manifest.deployment_id,/^sm-123-aaaaaaaaaaaa-/);
    assert.deepEqual(manifest.files.map(x=>x.path),['auth.js','catalogo-seo/index.html','index.html','producto/cuaderno/index.html','producto/lapiz/index.html','producto/regla/index.html','robots.txt','seo-productos.json','sitemap.xml','styles.css']);
    const serialized=await readFile(path.join(f.root,'publicacion.json'),'utf8');for(const privateValue of ['SECRET_TOKEN','SECRET_FTP','private-value','.env','.htaccess','private.sql','internal.json'])assert.ok(!serialized.includes(privateValue));
  }finally{await f.close();}
});
test('metadatos de GitHub y evento inválidos se omiten sin publicar sus valores',async()=>{
  const f=await fixture();try{const m=await f.manifest({env:{GITHUB_REPOSITORY:'https://secret@example.com/private',GITHUB_SHA:'SECRET',GITHUB_RUN_ID:'0',EVENTO_CATALOGO_ID:'SECRET'}});assert.equal(m.github,undefined);assert.equal(m.event_id,undefined);assert.ok(!JSON.stringify(m).includes('SECRET'));}finally{await f.close();}
});
test('cada generación sin ejecución GitHub tiene identidad nueva y no permite confundir un build previo',async()=>{
  const f=await fixture();try{const one=await f.manifest(),two=await f.manifest({nonce:()=>EVENT});assert.notEqual(one.deployment_id,two.deployment_id);}finally{await f.close();}
});
for(const bad of ['http://tienda.example','https://user:pass@tienda.example/','https://tienda.example/ruta','https://tienda.example/?token=private','https://tienda.example:8443/'])test('rechaza sitio inseguro o fuera de raíz: '+bad,()=>assert.throws(()=>publicationSite(bad)));
test('rechaza slugs con traversal, duplicados o un índice mal formado',async()=>{
  const f=await fixture();try{for(const index of [['../secreto'],['cuaderno','cuaderno'],{private:'value'}]){await writeFile(path.join(f.root,'seo-productos.json'),JSON.stringify(index));await assert.rejects(f.manifest());}}finally{await f.close();}
});
test('si falta una ficha del índice no se emite una prueba parcial',async()=>{
  const f=await fixture();try{await rm(path.join(f.root,'producto/regla/index.html'));await assert.rejects(f.manifest());}finally{await f.close();}
});
test('un hardlink a datos fuera del sitio no se utiliza para generar evidencia',async()=>{
  const f=await fixture();let other;try{other=await mkdtemp(path.join(os.tmpdir(),'sanmartin-private-'));await writeFile(path.join(other,'private.txt'),'SENSITIVE');await rm(path.join(f.root,'auth.js'));await link(path.join(other,'private.txt'),path.join(f.root,'auth.js'));await assert.rejects(f.manifest());}finally{await f.close();if(other)await removeFixture(other);}
});
test('la escritura de publicacion.json no sobrescribe un destino enlazado a un archivo privado',async()=>{
  const f=await fixture();let other;try{other=await mkdtemp(path.join(os.tmpdir(),'sanmartin-private-'));const secret=path.join(other,'private.txt');await writeFile(secret,'DO_NOT_OVERWRITE');await link(secret,path.join(f.root,'publicacion.json'));await assert.rejects(f.manifest(),/Destino de evidencia inseguro/);assert.equal(await readFile(secret,'utf8'),'DO_NOT_OVERWRITE');}finally{await f.close();if(other)await removeFixture(other);}
});
test('verificación compara evidencia y hashes de todas las rutas críticas en el HTTPS configurado',async()=>{
  const f=await fixture();try{const manifest=await f.manifest({env:{EVENTO_CATALOGO_ID:EVENT}}),mock=transport(f);const report=await verifyRemotePublication({manifest,fetchImpl:mock.fetchImpl,...verifyOptions});assert.equal(report.verified,true);assert.equal(report.status,'PUBLICACION_VERIFICADA');assert.equal(report.files_verified,manifest.files.length);assert.equal(report.event_id,EVENT);assert.equal(mock.calls.length,manifest.files.length+1);for(const request of mock.calls){assert.equal(request.url.origin,SITE);assert.equal(request.url.searchParams.get('publicacion'),manifest.deployment_id);assert.equal(request.options.redirect,'error');assert.equal(request.options.cache,'no-store');assert.equal(request.options.headers['Cache-Control'],'no-cache');assert.ok(request.options.signal instanceof AbortSignal);}}finally{await f.close();}
});
test('un paso de publicación omitido no hace peticiones ni se declara publicado',async()=>{
  let calls=0;const report=await verifyRemotePublication({enabled:false,fetchImpl:async()=>{calls++;throw Error('never');},now:NOW});assert.equal(report.status,'OMITIDA');assert.equal(report.verified,false);assert.equal(calls,0);
});
test('manifiesto anterior se rechaza aunque las fichas tengan los mismos nombres',async()=>{
  const f=await fixture();try{const manifest=await f.manifest(),previous=copy(manifest);previous.deployment_id='sm-anterior';const mock=transport(f,relative=>relative==='publicacion.json'?new Response(JSON.stringify(previous)):undefined);await assert.rejects(verifyRemotePublication({manifest,fetchImpl:mock.fetchImpl,...verifyOptions}),/distinta o anterior/);assert.equal(mock.calls.length,1);}finally{await f.close();}
});
test('una transferencia parcial con HTML antiguo no pasa aunque el manifiesto ya esté subido',async()=>{
  const f=await fixture();try{const manifest=await f.manifest(),old=Buffer.from(f.bytes.get('producto/lapiz/index.html'));old[5]^=1;const mock=transport(f,relative=>relative==='producto/lapiz/index.html'?new Response(old):undefined);await assert.rejects(verifyRemotePublication({manifest,fetchImpl:mock.fetchImpl,...verifyOptions}),/no coincide/);}finally{await f.close();}
});
test('404 de un archivo es fallo definitivo y no produce éxito',async()=>{
  const f=await fixture();try{const manifest=await f.manifest(),mock=transport(f,relative=>relative==='sitemap.xml'?new Response('missing',{status:404}):undefined);await assert.rejects(verifyRemotePublication({manifest,fetchImpl:mock.fetchImpl,...verifyOptions}));assert.equal(mock.calls.filter(c=>c.relative==='sitemap.xml').length,1);}finally{await f.close();}
});
test('429 y 5xx del manifiesto se reintentan hasta tres veces, luego se comprueba el sitio',async()=>{
  const f=await fixture();try{const manifest=await f.manifest();let attempts=0;const mock=transport(f,relative=>relative==='publicacion.json'&&++attempts<3?new Response('transient',{status:attempts===1?429:503}):undefined);const report=await verifyRemotePublication({manifest,fetchImpl:mock.fetchImpl,...verifyOptions});assert.equal(report.verified,true);assert.equal(attempts,3);}finally{await f.close();}
});
test('fallos de red/timeout se acotan a tres intentos y no filtran la excepción',async()=>{
  const f=await fixture();try{const manifest=await f.manifest();let count=0;await assert.rejects(verifyRemotePublication({manifest,fetchImpl:async()=>{count++;throw Error('SECRET_FROM_UPSTREAM');},...verifyOptions}),error=>{assert.doesNotMatch(error.message,/SECRET/);return true;});assert.equal(count,3);}finally{await f.close();}
});
test('redirección no se sigue ni se acepta como evidencia del dominio propio',async()=>{
  const f=await fixture();try{const manifest=await f.manifest();const response=new Response('redirect');Object.defineProperty(response,'redirected',{value:true});const mock=transport(f,()=>response);await assert.rejects(verifyRemotePublication({manifest,fetchImpl:mock.fetchImpl,...verifyOptions}),/redirige/);assert.equal(mock.calls.length,1);}finally{await f.close();}
});
test('respuesta etiquetada con origen ajeno se rechaza sin solicitar ese origen',async()=>{
  const f=await fixture();try{const manifest=await f.manifest();const response=new Response('wrong origin');Object.defineProperty(response,'url',{value:'https://otro.example/publicacion.json'});const mock=transport(f,()=>response);await assert.rejects(verifyRemotePublication({manifest,fetchImpl:mock.fetchImpl,...verifyOptions}),/fuera de la ruta/);assert.equal(mock.calls.length,1);}finally{await f.close();}
});
test('JSON remoto inválido y cuerpo excesivo no pasan como publicación',async()=>{
  const f=await fixture();try{const manifest=await f.manifest();for(const content of ['not json','x'.repeat(MAX_PROOF_BYTES+1)]){const mock=transport(f,()=>new Response(content));await assert.rejects(verifyRemotePublication({manifest,fetchImpl:mock.fetchImpl,...verifyOptions}));}}finally{await f.close();}
});
test('un manifiesto manipulado no puede añadir rutas privadas ni dirigir peticiones a otro host',async()=>{
  const f=await fixture();try{const original=await f.manifest();for(const badPath of ['../.env','.htaccess','https://otro.example/file','supabase/private.sql','producto/%2e%2e/index.html']){const manifest=copy(original);manifest.files[0].path=badPath;assert.throws(()=>validatePublicationProof(manifest));let calls=0;await assert.rejects(verifyRemotePublication({manifest,fetchImpl:async()=>{calls++;},...verifyOptions}));assert.equal(calls,0);}}finally{await f.close();}
});
test('rechaza cobertura incompleta, rutas duplicadas y cambio de dominio esperado antes de leer el alojamiento',async()=>{
  const f=await fixture();try{const manifest=await f.manifest(),missing=copy(manifest);missing.files=missing.files.filter(f=>f.path!=='producto/regla/index.html');assert.throws(()=>validatePublicationProof(missing));const duplicate=copy(manifest);duplicate.files.push(duplicate.files[0]);assert.throws(()=>validatePublicationProof(duplicate));let calls=0;await assert.rejects(verifyRemotePublication({manifest,site:'https://otra-tienda.example',fetchImpl:async()=>{calls++;},...verifyOptions}));assert.equal(calls,0);}finally{await f.close();}
});
test('el contrato de evidencia rechaza campos inesperados, fecha y metadatos de ejecución alterados',async()=>{
  const f=await fixture();try{const manifest=await f.manifest();for(const change of [m=>{m.secret='PRIVATE';},m=>{m.created_at='not a date';},m=>{m.files[0].token='PRIVATE';},m=>{m.github={repository:'SanMartinGT/tienda',run_id:'1',run_attempt:'1',commit_sha:'a'.repeat(40),run_url:'https://github.com/SanMartinGT/tienda/actions/runs/1',token:'PRIVATE'};}]){const invalid=copy(manifest);change(invalid);assert.throws(()=>validatePublicationProof(invalid));}}finally{await f.close();}
});
test('CLI omitida guarda estado explícito y un fallo actual reemplaza cualquier reporte verde anterior',async()=>{
  const f=await fixture();try{const verifier=fileURLToPath(new URL('./verificar-publicacion-remota.mjs',import.meta.url)),report=path.join(f.root,'report.json');const skipped=spawnSync(process.execPath,[verifier,'--skip','--report',report],{cwd:f.root,encoding:'utf8'});assert.equal(skipped.status,0,skipped.stderr);assert.equal(JSON.parse(await readFile(report,'utf8')).status,'OMITIDA');await writeFile(report,JSON.stringify({verified:true,status:'PUBLICACION_VERIFICADA'}));const failed=spawnSync(process.execPath,[verifier,'--report',report],{cwd:f.root,encoding:'utf8'});assert.equal(failed.status,1);assert.equal(JSON.parse(await readFile(report,'utf8')).verified,false);assert.equal(JSON.parse(await readFile(report,'utf8')).status,'FALLO');}finally{await f.close();}
});

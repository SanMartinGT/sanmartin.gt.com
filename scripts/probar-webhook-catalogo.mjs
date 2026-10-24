import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

// Node >=22.13 (CI usa22; local24). Sin Deno, secretos reales ni llamadas de red.
// Ejecuta el handler TypeScript de producción. Solo el reloj de reintentos y
// AbortSignal.timeout se simulan para comprobar sus plazos sin esperar3segundos.
const source=await readFile(new URL('../supabase/functions/catalogo-actualizado/index.ts',import.meta.url),'utf8');
const stripped=stripTypeScriptTypes(source,{mode:'strip'});
const program=stripped.replace('export function createHandler','function createHandler')+'\nglobalThis.handlerFactory=createHandler;';
assert.notEqual(program,stripped,'Debe cargarse el handler exportado real');
const SECRET='webhook-test-'+ 's'.repeat(52),TOKEN='github-test-private-token',REPOSITORY='FixtureOwner/fixture-repository';
const TABLES=['productos','producto_imagenes','ofertas_producto','categorias','marcas','existencias','configuracion_ecommerce','producto_presentaciones','unidades_medida'];
const TYPES=['INSERT','UPDATE','DELETE'];
const ID='11111111-1111-4111-8111-111111111111';
const EVENT='22222222-2222-4222-8222-222222222222';
function event(table='productos',type='UPDATE',row={id:ID}){
  return{type,schema:'public',table,record:type==='DELETE'?null:{...row},old_record:type==='INSERT'?null:{...row}};
}
function request(payload=event(),options={}){
  const headers=new Headers({'Content-Type':'application/json','x-webhook-secret':SECRET});
  for(const [name,value]of Object.entries(options.headers||{})){if(value===null)headers.delete(name);else headers.set(name,value);}
  const method=options.method||'POST';
  const body=options.body!==undefined?options.body:JSON.stringify(payload);
  return new Request('https://edge.fixture.example/catalogo-actualizado',{method,headers,...(['GET','HEAD'].includes(method)?{}:{body,...(body instanceof ReadableStream?{duplex:'half'}:{})})});
}
function fixture({environment={},fetcher,abortTimeout=false,uuidFactory=()=>EVENT,useDefaultUuid=false}={}){
  const env={CATALOGO_WEBHOOK_SECRET:SECRET,GITHUB_DISPATCH_TOKEN:TOKEN,GITHUB_REPOSITORY:REPOSITORY,...environment};
  const calls=[],delays=[],timeoutRequests=[],cancelled=[];let uuidCalls=0;
  const context=vm.createContext({Response,TextDecoder,crypto:globalThis.crypto,setTimeout(fn,ms){delays.push(ms);queueMicrotask(fn);return 1;},AbortSignal:{timeout(ms){
    timeoutRequests.push(ms);const controller=new AbortController();if(abortTimeout)queueMicrotask(()=>controller.abort(new DOMException('Synthetic timeout','TimeoutError')));return controller.signal;
  }}});
  vm.runInContext(program,context,{filename:'catalogo-actualizado/index.ts real',timeout:1000});
  const handler=context.handlerFactory({env:name=>env[name],...(useDefaultUuid?{}:{uuid:()=>{uuidCalls++;return uuidFactory();}}),fetch:async(url,options)=>{
    calls.push({url,options});
    if(fetcher)return fetcher(url,options,calls.length);
    return{status:204,body:{cancel:async()=>cancelled.push(true)}};
  }});
  return{handler,calls,delays,timeoutRequests,cancelled,get uuidCalls(){return uuidCalls;}};
}
async function result(handler,req){const response=await handler(req);return{status:response.status,body:await response.json(),headers:response.headers};}

for(const table of TABLES)for(const type of TYPES)test(`evento permitido: ${table} ${type}`,async()=>{
  const f=fixture(),value=await result(f.handler,request(event(table,type,{id:table==='configuracion_ecommerce'?true:ID})));
  assert.equal(value.status,202);assert.equal(f.calls.length,1);
  assert.deepEqual(JSON.parse(f.calls[0].options.body),{event_type:'catalogo_actualizado',client_payload:{evento_id:EVENT,tipo:type,tabla:table,id:table==='configuracion_ecommerce'?true:ID}});
  assert.equal(value.body.evento_id,EVENT);assert.equal(f.uuidCalls,1);
});

test('el destino y autorización GitHub proceden del entorno; 202 solo solicita actualización',async()=>{
  const f=fixture({environment:{GITHUB_REPOSITORY:'AnotherOwner/another-repository'}}),value=await result(f.handler,request());
  assert.equal(value.status,202);assert.equal(value.body.message,'Actualización solicitada.');
  assert.equal(f.calls[0].url,'https://api.github.com/repos/AnotherOwner/another-repository/dispatches');
  assert.equal(f.calls[0].options.headers.Authorization,`Bearer ${TOKEN}`);
  assert.equal(f.calls[0].options.headers['X-GitHub-Api-Version'],'2026-03-10');
  assert.equal(f.calls[0].options.redirect,'error');assert.deepEqual(f.timeoutRequests,[3000]);
  assert.equal(value.headers.get('Cache-Control'),'no-store');assert.equal(f.cancelled.length,1);
  assert.doesNotMatch(JSON.stringify(value.body),/publicado|desplegado|hosting/i);
});

test('el payload reenviado contiene solo tipo/tabla/id; no filas, costos, stock ni secretos',async()=>{
  const row={id:ID,producto_id:'otro-producto',costo_ultimo:999,stock_fisico:20,proveedor_id:'privado',nombre:'Nombre privado',secret:SECRET,token:TOKEN};
  const f=fixture(),value=await result(f.handler,request({...event('productos','UPDATE',row),otro_secreto:SECRET}));
  assert.equal(value.status,202);
  const forwarded=JSON.parse(f.calls[0].options.body);
  assert.deepEqual(forwarded,{event_type:'catalogo_actualizado',client_payload:{evento_id:EVENT,tipo:'UPDATE',tabla:'productos',id:ID}});
  assert.doesNotMatch(f.calls[0].options.body,/record|costo|stock|proveedor|privado|secret|token/i);
  assert.ok(!f.calls[0].options.body.includes(SECRET)&&!f.calls[0].options.body.includes(TOKEN));
});
test('el generador UUID predeterminado ignora correlaciones del payload y devuelve el ID enviado',async()=>{
  const f=fixture({useDefaultUuid:true}),value=await result(f.handler,request({...event(),evento_id:'correlacion-no-confiable'}));
  assert.equal(value.status,202);assert.match(value.body.evento_id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(JSON.parse(f.calls[0].options.body).client_payload.evento_id,value.body.evento_id);
  assert.ok(!f.calls[0].options.body.includes('correlacion-no-confiable'));
});
test('un fallo del generador UUID no envía un ID inválido ni revela su contenido',async()=>{
  const f=fixture({uuidFactory:()=>'<dato-interno-invalido>'}),value=await result(f.handler,request());
  assert.equal(value.status,500);assert.equal(f.calls.length,0);assert.equal(f.uuidCalls,1);assert.equal(value.body.evento_id,undefined);assert.ok(!JSON.stringify(value.body).includes('interno'));
});

for(const [label,header]of [['ausente',null],['incorrecto','x'.repeat(SECRET.length)],['longitud distinta','corto']])test(`secreto ${label} se rechaza sin dispatch`,async()=>{
  const f=fixture(),value=await result(f.handler,request(event(),{headers:{'x-webhook-secret':header}}));
  assert.equal(value.status,401);assert.equal(f.calls.length,0);assert.deepEqual(f.delays,[]);assert.equal(f.uuidCalls,0);assert.equal(value.body.evento_id,undefined);
});
test('una solicitud no autorizada no lee su cuerpo',async()=>{
  const f=fixture();let bodyRead=false;
  const value=await result(f.handler,{method:'POST',headers:new Headers({'Content-Type':'application/json'}),body:{getReader(){bodyRead=true;throw Error('No debe leerse');}}});
  assert.equal(value.status,401);assert.equal(bodyRead,false);assert.equal(f.calls.length,0);assert.equal(f.uuidCalls,0);
});
for(const method of ['GET','PUT','DELETE','OPTIONS'])test(`método ${method} no permitido`,async()=>{
  const f=fixture(),value=await result(f.handler,request(event(),{method}));assert.equal(value.status,405);assert.equal(f.calls.length,0);assert.equal(f.uuidCalls,0);
});
for(const type of [null,'text/plain','application/x-www-form-urlencoded'])test(`Content-Type ${type??'ausente'} no permite evento`,async()=>{
  const f=fixture(),value=await result(f.handler,request(event(),{headers:{'Content-Type':type}}));assert.equal(value.status,415);assert.equal(f.calls.length,0);assert.equal(f.uuidCalls,0);
});
test('JSON con charset se acepta',async()=>{
  const f=fixture(),value=await result(f.handler,request(event(),{headers:{'Content-Type':'application/json; charset=utf-8'}}));assert.equal(value.status,202);
});
for(const [label,payload]of [
  ['array',[]],['null',null],['schema ajeno',{...event(),schema:'erp_private'}],['tabla ajena',event('perfiles')],['tipo ajeno',event('productos','TRUNCATE')],
  ['INSERT sin record',{...event('productos','INSERT'),record:null}],['INSERT con old_record',{...event('productos','INSERT'),old_record:{id:ID}}],
  ['UPDATE sin old_record',{...event(),old_record:null}],['UPDATE sin record',{...event(),record:null}],['DELETE con record',{...event('productos','DELETE'),record:{id:ID}}],
  ['record array',{...event(),record:[]}]
])test(`evento inválido: ${label}`,async()=>{
  const f=fixture(),value=await result(f.handler,request(payload));assert.equal(value.status,400);assert.equal(f.calls.length,0);assert.equal(f.uuidCalls,0);
});
test('JSON mal formado no se reenvía',async()=>{
  const f=fixture(),value=await result(f.handler,request(null,{body:'{"type":'}));assert.equal(value.status,400);assert.equal(f.calls.length,0);assert.equal(f.uuidCalls,0);
});
test('el límite se mide en bytes y rechaza más de1MiB',async()=>{
  const f=fixture(),value=await result(f.handler,request(null,{body:'á'.repeat(524289)}));assert.equal(value.status,413);assert.equal(f.calls.length,0);assert.equal(f.uuidCalls,0);
});
test('fallo al leer el cuerpo no devuelve el mensaje privado de la excepción',async()=>{
  const f=fixture(),body=new ReadableStream({start(controller){controller.error(new Error('privado '+SECRET+' '+TOKEN));}});
  const value=await result(f.handler,request(null,{body}));assert.equal(value.status,500);assert.equal(f.calls.length,0);assert.equal(f.uuidCalls,0);assert.doesNotMatch(JSON.stringify(value.body),/privado|github-test|webhook-test/);
});
for(const [label,environment]of [
  ['secreto corto',{CATALOGO_WEBHOOK_SECRET:'corto'}],['secreto con espacio',{CATALOGO_WEBHOOK_SECRET:'s'.repeat(40)+' '}],['token ausente',{GITHUB_DISPATCH_TOKEN:undefined}],
  ['token con espacio',{GITHUB_DISPATCH_TOKEN:'token invalido'}],['repositorio ausente',{GITHUB_REPOSITORY:undefined}],['repositorio inválido',{GITHUB_REPOSITORY:'owner/repo/extra'}]
])test(`configuración inválida: ${label}`,async()=>{
  const f=fixture({environment}),value=await result(f.handler,request());assert.equal(value.status,500);assert.equal(f.calls.length,0);assert.equal(f.uuidCalls,0);assert.equal(value.body.message,'Servicio no configurado.');
});
test('sin id admisible omite el identificador, sin serializar la fila completa',async()=>{
  const f=fixture(),value=await result(f.handler,request(event('productos','UPDATE',{id:'<script>',dato_privado:'no reenviar'})));
  assert.equal(value.status,202);assert.deepEqual(JSON.parse(f.calls[0].options.body).client_payload,{evento_id:EVENT,tipo:'UPDATE',tabla:'productos'});
});
test('producto_id es alternativa a un id inválido',async()=>{
  const f=fixture();await f.handler(request(event('existencias','UPDATE',{id:'<invalido>',producto_id:ID})));assert.equal(JSON.parse(f.calls[0].options.body).client_payload.id,ID);
});
for(const status of [400,401,403,404,422,200,201])test(`GitHub ${status} no se reintenta ni se presenta como aceptado`,async()=>{
  const f=fixture({fetcher:async()=>({status})}),value=await result(f.handler,request());assert.equal(value.status,502);assert.equal(f.calls.length,1);assert.deepEqual(f.delays,[]);
});
for(const status of [429,500,503])test(`GitHub ${status} agota tres intentos breves`,async()=>{
  const f=fixture({fetcher:async()=>({status})}),value=await result(f.handler,request());assert.equal(value.status,502);assert.equal(f.calls.length,3);assert.deepEqual(f.delays,[250,500]);assert.deepEqual(f.timeoutRequests,[3000,3000,3000]);
});
test('fallo de red transitorio se recupera y no filtra excepciones',async()=>{
  const f=fixture({fetcher:async(_url,_options,attempt)=>{if(attempt<3)throw new Error('privado '+TOKEN);return{status:204};}}),value=await result(f.handler,request());
  assert.equal(value.status,202);assert.equal(f.calls.length,3);assert.deepEqual(f.delays,[250,500]);assert.ok(!JSON.stringify(value.body).includes(TOKEN));
  assert.equal(f.uuidCalls,1);assert.equal(value.body.evento_id,EVENT);assert.ok(f.calls.every(call=>JSON.parse(call.options.body).client_payload.evento_id===EVENT));
});
test('timeout por intento recibe señal, reintenta y devuelve502 sin afirmar publicación',async()=>{
  const f=fixture({abortTimeout:true,fetcher:async(_url,options)=>new Promise((_resolve,reject)=>{
    if(options.signal.aborted)return reject(options.signal.reason);
    options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true});
  })}),value=await result(f.handler,request());
  assert.equal(value.status,502);assert.equal(f.calls.length,3);assert.deepEqual(f.timeoutRequests,[3000,3000,3000]);assert.deepEqual(f.delays,[250,500]);
  assert.equal(value.body.message,'No se pudo solicitar la actualización.');
});

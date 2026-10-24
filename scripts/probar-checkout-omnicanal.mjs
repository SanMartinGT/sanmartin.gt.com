import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';

// Fixtures sin red, sesiones reales, credenciales ni cambios en inventario.
const files=['presentaciones.js','solicitudes-seguras.js','checkout-seguro.js'];
const sources=await Promise.all(files.map(async file=>[file,await readFile(new URL('../'+file,import.meta.url),'utf8')]));
const P='11111111-1111-4111-8111-111111111111',M='22222222-2222-4222-8222-222222222222',ACTOR='33333333-3333-4333-8333-333333333333';
const PACK='44444444-4444-4444-8444-444444444444',DEST='55555555-5555-4555-8555-555555555555',OTHER='66666666-6666-4666-8666-666666666666';
const SUC={modo:'SUCURSAL',ubicacionId:null},OMNI={modo:'OMNICANAL',ubicacionId:DEST};
const product={id:P,nombre:'Hojas',precio_base:0.1,venta_fraccionada:false,unidad_permite_fraccion:false,unidad_nombre:'hojas',unidad_decimales_permitidos:0};
const metre={id:M,nombre:'Cinta',precio_base:10,venta_fraccionada:true,unidad_permite_fraccion:true,unidad_nombre:'metros',unidad_decimales_permitidos:3};
const pack={id:PACK,producto_id:P,nombre:'Paquete de 500',cantidad_base:500,precio:30,precio_ecommerce:30};
const receipt={id:'77777777-7777-4777-8777-777777777777',pedido_id:'77777777-7777-4777-8777-777777777777',numero:'OMNI-PRUEBA',total:30,estado_pago:'PENDIENTE',estado_entrega:'PENDIENTE'};
const copy=value=>JSON.parse(JSON.stringify(value));
function harness({cryptoApi=webcrypto}={}){
  const storage=new Map();
  const context=vm.createContext({window:{},crypto:cryptoApi,TextEncoder,localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)}});
  for(const [file,source]of sources)vm.runInContext(source,context,{filename:file});
  return{commercial:context.window.SanMartinPresentaciones,checkout:context.window.SanMartinCheckout,requests:context.window.SanMartinRequests,storage};
}
function stateRow(producto_id,context,overrides={}){
  return{producto_id,estado:'DISPONIBLE',mensaje:'Decisión del servidor para el destino elegido.',requiere_traslado:context.modo==='OMNICANAL',modo_inventario:context.modo,ubicacion_destino_id:context.ubicacionId||DEST,...overrides};
}
function backend({body,error=null,decision,products=[product,metre],presentations=[pack]}={}){
  const calls=[];
  const client={
    from(table){const query={select:()=>query,in:()=>query,eq:()=>query,then:(resolve,reject)=>Promise.resolve({data:table==='catalogo_productos'?products:[],error:null}).then(resolve,reject)};return query;},
    async rpc(name,args){
      calls.push({name,args:copy(args)});
      if(name==='catalogo_presentaciones')return{data:presentations.filter(row=>args.p_producto_ids.includes(row.producto_id)),error:null};
      assert.equal(name,'validar_disponibilidad_presentaciones_contextual','La disponibilidad de ambos modos se resuelve en servidor.');
      const context={modo:args.p_modo_inventario,ubicacionId:args.p_ubicacion_destino_id};
      const rows=[...new Set(args.p_items.map(item=>item.producto_id))].map(id=>stateRow(id,context,decision?.(id,args)||{}));
      return{data:body===undefined?rows:body,error};
    }
  };
  return{client,calls};
}
async function cart(commercial,client,raw=[{producto_id:P,presentacion_id:PACK,cantidad:1}]){
  return commercial.hydrate(client,commercial.readCart(raw));
}

test('la decisión contextual del servidor permite OMNICANAL y rechaza SUCURSAL para el mismo paquete',async()=>{
  const h=harness(),b=backend({decision:(_id,args)=>args.p_modo_inventario==='SUCURSAL'?{estado:'AGOTADO',requiere_traslado:false,mensaje:'Stock local insuficiente según servidor'}:{}}),items=await cart(h.commercial,b.client);
  const result=await h.commercial.availability(b.client,items,OMNI);
  assert.equal(result.get(P).estado,'DISPONIBLE');assert.equal(result.get(P).requiere_traslado,true);
  await assert.rejects(h.commercial.availability(b.client,items,SUC),/Stock local insuficiente según servidor/);
  assert.deepEqual(b.calls.filter(call=>call.name!=='catalogo_presentaciones').map(call=>call.name),['validar_disponibilidad_presentaciones_contextual','validar_disponibilidad_presentaciones_contextual']);
});
test('envía unidades y presentaciones en cantidades comerciales, sin factores ni precios del navegador',async()=>{
  const h=harness(),b=backend(),items=await cart(h.commercial,b.client,[{producto_id:P,cantidad:1},{producto_id:P,presentacion_id:PACK,cantidad:2}]);
  assert.equal(h.commercial.requirements(items).get(P),1001);
  b.calls.length=0;await h.commercial.availability(b.client,items,OMNI);
  const call=b.calls[0];assert.equal(call.name,'validar_disponibilidad_presentaciones_contextual');
  assert.deepEqual(call.args,{p_items:[{producto_id:P,cantidad:1},{producto_id:P,presentacion_id:PACK,cantidad:2}],p_modo_inventario:'OMNICANAL',p_ubicacion_destino_id:DEST});
  assert.ok(call.args.p_items.every(item=>Object.keys(item).every(key=>['producto_id','presentacion_id','cantidad'].includes(key))));
});
test('un paquete de 500 mantiene cantidad comercial uno y acepta la resolución del servidor',async()=>{
  const h=harness(),b=backend({decision:()=>({requiere_traslado:false})}),items=await cart(h.commercial,b.client);
  assert.equal(items[0].cantidad,1);assert.equal(h.commercial.requirements(items).get(P),500);
  const result=await h.commercial.availability(b.client,items,OMNI);
  assert.equal(result.get(P).requiere_traslado,false);
  const call=b.calls.find(call=>call.name==='validar_disponibilidad_presentaciones_contextual');
  assert.equal(call.args.p_items[0].cantidad,1,'La cantidad base no sustituye la cantidad comercial enviada.');
});
test('las fracciones iguales se consolidan antes del envío y el rechazo del servidor prevalece',async()=>{
  const h=harness(),b=backend();
  const items=await h.commercial.hydrate(b.client,[{producto_id:M,presentacion_id:null,cantidad:0.5},{producto_id:M,presentacion_id:null,cantidad:0.25}]);
  b.calls.length=0;
  assert.equal((await h.commercial.availability(b.client,items,OMNI)).get(M).requiere_traslado,true);
  assert.deepEqual(b.calls[0].args.p_items,[{producto_id:M,cantidad:0.75}]);
  await assert.rejects(h.commercial.availability(backend({decision:()=>({estado:'AGOTADO',requiere_traslado:false,mensaje:'No alcanza la disponibilidad del destino'})}).client,items,OMNI),/No alcanza la disponibilidad/);
});
test('ambos modos consultan exclusivamente el contrato contextual con su destino explícito',async()=>{
  const h=harness(),b=backend(),items=await cart(h.commercial,b.client);
  b.calls.length=0;await h.commercial.availability(b.client,items,{modo:'OMNICANAL',ubicacionId:OTHER});
  await h.commercial.availability(b.client,items,SUC);
  assert.deepEqual(b.calls,[{name:'validar_disponibilidad_presentaciones_contextual',args:{p_items:[{producto_id:P,presentacion_id:PACK,cantidad:1}],p_modo_inventario:'OMNICANAL',p_ubicacion_destino_id:OTHER}},{name:'validar_disponibilidad_presentaciones_contextual',args:{p_items:[{producto_id:P,presentacion_id:PACK,cantidad:1}],p_modo_inventario:'SUCURSAL',p_ubicacion_destino_id:null}}]);
});
test('sin opciones explícitas crear, tienePendiente y disponibilidad se rechazan antes de enviar solicitudes',async()=>{
  const h=harness(),b=backend(),items=await cart(h.commercial,b.client);b.calls.length=0;
  await assert.rejects(h.checkout.crear(b.client,ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA'),/abastecer/);
  await assert.rejects(h.checkout.tienePendiente(ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA'),/abastecer/);
  await assert.rejects(h.commercial.availability(b.client,items),/abastecer/);
  assert.equal(b.calls.length,0);assert.equal(h.storage.size,0);
});
test('las opciones rechazan modalidad desconocida y destino ausente, inválido o arbitrario en SUCURSAL',()=>{
  const h=harness();
  for(const options of [null,{}, {modo:'RED',ubicacionId:DEST},{modo:'OMNICANAL'},{modo:'OMNICANAL',ubicacionId:null},{modo:'OMNICANAL',ubicacionId:'no-uuid'},{modo:'SUCURSAL'},{modo:'SUCURSAL',ubicacionId:DEST}])assert.throws(()=>h.checkout.normalizarOpciones(options));
  assert.deepEqual(copy(h.checkout.normalizarOpciones(SUC)),SUC);
  assert.deepEqual(copy(h.checkout.normalizarOpciones(OMNI)),OMNI);
});
test('un destino o modo devuelto distinto bloquea la disponibilidad contextual',async()=>{
  const h=harness(),reference=backend(),items=await cart(h.commercial,reference.client);
  for(const row of [stateRow(P,OMNI,{ubicacion_destino_id:OTHER}),stateRow(P,OMNI,{modo_inventario:'SUCURSAL'}),stateRow(P,OMNI,{ubicacion_destino_id:null}),stateRow(P,OMNI,{ubicacion_destino_id:'no-uuid'})])await assert.rejects(h.commercial.availability(backend({body:[row]}).client,items,OMNI),/carrito y destino/);
});
test('respuestas incompletas, duplicadas, extrañas o de formato inválido no habilitan el pedido',async()=>{
  const h=harness(),b=backend(),items=await cart(h.commercial,b.client),valid=stateRow(P,OMNI);
  const malformed=[null,{},[],[valid,valid],[valid,stateRow(M,OMNI)],[{...valid,estado:'DESCONOCIDO'}],[{...valid,requiere_traslado:'true'}],[{...valid,requiere_traslado:null}],[{...valid,estado:'AGOTADO',requiere_traslado:true}],[{...valid,producto_id:OTHER}]];
  for(const body of malformed)await assert.rejects(h.commercial.availability(backend({body}).client,items,OMNI));
  await assert.rejects(h.commercial.availability(backend({error:{message:'RPC contextual no disponible'}}).client,items,OMNI),/RPC contextual no disponible/);
});
test('una presentación rechazada invalida el producto sin que una fila disponible pueda ocultarlo',async()=>{
  const h=harness(),b=backend(),items=await cart(h.commercial,b.client);
  await assert.rejects(h.commercial.availability(backend({body:[stateRow(P,OMNI,{estado:'NO_DISPONIBLE',requiere_traslado:false,mensaje:'Presentación retirada en servidor'})]}).client,items,OMNI),/Presentación retirada en servidor/);
  await assert.rejects(h.commercial.availability(backend({body:[stateRow(P,OMNI,{estado:'NO_DISPONIBLE',requiere_traslado:false}),stateRow(P,OMNI)]}).client,items,OMNI),/carrito y destino/);
});
test('un error del contrato contextual no activa fallback al validador antiguo ni al stock de red',async()=>{
  const h=harness(),b=backend({error:{code:'PGRST202',message:'Falta aplicar el contrato contextual'}}),items=await cart(h.commercial,b.client);b.calls.length=0;
  await assert.rejects(h.commercial.availability(b.client,items,OMNI),/Falta aplicar el contrato contextual/);
  assert.deepEqual(b.calls.map(call=>call.name),['validar_disponibilidad_presentaciones_contextual']);
});
test('factores y precios locales no sustituyen la decisión ni se transmiten como autoridad al servidor',async()=>{
  const h=harness(),b=backend({decision:()=>({estado:'AGOTADO',requiere_traslado:false,mensaje:'La presentación actual requiere más unidades'})}),items=await cart(h.commercial,b.client);
  Object.assign(items[0],{factor_presentacion:1,precio:0.01,precioOriginal:0.01});b.calls.length=0;
  await assert.rejects(h.commercial.availability(b.client,items,OMNI),/presentación actual requiere más unidades/);
  assert.deepEqual(b.calls[0].args.p_items,[{producto_id:P,presentacion_id:PACK,cantidad:1}]);
});
test('un carrito no verificado no consulta inventario ni habilita una presentación retirada',async()=>{
  const h=harness(),b=backend();
  await assert.rejects(h.commercial.availability(b.client,[{producto_id:P,presentacion_id:PACK,cantidad:1,verificado:false}],OMNI),/pendientes de verificar/);
  assert.equal(b.calls.length,0);
});
test('crear envía modo y destino explícitos a las RPC de unidades y presentaciones',async()=>{
  const h=harness(),calls=[],client={rpc:async(name,args)=>{calls.push({name,args:copy(args)});return{data:receipt,error:null};}};
  await h.checkout.crear(client,ACTOR,[{producto_id:P,presentacion_id:PACK,cantidad:1}],'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI);
  await h.checkout.crear(client,ACTOR,[{producto_id:M,cantidad:0.5}],'DOMICILIO','CONTRA_ENTREGA',SUC);
  assert.equal(calls[0].name,'crear_pedido_checkout_presentaciones');assert.equal(calls[0].args.p_modo_inventario,'OMNICANAL');assert.equal(calls[0].args.p_ubicacion_destino_id,DEST);
  assert.equal(calls[1].name,'crear_pedido_checkout');assert.equal(calls[1].args.p_modo_inventario,'SUCURSAL');assert.equal(calls[1].args.p_ubicacion_destino_id,null);
  assert.ok(calls.every(call=>/^[0-9a-f-]{36}$/.test(call.args.p_clave_idempotencia)));
});
test('un intento de resultado desconocido conserva UUID al repetir contexto y cambia UUID si cambia modo o destino',async()=>{
  const h=harness(),calls=[],client={rpc:async(name,args)=>{calls.push({name,args:copy(args)});return{data:null,error:{message:'Resultado desconocido'}};}},items=[{producto_id:P,presentacion_id:PACK,cantidad:1},{producto_id:M,cantidad:0.5}];
  await assert.rejects(h.checkout.crear(client,ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI),/Resultado desconocido/);
  assert.equal(await h.checkout.tienePendiente(ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI),true);
  assert.equal(await h.checkout.tienePendiente(ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',SUC),false);
  assert.equal(await h.checkout.tienePendiente(ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',{modo:'OMNICANAL',ubicacionId:OTHER}),false);
  await assert.rejects(h.checkout.crear(client,ACTOR,[...items].reverse(),'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI));
  await assert.rejects(h.checkout.crear(client,ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',SUC));
  await assert.rejects(h.checkout.crear(client,ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',{modo:'OMNICANAL',ubicacionId:OTHER}));
  const ids=calls.map(call=>call.args.p_clave_idempotencia);assert.equal(ids[0],ids[1]);assert.notEqual(ids[0],ids[2]);assert.notEqual(ids[0],ids[3]);assert.notEqual(ids[2],ids[3]);
});
test('un recibo confirmado libera solo el pendiente del contexto enviado',async()=>{
  const h=harness(),items=[{producto_id:P,presentacion_id:PACK,cantidad:1}],unknown={rpc:async()=>({data:null,error:{message:'Pendiente'}})};
  await assert.rejects(h.checkout.crear(unknown,ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI));
  await assert.rejects(h.checkout.crear(unknown,ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',{modo:'OMNICANAL',ubicacionId:OTHER}));
  await h.checkout.crear({rpc:async()=>({data:receipt,error:null})},ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI);
  assert.equal(await h.checkout.tienePendiente(ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI),false);
  assert.equal(await h.checkout.tienePendiente(ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',{modo:'OMNICANAL',ubicacionId:OTHER}),true);
});
test('cambiar selección mientras se calcula la clave impide enviar la RPC al terminar el hash',async()=>{
  let startDigest,releaseDigest,current=true,rpcCalls=0,guardCalls=0;
  const started=new Promise(resolve=>{startDigest=resolve}),gate=new Promise(resolve=>{releaseDigest=resolve});
  const cryptoApi={randomUUID:()=>webcrypto.randomUUID(),subtle:{digest:async(...args)=>{startDigest();await gate;return webcrypto.subtle.digest(...args);}}};
  const h=harness({cryptoApi}),client={rpc:async()=>{rpcCalls++;return{data:receipt,error:null};}};
  const pending=h.checkout.crear(client,ACTOR,[{producto_id:P,presentacion_id:PACK,cantidad:1}],'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI,{isCurrent:()=>{guardCalls++;return current;}});
  await started;assert.equal(rpcCalls,0);current=false;releaseDigest();
  await assert.rejects(pending,/selección antes de enviar/);
  assert.equal(guardCalls,1);assert.equal(rpcCalls,0);
  assert.equal(h.storage.size,0,'Una selección cancelada nueva no crea UUID pendiente.');
  assert.equal(await h.checkout.tienePendiente(ACTOR,[{producto_id:P,presentacion_id:PACK,cantidad:1}],'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI),false);
});
test('un guard vigente después del hash permite enviar exactamente el contexto capturado',async()=>{
  const h=harness(),calls=[];
  await h.checkout.crear({rpc:async(name,args)=>{calls.push({name,args:copy(args)});return{data:receipt,error:null};}},ACTOR,[{producto_id:P,cantidad:1}],'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI,{isCurrent:()=>true});
  assert.equal(calls.length,1);assert.equal(calls[0].args.p_modo_inventario,'OMNICANAL');assert.equal(calls[0].args.p_ubicacion_destino_id,DEST);
});
test('SUCURSAL acepta el destino asignado del servidor y rechaza traslados o destinos mezclados',async()=>{
  const h=harness(),b=backend(),items=await cart(h.commercial,b.client,[{producto_id:P,cantidad:1},{producto_id:M,cantidad:0.5}]);
  const result=await h.commercial.availability(b.client,items,SUC);assert.equal(result.get(P).ubicacion_destino_id,DEST);assert.equal(result.get(P).requiere_traslado,false);
  for(const body of [[stateRow(P,SUC,{requiere_traslado:true}),stateRow(M,SUC)],[stateRow(P,SUC),stateRow(M,SUC,{ubicacion_destino_id:OTHER})]])await assert.rejects(h.commercial.availability(backend({body}).client,items,SUC),/carrito y destino/);
});
test('una presentación de base fraccionaria incompatible con unidad entera se bloquea antes de consultar stock',async()=>{
  const h=harness(),b=backend({presentations:[{...pack,cantidad_base:0.5}]}),items=await cart(h.commercial,b.client);
  assert.equal(items[0].verificado,true,'La hidratación comercial no sustituye la validación de base.');
  b.calls.length=0;
  await assert.rejects(h.commercial.availability(b.client,items,OMNI),/decimales de su unidad base/);
  assert.equal(b.calls.length,0);
});
test('un paquete cuya base excede los decimales de su unidad se bloquea antes de consultar stock',async()=>{
  const h=harness(),b=backend({products:[{...metre,unidad_decimales_permitidos:2}],presentations:[{...pack,producto_id:M,cantidad_base:0.005}]}),items=await cart(h.commercial,b.client,[{producto_id:M,presentacion_id:PACK,cantidad:1}]);
  b.calls.length=0;
  await assert.rejects(h.commercial.availability(b.client,items,OMNI),/decimales de su unidad base/);
  assert.equal(b.calls.length,0);
});
test('las bases fraccionarias compatibles se aceptan y no se confunden con el máximo comercial de paquetes',async()=>{
  const h=harness(),b=backend({products:[{...metre,unidad_decimales_permitidos:2}],presentations:[{...pack,producto_id:M,cantidad_base:0.25}]});
  const items=await cart(h.commercial,b.client,[{producto_id:M,presentacion_id:PACK,cantidad:3},{producto_id:M,cantidad:0.25}]);
  assert.equal(h.commercial.requirements(items).get(M),1);
  assert.equal((await h.commercial.availability(b.client,items,OMNI)).get(M).estado,'DISPONIBLE');
  const bulk=backend(),bulkItems=await cart(h.commercial,bulk.client);
  assert.equal(h.commercial.requirements(bulkItems).get(P),500);
  assert.equal((await h.commercial.availability(bulk.client,bulkItems,OMNI)).get(P).estado,'DISPONIBLE');
});
test('el guard cancelado conserva un UUID anterior de resultado desconocido sin enviar otra RPC',async()=>{
  const h=harness(),items=[{producto_id:P,presentacion_id:PACK,cantidad:1}],ids=[];
  const client={rpc:async(_name,args)=>{ids.push(args.p_clave_idempotencia);return{data:null,error:{message:'Resultado desconocido'}};}};
  await assert.rejects(h.checkout.crear(client,ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI),/Resultado desconocido/);
  const previous=[...h.storage.entries()];assert.equal(ids.length,1);
  await assert.rejects(h.checkout.crear(client,ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI,{isCurrent:()=>false}),/selección antes de enviar/);
  assert.equal(ids.length,1);assert.deepEqual([...h.storage.entries()],previous);
  assert.equal(await h.checkout.tienePendiente(ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI),true);
  await h.checkout.crear({rpc:async(_name,args)=>{ids.push(args.p_clave_idempotencia);return{data:receipt,error:null};}},ACTOR,items,'RETIRO_TIENDA','CONTRA_ENTREGA',OMNI,{isCurrent:()=>true});
  assert.equal(ids[0],ids[1]);assert.equal(h.storage.size,0);
});

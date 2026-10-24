import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

// Pruebas aisladas: no utilizan credenciales, sesiones reales ni modifican inventario.
const paperId='11111111-1111-4111-8111-111111111111', metreId='22222222-2222-4222-8222-222222222222', actor='33333333-3333-4333-8333-333333333333';
const packageIds=['44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555','66666666-6666-4666-8666-666666666666'];
const paper={id:paperId,nombre:'Hojas',precio_base:0.1,venta_fraccionada:false,unidad_permite_fraccion:false,unidad_nombre:'hojas',unidad_decimales_permitidos:0};
const metre={id:metreId,nombre:'Cinta',precio_base:10,venta_fraccionada:true,unidad_permite_fraccion:true,unidad_nombre:'metros',unidad_simbolo:'m',unidad_decimales_permitidos:3};
const presentations=[500,100,6].map((quantity,index)=>({id:packageIds[index],producto_id:paperId,nombre:`Paquete de ${quantity}`,cantidad_base:quantity,precio:[30,13,1][index],precio_ecommerce:[30,13,1][index],orden:index}));
const storage=new Map(),context=vm.createContext({window:{},crypto:webcrypto,TextEncoder,localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}});
for(const file of ['presentaciones.js','solicitudes-seguras.js','checkout-seguro.js'])vm.runInContext(await readFile(file,'utf8'),context,{filename:file});
const api=context.window.SanMartinPresentaciones,checkout=context.window.SanMartinCheckout;
const local={modo:'SUCURSAL',ubicacionId:null};
const json=value=>JSON.parse(JSON.stringify(value));
function client({rows=presentations,stock=1000,products=[paper,metre],offers=[]}={}){
  return {
    from:table=>{const query={select:()=>query,in:()=>query,eq:()=>query,then:resolve=>Promise.resolve({data:table==='catalogo_productos'?products:table==='ofertas_producto'?offers:[],error:null}).then(resolve)};return query;},
    rpc:async(name,args)=>{
      if(name==='catalogo_presentaciones')return {data:rows.filter(row=>args.p_producto_ids.includes(row.producto_id)),error:null};
      assert.equal(name,'validar_disponibilidad_presentaciones_contextual');
      const quantities=new Map();
      for(const item of args.p_items){const factor=item.presentacion_id?rows.find(row=>row.id===item.presentacion_id)?.cantidad_base:1;assert.ok(factor);quantities.set(item.producto_id,(quantities.get(item.producto_id)||0)+item.cantidad*factor);}
      return {data:[...quantities].map(([producto_id,quantity])=>({producto_id,estado:quantity>stock?'AGOTADO':'DISPONIBLE',mensaje:quantity>stock?'Stock insuficiente para todas las presentaciones.':'Disponible',modo_inventario:args.p_modo_inventario,ubicacion_destino_id:args.p_ubicacion_destino_id||actor,requiere_traslado:false})),error:null};
    }
  };
}
const paperOptions=api.options(paper,presentations,0.1),packages=paperOptions.filter(option=>option.id);
const twoHundreds=await api.hydrate(client(),[api.line(paper,packages[1],2)]);
assert.equal(twoHundreds[0].precio*twoHundreds[0].cantidad,26);
assert.equal(api.requirements(twoHundreds).get(paperId),200);
assert.equal(1000-api.requirements(twoHundreds).get(paperId),800);
const mixed=packages.map((option,index)=>api.line(paper,option,[1,2,3][index]));
assert.equal(api.requirements(mixed).get(paperId),718);
assert.equal(mixed.reduce((sum,item)=>sum+item.cantidad*item.precio,0),59);
assert.equal((await api.availability(client(),mixed,local)).get(paperId).estado,'DISPONIBLE');
await assert.rejects(api.availability(client(),[api.line(paper,packages[0],2),api.line(paper,packages[2],1)],local),/Stock insuficiente/);
const fractional=api.line(metre,api.options(metre,[],10)[0],0.5);
assert.equal(fractional.precio*fractional.cantidad,5);
assert.equal(api.requirements([fractional]).get(metreId),0.5);
assert.equal(api.validQuantity(0.5,paper,null),false);
assert.equal(api.validQuantity(0.0001,metre,null),false);
assert.equal(api.validQuantity(0.05,{...metre,unidad_decimales_permitidos:1},null),false);
assert.equal(api.validQuantity(0.5,{...metre,unidad_decimales_permitidos:0},null),false);
assert.equal(api.validQuantity(101,metre,null),false);
assert.equal(api.totals([{precioOriginal:1,precio:1,cantidad:0.333},{precioOriginal:1,precio:1,cantidad:0.333}]).total,0.66);
assert.throws(()=>api.line(paper,packages[0],0.5),/entera/);
const restored=api.readCart(JSON.stringify([{...fractional,precio:999,factor_presentacion:999,verificado:true}]));
assert.equal(restored[0].cantidad,0.5);
assert.equal(restored[0].precio,0);
assert.equal(restored[0].factor_presentacion,1);
assert.equal(restored[0].verificado,false);
const tampered=await api.hydrate(client(),[{...mixed[0],precio:0.01,factor_presentacion:1}]);
assert.equal(tampered[0].precio,30);
assert.equal(tampered[0].factor_presentacion,500);
const freePresentation={...presentations[0],precio_ecommerce:0};
const free=await api.hydrate(client({rows:[freePresentation,...presentations.slice(1)]}),[mixed[0],fractional]);
assert.equal(free[0].verificado,true);
assert.equal(free[0].precio,0);
assert.equal(api.totals(free).total,5);
const discountedPresentation={...presentations[0],precio_ecommerce:15};
const discounted=await api.hydrate(client({rows:[discountedPresentation,...presentations.slice(1)],offers:[{producto_id:paperId,oferta_porcentaje:50,fecha_inicio:'2020-01-01',fecha_fin:null,activo:true,aplica_ecommerce:true}]}),[mixed[0]]);
assert.equal(discounted[0].precio,15);
const zeroOwnPrice=await api.hydrate(client({rows:[{...presentations[0],precio:0,precio_ecommerce:0}]}),[mixed[0],fractional]);
assert.equal(zeroOwnPrice[0].verificado,true);
assert.equal(api.totals(zeroOwnPrice).total,5);
const zeroBase=api.options({...paper,precio_base:0},[],0)[0];
assert.equal(zeroBase.precio_ecommerce,0);
const retired=await api.hydrate(client({rows:presentations.slice(1)}),[mixed[0]]);
assert.equal(retired[0].verificado,false);
assert.match(retired[0].error,/presentación ya no está disponible/);
await assert.rejects(api.availability(client(),retired,local),/pendientes de verificar/);
const forbiddenFraction=await api.hydrate(client({products:[paper,{...metre,unidad_permite_fraccion:false}]}),[fractional]);
assert.equal(forbiddenFraction[0].verificado,false);
const merged=[];api.merge(merged,mixed[0]);api.merge(merged,mixed[1]);api.merge(merged,mixed[1]);
assert.equal(merged.length,2);assert.equal(merged[1].cantidad,4);
const normalized=checkout.normalizarItems([mixed[1],mixed[0],mixed[1],fractional]);
assert.equal(normalized.length,3);
assert.equal(normalized.find(item=>item.presentacion_id===packageIds[1]).cantidad,4);
assert.equal(normalized.find(item=>item.producto_id===metreId).cantidad,0.5);
assert.throws(()=>checkout.normalizarItems([{...mixed[0],cantidad:0.5}]),/entera/);
assert.throws(()=>checkout.normalizarItems([{...mixed[0],presentacion_id:'invalid'}]),/presentación no válida/);

const receipt={id:'77777777-7777-4777-8777-777777777777',pedido_id:'77777777-7777-4777-8777-777777777777',numero:'SM-TEST',total:59,estado_pago:'PENDIENTE',estado_entrega:'PENDIENTE'};
let calls=[],release;
const concurrentClient={rpc:async(name,payload)=>{calls.push({name,payload});await new Promise(resolve=>{release=resolve;});return {data:receipt,error:null};}};
const pending1=checkout.crear(concurrentClient,actor,mixed,'RETIRO_TIENDA','CONTRA_ENTREGA',local);
const pending2=checkout.crear(concurrentClient,actor,[...mixed].reverse(),'RETIRO_TIENDA','CONTRA_ENTREGA',local);
while(!release)await new Promise(resolve=>setTimeout(resolve,1));
await new Promise(resolve=>setTimeout(resolve,10));
assert.equal(calls.length,1);assert.equal(calls[0].name,'crear_pedido_checkout_presentaciones');
release();assert.equal((await pending1).id,(await pending2).id);
assert.equal(calls[0].payload.p_items.length,3);
assert.ok(calls[0].payload.p_clave_idempotencia);
let attempts=0,retryIds=[];
const retryClient={rpc:async(name,payload)=>{assert.equal(name,'crear_pedido_checkout_presentaciones');retryIds.push(payload.p_clave_idempotencia);return ++attempts===1?{data:null,error:{message:'Respuesta interrumpida'}}:{data:receipt,error:null};}};
await assert.rejects(checkout.crear(retryClient,actor,mixed,'RETIRO_TIENDA','CONTRA_ENTREGA',local),/interrumpida/);
assert.equal(await checkout.tienePendiente(actor,mixed,'RETIRO_TIENDA','CONTRA_ENTREGA',local),true);
assert.equal(await checkout.tienePendiente(actor,[mixed[0]],'RETIRO_TIENDA','CONTRA_ENTREGA',local),false);
await checkout.crear(retryClient,actor,[...mixed].reverse(),'RETIRO_TIENDA','CONTRA_ENTREGA',local);
assert.equal(retryIds[0],retryIds[1]);
assert.equal(await checkout.tienePendiente(actor,mixed,'RETIRO_TIENDA','CONTRA_ENTREGA',local),false);
await checkout.crear({rpc:async(name)=>{assert.equal(name,'crear_pedido_checkout');return {data:receipt,error:null};}},actor,[fractional],'RETIRO_TIENDA','CONTRA_ENTREGA',local);

// Un refresco lento del carrito no revierte cambios hechos por el comprador.
const main=await readFile('script.js','utf8'),hydrateSource=main.slice(main.indexOf('async function hidratarCarrito()'),main.indexOf('async function addToCart('));
let completeHydration;
const cartContext=vm.createContext({window:{SanMartinPresentaciones:{hydrate:()=>new Promise(resolve=>{completeHydration=resolve;})}},cartStore:{state:()=>({status:'ready'}),capture:()=>({}),isCurrent:()=>true},supabaseClient:{},cart:json(mixed),guardarCarrito:()=>{},renderCart:()=>{}});
vm.runInContext(hydrateSource,cartContext);
const refreshing=vm.runInContext('hidratarCarrito()',cartContext);
cartContext.cart[0].cantidad=3;completeHydration(json(mixed));await refreshing;
assert.equal(cartContext.cart[0].cantidad,3);
console.log('Presentaciones: 500/Q30, 100/Q13, 6/Q1, mezcla de inventario, exceso, 0.5 metros, permisos y decimales, manipulación local, retiro de presentación, carrito concurrente y reintentos de checkout verificados.');

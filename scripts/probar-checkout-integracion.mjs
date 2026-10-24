import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import nodeTest from 'node:test';
import vm from 'node:vm';

// Ejecuta el handler real con dependencias controladas; no usa red ni sesiones reales.
const main=await readFile(new URL('../script.js',import.meta.url),'utf8');
const source=main.slice(main.indexOf("document.querySelector('#checkoutButton').addEventListener"),main.indexOf('const newsletterForm='));
const test=(name,fn)=>nodeTest(name,{timeout:3000},fn);
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const P='33333333-3333-4333-8333-333333333333';
const line={producto_id:P,presentacion_id:null,cantidad:1,precio:10,factor_presentacion:1,verificado:true};
const receipt={numero:'PEDIDO-PRUEBA',total:10};
const clone=value=>JSON.parse(JSON.stringify(value));
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done});return{promise,resolve}};
function fixture({retry=false,mode='OMNICANAL'}={}){
  let cartRevision=0,purchaseRevision=0,handler,selected=Object.freeze({modo:mode,ubicacionId:mode==='OMNICANAL'?A:null});
  const calls={auth:0,pending:[],hydrate:0,availability:[],create:[],saves:0,closed:0,rpc:0},messages=[];
  const dependencies={auth:async()=>({data:{user:{id:'cliente'}},error:null}),pending:async()=>retry,hydrate:async items=>clone(items),availability:async()=>new Map(),create:async()=>receipt};
  const cartStore={state:()=>({status:'ready'}),capture:()=>({actor:'cliente',revision:cartRevision}),sameActor:token=>token.actor==='cliente',isCurrent:token=>token.actor==='cliente'&&token.revision===cartRevision};
  const compra={options:()=>selected,capture:()=>({revision:purchaseRevision,modo:selected.modo,ubicacionId:selected.ubicacionId}),isCurrent:token=>token.revision===purchaseRevision&&token.modo===selected.modo&&token.ubicacionId===selected.ubicacionId,touch:()=>{purchaseRevision++}};
  const button={disabled:false,textContent:'Confirmar pedido',addEventListener:(_event,fn)=>{handler=fn}};
  const sandbox={cartStore,compra,cart:[clone(line)],selectedDelivery:'RETIRO_TIENDA',selectedPayment:'CONTRA_ENTREGA',checkoutInProgress:false,document:{querySelector:()=>button},supabaseClient:{auth:{getUser:async()=>{calls.auth++;return dependencies.auth()}}},guardarCarrito:()=>{calls.saves++;cartRevision++},renderCart(){},toggleCart(open){if(!open)calls.closed++},showToast:message=>messages.push(message),money:value=>String(value),window:{SanMartinCheckout:{tienePendiente:async(...args)=>{calls.pending.push(args);return dependencies.pending(...args)},crear:async(...args)=>{calls.create.push(args);return dependencies.create(...args)}},SanMartinPresentaciones:{key:item=>`${item.producto_id}:${item.presentacion_id||''}`,hydrate:async(_client,items)=>{calls.hydrate++;return dependencies.hydrate(items)},availability:async(...args)=>{calls.availability.push(args);return dependencies.availability(...args)}}}};
  const context=vm.createContext(sandbox);vm.runInContext(source,context,{filename:'script.js checkout handler'});
  return{context,compra,calls,messages,dependencies,button,run:()=>handler(),selected:()=>selected,change(kind){
    if(kind==='mode'){selected=Object.freeze({modo:'SUCURSAL',ubicacionId:null});purchaseRevision++}
    else if(kind==='destination'){selected=Object.freeze({modo:'OMNICANAL',ubicacionId:B});purchaseRevision++}
    else if(kind==='delivery')sandbox.selectedDelivery='DOMICILIO';
    else if(kind==='payment')sandbox.selectedPayment='';
    else if(kind==='touch')purchaseRevision++;
    else throw new Error('Cambio de fixture desconocido');
  }};
}

for(const mode of ['SUCURSAL','OMNICANAL'])test(`el checkout ${mode} entrega la misma selección inmutable a pendiente, disponibilidad y creación`,async()=>{
  const f=fixture({mode}),selected=f.selected();await f.run();
  assert.equal(f.calls.pending.length,1);assert.equal(f.calls.availability.length,1);assert.equal(f.calls.create.length,1);
  assert.strictEqual(f.calls.pending[0][4],selected);
  assert.strictEqual(f.calls.availability[0][2],selected);
  assert.strictEqual(f.calls.create[0][5],selected);
  assert.equal(Object.isFrozen(selected),true);
  assert.equal(f.context.cart.length,0);
  assert.equal(f.calls.closed,1);
});

for(const phase of ['getUser','pending','availability'])for(const change of ['mode','destination','delivery','payment','touch'])test(`${change} durante ${phase} impide enviar el contexto anterior`,async()=>{
  const f=fixture(),gate=deferred(),entered=deferred();
  if(phase==='getUser')f.dependencies.auth=()=>{entered.resolve();return gate.promise};
  else if(phase==='pending')f.dependencies.pending=()=>{entered.resolve();return gate.promise};
  else f.dependencies.availability=()=>{entered.resolve();return gate.promise};
  const pending=f.run();await entered.promise;f.change(change);
  gate.resolve(phase==='getUser'?{data:{user:{id:'cliente'}},error:null}:phase==='pending'?false:new Map());await pending;
  assert.equal(f.calls.create.length,0);
  assert.equal(f.context.cart.length,1);
  assert.equal(f.calls.closed,0);
  assert.equal(f.context.checkoutInProgress,false);
});

test('un cambio durante la hidratación impide consultar stock y enviar la selección anterior',async()=>{
  const f=fixture(),gate=deferred(),entered=deferred();f.dependencies.hydrate=()=>{entered.resolve();return gate.promise};
  const pending=f.run();await entered.promise;f.change('touch');gate.resolve([clone(line)]);await pending;
  assert.equal(f.calls.availability.length,0);assert.equal(f.calls.create.length,0);assert.equal(f.context.cart.length,1);
});

test('el reintento pendiente conserva opciones y recupera el pedido sin volver a exigir stock',async()=>{
  const f=fixture({retry:true}),selected=f.selected();
  f.dependencies.hydrate=async()=>{throw new Error('No debe hidratar un replay')};
  f.dependencies.availability=async()=>{throw new Error('No debe consultar stock reservado por el replay')};
  await f.run();
  assert.equal(f.calls.hydrate,0);assert.equal(f.calls.availability.length,0);assert.equal(f.calls.create.length,1);
  assert.strictEqual(f.calls.pending[0][4],selected);assert.strictEqual(f.calls.create[0][5],selected);
  assert.equal(f.context.cart.length,0);assert.ok(f.messages.some(message=>message.includes(receipt.numero)));
});

test('el guard adicional detecta el cambio ocurrido al calcular el identificador de solicitud',async()=>{
  const f=fixture({retry:true}),gate=deferred(),entered=deferred();
  f.dependencies.create=async(_client,_actor,_items,_delivery,_payment,_options,guard)=>{
    assert.equal(typeof guard?.isCurrent,'function');assert.equal(guard.isCurrent(),true);entered.resolve();await gate.promise;
    if(!guard.isCurrent())throw new Error('La selección cambió antes de enviar la solicitud.');
    f.calls.rpc++;return receipt;
  };
  const pending=f.run();await entered.promise;f.change('destination');gate.resolve();await pending;
  assert.equal(f.calls.rpc,0);assert.equal(f.context.cart.length,1);assert.equal(f.calls.closed,0);
});

for(const change of ['mode','destination','delivery','payment','touch'])test(`un recibo ya enviado conserva el carrito y la selección nueva tras ${change}`,async()=>{
  const f=fixture({retry:true}),gate=deferred(),entered=deferred();f.dependencies.create=()=>{entered.resolve();return gate.promise};
  const pending=f.run();await entered.promise;f.change(change);const newOptions=f.selected(),newDelivery=f.context.selectedDelivery,newPayment=f.context.selectedPayment;
  gate.resolve(receipt);await pending;
  assert.equal(f.context.cart.length,1);assert.equal(f.calls.saves,0);assert.equal(f.calls.closed,0);
  assert.strictEqual(f.selected(),newOptions);assert.equal(f.context.selectedDelivery,newDelivery);assert.equal(f.context.selectedPayment,newPayment);
  assert.ok(f.messages.some(message=>message.includes(receipt.numero)&&message.includes('Conservamos tu carrito')));
});

test('una selección incompleta no inicia consultas de cuenta, stock ni creación',async()=>{
  const f=fixture();f.compra.options=()=>{throw new Error('Selecciona una sucursal de destino habilitada.')};await f.run();
  assert.equal(f.calls.auth,0);assert.equal(f.calls.pending.length,0);assert.equal(f.calls.availability.length,0);assert.equal(f.calls.create.length,0);
  assert.equal(f.context.cart.length,1);assert.ok(f.messages.some(message=>message.includes('sucursal')));
});

for(const phase of ['hydrate','availability'])test(`un rechazo tardío de ${phase} no muestra un error de la selección anterior`,async()=>{
  const f=fixture(),gate=deferred(),entered=deferred(),obsolete=`ERROR_ANTERIOR_${phase}`;
  f.dependencies[phase]=()=>{entered.resolve();return gate.promise};
  const pending=f.run();await entered.promise;f.change('destination');
  gate.resolve(Promise.reject(new Error(obsolete)));await pending;
  assert.equal(f.calls.create.length,0);assert.equal(f.context.cart.length,1);
  assert.ok(f.messages.some(message=>/selección/i.test(message)));
  assert.ok(f.messages.every(message=>!message.includes(obsolete)));
});

test('el error de disponibilidad de la selección vigente sí informa al comprador',async()=>{
  const f=fixture();f.dependencies.availability=async()=>{throw new Error('Stock insuficiente en la selección vigente')};await f.run();
  assert.equal(f.calls.create.length,0);assert.equal(f.context.cart.length,1);
  assert.ok(f.messages.some(message=>message.includes('Stock insuficiente en la selección vigente')));
});

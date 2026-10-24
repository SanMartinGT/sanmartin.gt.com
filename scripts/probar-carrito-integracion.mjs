import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const main=await readFile(new URL('../script.js',import.meta.url),'utf8');
const hydration=main.slice(main.indexOf('async function hidratarCarrito()'),main.indexOf('async function addToCart('));
const adding=main.slice(main.indexOf('async function addToCart('),main.indexOf('function renderCart()'));
const checkout=main.slice(main.indexOf("document.querySelector('#checkoutButton').addEventListener"),main.indexOf('const newsletterForm='));
const clone=value=>JSON.parse(JSON.stringify(value));
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done});return{promise,resolve}};
const line={producto_id:'33333333-3333-4333-8333-333333333333',cantidad:1,precio:10,factor_presentacion:1,verificado:true};
function fixture(){
  let actor='A',generation=1,revision=0,saves=0,handler;
  const store={state:()=>({actor,status:'ready'}),capture:()=>({actor,generation,revision}),sameActor:t=>t.actor===actor&&t.generation===generation,isCurrent:t=>store.sameActor(t)&&t.revision===revision,ensureReady:async()=>store.capture(),replace:()=>{revision++;saves++;}};
  const button={disabled:false,textContent:'Confirmar pedido',addEventListener:(_name,fn)=>{handler=fn}};
  const messages=[];
  const sandbox={window:{SanMartinPresentaciones:{},SanMartinCheckout:{}},compra:{options:()=>Object.freeze({modo:'SUCURSAL',ubicacionId:null}),capture:()=>({}),isCurrent:()=>true},cartStore:store,cart:[clone(line)],products:[{id:line.producto_id,opciones:[{id:null}]}],supabaseClient:{auth:{getUser:async()=>({data:{user:{id:actor}},error:null})}},selectedDelivery:'RETIRO_TIENDA',selectedPayment:'CONTRA_ENTREGA',checkoutInProgress:false,document:{querySelector:()=>button},guardarCarrito:()=>store.replace(),renderCart(){},toggleCart(){},showToast:message=>messages.push(message),money:value=>String(value)};
  const context=vm.createContext(sandbox);
  return{context,store,messages,button,get saves(){return saves},switchActor(){actor='B';generation++;sandbox.cart=[clone(line)]},handler:()=>handler};
}

test('hidratar pendiente de A no reemplaza el carrito idéntico de B',async()=>{
  const f=fixture(),gate=deferred();f.context.window.SanMartinPresentaciones.hydrate=()=>gate.promise;
  vm.runInContext(hydration,f.context);const pending=vm.runInContext('hidratarCarrito()',f.context);
  f.switchActor();gate.resolve([{...line,precio:500}]);await pending;
  assert.equal(f.context.cart[0].precio,10);assert.equal(f.saves,0);
});
test('agregar pendiente de A no atribuye sus productos a B aunque el JSON coincida',async()=>{
  const f=fixture(),gate=deferred(),started=deferred();
  f.context.window.SanMartinPresentaciones={line:()=>clone(line),merge:(cart,item)=>cart.push(item),hydrate:()=>{started.resolve();return gate.promise},requirements:()=>new Map()};
  vm.runInContext(adding,f.context);const pending=vm.runInContext(`addToCart('${line.producto_id}')`,f.context);
  await started.promise;f.switchActor();gate.resolve([line,line]);await pending;
  assert.equal(f.context.cart.length,1);assert.equal(f.saves,0);
});
test('checkout no envía el carrito si cambia la cuenta durante getUser',async()=>{
  const f=fixture(),gate=deferred();let submitted=false;
  f.context.supabaseClient.auth.getUser=()=>gate.promise;
  f.context.window.SanMartinCheckout={tienePendiente:async()=>{submitted=true}};
  vm.runInContext(checkout,f.context);const pending=f.handler()();f.switchActor();gate.resolve({data:{user:{id:'B'}},error:null});await pending;
  assert.equal(submitted,false);assert.equal(f.saves,0);assert.equal(f.context.cart.length,1);
});
test('recibo tardío de A no vacía ni muestra información del pedido en B',async()=>{
  const f=fixture(),gate=deferred(),started=deferred();
  f.context.window.SanMartinCheckout={tienePendiente:async()=>true,crear:()=>{started.resolve();return gate.promise}};
  vm.runInContext(checkout,f.context);const pending=f.handler()();await started.promise;f.switchActor();gate.resolve({numero:'PEDIDO-A',total:10});await pending;
  assert.equal(f.context.cart.length,1);assert.equal(f.saves,0);assert.equal(f.messages.length,0);
});
test('el recibo de la cuenta vigente sí limpia únicamente su carrito enviado',async()=>{
  const f=fixture();f.context.window.SanMartinCheckout={tienePendiente:async()=>true,crear:async()=>({numero:'PEDIDO-A',total:10})};
  vm.runInContext(checkout,f.context);await f.handler()();
  assert.equal(f.context.cart.length,0);assert.equal(f.saves,1);assert.match(f.messages[0],/PEDIDO-A/);
});
test('catálogo, cuenta, acceso y fichas cargan el almacén antes que sus escritores',async()=>{
  for(const file of ['index.html','catalogo.html','producto.html','mi-cuenta.html','login.html','slogan.html','scripts/generar-seo-productos.mjs']){
    const source=await readFile(new URL('../'+file,import.meta.url),'utf8');
    assert.ok(source.includes('carrito-estado.js'),file);
    const writer=source.indexOf('<script src="'+(file==='mi-cuenta.html'||file==='login.html'?'auth.js':file.includes('producto')?'producto.js':'script.js'));
    assert.ok(writer<0||source.indexOf('carrito-estado.js')<writer,file);
  }
  for(const file of ['script.js','producto.js','producto-estatico.js','auth.js','carrito-cuenta.js']){
    const source=await readFile(new URL('../'+file,import.meta.url),'utf8');
    assert.ok(!source.includes('sanmartin_ecommerce_cart_v1'),file+' escribe el ámbito anterior');
  }
});

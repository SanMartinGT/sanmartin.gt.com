import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

// Código real con datos ficticios. No usa sesiones, claves ni solicitudes de red.
const authSource=await readFile(new URL('../auth.js',import.meta.url),'utf8');
const commercialSource=await readFile(new URL('../presentaciones.js',import.meta.url),'utf8');
const cartBridgeSource=await readFile(new URL('../carrito-cuenta.js',import.meta.url),'utf8');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const P='33333333-3333-4333-8333-333333333333',Q='44444444-4444-4444-8444-444444444444',PACK='55555555-5555-4555-8555-555555555555';
const O='66666666-6666-4666-8666-666666666666',OTHER='77777777-7777-4777-8777-777777777777';
const clone=value=>JSON.parse(JSON.stringify(value));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const turn=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
const textMarkup=value=>String(value??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const line=(options={})=>({id:'linea-ficticia',pedido_id:O,producto_id:P,cantidad:2,precio_unitario:999,total_linea:1998,presentacion_id:null,presentacion_nombre:null,cantidad_presentaciones:null,factor_presentacion:100,precio_presentacion:999,productos:{id:P,nombre:'Producto oculto de mi pedido',sku:'OCULTO-1'},...options});
const order=(id=O)=>({id,cliente_id:A,numero:'FICTICIO-'+id.slice(0,2),estado:'PAGADO',estado_pago:'PAGADO',estado_entrega:'ENTREGADO',fecha_creacion:'2026-10-20T12:00:00Z',fecha_entrega:'2026-10-21T12:00:00Z',total:1998,costo_envio:0,metodo_entrega:'RETIRO_TIENDA',metodo_pago:'CONTRA_ENTREGA',direccion_envio:{}});

class Host {
  constructor(){this._html='';this._text='';this.buttons=[];this.classList={toggle(){}};}
  set textContent(value){this._text=String(value);this._html='';this.buttons=[];}
  get textContent(){return this._text;}
  set innerHTML(value){
    this._html=String(value);this._text='';this.buttons=[];
    for(const match of this._html.matchAll(/<button\b([^>]*\bdata-reorder="([^"]+)"[^>]*)>([\s\S]*?)<\/button>/g)){
      const button={dataset:{reorder:match[2]},disabled:/\bdisabled\b/.test(match[1]),textContent:match[3],handlers:new Map(),addEventListener(name,fn){this.handlers.set(name,fn);}};
      this.buttons.push(button);
    }
  }
  get innerHTML(){return this._html;}
  querySelectorAll(selector){return selector==='[data-reorder]'?this.buttons:[];}
}
function query(result){
  const value={then:(yes,no)=>Promise.resolve(result).then(yes,no)};
  for(const name of ['select','eq','order','in'])value[name]=()=>value;
  return value;
}
function fixture({orders=[order()],rpc=async(_name,args)=>({data:[line({pedido_id:args.p_pedido_id})],error:null}),storeOptions={}}={}){
  const host=new Host(),message=new Host(),calls=[],saved=[],authCallbacks=[];
  let actor=A,generation=1,revision=0;
  const location={href:'https://cuenta.example/mi-cuenta.html',protocol:'https:',origin:'https://cuenta.example',search:''};
  const store={
    capture:()=>({actor,generation,revision}),
    sameActor:token=>Boolean(token&&token.actor===actor&&token.generation===generation),
    isCurrent:token=>store.sameActor(token)&&token.revision===revision,
    state:()=>({actor,status:'ready'}),
    ensureReady:async expected=>{if(expected!==undefined&&expected!==actor)throw Error('La cuenta cambió.');return store.capture();},
    replace(items,token){assert.equal(store.isCurrent(token),true,'Solo el contexto vigente puede reemplazar el carrito.');saved.push(clone(items));revision++;},
    flush:async()=>{},
    ...storeOptions
  };
  const client={
    auth:{getUser:async()=>({data:{user:actor?{id:actor}:null},error:null}),onAuthStateChange(fn){authCallbacks.push(fn);fn('INITIAL_SESSION',{user:{id:actor}});return{data:{subscription:{unsubscribe(){}}}};}},
    from(table){calls.push({table});assert.equal(table,'pedidos_ecommerce','El historial no consulta catálogo público ni detalle crudo.');return query({data:orders,error:null});},
    rpc(name,args){calls.push({name,args:clone(args)});assert.equal(name,'erp_detalle_productos_pedido');return rpc(name,args);}
  };
  const document={
    visibilityState:'visible',
    getElementById:id=>id==='ordersList'?host:id==='accountMessage'?message:null,
    querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},
    createElement(){return{_text:'',set textContent(value){this._text=String(value??'');},get innerHTML(){return textMarkup(this._text);}};}
  };
  const context=vm.createContext({window:{supabaseClient:client,SanMartinCarrito:store,location,addEventListener(){}},document,console,URL,URLSearchParams,Intl,Date,Map,Set,setTimeout(){return 0;},clearTimeout(){},setInterval(){return 0;}});
  vm.runInContext(commercialSource,context,{filename:'presentaciones.js real'});
  vm.runInContext(authSource+'\nglobalThis.h07={loadAccountOrderDetails,buildAccountReorder,setupOrdersDashboard};',context,{filename:'auth.js real'});
  return{context,api:context.h07,commercial:context.window.SanMartinPresentaciones,host,message,calls,saved,store,location,client,
    switchActor(next=B){actor=next;generation++;revision++;authCallbacks.forEach(fn=>fn(next?'SIGNED_IN':'SIGNED_OUT',next?{user:{id:next}}:null));},
    click(index=0){const button=host.buttons[index];assert.ok(button,'Debe existir la acción de recompra.');assert.equal(button.disabled,false);const handler=button.handlers.get('click');assert.equal(typeof handler,'function');return handler({currentTarget:button,preventDefault(){}});}
  };
}

test('detalle autorizado conserva nombre de producto oculto y no consulta catálogo público',async()=>{
  const f=fixture();const result=await f.api.loadAccountOrderDetails([order()],()=>true);
  assert.equal(result.get(O).error,'');assert.equal(result.get(O).items[0].productos.nombre,'Producto oculto de mi pedido');
  assert.deepEqual(f.calls.filter(call=>call.name).map(call=>call.args),[{p_pedido_id:O}]);
  assert.equal(f.calls.some(call=>call.table==='catalogo_productos'),false);
});

for(const [name,data] of [
  ['payload no es un array',{productos:[line()]}],
  ['línea de otro pedido',[line({pedido_id:OTHER})]],
  ['producto_id no coincide con productos.id',[line({productos:{id:Q,nombre:'Ajeno'}})]],
  ['producto sin nombre',[line({productos:{id:P,nombre:'  '}})]]
])test(`detalle inválido queda como error explícito: ${name}`,async()=>{
  const f=fixture({rpc:async()=>({data,error:null})}),result=await f.api.loadAccountOrderDetails([order()]);
  assert.ok(result.get(O).error);assert.equal(result.get(O).items.length,0);
});

test('un error de RPC no borra los detalles válidos de otros pedidos',async()=>{
  const f=fixture({rpc:async(_name,args)=>args.p_pedido_id===O?{data:null,error:{message:'Sin acceso al detalle'}}:{data:[line({pedido_id:OTHER})],error:null}});
  const result=await f.api.loadAccountOrderDetails([order(),order(OTHER)]);
  assert.ok(result.get(O).error);assert.equal(result.get(O).items.length,0);
  assert.equal(result.get(OTHER).error,'');assert.equal(result.get(OTHER).items.length,1);
});

test('pedido sin líneas se distingue de error de detalle',async()=>{
  const f=fixture({rpc:async()=>({data:[],error:null})}),result=await f.api.loadAccountOrderDetails([order()]);
  assert.equal(result.get(O).error,'');assert.equal(result.get(O).items.length,0);
});

test('el detalle limita a cuatro las consultas simultáneas',async()=>{
  let active=0,maximum=0;const gates=[],f=fixture({rpc:(_name,args)=>{const gate=deferred();gates.push({gate,args});active++;maximum=Math.max(maximum,active);return gate.promise.finally(()=>{active--;});}});
  const orders=Array.from({length:9},(_,index)=>order(`${index+1}`.repeat(8)+'-6666-4666-8666-666666666666'));
  const pending=f.api.loadAccountOrderDetails(orders);await turn();assert.equal(gates.length,4);
  for(let index=0;index<orders.length;index++){while(!gates[index])await turn();gates[index].gate.resolve({data:[line({pedido_id:gates[index].args.p_pedido_id})],error:null});await turn();}
  const result=await pending;assert.equal(result.size,9);assert.equal(maximum,4);assert.equal(active,0);
});

test('cambiar la cuenta detiene tareas nuevas y descarta detalles pendientes',async()=>{
  let current=true;const gates=[],f=fixture({rpc:()=>{const gate=deferred();gates.push(gate);return gate.promise;}});
  const pending=f.api.loadAccountOrderDetails(Array.from({length:8},(_,index)=>order('pedido-'+index)),()=>current);
  await turn();assert.equal(gates.length,4);current=false;
  gates.forEach(gate=>gate.resolve({data:[line()],error:null}));const result=await pending;
  assert.equal(gates.length,4);assert.equal(result.size,0);
});

test('una carga ya obsoleta no lanza RPC',async()=>{
  const f=fixture(),result=await f.api.loadAccountOrderDetails([order()],()=>false);
  assert.equal(f.calls.filter(call=>call.name).length,0);assert.equal(result.size,0);
});

test('recompra conserva todas las líneas ocultas y visibles sin copiar importes históricos',()=>{
  const f=fixture(),result=f.api.buildAccountReorder([line(),line({producto_id:Q,productos:{id:Q,nombre:'Producto visible',sku:'VISIBLE'}})]);
  assert.deepEqual(clone(result).map(item=>item.producto_id),[P,Q]);
  assert.equal(result[0].nombre,'Producto oculto de mi pedido');
  for(const item of result){assert.equal(item.precio,0);assert.equal(item.precioOriginal,0);assert.equal(item.precioOferta,null);assert.equal(item.factor_presentacion,1);assert.equal(item.verificado,false);}
});

test('recompra usa cantidad fraccionaria en unidad y cantidad comercial entera en paquete',()=>{
  const f=fixture(),result=f.api.buildAccountReorder([line({cantidad:0.5}),line({producto_id:Q,productos:{id:Q,nombre:'Paquete'},cantidad:18,presentacion_id:PACK,cantidad_presentaciones:3,factor_presentacion:6})]);
  assert.equal(result[0].cantidad,0.5);assert.equal(result[0].presentacion_id,null);
  assert.equal(result[1].cantidad,3);assert.equal(result[1].presentacion_id,PACK);assert.equal(result[1].factor_presentacion,1);
});

for(const quantity of [0,-1,null,undefined,NaN,Infinity,'no-numero'])test(`cantidad histórica inválida no se convierte en una unidad: ${String(quantity)}`,()=>{
  const f=fixture();assert.throws(()=>f.api.buildAccountReorder([line({cantidad:quantity})]));
});

for(const quantity of [0,null,undefined,1.5])test(`paquete requiere cantidad comercial válida: ${String(quantity)}`,()=>{
  const f=fixture();assert.throws(()=>f.api.buildAccountReorder([line({presentacion_id:PACK,cantidad_presentaciones:quantity})]));
});

test('una línea no identificable rechaza la recompra en vez de descartarla parcialmente',()=>{
  const f=fixture();assert.throws(()=>f.api.buildAccountReorder([line(),line({producto_id:'invalido',productos:{id:'invalido',nombre:'No identificable'}})]));
  assert.throws(()=>f.api.buildAccountReorder([line({presentacion_id:'invalida',cantidad_presentaciones:2})]));
});

test('readCart debe conservar todas las líneas de la recompra',()=>{
  const f=fixture();f.commercial.readCart=()=>[];
  assert.throws(()=>f.api.buildAccountReorder([line()]));
});

test('hidratación real conserva oculto con error y revalida precio vigente del visible',async()=>{
  const f=fixture(),candidate=f.api.buildAccountReorder([line(),line({producto_id:Q,productos:{id:Q,nombre:'Visible'},cantidad:0.5})]);
  const product={id:Q,nombre:'Nombre vigente',precio_base:20,venta_fraccionada:true,unidad_permite_fraccion:true,unidad_decimales_permitidos:2,unidad_nombre:'Metros'};
  const client={from:table=>query({data:table==='catalogo_productos'?[product]:[],error:null}),rpc:async()=>({data:[],error:null})};
  const result=await f.commercial.hydrate(client,candidate);
  assert.equal(result.length,2);assert.equal(result[0].nombre,'Producto oculto de mi pedido');assert.equal(result[0].verificado,false);assert.equal(result[0].precio,0);assert.match(result[0].error,/no está disponible/);
  assert.equal(result[1].verificado,true);assert.equal(result[1].cantidad,0.5);assert.equal(result[1].precio,20);assert.equal(result[1].nombre,'Nombre vigente');
  assert.throws(()=>f.commercial.requirements(result));
});

test('presentación retirada sigue siendo línea no verificable y nunca cambia a unidad',async()=>{
  const f=fixture(),candidate=f.api.buildAccountReorder([line({presentacion_id:PACK,cantidad_presentaciones:2})]);
  const client={from:table=>query({data:table==='catalogo_productos'?[{id:P,nombre:'Producto',precio_base:20}]:[],error:null}),rpc:async()=>({data:[],error:null})};
  const result=await f.commercial.hydrate(client,candidate);
  assert.equal(result[0].presentacion_id,PACK);assert.equal(result[0].verificado,false);assert.match(result[0].error,/presentación/);
});

test('dashboard muestra nombre autorizado oculto con escape HTML y permite llevarlo a revalidación',async()=>{
  const name='Oculto <img src=x onerror="alert(1)">',f=fixture({rpc:async()=>({data:[line({productos:{id:P,nombre:name}})],error:null})});
  await f.api.setupOrdersDashboard();assert.ok(f.host.innerHTML.includes(textMarkup(name).replaceAll('"','&quot;')));
  assert.equal(f.host.innerHTML.includes('<img src=x'),false);
  await f.click();assert.equal(f.saved.length,1);assert.equal(f.saved[0][0].producto_id,P);assert.equal(f.saved[0][0].precio,0);assert.equal(f.saved[0][0].verificado,false);
});

test('error de detalle mantiene el pedido y bloquea su recompra',async()=>{
  const f=fixture({rpc:async()=>({data:null,error:{message:'Detalle no disponible'}})});await f.api.setupOrdersDashboard();
  assert.ok(f.host.innerHTML.includes('order-card'));assert.ok(f.host.innerHTML.includes('1998.00'));
  assert.equal(f.host.buttons.some(button=>!button.disabled),false);assert.equal(f.saved.length,0);
});

test('respuesta de detalle de A tras cambiar a B no reaparece en el dashboard',async()=>{
  const gate=deferred(),f=fixture({rpc:()=>gate.promise});
  const pending=f.api.setupOrdersDashboard();await turn();f.switchActor();
  gate.resolve({data:[line()],error:null});await pending;
  assert.equal(f.host.innerHTML.includes('Producto oculto'),false);assert.equal(f.saved.length,0);
});

test('recompra interrumpida por cambio de cuenta antes de ensureReady no reemplaza el carrito',async()=>{
  const gate=deferred(),f=fixture();await f.api.setupOrdersDashboard();const token=f.store.capture();
  f.store.ensureReady=()=>gate.promise;const pending=f.click();await turn();f.switchActor();gate.resolve(token);await pending;
  assert.equal(f.saved.length,0);assert.equal(f.location.href,'https://cuenta.example/mi-cuenta.html');
});

test('flush tardío de recompra de A no redirige a B ni muestra confirmación anterior',async()=>{
  const gate=deferred(),entered=deferred(),f=fixture({storeOptions:{flush:()=>{entered.resolve();return gate.promise;}}});
  await f.api.setupOrdersDashboard();const pending=f.click();await entered.promise;f.switchActor();gate.resolve();await pending;
  assert.equal(f.location.href,'https://cuenta.example/mi-cuenta.html');assert.equal(f.message.textContent,'');
});

function cartBridge({status='ready',withCartView=true}={}){
  const counts={renders:0,hydrations:0,resets:0,closed:[]},controls=[{checked:true},{checked:true}];let listener;
  const node=()=>({hidden:false,setAttribute(){},replaceChildren(){},append(){},addEventListener(){},querySelectorAll:()=>[]});
  const initial={status,items:[{producto_id:P,cantidad:2,verificado:false}],reviewable:false,generation:1,revision:0};
  const context=vm.createContext({
    window:{SanMartinCarrito:{subscribe(fn){listener=fn;fn(initial,'initial');}},SanMartinCompra:{reset(){counts.resets++;}}},
    document:{createElement:node,body:{append(){}},querySelectorAll:()=>controls},
    cart:[],selectedDelivery:'DOMICILIO',selectedPayment:'CONTRA_ENTREGA',
    hidratarCarrito:async()=>{counts.hydrations++;},toggleCart:open=>counts.closed.push(open),
    ...(withCartView?{renderCart:()=>{counts.renders++;}}:{})
  });
  vm.runInContext(cartBridgeSource,context,{filename:'carrito-cuenta.js real'});
  return{context,counts,controls,emit(reason,next={}){listener({...initial,...next},reason);}};
}

test('puente hidrata la recompra si la suscripción inicial ya recibe carrito listo',()=>{
  const f=cartBridge();assert.equal(f.counts.hydrations,1);assert.equal(f.counts.renders,1);
  assert.equal(f.context.cart[0].producto_id,P);assert.equal(f.counts.resets,0);
});

test('puente espera la carga cuando el estado inicial sigue cargando',()=>{
  const f=cartBridge({status:'loading'});assert.equal(f.counts.hydrations,0);assert.equal(f.counts.renders,1);
  f.emit('load',{status:'ready'});assert.equal(f.counts.hydrations,1);assert.equal(f.counts.renders,2);
});

test('puente no duplica hidratación ni render durante edit/saved',()=>{
  const f=cartBridge(),initial={...f.counts};
  f.emit('edit',{items:[{producto_id:Q,cantidad:1}]});f.emit('saved');
  assert.equal(f.counts.hydrations,initial.hydrations);assert.equal(f.counts.renders,initial.renders);assert.equal(f.counts.resets,0);
});

test('puente no hidrata una notificación load que todavía no está lista',()=>{
  const f=cartBridge({status:'loading'});f.emit('load',{status:'loading'});
  assert.equal(f.counts.hydrations,0);assert.equal(f.counts.renders,2);
});

test('puente conserva limpieza de identidad sin hidratar la cuenta anterior',()=>{
  const f=cartBridge({status:'loading'});f.emit('identity',{items:[],generation:2});
  assert.equal(f.counts.hydrations,0);assert.equal(f.counts.resets,1);assert.deepEqual(f.counts.closed,[false]);
  assert.equal(f.context.selectedDelivery,'');assert.equal(f.context.selectedPayment,'');assert.equal(f.controls.every(input=>!input.checked),true);assert.equal(f.context.cart.length,0);
});

test('puente en cuenta sin vista de carrito no hidrata ni cambia sus controles',()=>{
  const f=cartBridge({withCartView:false});f.emit('load');f.emit('identity',{generation:2,items:[]});
  assert.equal(f.counts.hydrations,0);assert.equal(f.counts.renders,0);assert.equal(f.counts.resets,0);
  assert.equal(f.context.cart.length,0);assert.equal(f.context.selectedDelivery,'DOMICILIO');assert.equal(f.context.selectedPayment,'CONTRA_ENTREGA');
});

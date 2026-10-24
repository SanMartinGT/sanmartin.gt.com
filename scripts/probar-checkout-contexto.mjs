import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import nodeTest from 'node:test';
import vm from 'node:vm';

// Ninguna prueba usa red, SDK, credenciales ni pedidos reales.
const source=await readFile(new URL('../checkout-contexto.js',import.meta.url),'utf8');
const helperSource=await readFile(new URL('../checkout-seguro.js',import.meta.url),'utf8');
const test=(name,fn)=>nodeTest(name,{timeout:3000},fn);
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
const P='33333333-3333-4333-8333-333333333333';
const branches=[{id:A,codigo:'A',nombre:'Sucursal A',direccion:'Dirección A',permite_recepcion:true,permite_transferencia:true},{id:B,codigo:'B',nombre:'Sucursal B',direccion:null,permite_recepcion:false,permite_transferencia:false}];
const clone=value=>JSON.parse(JSON.stringify(value));
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done});return{promise,resolve}};
const available=()=>new Map([[P,{producto_id:P,estado:'DISPONIBLE'}]]);
const item=(cantidad=1)=>({producto_id:P,presentacion_id:null,cantidad,verificado:true,factor_presentacion:1,precio:10});
function harness(){
  const calls=[],checks=[];
  let response={data:{productos:[],sucursales:clone(branches),ubicacion_destino_id:null},error:null};
  let responseGate=null,availability=async()=>available();
  const client={rpc:async(name,args)=>{calls.push({name,args:clone(args)});return responseGate?await responseGate:clone(response)}};
  const commercial={availability:async(_client,items,options)=>{assert.equal(_client,client);checks.push({items:clone(items),options:clone(options)});return availability(items,options)}};
  const window={SanMartinPresentaciones:commercial,addEventListener(){},removeEventListener(){}};
  const context=vm.createContext({window,console,setTimeout,clearTimeout,document:{querySelector:()=>null}});
  vm.runInContext(helperSource,context,{filename:'checkout-seguro.js'});
  vm.runInContext(source,context,{filename:'checkout-contexto.js'});
  const store=window.SanMartinCrearContextoCompra({client});
  return{store,calls,checks,setResponse:value=>{response=value;responseGate=null},setResponseGate:value=>{responseGate=value},setAvailability:value=>{availability=value}};
}
async function omni(h,id=A){await h.store.loadBranches();h.store.select({modo:'OMNICANAL',ubicacionId:id});}

test('SUCURSAL usa explícitamente destino null y entrega opciones inmutables',()=>{
  const h=harness(),options=h.store.options();
  assert.deepEqual(clone(options),{modo:'SUCURSAL',ubicacionId:null});
  assert.equal(Object.isFrozen(options),true);
  assert.throws(()=>{options.modo='OMNICANAL'});
});
test('el catálogo solicita IDs vacíos sin consultar inventario global',async()=>{
  const h=harness();await h.store.loadBranches();
  assert.equal(h.calls.length,1);
  assert.deepEqual(h.calls[0],{name:'ecommerce_stock_omnicanal',args:{p_producto_ids:[],p_ubicacion_destino_id:null}});
  assert.equal(h.store.state().branchStatus,'ready');
  assert.deepEqual(clone(h.store.state().branches).map(b=>b.id),[A,B]);
});
test('OMNICANAL exige seleccionar un destino perteneciente al catálogo público',async()=>{
  const h=harness();await h.store.loadBranches();h.store.select({modo:'OMNICANAL',ubicacionId:null});
  assert.throws(()=>h.store.options());
  h.store.select({modo:'OMNICANAL',ubicacionId:A});
  assert.deepEqual(clone(h.store.options()),{modo:'OMNICANAL',ubicacionId:A});
  assert.throws(()=>{h.store.select({modo:'OMNICANAL',ubicacionId:'99999999-9999-4999-8999-999999999999'});h.store.options()});
});
test('un UUID inválido o modo ajeno al contrato no habilita opciones de compra',async()=>{
  const h=harness();await h.store.loadBranches();
  assert.throws(()=>h.store.select({modo:'RED',ubicacionId:A}));
  assert.throws(()=>{h.store.select({modo:'OMNICANAL',ubicacionId:'no-es-uuid'});h.store.options()});
});
test('cambiar a SUCURSAL retira el destino omnicanal sin enviarlo a la sucursal habitual',async()=>{
  const h=harness();await omni(h);const previous=h.store.capture();
  h.store.select({modo:'SUCURSAL',ubicacionId:A});
  assert.equal(h.store.isCurrent(previous),false);
  assert.deepEqual(clone(h.store.options()),{modo:'SUCURSAL',ubicacionId:null});
});
test('cada destino nuevo invalida la selección capturada aun con el mismo carrito',async()=>{
  const h=harness();await omni(h);const first=h.store.capture();
  h.store.select({modo:'OMNICANAL',ubicacionId:B});
  assert.equal(h.store.isCurrent(first),false);
  assert.equal(h.store.isCurrent(h.store.capture()),true);
});
test('touch invalida cotizaciones al cambiar entrega o pago sin alterar opciones',async()=>{
  const h=harness();await omni(h);const before=h.store.capture(),options=clone(h.store.options());
  h.store.touch();
  assert.equal(h.store.isCurrent(before),false);
  assert.deepEqual(clone(h.store.options()),options);
  assert.notEqual(h.store.state().status,'ready');
});
test('refresh usa el mismo modo y destino seleccionados y solo las líneas indicadas',async()=>{
  const h=harness();await omni(h,B);await h.store.refresh([item(2)]);
  assert.equal(h.checks.length,1);
  assert.deepEqual(h.checks[0].options,{modo:'OMNICANAL',ubicacionId:B});
  assert.equal(h.checks[0].items[0].cantidad,2);
  assert.equal(h.store.state().status,'ready');
});
test('una disponibilidad de A resuelta después de seleccionar B no valida B',async()=>{
  const h=harness(),gate=deferred();await omni(h);h.setAvailability(()=>gate.promise);
  const pending=h.store.refresh([item()]);h.store.select({modo:'OMNICANAL',ubicacionId:B});
  gate.resolve(available());await pending;
  assert.notEqual(h.store.state().status,'ready');
  assert.equal(h.store.options().ubicacionId,B);
});
test('la última consulta de cantidades prevalece sobre otra respuesta anterior',async()=>{
  const h=harness(),first=deferred(),second=deferred();await omni(h);
  h.setAvailability(items=>items[0].cantidad===1?first.promise:second.promise);
  const old=h.store.refresh([item(1)]),latest=h.store.refresh([item(2)]);
  second.resolve(available());await latest;
  assert.equal(h.store.state().status,'ready');
  first.resolve(Promise.reject(new Error('Respuesta obsoleta de inventario')));await old;
  assert.equal(h.store.state().status,'ready');
  assert.equal(h.checks.at(-1).items[0].cantidad,2);
});
test('un error de disponibilidad bloquea la validación y permite reintentar explícitamente',async()=>{
  const h=harness();await omni(h);h.setAvailability(async()=>{throw new Error('Stock insuficiente')});
  await h.store.refresh([item()]);
  assert.equal(h.store.state().status,'error');assert.ok(h.store.state().error||h.store.state().message);
  h.setAvailability(async()=>available());h.store.touch();await h.store.refresh([item()]);
  assert.equal(h.store.state().status,'ready');
});
test('un error al cargar destinos no se convierte en catálogo disponible',async()=>{
  const h=harness();h.setResponse({data:null,error:{message:'Consulta interrumpida'}});await h.store.loadBranches();
  assert.equal(h.store.state().branchStatus,'error');
  assert.throws(()=>{h.store.select({modo:'OMNICANAL',ubicacionId:A});h.store.options()});
});
test('una respuesta de catálogo mal formada no autoriza destinos',async()=>{
  const h=harness();h.setResponse({data:{productos:[],sucursales:'malformado'},error:null});await h.store.loadBranches();
  assert.equal(h.store.state().branchStatus,'error');
  assert.throws(()=>{h.store.select({modo:'OMNICANAL',ubicacionId:A});h.store.options()});
});
test('la recarga del catálogo retira un destino que ya no está habilitado',async()=>{
  const h=harness();await omni(h);h.setResponse({data:{productos:[],sucursales:[branches[1]],ubicacion_destino_id:null},error:null});await h.store.loadBranches();
  assert.throws(()=>h.store.options());
  assert.notEqual(h.store.state().status,'ready');
});
test('state no permite introducir desde fuera una sucursal ajena al catálogo',async()=>{
  const h=harness();await h.store.loadBranches();const exposed=h.store.state();
  exposed.branches.push({id:'99999999-9999-4999-8999-999999999999',nombre:'Inyectada'});
  assert.throws(()=>{h.store.select({modo:'OMNICANAL',ubicacionId:'99999999-9999-4999-8999-999999999999'});h.store.options()});
});
test('reset invalida la operación anterior y vuelve a SUCURSAL sin destino',async()=>{
  const h=harness(),gate=deferred();await omni(h);const before=h.store.capture();h.setAvailability(()=>gate.promise);
  const pending=h.store.refresh([item()]);h.store.reset();gate.resolve(available());await pending;
  assert.equal(h.store.isCurrent(before),false);
  assert.deepEqual(clone(h.store.options()),{modo:'SUCURSAL',ubicacionId:null});
  assert.notEqual(h.store.state().status,'ready');
});
test('un carrito vacío o sin hidratación comercial no consulta disponibilidad',async()=>{
  const h=harness();await omni(h);await h.store.refresh([]);await h.store.refresh([{...item(),verificado:false}]);
  assert.equal(h.checks.length,0);
  assert.notEqual(h.store.state().status,'ready');
});
test('una consulta antigua de destinos no reemplaza el catálogo cargado después',async()=>{
  const h=harness(),gate=deferred();h.setResponseGate(gate.promise);const old=h.store.loadBranches();
  h.setResponse({data:{productos:[],sucursales:[branches[1]],ubicacion_destino_id:null},error:null});await h.store.loadBranches();
  gate.resolve({data:null,error:{message:'Error antiguo'}});await old;
  assert.equal(h.store.state().branchStatus,'ready');
  assert.deepEqual(clone(h.store.state().branches).map(b=>b.id),[B]);
});

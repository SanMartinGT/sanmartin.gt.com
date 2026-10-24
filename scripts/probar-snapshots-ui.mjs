import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

// Código real y datos ficticios: no sesiones, red ni cambios de Supabase.
// El repositorio ecommerce se puede probar solo. Los casos ERP ejecutan sus
// archivos reales cuando está disponible la carpeta hermana; si no, el runner
// informa explícitamente el skip, sin usar una copia de la implementación.
const authSource=await readFile(new URL('../auth.js',import.meta.url),'utf8');
async function optionalSource(name){
  try{return await readFile(new URL('../../San Martin ERP/'+name,import.meta.url),'utf8');}
  catch(error){if(error.code==='ENOENT')return null;throw error;}
}
const ordersSource=await optionalSource('ecommerce-orders.js'),invoiceSource=await optionalSource('ecommerce-invoices.js');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const textMarkup=value=>String(value??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const authContext=vm.createContext({window:{supabaseClient:null,location:{search:'',protocol:'https:'},addEventListener(){}},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement(){let text='';return{set textContent(value){text=String(value??'');},get innerHTML(){return textMarkup(text);}};}},setTimeout(){},setInterval(){},URL,URLSearchParams,console});
vm.runInContext(authSource+'\nglobalThis.h08={accountOrderUnit,accountOrderLineHtml,accountOrderDeliveryHtml};',authContext,{filename:'auth.js real'});
const account=authContext.h08;
function erpContext(source,exposure){
  if(!source)return null;
  const context=vm.createContext({esc:escape,qty:value=>String(Number(value)),money:value=>'Q'+Number(value).toFixed(2),console});
  vm.runInContext(source+'\nglobalThis.h08='+exposure+';',context,{filename:'ERP real'});return context.h08;
}
const erp=erpContext(ordersSource,'{ecommerceOrderProductRow,ecommerceOrderDeliveryDetails}');
const invoices=erpContext(invoiceSource,'{ecommerceInvoiceProductRow,ecommerceInvoiceDocument}');
const noErp={skip:!erp?'Checkout ERP hermano no disponible en este repositorio':false};
const noInvoices={skip:!invoices?'Checkout ERP hermano no disponible en este repositorio':false};
const line=(extra={})=>({producto_id:'33333333-3333-4333-8333-333333333333',productos:{id:'33333333-3333-4333-8333-333333333333',nombre:'Nombre al comprar',sku:'SKU-ORIGINAL'},identidad_origen:'SNAPSHOT',unidad_medida_snapshot:{nombre:'Metros',abreviatura:'m',permite_fraccion:true,decimales_permitidos:3},cantidad:0.5,precio_unitario:10,total_linea:5,presentacion_id:null,...extra});
const delivered=(address={},method='DOMICILIO')=>({metodo_entrega:method,direccion_envio:address});
function invoice(address,extra={}){
  return{numero:7,fecha_emision:'2026-10-24T10:00:00Z',datos:{moneda:'GTQ',zona_horaria:'America/Guatemala',empresa:{empresa_nombre:'Empresa ficticia'},cliente:{nombre:'Nombre de facturación posterior',telefono:'99999999',direccion_completa:'Dirección de facturación posterior'},pedido:{numero:'FICTICIO',metodo_entrega:'DOMICILIO',metodo_pago:'CONTRA_ENTREGA',total:5,costo_envio:0,direccion_envio:address},lineas:[],...extra}};
}

test('cuenta: unidad y nombre snapshot se muestran sin etiqueta de referencia actual',()=>{
  const html=account.accountOrderLineHtml(line());assert.match(html,/Nombre al comprar/);assert.match(html,/SKU-ORIGINAL/);assert.match(html,/0.5 m × Q10.00/);assert.doesNotMatch(html,/referencia actual/);
});
test('cuenta: unidad snapshot admite nombre cuando no tiene abreviatura',()=>{
  assert.equal(account.accountOrderUnit(line({unidad_medida_snapshot:{nombre:'Metros'}})),'Metros');
});
for(const origin of ['REFERENCIA_ACTUAL',undefined])test(`cuenta: origen ${String(origin)} se identifica sin fingir nombre histórico`,()=>{
  const html=account.accountOrderLineHtml(line({identidad_origen:origin,unidad_medida_snapshot:null,productos:{nombre:'Nombre actual',sku:'SKU-ACTUAL',unidades_medida:{abreviatura:'kg'}}}));
  assert.match(html,/Nombre actual/);assert.match(html,/Nombre y SKU: referencia actual; no registrados al comprar/);assert.match(html,/unidad no registrada en el pedido/);assert.doesNotMatch(html,/ kg /);
});
test('cuenta: presentación conserva cantidad base y unidad persistida',()=>{
  const html=account.accountOrderLineHtml(line({presentacion_id:'paquete',presentacion_nombre:'Rollo de cinco',cantidad_presentaciones:2,cantidad:10,precio_presentacion:20,total_linea:40}));
  assert.match(html,/Rollo de cinco · 2 × Q20.00 \(10 m en total\)/);
});
test('cuenta: valores numéricos ausentes no se transforman en cero',()=>{
  const html=account.accountOrderLineHtml(line({cantidad:null,precio_unitario:null,total_linea:null}));assert.match(html,/No registrada m × No registrado/);assert.doesNotMatch(html,/Q0.00/);
});
test('cuenta: SKU ausente permanece explícitamente ausente',()=>{
  assert.match(account.accountOrderLineHtml(line({productos:{nombre:'Nombre',sku:null}})),/SKU: No registrado en el pedido/);
});
test('cuenta: nombre, SKU y unidad con HTML se escapan como texto',()=>{
  const html=account.accountOrderLineHtml(line({productos:{nombre:'<img src=x onerror="x">',sku:'"<b>SKU</b>'},unidad_medida_snapshot:{abreviatura:'<i>m</i>'}}));
  assert.match(html,/&lt;img/);assert.match(html,/&quot;&lt;b&gt;SKU/);assert.match(html,/&lt;i&gt;m/);assert.doesNotMatch(html,/<img|<b>SKU|<i>/);
});
test('cuenta: contacto nuevo muestra destinatario y teléfono del pedido; la etiqueta queda separada',()=>{
  const html=account.accountOrderDeliveryHtml(delivered({version_snapshot:1,nombre:'Casa',destinatario:'Ana López',nombre_completo:'Alias distinto',telefono:'55551234',direccion_completa:'Calle del pedido'}));
  assert.match(html,/<dt>Destinatario<\/dt><dd>Ana López/);assert.match(html,/<dt>Teléfono de contacto<\/dt><dd>55551234/);assert.match(html,/<dt>Nombre de la dirección<\/dt><dd>Casa/);assert.doesNotMatch(html,/Alias distinto/);
});
test('cuenta: nombre_completo es alias de destinatario',()=>{
  assert.match(account.accountOrderDeliveryHtml(delivered({nombre_completo:'Ana López'})),/<dt>Destinatario<\/dt><dd>Ana López/);
});
test('cuenta: etiqueta de dirección antigua no se presenta como destinatario',()=>{
  const html=account.accountOrderDeliveryHtml(delivered({nombre:'Casa antigua',direccion_completa:'Calle original'}));
  assert.match(html,/<dt>Destinatario<\/dt><dd>No registrado en el pedido/);assert.match(html,/<dt>Teléfono de contacto<\/dt><dd>No registrado en el pedido/);assert.match(html,/<dt>Nombre de la dirección<\/dt><dd>Casa antigua/);
});
test('cuenta: no consulta ni sustituye contacto por un perfil posterior',()=>{
  const order={...delivered({version_snapshot:1,destinatario:null,telefono:null}),perfiles:{nombre:'Nombre posterior',telefono:'9999'}};
  const html=account.accountOrderDeliveryHtml(order);assert.doesNotMatch(html,/Nombre posterior|9999/);assert.match(html,/No registrado en el pedido/);
});
test('cuenta: retiro usa sucursal conservada y no la dirección domiciliaria',()=>{
  const html=account.accountOrderDeliveryHtml(delivered({destinatario:'Ana',telefono:'1234',sucursal:'Sucursal original',direccion_completa:'Casa que no debe mostrarse'},'RETIRO_TIENDA'));
  assert.match(html,/Sucursal original/);assert.doesNotMatch(html,/Casa que no debe mostrarse/);
});
test('cuenta: dirección legada como string conserva su texto sin inventar contacto',()=>{
  const html=account.accountOrderDeliveryHtml(delivered('Calle antigua'));assert.match(html,/Calle antigua/);assert.match(html,/<dt>Destinatario<\/dt><dd>No registrado/);
});
test('cuenta: valores HTML de contacto se escapan',()=>{
  const html=account.accountOrderDeliveryHtml(delivered({destinatario:'<img src=x>',telefono:'"<b>123</b>',nombre:'<i>Casa</i>'}));assert.match(html,/&lt;img/);assert.match(html,/&quot;&lt;b&gt;123/);assert.doesNotMatch(html,/<img|<b>123|<i>/);
});
test('ERP: snapshot comercial y unidad se muestran tal como vienen del pedido',noErp,()=>{
  const html=erp.ecommerceOrderProductRow(line());assert.match(html,/Nombre al comprar/);assert.match(html,/SKU-ORIGINAL/);assert.match(html,/>m</);assert.doesNotMatch(html,/referencia actual/);
});
test('ERP: unidad ausente no se reemplaza por unidad actual y referencia actual es explícita',noErp,()=>{
  const html=erp.ecommerceOrderProductRow(line({identidad_origen:'REFERENCIA_ACTUAL',unidad_medida_snapshot:null,productos:{nombre:'Nombre actual',sku:'SKU-2',unidades_medida:{abreviatura:'kg'}}}));assert.match(html,/unidad no registrada en el pedido/);assert.match(html,/referencia actual; no registrados al comprar/);assert.doesNotMatch(html,/unidades base|>kg</);
});
test('ERP: contacto nuevo usa destinatario y teléfono del pedido',noErp,()=>{
  const html=erp.ecommerceOrderDeliveryDetails(delivered({version_snapshot:1,nombre:'Casa',destinatario:'Ana',telefono:'1234'}));assert.match(html,/<dt>Destinatario \/ nombre de entrega<\/dt><dd>Ana/);assert.match(html,/<dt>Teléfono de contacto<\/dt><dd>1234/);assert.match(html,/<dt>Nombre de la dirección<\/dt><dd>Casa/);
});
test('ERP: etiqueta antigua queda separada y no inventa destinatario o teléfono',noErp,()=>{
  const html=erp.ecommerceOrderDeliveryDetails(delivered({nombre:'Casa antigua'}));assert.match(html,/<dt>Destinatario \/ nombre de entrega<\/dt><dd>No registrado en el pedido/);assert.match(html,/<dt>Teléfono de contacto<\/dt><dd>No registrado en el pedido/);assert.match(html,/Casa antigua/);
});
test('comprobante: version1 prioriza destinatario del pedido frente a facturación',noInvoices,()=>{
  const html=invoices.ecommerceInvoiceDocument(invoice({version_snapshot:1,destinatario:'Ana original',nombre_completo:'Alias',nombre:'Etiqueta',telefono:'1234',direccion_completa:'Calle original'}));
  assert.match(html,/Destinatario del pedido:<\/span> Ana original/);assert.match(html,/Teléfono:<\/span> 1234/);assert.doesNotMatch(html,/Nombre de facturación posterior|99999999|Dirección de facturación posterior|Alias/);
});
test('comprobante: faltantes version1 no se completan con datos de facturación posteriores',noInvoices,()=>{
  const html=invoices.ecommerceInvoiceDocument(invoice({version_snapshot:1,nombre:'Etiqueta sin destinatario',destinatario:null,nombre_completo:null,telefono:null}));
  assert.match(html,/Destinatario del pedido:<\/span> No registrado al emitir/);assert.match(html,/Teléfono:<\/span> No registrado al emitir/);assert.match(html,/Dirección:<\/span> No registrado al emitir/);assert.doesNotMatch(html,/Etiqueta sin destinatario|Nombre de facturación posterior|99999999|Dirección de facturación posterior/);
});
test('comprobante: retiro version1 usa sucursal conservada si no hay dirección',noInvoices,()=>{
  const data=invoice({version_snapshot:1,destinatario:'Ana',telefono:'1234',sucursal:'Sucursal al comprar'});data.datos.pedido.metodo_entrega='RETIRO_TIENDA';const html=invoices.ecommerceInvoiceDocument(data);assert.match(html,/Dirección:<\/span> Sucursal al comprar/);assert.doesNotMatch(html,/Dirección de facturación posterior/);
});
test('comprobante: JSON legado sin versión sigue siendo registro al emitir, sin mutarlo',noInvoices,()=>{
  const data=invoice({nombre:'Texto conservado'}),before=JSON.stringify(data),html=invoices.ecommerceInvoiceDocument(data);assert.match(html,/Cliente \/ registro al emitir:<\/span> Texto conservado/);assert.match(html,/Teléfono:<\/span> 99999999/);assert.equal(JSON.stringify(data),before);
});
test('comprobante: identidad REFERENCIA_ACTUAL se etiqueta solo en nuevas emisiones con flag',noInvoices,()=>{
  const historical=value=>String(value??'').trim()||'No registrado al emitir',invoiceMoney=value=>'Q'+Number(value).toFixed(2);
  const current=invoices.ecommerceInvoiceProductRow({nombre:'Nombre al emitir',sku:'SKU-ACTUAL',identidad_origen:'REFERENCIA_ACTUAL',cantidad:1,precio_unitario:5,total_linea:5,unidad_medida_snapshot:null},0,{historical,invoiceMoney});
  const prior=invoices.ecommerceInvoiceProductRow({nombre:'Nombre conservado',sku:'SKU-1',cantidad:1,precio_unitario:5,total_linea:5,medida:'m'},0,{historical,invoiceMoney});
  assert.match(current,/Nombre\/SKU de referencia al emitir; no registrados al comprar/);assert.doesNotMatch(prior,/referencia al emitir/);
});
test('comprobante: nombre de unidad snapshot y faltante se imprimen sin unidad actual',noInvoices,()=>{
  const historical=value=>String(value??'').trim()||'No registrado al emitir',invoiceMoney=value=>String(value),options={historical,invoiceMoney};
  const present=invoices.ecommerceInvoiceProductRow({nombre:'Producto',cantidad:1,unidad_medida_snapshot:{nombre:'Metros'}},0,options);assert.match(present,/>Metros</);
  const absent=invoices.ecommerceInvoiceProductRow({nombre:'Producto',cantidad:1,unidad_medida_snapshot:null},0,options);assert.match(absent,/>No registrado al emitir</);assert.doesNotMatch(absent,/unidades base/);
});

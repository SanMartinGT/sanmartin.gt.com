const authClient=window.supabaseClient;
const byId=id=>document.getElementById(id);
const showMessage=(id,text,isError=false)=>{const el=byId(id);if(!el)return;el.textContent=text;el.classList.toggle('error',isError)};
const escapeAccountHtml=value=>{const element=document.createElement('span');element.textContent=String(value??'');return element.innerHTML};
const redirectUrl=()=>{if(!['http:','https:'].includes(window.location.protocol))return null;const fallback=new URL('mi-cuenta.html',window.location.href),target=new URLSearchParams(window.location.search).get('returnTo');if(!target)return fallback.href;try{const candidate=new URL(target,window.location.origin);if(candidate.origin!==window.location.origin||/\/login\.html$/i.test(candidate.pathname))return fallback.href;return candidate.href}catch{return fallback.href}};
async function syncHeader(){if(!authClient)return;const {data:{user}}=await authClient.auth.getUser();document.querySelectorAll('[data-auth-link]').forEach(link=>{const label=link.querySelector('span');link.href=user?'mi-cuenta.html':'login.html';link.setAttribute('aria-label',user?'Mi cuenta':'Iniciar sesión');if(label)label.textContent=user?'Mi cuenta':'Iniciar sesión'})}
const orderStatus=order=>{
  const payment=String(order.estado||'').toUpperCase(),delivery=String(order.estado_entrega||'').toUpperCase();
  if(/CANCEL|DEVUEL/.test(payment)||/CANCEL|DEVUEL/.test(delivery))return{key:'cancelled',label:/DEVUEL/.test(payment+delivery)?'Devuelto':'Cancelado',icon:'↩️',stage:0};
  const state=delivery&&delivery!=='PENDIENTE'?delivery:payment;
  if(/ENTREG|COMPLET/.test(state))return{key:'delivered',label:'Entregado',icon:'✅',stage:3};
  if(/ENVI|CAMINO/.test(state))return{key:'processing',label:'Enviado',icon:'🚚',stage:2};
  if(state==='PREPARADO'||state==='LISTO_PARA_RETIRO')return{key:'processing',label:order.metodo_entrega==='RETIRO_TIENDA'?'Listo para retirar':'Preparado',icon:'📦',stage:1};
  if(/PAGADO|CONFIRMADO|PREPAR|PROCESO/.test(state))return{key:'processing',label:state==='PAGADO'?'Pago confirmado':state==='CONFIRMADO'?'Pedido confirmado':'En preparación',icon:'📦',stage:0};
  return{key:'received',label:payment==='RESERVADO'||payment==='PENDIENTE'?'Pedido recibido':order.estado||'Pedido recibido',icon:'🛍️',stage:0};
};
const orderTimestamp=value=>value?new Intl.DateTimeFormat('es-GT',{dateStyle:'short',timeStyle:'medium'}).format(new Date(value)):'—';
const orderProgress=(order,status)=>{
  if(status.key==='cancelled')return '<div class="order-progress"><span class="done">✓ Pedido recibido</span><i></i><span>○ '+escapeAccountHtml(status.label)+'</span></div>';
  const steps=[['Pedido recibido',0],[order.metodo_entrega==='RETIRO_TIENDA'?'Listo para retirar':'Preparado',1],...(order.metodo_entrega==='RETIRO_TIENDA'?[]:[['Enviado',2]]),['Entregado',3]];
  return '<div class="order-progress">'+steps.map(([label,stage])=>'<span class="'+(stage<=status.stage?'done':'')+'">'+(stage<=status.stage?'✓':'○')+' '+label+'</span>').join('<i></i>')+'</div>';
};
const orderMoney=value=>`Q${(Number(value)||0).toFixed(2)}`;
const orderDate=value=>value?new Intl.DateTimeFormat('es-GT',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)):'—';
async function setupOrdersDashboard(){const host=byId('ordersList');if(!host||!authClient)return;const {data:{user}}=await authClient.auth.getUser();if(!user)return;const result=await authClient.from('pedidos_ecommerce').select('id,numero,estado,estado_entrega,total,fecha_creacion,fecha_pago,fecha_cancelacion,fecha_preparado,fecha_envio,fecha_entrega,direccion_envio,costo_envio,metodo_entrega,metodo_pago').eq('cliente_id',user.id).order('fecha_creacion',{ascending:false});if(result.error){host.textContent='No pudimos cargar tus pedidos.';return}const orders=result.data||[];if(!orders.length){host.innerHTML='<div class="orders-empty"><strong>Aún no tienes pedidos.</strong><span>Cuando realices una compra, podrás seguirla aquí.</span></div>';return}const lineResult=await authClient.from('pedidos_ecommerce_detalle').select('pedido_id,producto_id,cantidad,precio_unitario,total_linea').in('pedido_id',orders.map(order=>order.id));const lines=lineResult.data||[],ids=[...new Set(lines.map(line=>line.producto_id).filter(Boolean))];let products=[];if(ids.length){const productResult=await authClient.from('catalogo_productos').select('id,nombre,nombre_corto,slug,precio_base').in('id',ids);products=productResult.data||[]}const productById=new Map(products.map(product=>[product.id,product])),linesByOrder=new Map();lines.forEach(line=>{const list=linesByOrder.get(line.pedido_id)||[];list.push({...line,product:productById.get(line.producto_id)});linesByOrder.set(line.pedido_id,list)});const totals={total:orders.length,processing:0,delivered:0,cancelled:0};orders.forEach(order=>{const status=orderStatus(order);if(status.key==='processing')totals.processing++;if(status.key==='delivered')totals.delivered++;if(status.key==='cancelled')totals.cancelled++});host.innerHTML=`<div class="orders-intro"><p class="eyebrow">HISTORIAL DE COMPRAS</p><p>Consulta, sigue y repite tus compras en San Martín.</p></div><div class="order-summary"><div><span>🛍️</span><b>${totals.total}</b><small>Pedidos totales</small></div><div><span>🚚</span><b>${totals.processing}</b><small>En proceso</small></div><div><span>✅</span><b>${totals.delivered}</b><small>Entregados</small></div><div><span>↩️</span><b>${totals.cancelled}</b><small>Devueltos / cancelados</small></div></div><div class="orders-list">${orders.map(order=>{const status=orderStatus(order),items=linesByOrder.get(order.id)||[],subtotal=items.reduce((sum,item)=>sum+(Number(item.total_linea)||0),0),shipping=Number(order.costo_envio)||0,address=order.direccion_envio||{},addressText=[address.nombre,address.direccion_completa,address.municipio,address.departamento].filter(Boolean).map(escapeAccountHtml).join(', ')||'No disponible';return `<article class="order-card"><header><div><span class="order-number">Pedido #${escapeAccountHtml(order.numero||order.id.slice(0,8))}</span><small>${orderDate(order.fecha_creacion)}</small></div><span class="order-status ${status.key}">${status.icon} ${escapeAccountHtml(status.label)}</span></header>${orderProgress(order,status)}<div class="order-items">${items.length?items.slice(0,3).map(item=>`<div><span class="order-product-image">🛍️</span><span><strong>${escapeAccountHtml(item.product?.nombre_corto||item.product?.nombre||'Producto')}</strong><small>${Number(item.cantidad)||0} × ${orderMoney(item.precio_unitario)}</small></span><b>${orderMoney(item.total_linea)}</b></div>`).join(''):'<p>El detalle de productos estará disponible pronto.</p>'}</div><footer><strong>Total: ${orderMoney(order.total)}</strong><details><summary>Ver pedido</summary><dl><div><dt>Estado de pago</dt><dd>${escapeAccountHtml(order.estado||'Pendiente')}</dd></div>${[['Preparado',order.fecha_preparado],['Enviado',order.fecha_envio],['Entregado',order.fecha_entrega]].filter(([,date])=>date).map(([label,date])=>`<div><dt>${label}</dt><dd>${orderTimestamp(date)}</dd></div>`).join('')}<div><dt>Pago</dt><dd>${escapeAccountHtml(order.metodo_pago||'No disponible')}</dd></div><div><dt>Entrega</dt><dd>${escapeAccountHtml(order.metodo_entrega||'No disponible')}</dd></div><div><dt>Subtotal</dt><dd>${orderMoney(subtotal)}</dd></div><div><dt>Envío</dt><dd>${orderMoney(shipping)}</dd></div><div><dt>Dirección</dt><dd>${addressText}</dd></div></dl></details>${status.key==='delivered'?`<button type="button" class="reorder-button" data-reorder="${escapeAccountHtml(order.id)}">Comprar nuevamente</button>`:''}</footer></article>`}).join('')}</div>`;host.querySelectorAll('[data-reorder]').forEach(button=>button.addEventListener('click',()=>{const items=linesByOrder.get(button.dataset.reorder)||[],cart=items.filter(item=>item.product).map(item=>({producto_id:String(item.producto_id),nombre:item.product.nombre_corto||item.product.nombre,image:'',cantidad:Math.max(1,Math.min(99,Number(item.cantidad)||1)),precioOriginal:Number(item.precio_unitario)||0,precioOferta:null,precio:Number(item.precio_unitario)||0,descuentoUnitario:0}));localStorage.setItem('sanmartin_ecommerce_cart_v1',JSON.stringify(cart));window.location.href='index.html'}));}
async function setupFavoriteCards(){const host=byId('favoritesList');if(!host||!authClient)return;const {data:{user}}=await authClient.auth.getUser();if(!user)return;const favorites=await authClient.from('favoritos_ecommerce').select('producto_id').eq('usuario_id',user.id);const ids=(favorites.data||[]).map(item=>item.producto_id);if(!ids.length){host.innerHTML='<div class="orders-empty"><strong>Aún no tienes favoritos.</strong><span>Guarda productos con el corazón para encontrarlos aquí.</span></div>';return}const [productResult,imageResult,categoryResult]=await Promise.all([authClient.from('catalogo_productos').select('id,nombre,nombre_corto,descripcion_corta,precio_base,categoria_id').in('id',ids),authClient.from('producto_imagenes').select('producto_id,url_publica,storage_bucket,storage_path,es_principal,orden').in('producto_id',ids).eq('activo',true).order('es_principal',{ascending:false}).order('orden',{ascending:true}),authClient.from('categorias').select('id,nombre')]);const imageByProduct=new Map();(imageResult.data||[]).forEach(image=>{if(!imageByProduct.has(image.producto_id))imageByProduct.set(image.producto_id,image)});const categoryById=new Map((categoryResult.data||[]).map(category=>[category.id,category.nombre]));const imageUrl=image=>image?.url_publica||image?.storage_bucket&&image?.storage_path?authClient.storage.from(image.storage_bucket).getPublicUrl(image.storage_path).data.publicUrl:'';host.innerHTML=(productResult.data||[]).map(product=>{const image=imageUrl(imageByProduct.get(product.id)),name=product.nombre_corto||product.nombre,description=product.descripcion_corta||'Información y presentación disponibles próximamente.';return `<article class="product-card favorite-product-card"><button class="favorite is-saved" data-remove-favorite="${escapeAccountHtml(product.id)}" aria-label="Quitar ${escapeAccountHtml(name)} de favoritos">♥</button><div class="product-image">${image?`<img src="${escapeAccountHtml(image)}" alt="${escapeAccountHtml(name)}" loading="lazy">`:'<span class="favorite-image-empty">🛍️</span>'}</div><div class="product-info"><span class="product-subcategory">${escapeAccountHtml(categoryById.get(product.categoria_id)||'Favorito')}</span><strong class="product-name">${escapeAccountHtml(name)}</strong><p class="product-description">${escapeAccountHtml(description)}</p><div class="product-pricing"><strong class="base-price">Q${Number(product.precio_base||0).toFixed(2)}</strong></div><button class="add-button" data-favorite-cart="${escapeAccountHtml(product.id)}">Agregar al carrito <span aria-hidden="true">→</span></button></div></article>`}).join('');host.querySelectorAll('[data-remove-favorite]').forEach(button=>button.addEventListener('click',async()=>{await authClient.from('favoritos_ecommerce').delete().eq('usuario_id',user.id).eq('producto_id',button.dataset.removeFavorite);setupFavoriteCards()}));host.querySelectorAll('[data-favorite-cart]').forEach(button=>button.addEventListener('click',()=>{const product=(productResult.data||[]).find(item=>String(item.id)===button.dataset.favoriteCart);if(!product)return;const cart=JSON.parse(localStorage.getItem('sanmartin_ecommerce_cart_v1')||'[]'),existing=cart.find(item=>String(item.producto_id)===String(product.id));if(existing)existing.cantidad=Math.min(99,(Number(existing.cantidad)||0)+1);else cart.push({producto_id:String(product.id),nombre:product.nombre_corto||product.nombre,image:imageUrl(imageByProduct.get(product.id)),cantidad:1,precioOriginal:Number(product.precio_base)||0,precioOferta:null,precio:Number(product.precio_base)||0,descuentoUnitario:0});localStorage.setItem('sanmartin_ecommerce_cart_v1',JSON.stringify(cart));button.textContent='Agregado ✓'}));}
// Registro con consentimiento explícito de los documentos legales publicados.
async function setupLogin(){
  const form=byId('authForm');
  if(!form||!authClient)return;
  let signup=false;
  const agreementMessage=byId('agreementMessage');
  const servedFromWeb=['http:','https:'].includes(window.location.protocol);
  const requireWebOrigin=()=>{
    if(servedFromWeb)return false;
    showMessage('authMessage','Abre la tienda desde http://localhost; Supabase Auth no funciona con archivos file://.',true);
    return true;
  };
  const setMode=mode=>{
    signup=mode;
    form.classList.toggle('is-signup',mode);
    byId('authTitle').textContent=mode?'Crea tu cuenta':'Inicia sesión';
    byId('authLead').textContent=mode?'Guarda tus pedidos, favoritos y una dirección de entrega.':'Accede a tus pedidos, favoritos y datos de entrega.';
    byId('authModeButton').textContent=mode?'Iniciar sesión':'Crear cuenta';
    byId('authSwitchLabel').textContent=mode?'¿Ya tienes cuenta?':'¿No tienes cuenta?';
    form.querySelector('.auth-submit').textContent=mode?'Crear cuenta':'Iniciar sesión';
    form.querySelectorAll('.signup-only').forEach(section=>section.hidden=!mode);
    form.querySelectorAll('.signup-only input').forEach(input=>input.required=mode);
    if(agreementMessage)agreementMessage.hidden=true;
  };
  byId('authModeButton').addEventListener('click',()=>setMode(!signup));
  byId('googleLogin').addEventListener('click',async()=>{
    if(requireWebOrigin())return;
    const {error}=await authClient.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirectUrl()}});
    if(error)showMessage('authMessage',error.message,true);
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(requireWebOrigin())return;
    const values=Object.fromEntries(new FormData(form));
    if(signup&&(!values.acepta_privacidad||!values.acepta_terminos)){
      if(agreementMessage)agreementMessage.hidden=false;
      showMessage('authMessage','Acepta ambos documentos para crear tu cuenta.',true);
      return;
    }
    if(!form.reportValidity())return;
    if(agreementMessage)agreementMessage.hidden=true;
    showMessage('authMessage','Procesando…');
    let result;
    if(signup){
      result=await authClient.auth.signUp({
        email:values.email,
        password:values.password,
        options:{
          emailRedirectTo:redirectUrl(),
          data:{
            nombre:values.nombre,
            apellido:values.apellido,
            acepto_aviso_privacidad:true,
            acepto_terminos_condiciones:true,
            consentimiento_version:'2026-10-06',
            consentimiento_fecha:new Date().toISOString()
          }
        }
      });
    }else result=await authClient.auth.signInWithPassword({email:values.email,password:values.password});
    if(result.error)return showMessage('authMessage',result.error.message,true);
    if(signup&&!result.data.session)return showMessage('authMessage','Revisa tu correo para confirmar la cuenta.');
    window.location.assign(redirectUrl());
  });
}
// La vista de cuenta administra únicamente el perfil. Pedidos y favoritos se cargan
// una sola vez mediante setupOrdersDashboard y setupFavoriteCards, más abajo.
async function setupAccount(){
  if(!byId('profileForm')||!authClient)return;
  const {data:{user}}=await authClient.auth.getUser();
  if(!user){window.location.href='login.html';return;}
  const {data:profile,error}=await authClient.from('perfiles').select('*').eq('id',user.id).maybeSingle();
  if(error)showMessage('accountMessage',error.message,true);
  const current=profile||{id:user.id,correo:user.email};
  const fill=(form,fields)=>fields.forEach(field=>{if(form.elements[field])form.elements[field].value=current[field]||'';});
  fill(byId('profileForm'),['nombre','segundo_nombre','apellido','segundo_apellido','telefono','correo']);
  fill(byId('addressForm'),['nombre_direccion','departamento','municipio','direccion_completa','referencia_direccion']);
  byId('accountName').textContent=`Hola, ${current.nombre||user.user_metadata?.nombre||'cliente'}`;
  const save=async(form,fields,message)=>{
    const values=Object.fromEntries(new FormData(form)),payload={};
    fields.forEach(field=>payload[field]=values[field]||null);
    const {error:saveError}=await authClient.rpc('actualizar_mi_perfil',{p_datos:payload});
    showMessage('accountMessage',saveError?saveError.message:message,Boolean(saveError));
  };
  byId('profileForm').addEventListener('submit',event=>{event.preventDefault();save(event.currentTarget,['nombre','segundo_nombre','apellido','segundo_apellido','telefono'],'Datos guardados correctamente.');});
  byId('addressForm').addEventListener('submit',event=>{event.preventDefault();save(event.currentTarget,['nombre_direccion','departamento','municipio','direccion_completa','referencia_direccion'],'Dirección guardada correctamente.');});
  document.querySelectorAll('[data-account-tab]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-account-tab],[data-account-panel]').forEach(element=>element.classList.remove('active'));
    button.classList.add('active');
    document.querySelector(`[data-account-panel="${button.dataset.accountTab}"]`)?.classList.add('active');
  }));
  byId('logoutButton').addEventListener('click',async()=>{await authClient.auth.signOut();window.location.href='index.html';});
}
syncHeader();setupLogin();setupAccount();setTimeout(setupOrdersDashboard,350);setTimeout(setupFavoriteCards,500);setTimeout(()=>{const tab=new URLSearchParams(window.location.search).get('tab');if(tab){document.querySelector(`[data-account-tab="${tab}"]`)?.click()}},600);

/* Recarga al regresar a la cuenta y cada 30 segundos mientras se ven los pedidos. */
async function renderOrderTracking(){return setupOrdersDashboard();}
const refreshVisibleOrders=()=>{if(document.visibilityState==='visible'&&document.querySelector('[data-account-panel="pedidos"].active'))setupOrdersDashboard();};
document.querySelector('[data-account-tab="pedidos"]')?.addEventListener('click',()=>setupOrdersDashboard());
window.addEventListener('focus',refreshVisibleOrders);
document.addEventListener('visibilitychange',refreshVisibleOrders);
setInterval(refreshVisibleOrders,30000);

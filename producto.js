(()=>{
// Fondo neutro de la ficha: se aplica de forma directa para evitar heredar el tono crema global.
document.documentElement.style.setProperty('background','#fff','important');
document.body.style.setProperty('background','#fff','important');

// La ficha reutiliza el mismo encabezado operativo de la tienda: búsqueda,
// categorías, cuenta, favoritos y carrito.
const existingProductHeader=document.querySelector('header.institutional-header');
if(existingProductHeader)existingProductHeader.remove();
document.querySelector('.announcement')?.remove();
if(!document.querySelector('.site-header')){
  const shell=document.createElement('template');
  shell.innerHTML=`<div class="announcement">Envío gratis en compras mayores a Q200</div>
    <header class="site-header" id="inicio">
      <div class="header-main container">
        <button class="icon-button menu-button" id="menuButton" aria-label="Abrir menú">☰</button>
        <a class="brand" href="index.html" aria-label="San Martín, inicio"><img class="brand-logo" src="assets/logotipo/logo-san-martin.png" alt="Logotipo de San Martín"><span><strong>San Martín</strong><small>papelería · librería</small></span></a>
        <label class="search-bar"><span>⌕</span><input id="searchInput" type="search" placeholder="Busca útiles, arte, decoración..."><button id="searchButton" aria-label="Buscar">Buscar</button></label>
        <nav class="header-actions" aria-label="Acciones de usuario">
          <a class="icon-button auth-link" data-auth-link href="login.html" aria-label="Iniciar sesión"><svg class="account-symbol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 21c.7-4.1 3.2-6.2 7.5-6.2s6.8 2.1 7.5 6.2"></path></svg><span>Iniciar sesión</span></a>
          <button class="icon-button" id="favoritesButton" aria-label="Favoritos">♡<span>Favoritos</span></button>
          <button class="icon-button cart-button" id="cartButton" aria-label="Abrir carrito"><svg class="cart-symbol" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.4L21 8H7"></path><circle cx="10" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle></svg><b id="cartCount">0</b><span data-cart-label>Q0.00</span></button>
        </nav>
      </div>
      <nav class="category-nav container" id="categoryNav" aria-label="Categorías principales" aria-live="polite"><span class="nav-loading">Cargando categorías…</span></nav>
    </header>`;
  document.body.insertBefore(shell.content,document.querySelector('main'));
}
const loadProductHeaderCategories=async()=>{
  const nav=document.querySelector('#categoryNav'),client=window.supabaseClient;
  if(!nav||!client)return;
  const {data,error}=await client.from('categorias').select('id,nombre,slug,categoria_padre_id,orden,icono').eq('activo',true).eq('visible_ecommerce',true).order('orden',{ascending:true,nullsFirst:false}).order('nombre',{ascending:true});
  if(error){console.warn('No se pudieron cargar las categorías de la ficha:',error.message);nav.textContent='Las categorías estarán disponibles pronto.';return;}
  const categories=data||[],childrenOf=id=>categories.filter(category=>category.categoria_padre_id===id);
  const categoryLink=(category,className='')=>{const link=document.createElement('a');link.href=category.slug?`catalogo.html?categoria=${encodeURIComponent(category.slug)}`:'catalogo.html';if(className)link.className=className;link.dataset.category=category.nombre;link.dataset.categoryId=category.id;link.textContent=`${category.icono?`${category.icono} `:''}${category.nombre}`;return link;};
  nav.replaceChildren();
  const all=document.createElement('a');all.href='catalogo.html';all.textContent='Todo el catálogo';all.dataset.category='Todos';nav.append(all);
  categories.filter(category=>!category.categoria_padre_id).forEach(parent=>{
    const children=childrenOf(parent.id);
    if(!children.length){nav.append(categoryLink(parent));return;}
    const dropdown=document.createElement('div');dropdown.className='nav-dropdown';
    dropdown.append(categoryLink(parent,'nav-parent-link'));
    const toggle=document.createElement('button');toggle.type='button';toggle.className='nav-parent';toggle.dataset.subnavToggle='true';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label',`Mostrar subcategorías de ${parent.nombre}`);toggle.innerHTML=`<span>${parent.nombre}</span><span class="subnav-toggle" aria-hidden="true" data-subnav-icon>⌄</span>`;
    const subnav=document.createElement('div');subnav.className='subnav';
    const viewAll=categoryLink(parent,'subnav-view-all');viewAll.textContent='Ver todo';subnav.append(viewAll,...children.map(category=>categoryLink(category)));
    dropdown.append(toggle,subnav);nav.append(dropdown);
  });
  const featured=document.createElement('a');featured.href='catalogo.html?destacados=1';featured.className='sale-link';featured.textContent='Destacados';nav.append(featured);
};
void loadProductHeaderCategories();
// El menú de la ficha se puede volver a renderizar de forma asíncrona; la
// delegación mantiene el acordeón operativo en móvil en todos esos casos.
document.addEventListener('click',event=>{
  const toggle=event.target.closest('#categoryNav .nav-parent');
  if(!toggle)return;
  event.preventDefault();event.stopPropagation();
  const dropdown=toggle.closest('.nav-dropdown');if(!dropdown)return;
  const open=!dropdown.classList.contains('open');
  dropdown.classList.toggle('open',open);
  toggle.setAttribute('aria-expanded',String(open));
  const label=toggle.getAttribute('aria-label')?.replace(/^(Mostrar|Ocultar) subcategorías de /,'')||'esta categoría';
  toggle.setAttribute('aria-label',`${open?'Ocultar':'Mostrar'} subcategorías de ${label}`);
  const icon=toggle.querySelector('[data-subnav-icon]');
  if(icon)icon.textContent=open?'⌃':'⌄';
},true);
// El pie de página de inicio también acompaña la ficha, con enlaces que siguen
// funcionando desde la ficha dinámica producto.html?slug=.
document.querySelector('footer')?.remove();
if(!document.querySelector('footer')){
  const footerShell=document.createElement('template');
  footerShell.innerHTML=`<footer><div class="container footer-grid"><div class="footer-identity"><a class="brand footer-brand" href="index.html" aria-label="San Martín, inicio"><img class="brand-logo" src="assets/logotipo/logo-san-martin.png" alt="Logotipo de San Martín"><span><strong>San Martín</strong><small>papelería · librería</small></span></a><a class="footer-slogan" href="slogan.html" aria-label="Conocer el manifiesto de San Martín"><span>SAN MARTÍN</span><strong>SOY DE LOS QUE HACEN.</strong><em>De los que tienen una idea y empiezan.</em><small>Estudian · Crean · Trabajan · Emprenden · Enseñan · Construyen</small></a></div><div><strong>Compra</strong><a href="catalogo.html">Catálogo</a><a href="index.html#destacados">Destacados</a><a href="index.html#inspiracion">Inspiración</a></div><div><strong>Ayuda</strong><a href="envios-entregas.html">Envíos y entregas</a><a href="cambios-devoluciones.html">Cambios y devoluciones</a><a href="contacto.html">Contáctanos</a></div><div><strong>Recibe novedades</strong><p>Ideas, lanzamientos y ofertas.</p><form class="newsletter" id="newsletter"><input type="email" placeholder="Tu correo electrónico" required><button aria-label="Suscribirme">→</button></form></div></div><div class="copyright container">© 2026 San Martin Papeleria Libreria. Todos los derechos reservados.</div></footer>`;
  document.body.append(footerShell.content);
}
if(!document.querySelector('#cartDrawer')){
  const cartShell=document.createElement('template');
  cartShell.innerHTML=`<aside class="cart-drawer" id="cartDrawer" aria-label="Carrito de compras" aria-hidden="true"><div class="cart-head"><h2>Tu carrito</h2><button class="icon-button" id="closeCart" aria-label="Cerrar carrito">×</button></div><div id="cartItems" class="cart-items"><p class="empty-cart">Aún no agregaste productos.</p></div><div class="cart-footer"><div class="checkout-options"><fieldset><legend>Forma de recibir</legend><label><input type="radio" name="deliveryMethod" value="RETIRO_TIENDA"> Recoger en tienda <b>Gratis</b></label><label><input type="radio" name="deliveryMethod" value="DOMICILIO"> Envío a domicilio <b>Q25.00</b></label></fieldset><fieldset><legend>Método de pago</legend><label><input type="radio" name="paymentMethod" value="CONTRA_ENTREGA"> Pago contra entrega</label></fieldset></div><div><span>Descuentos</span><strong id="cartDiscount">-Q0.00</strong></div><div><span>Envío</span><strong id="cartShipping">—</strong></div><div><span>Total</span><strong id="cartSubtotal">Q0.00</strong></div><button class="button button-dark checkout" id="checkoutButton">Confirmar pedido</button></div></aside><div class="overlay" id="overlay"></div><div class="toast" id="toast" role="status"></div>`;
  document.body.append(cartShell.content);
}
const loadProductHeaderScripts=async()=>{
  for(const src of ['script.js?v=product-header-1','carrito-cuenta.js?v=1','product-links.js?v=2','buscador-sku.js?v=3','auth.js?v=product-header-1']){
    await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.head.append(script);});
  }
};
void loadProductHeaderScripts().catch(error=>console.error('No se pudo iniciar el encabezado de la tienda:',error));
const detailClient=window.supabaseClient;
const q=new URLSearchParams(location.search),routeSlug=location.pathname.match(/\/producto\/([^/]+)\/?$/)?.[1],slug=q.get('slug')||routeSlug||null;
const esc=v=>{const e=document.createElement('span');e.textContent=String(v??'');return e.innerHTML};
const money=v=>`Q${Number(v||0).toFixed(2)}`;
const imageUrl=i=>i?.url_publica || (i?.storage_bucket && i?.storage_path ? detailClient.storage.from(i.storage_bucket).getPublicUrl(i.storage_path).data.publicUrl : '');
const activeOffer=(offers,id)=>offers.filter(o=>o.producto_id===id&&o.activo&&o.aplica_ecommerce&&new Date(o.fecha_inicio)<=new Date()&&(!o.fecha_fin||new Date(o.fecha_fin)>=new Date())).sort((a,b)=>b.oferta_porcentaje-a.oferta_porcentaje)[0];
async function loadProductDetail(){const host=document.querySelector('#productDetail');if(!slug){host.innerHTML='<p class="catalog-empty">No encontramos el producto solicitado.</p>';return}const result=await detailClient.from('catalogo_producto_detalle').select('*').eq('slug',slug).maybeSingle();if(result.error||!result.data){host.innerHTML='<p class="catalog-empty">Este producto no está disponible.</p>';return}const p=result.data;const [images,offers,categories,brands]=await Promise.all([detailClient.from('producto_imagenes').select('url_publica,storage_bucket,storage_path,alt_text,es_principal,orden').eq('producto_id',p.id).eq('activo',true).order('es_principal',{ascending:false}).order('orden'),detailClient.from('ofertas_producto').select('producto_id,oferta_porcentaje,fecha_inicio,fecha_fin,activo,aplica_ecommerce').eq('producto_id',p.id),detailClient.from('categorias').select('id,nombre,slug'),detailClient.from('marcas').select('id,nombre,slug')]);const imgs=images.data||[],main=imageUrl(imgs[0]),offer=activeOffer(offers.data||[],p.id),base=Number(p.precio_base),price=offer?base*(1-Number(offer.oferta_porcentaje)/100):base,category=(categories.data||[]).find(x=>x.id===p.categoria_id),brand=(brands.data||[]).find(x=>x.id===p.marca_id);document.title=`${p.titulo_seo||p.nombre} | San Martín`;document.querySelector('meta[name="description"]').content=p.descripcion_seo||p.descripcion_corta||p.nombre;const spec=[['Marca',brand?.nombre],['Presentación',p.presentacion],['Modelo',p.modelo],['Color',p.color],['Tamaño',p.tamano],['Material',p.material],['Contenido',p.contenido],['Piezas por paquete',p.piezas_por_paquete],['Peso',p.peso&&`${p.peso} ${p.unidad_peso||''}`],['Dimensiones',p.ancho&&`${p.ancho} × ${p.alto||'—'} × ${p.profundidad||'—'} ${p.unidad_dimensiones||''}`]].filter(([,v])=>v!==null&&v!==undefined&&v!=='');host.innerHTML=`<nav class="breadcrumb"><a href="index.html">Inicio</a> / <a href="catalogo.html${category?.slug?`?categoria=${encodeURIComponent(category.slug)}`:''}">${esc(category?.nombre||'Catálogo')}</a> / <span>${esc(p.nombre_corto||p.nombre)}</span></nav><div class="product-detail-grid"><section class="detail-gallery"><img id="detailMainImage" src="${esc(main)}" alt="${esc(imgs[0]?.alt_text||p.nombre)}">${imgs.length>1?`<div class="detail-thumbnails">${imgs.map((i,n)=>`<button type="button" data-image="${esc(imageUrl(i))}" aria-label="Ver imagen ${n+1}"><img src="${esc(imageUrl(i))}" alt=""></button>`).join('')}</div>`:''}</section><section class="detail-summary"><p class="eyebrow">${esc(brand?.nombre||category?.nombre||'SAN MARTÍN')}</p><h1>${esc(p.nombre_corto||p.nombre)}</h1>${p.descripcion_corta?`<p class="detail-lead">${esc(p.descripcion_corta)}</p>`:''}${offer?`<p class="detail-offer">Oferta ${esc(offer.oferta_porcentaje)}% de descuento</p><p class="detail-price"><del>${money(base)}</del> <strong>${money(price)}</strong></p>`:`<p class="detail-price"><strong>${money(base)}</strong></p>`}<p class="availability">Disponible sujeto a confirmación de inventario.</p><div class="detail-quantity"><button type="button" data-change="-1" aria-label="Reducir cantidad">−</button><output id="detailQuantity">1</output><button type="button" data-change="1" aria-label="Aumentar cantidad">+</button></div><button class="button button-dark" id="detailAdd">Agregar al carrito</button><button class="detail-favorite" id="detailFavorite" type="button">♡ Guardar en favoritos</button><div class="detail-trust"><p>Retiro gratis en tienda.</p><p>Envío en Guatemala desde Q100.</p><p>Cambios y devoluciones según políticas publicadas.</p></div></section></div>${p.descripcion_larga?`<section class="detail-section"><h2>Descripción</h2><p>${esc(p.descripcion_larga).replace(/\n/g,'<br>')}</p></section>`:''}${spec.length?`<section class="detail-section"><h2>Especificaciones</h2><dl class="detail-specs">${spec.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>`:''}`;let quantity=1;host.querySelectorAll('[data-change]').forEach(b=>b.addEventListener('click',()=>{quantity=Math.max(1,Math.min(99,quantity+Number(b.dataset.change)));host.querySelector('#detailQuantity').textContent=quantity}));host.querySelector('#detailAdd').addEventListener('click',()=>{const cart=JSON.parse(localStorage.getItem('sanmartin_ecommerce_cart_v1')||'[]'),item=cart.find(x=>x.producto_id===p.id);if(item)item.cantidad=Math.min(99,Number(item.cantidad)+quantity);else cart.push({producto_id:p.id,nombre:p.nombre_corto||p.nombre,image:main,cantidad:quantity,precioOriginal:base,precioOferta:offer?price:null,precio:price});localStorage.setItem('sanmartin_ecommerce_cart_v1',JSON.stringify(cart));location.href='catalogo.html'});host.querySelectorAll('[data-image]').forEach(b=>b.addEventListener('click',()=>host.querySelector('#detailMainImage').src=b.dataset.image));}
loadProductDetail();

/* Metadatos por ficha: canonical, Open Graph y datos estructurados para buscadores. */
(()=>{if(!detailClient||!slug)return;const meta=(key,value,property=false)=>{let tag=document.head.querySelector(`meta[${property?'property':'name'}="${key}"]`);if(!tag){tag=document.createElement('meta');tag.setAttribute(property?'property':'name',key);document.head.append(tag);}tag.content=value;};const run=async()=>{const result=await detailClient.from('catalogo_producto_detalle').select('*').eq('slug',slug).maybeSingle();if(result.error||!result.data)return;const p=result.data,canonical=new URL(`producto/${encodeURIComponent(slug)}/`,document.baseURI).href;let link=document.head.querySelector('link[rel="canonical"]');if(!link){link=document.createElement('link');link.rel='canonical';document.head.append(link);}link.href=canonical;const images=await detailClient.from('producto_imagenes').select('url_publica,storage_bucket,storage_path,es_principal,orden').eq('producto_id',p.id).eq('activo',true).order('es_principal',{ascending:false}).order('orden').limit(1),offers=await detailClient.from('ofertas_producto').select('oferta_porcentaje,fecha_inicio,fecha_fin,activo,aplica_ecommerce').eq('producto_id',p.id),availability=await detailClient.rpc('estado_disponibilidad_ecommerce',{p_producto_id:p.id}),image=imageUrl(images.data?.[0]),offer=activeOffer((offers.data||[]).map(item=>({...item,producto_id:p.id})),p.id),price=Number(p.precio_base)*(offer?1-Number(offer.oferta_porcentaje)/100:1),available=['DISPONIBLE','POCAS_UNIDADES'].includes(availability.data?.[0]?.estado),name=p.titulo_seo||p.nombre,description=p.descripcion_seo||p.descripcion_corta||p.nombre;meta('description',description);meta('og:type','product',true);meta('og:title',name,true);meta('og:description',description,true);meta('og:url',canonical,true);if(image)meta('og:image',image,true);meta('twitter:card',image?'summary_large_image':'summary');meta('twitter:title',name);meta('twitter:description',description);const schema={'@context':'https://schema.org','@type':'Product',name,description,sku:p.sku||undefined,image:image?[image]:undefined,offers:{'@type':'Offer',url:canonical,priceCurrency:'GTQ',price:price.toFixed(2),availability:availability.data?.[0]?.estado==='AGOTADO'?'https://schema.org/OutOfStock':available?'https://schema.org/InStock':undefined,itemCondition:'https://schema.org/NewCondition'}};let json=document.querySelector('#productJsonLd');if(!json){json=document.createElement('script');json.type='application/ld+json';json.id='productJsonLd';document.head.append(json);}json.textContent=JSON.stringify(schema);};run();})();

/* Zoom accesible para revisar detalles visuales sin abandonar la ficha. */
(()=>{const host=document.querySelector('#productDetail');if(!host)return;let initialized=false;const run=async()=>{const image=host.querySelector('#detailMainImage');if(initialized||!image)return;initialized=true;image.tabIndex=0;image.setAttribute('role','button');image.setAttribute('aria-label','Ampliar imagen del producto');const dialog=document.createElement('dialog');dialog.className='image-zoom-dialog';dialog.innerHTML='<button type="button" class="image-zoom-close" aria-label="Cerrar imagen ampliada">×</button><img alt="">';document.body.append(dialog);const zoomed=dialog.querySelector('img'),open=()=>{zoomed.src=image.currentSrc||image.src;zoomed.alt=image.alt;dialog.showModal();};image.addEventListener('click',open);image.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});dialog.querySelector('.image-zoom-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});const current=await detailClient.from('catalogo_producto_detalle').select('sku').eq('slug',slug).maybeSingle();const specs=host.querySelector('.detail-specs');if(current.data?.sku&&specs&&!specs.querySelector('[data-product-sku]'))specs.insertAdjacentHTML('afterbegin',`<div data-product-sku><dt>SKU</dt><dd>${esc(current.data.sku)}</dd></div>`);};new MutationObserver(run).observe(host,{childList:true,subtree:true});run();})();

/* Prioriza co-compras agregadas y conserva recomendaciones por categoría como respaldo. */
(()=>{const host=document.querySelector('#productDetail');if(!detailClient||!host||!slug)return;let done=false;const run=async()=>{if(done||!document.querySelector('#detailAdd'))return;done=true;const current=await detailClient.from('catalogo_producto_detalle').select('id').eq('slug',slug).maybeSingle();if(current.error||!current.data)return;const result=await detailClient.rpc('productos_comprados_juntos_ecommerce',{p_producto_id:current.data.id,p_limite:4});if(result.error||!result.data?.length)return;const items=result.data,ids=items.map(item=>item.id),imageResult=await detailClient.from('producto_imagenes').select('producto_id,url_publica,storage_bucket,storage_path,es_principal,orden').in('producto_id',ids).eq('activo',true).order('es_principal',{ascending:false}).order('orden'),byProduct=new Map();(imageResult.data||[]).forEach(image=>{if(!byProduct.has(image.producto_id))byProduct.set(image.producto_id,image)});let section=host.querySelector('.related-products');if(!section){section=document.createElement('section');section.className='detail-section related-products';host.append(section);}section.innerHTML=`<h2>Comprados juntos frecuentemente</h2><p class="related-note">Recomendaciones basadas en compras confirmadas.</p><div class="related-grid">${items.map(item=>`<a class="related-card" href="producto.html?slug=${encodeURIComponent(item.slug)}"><img src="${esc(imageUrl(byProduct.get(item.id)))}" alt="${esc(item.nombre_corto||item.nombre)}"><span>${esc(item.nombre_corto||item.nombre)}</span><strong>${money(item.precio_base)}</strong></a>`).join('')}</div>`;};new MutationObserver(run).observe(host,{childList:true,subtree:true});run();})();

/* Favoritos de la ficha; RLS limita la operación a auth.uid(). */
(()=>{
  const host=document.querySelector('#productDetail');
  // Las fichas pueden abrirse desde producto.html?slug=... o desde /producto/slug/.
  const currentSlug=slug;
  if(!detailClient||!host||!currentSlug)return;
  let productId=null;
  const setFavorite=(button,saved)=>{button.dataset.saved=String(saved);button.textContent=saved?'♥ Guardado en favoritos':'♡ Guardar en favoritos';button.setAttribute('aria-pressed',String(saved));};
  const sync=async()=>{const button=document.querySelector('#detailFavorite');if(!button||productId)return;const product=await detailClient.from('catalogo_producto_detalle').select('id').eq('slug',currentSlug).maybeSingle();if(product.error||!product.data)return;productId=product.data.id;const {data:{user}}=await detailClient.auth.getUser();if(!user)return;const favorite=await detailClient.from('favoritos_ecommerce').select('id').eq('usuario_id',user.id).eq('producto_id',productId).maybeSingle();setFavorite(button,Boolean(favorite.data));};
  new MutationObserver(sync).observe(host,{childList:true,subtree:true});
  host.addEventListener('click',async event=>{const button=event.target.closest('#detailFavorite');if(!button)return;const {data:{user}}=await detailClient.auth.getUser();if(!user){location.href=`login.html?returnTo=${encodeURIComponent(`producto.html?slug=${currentSlug}`)}`;return;}if(!productId)await sync();if(!productId)return;button.disabled=true;const saved=button.dataset.saved==='true';const query=detailClient.from('favoritos_ecommerce');const result=saved?await query.delete().eq('usuario_id',user.id).eq('producto_id',productId):await query.insert({usuario_id:user.id,producto_id:productId});button.disabled=false;if(result.error){alert(result.error.message);return;}setFavorite(button,!saved);});
  sync();
})();

/* Estado comercial y recomendaciones: nunca revela cantidades de inventario. */
(()=>{
  const host=document.querySelector('#productDetail');
  if(!detailClient||!host||!slug)return;
  let loaded=false,loading=false;
  const run=async()=>{
    if(loaded||loading||!host.querySelector('#detailAdd'))return;
    loading=true;
    const product=await detailClient.from('catalogo_producto_detalle').select('id,categoria_id').eq('slug',slug).maybeSingle();
    if(product.error||!product.data){loading=false;return;}
    loaded=true;
    const availability=await detailClient.rpc('estado_disponibilidad_ecommerce',{p_producto_id:product.data.id});
    const status=host.querySelector('.availability'),add=host.querySelector('#detailAdd');
    if(status&&availability.data?.[0]){status.textContent=availability.data[0].mensaje;status.dataset.state=availability.data[0].estado;add.disabled=availability.data[0].estado==='AGOTADO';}
    const [relatedResult,categoryResult]=await Promise.all([
      detailClient.from('catalogo_productos').select('id,nombre,nombre_corto,slug,precio_base,destacado_ecommerce,descripcion_corta').eq('categoria_id',product.data.categoria_id).neq('id',product.data.id).order('id').limit(1000),
      detailClient.from('categorias').select('nombre').eq('id',product.data.categoria_id).maybeSingle()
    ]);
    const related=relatedResult;
    if(related.data?.length>4){const key=`sanmartin_related_${product.data.id}`,saved=JSON.parse(sessionStorage.getItem(key)||'{}'),last=new Set(Array.isArray(saved)?saved:saved.last||[]),pool=[...related.data],shuffle=list=>{for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;};let seen=new Set(Array.isArray(saved)?saved:saved.seen||[]),available=pool.filter(item=>!seen.has(String(item.id)));if(available.length<4){seen=new Set(last);available=pool.filter(item=>!seen.has(String(item.id)));}const selected=shuffle(available).slice(0,4),selectedIds=selected.map(item=>String(item.id));selectedIds.forEach(id=>seen.add(id));related.data=selected;sessionStorage.setItem(key,JSON.stringify({seen:[...seen],last:selectedIds}));}
    if(related.error||!related.data?.length)return;
    const ids=related.data.map(item=>item.id);
    const [images,offers]=await Promise.all([
      detailClient.from('producto_imagenes').select('producto_id,url_publica,storage_bucket,storage_path,es_principal,orden').in('producto_id',ids).eq('activo',true).order('es_principal',{ascending:false}).order('orden'),
      detailClient.from('ofertas_producto').select('producto_id,oferta_porcentaje,fecha_inicio,fecha_fin,activo,aplica_ecommerce').in('producto_id',ids)
    ]);
    const byProduct=new Map();
    (images.data||[]).forEach(image=>{if(!byProduct.has(image.producto_id))byProduct.set(image.producto_id,image);});
    const section=host.querySelector('[data-related-category]')||document.createElement('section');
    section.className='detail-section related-products';
    section.dataset.relatedCategory='true';
    const entries=new Map(related.data.map(item=>{const offer=activeOffer((offers.data||[]),item.id),base=Number(item.precio_base),price=offer?base*(1-Number(offer.oferta_porcentaje)/100):base;return [String(item.id),{...item,base,price,offer,image:imageUrl(byProduct.get(item.id))}];}));
    const category=categoryResult.data?.nombre||'Producto relacionado';
    section.innerHTML=`<h2>También te puede interesar</h2><div class="related-grid">${[...entries.values()].map(item=>`<article class="product-card related-card"><a class="product-detail-link" href="producto.html?slug=${encodeURIComponent(item.slug)}" aria-label="Ver detalle de ${esc(item.nombre_corto||item.nombre)}"><div class="product-image">${item.offer?`<span class="tag">Oferta -${esc(item.offer.oferta_porcentaje)}%</span>`:''}<img src="${esc(item.image)}" alt="${esc(item.nombre_corto||item.nombre)}" loading="lazy"></div><div class="product-info"><span class="product-subcategory">${esc(category)}</span><strong class="product-name">${esc(item.nombre_corto||item.nombre)}</strong><p class="product-description">${esc(item.descripcion_corta||'Información y presentación disponibles próximamente.')}</p><div class="product-pricing">${item.offer?`<span class="old-base-price">${money(item.base)}</span><strong class="offer-price">${money(item.price)}</strong>`:`<strong class="base-price">${money(item.price)}</strong>`}</div></div></a><button class="add-button" type="button" data-related-add="${esc(item.id)}">Agregar al carrito <span aria-hidden="true">→</span></button></article>`).join('')}</div>`;
    section.querySelectorAll('[data-related-add]').forEach(button=>button.addEventListener('click',()=>{const item=entries.get(button.dataset.relatedAdd);if(!item)return;const cart=JSON.parse(localStorage.getItem('sanmartin_ecommerce_cart_v1')||'[]'),existing=cart.find(entry=>String(entry.producto_id)===String(item.id));if(existing)existing.cantidad=Math.min(99,Number(existing.cantidad)+1);else cart.push({producto_id:item.id,nombre:item.nombre_corto||item.nombre,image:item.image,cantidad:1,precioOriginal:item.base,precioOferta:item.offer?item.price:null,precio:item.price});localStorage.setItem('sanmartin_ecommerce_cart_v1',JSON.stringify(cart));button.innerHTML='Agregado ✓';setTimeout(()=>{button.innerHTML='Agregar al carrito <span aria-hidden="true">→</span>';},1400);}));
    if(!section.isConnected)host.append(section);
  };
  new MutationObserver(run).observe(host,{childList:true,subtree:true});
  run();
})();

/* Identificadores comerciales: SKU y código de barras, si fueron registrados. */
(()=>{const host=document.querySelector('#productDetail');if(!detailClient||!host||!slug)return;let loaded=false;const run=async()=>{if(loaded||!host.querySelector('#detailAdd'))return;const result=await detailClient.from('catalogo_producto_detalle').select('sku,codigo_barras').eq('slug',slug).maybeSingle();if(result.error||!result.data)return;loaded=true;const values=[['sku','SKU',result.data.sku],['barcode','Código de barras',result.data.codigo_barras]].filter(([, ,value])=>value!==null&&value!==undefined&&String(value).trim()!=='');if(!values.length)return;let specs=host.querySelector('.detail-specs');if(!specs){const section=document.createElement('section');section.className='detail-section';section.innerHTML='<h2>Identificación del producto</h2><dl class="detail-specs"></dl>';host.append(section);specs=section.querySelector('.detail-specs');}values.reverse().forEach(([key,label,value])=>{let row=specs.querySelector(`[data-product-${key}]`);if(!row){row=document.createElement('div');row.setAttribute(`data-product-${key}`,'');specs.prepend(row);}row.innerHTML=`<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`;});};new MutationObserver(run).observe(host,{childList:true,subtree:true});run();})();

/* Las recomendaciones ocupan dos columnas, también si un estilo externo cambia la cuadrícula. */
(()=>{const host=document.querySelector('#productDetail');if(!host)return;const apply=()=>{const mobile=window.matchMedia('(max-width:760px)').matches;host.querySelectorAll('.related-grid').forEach(grid=>{grid.style.gridTemplateColumns=mobile?'repeat(2,minmax(0,1fr))':'';});};new MutationObserver(apply).observe(host,{childList:true,subtree:true});window.addEventListener('resize',apply);apply();})();
})();



(() => {
 const p=JSON.parse(document.querySelector('#productSnapshot').textContent);let quantity=1;
 document.querySelectorAll('[data-change]').forEach(b=>b.addEventListener('click',()=>{quantity=Math.max(1,Math.min(99,quantity+Number(b.dataset.change)));document.querySelector('#detailQuantity').textContent=quantity;}));
 document.querySelector('#detailAdd').addEventListener('click',async()=>{
 const button=document.querySelector('#detailAdd'),status=document.querySelector('#productStatus');button.disabled=true;
 try{const client=window.supabaseClient;if(!client)throw Error('No se pudo conectar. Inténtalo nuevamente.');
 const store=window.SanMartinCarrito,context=await store.ensureReady();
 const [product,offers]=await Promise.all([client.from('catalogo_productos').select('id,nombre,precio_base').eq('id',p.id).maybeSingle(),client.from('ofertas_producto').select('*').eq('producto_id',p.id)]);
 if(product.error||offers.error||!product.data)throw Error('No se pudo verificar el producto. Inténtalo nuevamente.');
 const now=Date.now(),discount=Math.max(0,...(offers.data||[]).filter(o=>o.activo&&o.aplica_ecommerce&&Date.parse(o.fecha_inicio)<=now&&(!o.fecha_fin||Date.parse(o.fecha_fin)>=now)).map(o=>Number(o.oferta_porcentaje))),base=Number(product.data.precio_base),amount=Number((base*(1-discount/100)).toFixed(2));if(!Number.isFinite(amount)||amount<=0)throw Error('Precio no disponible.');
 if(amount!==Number(p.precio)){status.textContent=`El precio actual es Q${amount.toFixed(2)}. Pulsa otra vez para agregarlo.`;p.precio=amount;document.querySelector('.detail-price strong').textContent=`Q${amount.toFixed(2)}`;const schema=JSON.parse(document.querySelector('#productJsonLd').textContent);schema.offers.price=amount.toFixed(2);document.querySelector('#productJsonLd').textContent=JSON.stringify(schema);return;}
 const next=window.SanMartinPresentaciones.readCart([...store.read(),{producto_id:p.id,nombre:product.data.nombre,image:p.image,cantidad:quantity}]);
 const verified=await window.SanMartinPresentaciones.hydrate(client,next);window.SanMartinPresentaciones.requirements(verified);
 store.replace(verified,context);await store.flush();
 if(store.sameActor(context)&&store.state().status==='ready')location.href=new URL('catalogo.html',document.baseURI).href;
 }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
 });
})();

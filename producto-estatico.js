(() => {
 const p=JSON.parse(document.querySelector('#productSnapshot').textContent);let quantity=1;
 document.querySelectorAll('[data-change]').forEach(b=>b.addEventListener('click',()=>{quantity=Math.max(1,Math.min(99,quantity+Number(b.dataset.change)));document.querySelector('#detailQuantity').textContent=quantity;}));
 document.querySelector('#detailAdd').addEventListener('click',async()=>{
 const button=document.querySelector('#detailAdd'),status=document.querySelector('#productStatus');button.disabled=true;
 try{const client=window.supabaseClient;if(!client)throw Error('No se pudo conectar. Inténtalo nuevamente.');
 const [product,inventory,offers]=await Promise.all([client.from('catalogo_productos').select('id,nombre,precio_base').eq('id',p.id).maybeSingle(),client.rpc('estado_disponibilidad_ecommerce',{p_producto_id:p.id}),client.from('ofertas_producto').select('*').eq('producto_id',p.id)]);
 const state=inventory.data?.[0]?.estado;if(product.error||inventory.error||offers.error||!product.data||!['DISPONIBLE','POCAS_UNIDADES'].includes(state))throw Error('No se pudo confirmar disponibilidad. Consulta con la tienda.');
 const now=Date.now(),discount=Math.max(0,...(offers.data||[]).filter(o=>o.activo&&o.aplica_ecommerce&&Date.parse(o.fecha_inicio)<=now&&(!o.fecha_fin||Date.parse(o.fecha_fin)>=now)).map(o=>Number(o.oferta_porcentaje))),base=Number(product.data.precio_base),amount=Number((base*(1-discount/100)).toFixed(2));if(!Number.isFinite(amount)||amount<=0)throw Error('Precio no disponible.');
 if(amount!==Number(p.precio)){status.textContent=`El precio actual es Q${amount.toFixed(2)}. Pulsa otra vez para agregarlo.`;p.precio=amount;document.querySelector('.detail-price strong').textContent=`Q${amount.toFixed(2)}`;const schema=JSON.parse(document.querySelector('#productJsonLd').textContent);schema.offers.price=amount.toFixed(2);document.querySelector('#productJsonLd').textContent=JSON.stringify(schema);return;}
 const cart=JSON.parse(localStorage.getItem('sanmartin_ecommerce_cart_v1')||'[]'),item=cart.find(x=>x.producto_id===p.id);if(item){item.cantidad=Math.min(99,Number(item.cantidad)+quantity);Object.assign(item,{precioOriginal:base,precio:amount,precioOferta:discount?amount:null});}else cart.push({producto_id:p.id,nombre:product.data.nombre,image:p.image,cantidad:quantity,precioOriginal:base,precioOferta:discount?amount:null,precio:amount});localStorage.setItem('sanmartin_ecommerce_cart_v1',JSON.stringify(cart));location.href=new URL('catalogo.html',document.baseURI).href;
 }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
 });
})();

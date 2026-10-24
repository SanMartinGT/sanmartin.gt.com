/* Solo enlaza URLs limpias que existen en el último despliegue. Los productos
   recién creados y las demos siguen usando la ficha dinámica noindex. */
(async()=>{
 try {
 const response=await fetch(new URL('seo-productos.json',document.baseURI));if(!response.ok)return;
 const slugs=new Set(await response.json());
 const update=()=>document.querySelectorAll('a[href*="producto.html?slug="]').forEach(link=>{const url=new URL(link.href),slug=url.searchParams.get('slug')?.toLowerCase();if(slugs.has(slug))link.href=new URL(`producto/${encodeURIComponent(slug)}/`,document.baseURI).href;});
 update();new MutationObserver(update).observe(document.body,{childList:true,subtree:true});
 }catch(error){console.warn('No se pudo cargar el índice de fichas SEO.');}
})();

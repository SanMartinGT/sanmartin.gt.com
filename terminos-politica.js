document.addEventListener('DOMContentLoaded',()=>{
  const privacyParagraph=Array.from(document.querySelectorAll('#privacidad~p')).find(paragraph=>paragraph.textContent.trim().startsWith('San Martín utiliza los datos de contacto'));
  if(privacyParagraph)privacyParagraph.innerHTML='San Martín utiliza los datos de contacto, cuenta, dirección y pedido para gestionar compras, entregas, atención y comunicaciones relacionadas con el servicio. La información se trata con medidas razonables de seguridad y acceso controlado. Consulta el <a href="aviso-privacidad.html">Aviso de privacidad</a> para conocer el detalle.';
  const voluntaryReturn=Array.from(document.querySelectorAll('#cambios~p')).find(paragraph=>paragraph.textContent.trim().startsWith('Cambios o devoluciones por decisión del cliente'));
  if(voluntaryReturn)voluntaryReturn.innerHTML='<strong>Cambios o devoluciones por decisión del cliente:</strong> se realizan en el punto de retiro de San Martín dentro del plazo indicado. Si el producto cumple los requisitos, el cliente podrá solicitar un cambio por otro producto o un <strong>reembolso en efectivo en tienda</strong>. Cualquier diferencia de precio deberá cubrirse o ajustarse según corresponda.';
  const help=Array.from(document.querySelectorAll('footer .footer-grid > div')).find(section=>section.querySelector(':scope > strong')?.textContent==='Ayuda');
  if(help&&!help.querySelector('a[href="aviso-privacidad.html"]')){
    const termsLink=help.querySelector('a[href="terminos-condiciones.html"]');
    if(termsLink)termsLink.insertAdjacentHTML('afterend','<a href="aviso-privacidad.html">Aviso de privacidad</a>');
  }
  const helpRoutes={'Envíos y entregas':'envios-entregas.html','Cambios y devoluciones':'cambios-devoluciones.html','Contáctanos':'contacto.html'};
  document.querySelectorAll('footer a').forEach(link=>{const route=helpRoutes[link.textContent.trim()];if(route)link.href=route;});
});

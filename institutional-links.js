/* Contexto y navegación compartidos por las páginas institucionales de San Martín. */
document.addEventListener('DOMContentLoaded',()=>{
  if(!document.querySelector('#institutionalContextStyle'))document.head.insertAdjacentHTML('beforeend','<style id="institutionalContextStyle">.institutional-context{margin:25px 0 0;color:#52615b;font-size:.76rem;font-weight:600;letter-spacing:.02em}.institutional-context strong{color:#19302b}.institutional-context a{margin-left:8px;color:#154b40;text-decoration:underline;text-underline-offset:3px}@media(max-width:520px){.institutional-context{line-height:1.8}.institutional-context a{margin-left:4px}}</style>');
  const hero=document.querySelector('.institutional-hero .container');
  if(hero&&!hero.querySelector('.institutional-context'))hero.insertAdjacentHTML('beforeend','<p class="institutional-context">San Martín forma parte de <strong>Grupo GMCA</strong> · <a href="nosotros-historia.html">Conoce nuestra historia</a> · <a href="slogan.html">Nuestro manifiesto</a></p>');
  const about=Array.from(document.querySelectorAll('footer .footer-grid > div')).find(section=>section.querySelector(':scope > strong')?.textContent==='Nosotros');
  if(about&&!about.querySelector('a[href="nosotros-historia.html"]'))about.insertAdjacentHTML('beforeend','<a href="nosotros-historia.html">Historia</a>');
  const help=Array.from(document.querySelectorAll('footer .footer-grid > div')).find(section=>section.querySelector(':scope > strong')?.textContent==='Ayuda');
  if(help&&!help.querySelector('a[href="terminos-condiciones.html"]'))help.insertAdjacentHTML('afterbegin','<a href="terminos-condiciones.html">Términos y condiciones</a>');
  if(help&&!help.querySelector('a[href="aviso-privacidad.html"]')){
    const termsLink=help.querySelector('a[href="terminos-condiciones.html"]');
    if(termsLink)termsLink.insertAdjacentHTML('afterend','<a href="aviso-privacidad.html">Aviso de privacidad</a>');
  }
  const helpRoutes={'Envíos y entregas':'envios-entregas.html','Cambios y devoluciones':'cambios-devoluciones.html','Contáctanos':'contacto.html'};
  document.querySelectorAll('footer a').forEach(link=>{const route=helpRoutes[link.textContent.trim()];if(route)link.href=route;});
});

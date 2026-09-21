/* =====================================================
   WHATSAPP
===================================================== */

function consultarWhatsApp(producto) {

    const mensaje =
        `Hola, San Martín. Me interesa el producto "${producto.nombre}"` +
        `${producto.marca ? ` marca ${producto.marca}` : ""}. ` +
        `¿Tienen disponibilidad?`;


    const mensajeCodificado =
        encodeURIComponent(mensaje);


    const url =
        `https://wa.me/${WHATSAPP_SAN_MARTIN}?text=${mensajeCodificado}`;


    window.open(
        url,
        "_blank"
    );

}
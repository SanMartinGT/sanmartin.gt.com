/* =====================================================
   SAN MARTÍN
   INICIO
===================================================== */


/* =====================================================
   CARRUSEL DE OFERTAS Y EVENTOS
===================================================== */

const promotionsTrack =
    document.getElementById("promotionsTrack");

const previousPromotion =
    document.querySelector(".promo-arrow-prev");

const nextPromotion =
    document.querySelector(".promo-arrow-next");

if (promotionsTrack && previousPromotion && nextPromotion) {

    const moverPromociones = (direccion) => {

        promotionsTrack.scrollBy({
            left: direccion * promotionsTrack.clientWidth,
            behavior: "smooth"
        });

    };

    previousPromotion.addEventListener("click", () => {
        moverPromociones(-1);
    });

    nextPromotion.addEventListener("click", () => {
        moverPromociones(1);
    });

}
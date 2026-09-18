/* =====================================================
   NAVEGACIÓN CON HEADER FIJO
   Ajusta el desplazamiento para que las secciones
   no queden escondidas detrás del menú y buscador.
===================================================== */

document.querySelectorAll('nav a[href^="#"]').forEach(enlace => {

    enlace.addEventListener("click", function(e) {

        const destino =
            document.querySelector(
                this.getAttribute("href")
            );

        if (!destino) return;

        e.preventDefault();


        /*
           Altura real del header completo
           incluyendo menú + buscador.
        */

        const header =
            document.querySelector("header");


        const alturaHeader =
            header
                ? header.offsetHeight
                : 0;


        /*
           Posición de la sección
           respecto al documento.
        */

        const posicion =
            destino.getBoundingClientRect().top +
            window.pageYOffset;


        /*
           Dejar un pequeño espacio
           debajo del header.
        */

        const margen = 15;


        /*
           Nueva posición de desplazamiento.
        */

        window.scrollTo({

            top:
                posicion -
                alturaHeader -
                margen,

            behavior: "smooth"

        });

    });

});
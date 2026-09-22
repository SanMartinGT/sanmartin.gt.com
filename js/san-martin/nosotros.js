/* =====================================================
   SAN MARTÍN
   VISTA INTERNA — NOSOTROS
===================================================== */


/* =====================================================
   ELEMENTOS
===================================================== */

const btnNosotros =
    document.getElementById("btnNosotros");

const vistaNosotros =
    document.getElementById("nosotros");

const btnVolverInicioNosotros =
    document.getElementById(
        "btnVolverInicioNosotros"
    );

const btnVolverInicioNosotrosFinal =
    document.getElementById(
        "btnVolverInicioNosotrosFinal"
    );


/* =====================================================
   ELEMENTOS DE LA PÁGINA PRINCIPAL
===================================================== */

const contenidoPrincipal = [

    document.querySelector(".hero"),

    document.getElementById("promociones"),

    document.getElementById("marcas"),

    document.getElementById("catalogo"),

    document.getElementById("ubicacion"),

    document.getElementById("cuenta"),

    document.querySelector("footer")

].filter(Boolean);


/* =====================================================
   MOSTRAR NOSOTROS
===================================================== */

function mostrarNosotros() {

    contenidoPrincipal.forEach(elemento => {

        elemento.hidden = true;

    });


    vistaNosotros.hidden = false;


    document.body.classList.add(
        "vista-nosotros-activa"
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });


    history.pushState(
        {
            vista: "nosotros"
        },
        "",
        "#nosotros"
    );

}


/* =====================================================
   VOLVER AL INICIO
===================================================== */

function volverAlInicio() {

    vistaNosotros.hidden = true;


    contenidoPrincipal.forEach(elemento => {

        elemento.hidden = false;

    });


    document.body.classList.remove(
        "vista-nosotros-activa"
    );


    history.pushState(
        {
            vista: "inicio"
        },
        "",
        "#inicio"
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =====================================================
   BOTÓN NOSOTROS
===================================================== */

if (btnNosotros) {

    btnNosotros.addEventListener(
        "click",
        function (evento) {

            evento.preventDefault();

            mostrarNosotros();

        }
    );

}


/* =====================================================
   BOTÓN VOLVER — PRINCIPAL
===================================================== */

if (btnVolverInicioNosotros) {

    btnVolverInicioNosotros.addEventListener(
        "click",
        volverAlInicio
    );

}


/* =====================================================
   BOTÓN VOLVER — FINAL
===================================================== */

if (btnVolverInicioNosotrosFinal) {

    btnVolverInicioNosotrosFinal.addEventListener(
        "click",
        volverAlInicio
    );

}


/* =====================================================
   BOTÓN ATRÁS DEL NAVEGADOR
===================================================== */

window.addEventListener(
    "popstate",
    function () {

        if (
            window.location.hash === "#nosotros"
        ) {

            mostrarNosotros();

        } else {

            volverAlInicio();

        }

    }
);


/* =====================================================
   CARGAR DIRECTAMENTE #NOSOTROS
===================================================== */

if (
    window.location.hash === "#nosotros"
) {

    mostrarNosotros();

}
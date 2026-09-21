/* =====================================================
   MARCAS
===================================================== */

const marcas = [

    {
        nombre: "Maped",
        imagen: "imagenes/marcas/maped.png"
    },

    {
        nombre: "Tucan",
        imagen: "imagenes/marcas/tucan.jpeg"
    },

    {
        nombre: "Y-PLUS+",
        imagen: "imagenes/marcas/yplus.jpeg"
    },

    {
        nombre: "Paper Mate",
        imagen: "imagenes/marcas/papermate.png"
    },

    {
        nombre: "Norma",
        imagen: "imagenes/marcas/norma.png"
    },

    {
        nombre: "Mis Pasitos",
        imagen: "imagenes/marcas/mispasitos.png"
    },

    {
        nombre: "Fast",
        imagen: "imagenes/marcas/fast.jpeg"
    },

    {
        nombre: "Scribe",
        imagen: "imagenes/marcas/scribe.png"
    },

    {
        nombre: "Facela",
        imagen: "imagenes/marcas/facela.png"
    },

    {
        nombre: "Faber-Castell",
        imagen: "imagenes/marcas/faber-castell.png"
    },

    {
        nombre: "Artesco",
        imagen: "imagenes/marcas/artesco.png"
    },

    {
        nombre: "BRETTON",
        imagen: "imagenes/marcas/bretton.png"
    },

    {
        nombre: "Pilot",
        imagen: "imagenes/marcas/pilot.png"
    },

    {
        nombre: "Barrilito",
        imagen: "imagenes/marcas/barrilito.png"
    },

    {
        nombre: "Sysabe",
        imagen: "imagenes/marcas/sysabe.png"
    },

    {
        nombre: "Pelikan",
        imagen: "imagenes/marcas/pelikan.jpg"
    },

    {
        nombre: "BIC",
        imagen: "imagenes/marcas/bic.png"
    },

    {
        nombre: "Tesa",
        imagen: "imagenes/marcas/tesa.png"
    },

    {
        nombre: "Casio",
        imagen: "imagenes/marcas/casio.png"
    },

    {
        nombre: "Sina Fina",
        imagen: "imagenes/marcas/sinafina.png"
    },

    {
        nombre: "Bolik",
        imagen: "imagenes/marcas/bolik.jpg"
    },

    {
        nombre: "Milan",
        imagen: "imagenes/marcas/milan.png"
    },

    {
        nombre: "Scotch",
        imagen: "imagenes/marcas/scotch.png"
    }

];


/* =====================================================
   CONTROL DEL DESPLAZAMIENTO AUTOMÁTICO
===================================================== */

let marcasAutoScroll = null;

let marcasPausadas = false;


/* =====================================================
   MOSTRAR MARCAS
===================================================== */

function mostrarMarcas() {

    const contenedor =
        document.getElementById("brands");


    if (!contenedor) return;


    /*
       Detener la animación anterior
       antes de reconstruir las marcas.
    */

    if (marcasAutoScroll) {

        cancelAnimationFrame(
            marcasAutoScroll
        );

        marcasAutoScroll = null;

    }


    /*
       Limpiar contenedor
    */

    contenedor.innerHTML = "";


    /*
       Crear tarjetas
    */

    marcas.forEach(marca => {

        const tarjeta =
            document.createElement("button");


        tarjeta.className =
            "brand";


        tarjeta.type =
            "button";


        /*
           Marcar la marca seleccionada
        */

        if (
            marcaActual ===
            marca.nombre
        ) {

            tarjeta.classList.add(
                "active"
            );

        }


        


        tarjeta.innerHTML = `

            <div class="brand-image">

                <img
                    src="${marca.imagen}"
                    alt="Marca ${marca.nombre}"
                    loading="lazy"
                >

            </div>

            <div class="brand-name">

                ${marca.nombre}

            </div>

        `;


        /*
           Seleccionar marca
        */

        tarjeta.addEventListener(
            "click",
            () => {

                /*
                   Pausar momentáneamente
                */

                marcasPausadas = true;


                filtrarPorMarca(
                    marca.nombre
                );


                /*
                   Volver a activar
                   después de la selección
                */

                setTimeout(
                    () => {

                        marcasPausadas =
                            false;

                    },
                    1200
                );

            }
        );


        contenedor.appendChild(
            tarjeta
        );

    });


    /*
       Iniciar desplazamiento
    */

    iniciarAutoScrollMarcas();

}


/* =====================================================
   DESPLAZAMIENTO AUTOMÁTICO
===================================================== */

function iniciarAutoScrollMarcas() {

    const contenedor =
        document.getElementById("brands");


    if (!contenedor) return;


    /*
       Cancelar animación anterior
    */

    if (marcasAutoScroll) {

        cancelAnimationFrame(
            marcasAutoScroll
        );

    }


    /*
       Velocidad del movimiento

       0.20 = muy lento
       0.35 = elegante
       0.50 = rápido

    */

    const velocidad =
        2;


    function moverMarcas() {

        /*
           Solo mover si no está pausado
        */

        if (!marcasPausadas) {

            /*
               Mover hacia la izquierda
            */

            contenedor.scrollLeft +=
                velocidad;


            /*
               Cuando llega al final,
               regresar al principio
            */

            if (
                contenedor.scrollLeft +
                contenedor.clientWidth >=
                contenedor.scrollWidth - 1
            ) {

                contenedor.scrollLeft = 0;

            }

        }


        /*
           Continuar animación
        */

        marcasAutoScroll =
            requestAnimationFrame(
                moverMarcas
            );

    }


    /*
       Comenzar
    */

    marcasAutoScroll =
        requestAnimationFrame(
            moverMarcas
        );

}


/* =====================================================
   PAUSA CON MOUSE
===================================================== */

const contenedorMarcas =
    document.getElementById("brands");


if (contenedorMarcas) {


    /*
       Mouse entra
    */

    contenedorMarcas.addEventListener(
        "mouseenter",
        () => {

            marcasPausadas =
                true;

        }
    );


    /*
       Mouse sale
    */

    contenedorMarcas.addEventListener(
        "mouseleave",
        () => {

            marcasPausadas =
                false;

        }
    );


    /*
       Usuario empieza a tocar
       en teléfono/tablet
    */

    contenedorMarcas.addEventListener(
        "touchstart",
        () => {

            marcasPausadas =
                true;

        },
        {
            passive: true
        }
    );


    /*
       Usuario termina de tocar
    */

    contenedorMarcas.addEventListener(
        "touchend",
        () => {

            /*
               Pequeña pausa antes
               de volver a moverse
            */

            setTimeout(
                () => {

                    marcasPausadas =
                        false;

                },
                800
            );

        },
        {
            passive: true
        }
    );


    /*
       Si el usuario cancela el toque
    */

    contenedorMarcas.addEventListener(
        "touchcancel",
        () => {

            marcasPausadas =
                false;

        },
        {
            passive: true
        }
    );

}


function filtrarPorMarca(marca) {

    // Seleccionar la marca
    marcaActual = marca;
    
    paginaActual = 1;

    // Mostrar todos los productos de esa marca
    // sin importar su categoría
    categoriaActual = "Todos";

    // Restablecer el botón "Todos"
    botonesFiltro.forEach(btn => {

        btn.classList.remove("active");

    });

    const botonTodos =
        document.querySelector(
            '.filter[data-category="Todos"]'
        );

    if (botonTodos) {

        botonTodos.classList.add("active");

    }

    // Actualizar marcas
        mostrarMarcas();

    // Actualizar catálogo
        mostrarProductos();

    // Bajar hasta el catálogo
    const catalogo =
        document.getElementById("catalogo");

    catalogo.scrollIntoView({
        behavior: "smooth"
    });

}
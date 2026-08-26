/* =====================================================
   SAN MARTÍN
   CATÁLOGO DE PRODUCTOS
===================================================== */


/* =====================================================
   CONFIGURACIÓN DE SAN MARTÍN
===================================================== */

const WHATSAPP_SAN_MARTIN = "50249027035";


/* =====================================================
   CATEGORÍA ACTUAL
===================================================== */

let categoriaActual = "Todos";
let marcaActual = "Todas";

// =====================================================
// PAGINACIÓN
// =====================================================

const productosPorPagina = 20;

let paginaActual = 1;



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
        0.35;


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

/* =====================================================
   ELEMENTOS DE LA PÁGINA
===================================================== */

const contenedorProductos =
    document.getElementById("products");

const buscador =
    document.getElementById("search");

const botonesFiltro =
    document.querySelectorAll(".filter");

const paginacion =
    document.getElementById("pagination");

/* =====================================================
   NORMALIZAR TEXTO PARA EL BUSCADOR
   - Minúsculas
   - Quita tildes
   - Normaliza espacios
   ===================================================== */

function normalizarTexto(texto) {

    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();

}


/* =====================================================
   BUSCADOR INTELIGENTE
   Permite buscar palabras en cualquier orden
   ===================================================== */

function coincideBusquedaInteligente(producto, busqueda) {

    const textoBusqueda =
        normalizarTexto(busqueda);

    // Si no hay búsqueda, mostrar todo
    if (!textoBusqueda) {
        return true;
    }

    // Texto completo del producto
    const textoProducto =
        normalizarTexto(`
            ${producto.nombre || ""}
            ${producto.marca || ""}
            ${producto.codigo || ""}
            ${producto.categoria || ""}
        `);

    // Separar lo que escribió el cliente
    const palabras =
        textoBusqueda.split(" ");

    /*
       TODAS las palabras deben existir
       en el producto, pero NO importa
       el orden.
    */

    return palabras.every(palabra =>
        textoProducto.includes(palabra)
    );

}


/* =====================================================
   MOSTRAR PRODUCTOS
===================================================== */

function mostrarProductos() {

    const busqueda =
        buscador.value
            .trim();


    const productosFiltrados =
        productos.filter(producto => {

            const coincideCategoria =
                categoriaActual === "Todos" ||
                producto.categoria === categoriaActual;

            const coincideMarca =
                marcaActual === "Todas" ||
                producto.marca === marcaActual;

            const coincideBusqueda =
                coincideBusquedaInteligente(
                    producto,
                    busqueda
                );

            return (
                coincideCategoria &&
                coincideMarca &&
                coincideBusqueda
            );

        });


    contenedorProductos.innerHTML = "";

    // =================================================
    // PAGINACIÓN
    // =================================================

    const totalPaginas =
        Math.ceil(
            productosFiltrados.length /
            productosPorPagina
        );


    // Si la página actual ya no existe,
    // volver a la última página disponible
    if (
        paginaActual > totalPaginas &&
        totalPaginas > 0
    ) {

        paginaActual = totalPaginas;

    }


    // Calcular qué productos mostrar
    const inicio =
        (paginaActual - 1) *
        productosPorPagina;

    const fin =
        inicio +
        productosPorPagina;


    const productosPagina =
        productosFiltrados.slice(
            inicio,
            fin
        );

    /* =================================================
       SI NO ENCUENTRA PRODUCTOS
    ================================================= */

    if (productosFiltrados.length === 0) {

        contenedorProductos.innerHTML = `

            <div class="no-results">

                <h3>
                    No encontramos ese producto.
                </h3>

                <p>
                    Prueba con otro nombre
                    o categoría.
                </p>

            </div>

        `;

        return;

    }


    /* =================================================
       CREAR TARJETAS
    ================================================= */

    productosPagina.forEach(producto => {

        const tarjeta =
            document.createElement("article");


        tarjeta.className = "product";


        tarjeta.innerHTML = `

            <div class="product-image">

                ${
                    producto.imagen
                    ? `
                        <img
                            src="${producto.imagen}"
                            alt="${producto.nombre}"
                        >
                    `
                    : `
                        <span class="product-icon">
                            ${producto.icono || "📦"}
                        </span>
                    `
                }

            </div>


            <div class="product-info">

                <div class="product-category">

                    ${producto.categoria}

                </div>


                <h3 class="product-name">

                    ${producto.nombre}

                </h3>


                <div class="product-brand">

                    ${producto.marca || "San Martín"}

                </div>


                <p class="product-description">

                    ${producto.descripcion}

                </p>


                <div class="product-price">

                    Q${producto.precio.toFixed(2)}

                </div>


                <div class="product-code">

                    Código:
                    ${producto.codigo || "No disponible"}

                </div>


                <div class="stock">

                    ● Consultar disponibilidad

                </div>


                <button
                    class="product-whatsapp"
                    type="button"
                >

                    💬 Consultar por WhatsApp

                </button>


            </div>

        `;


        /* =================================================
           AGREGAR TARJETA AL CATÁLOGO
        ================================================= */

        contenedorProductos.appendChild(tarjeta);


        /* =================================================
           CONECTAR BOTÓN DE WHATSAPP
        ================================================= */

        const botonWhatsApp =
            tarjeta.querySelector(
                ".product-whatsapp"
            );


        botonWhatsApp.addEventListener(
            "click",
            () => {

                consultarWhatsApp(producto);

            }
        );

    });


     /* =================================================
       CREAR PAGINACIÓN
    ================================================= */

    paginacion.innerHTML = "";


    // Si solamente existe una página,
    // no mostramos los botones
    if (totalPaginas <= 1) {

        return;

    }


    /* =================================================
       BOTÓN ANTERIOR
    ================================================= */

    const anterior =
        document.createElement("button");


    anterior.className =
        "page-button";


    anterior.textContent =
        "‹";


    anterior.disabled =
        paginaActual === 1;


    anterior.addEventListener(
        "click",
        () => {

            if (paginaActual > 1) {

                paginaActual--;

                mostrarProductos();

            }

        }
    );


    paginacion.appendChild(
        anterior
    );


    /* =================================================
    NÚMEROS DE PÁGINA INTELIGENTES
    ================================================= */

    const paginasVisibles = [];


    // =================================================
    // SI HAY POCAS PÁGINAS
    // =================================================

    if (totalPaginas <= 7) {

    for (
        let pagina = 1;
        pagina <= totalPaginas;
        pagina++
    ) {

        paginasVisibles.push(pagina);

    }

}


// =================================================
// SI HAY MUCHAS PÁGINAS
// =================================================

else {

    paginasVisibles.push(1);


    // Páginas cercanas a la actual
    let inicio =
        Math.max(
            2,
            paginaActual - 2
        );


    let fin =
        Math.min(
            totalPaginas - 1,
            paginaActual + 2
        );


    // Puntos suspensivos después de la primera
    if (inicio > 2) {

        paginasVisibles.push("...");

    }


    // Páginas cercanas
    for (
        let pagina = inicio;
        pagina <= fin;
        pagina++
    ) {

        paginasVisibles.push(pagina);

    }


    // Puntos suspensivos antes de la última
    if (
        fin <
        totalPaginas - 1
    ) {

        paginasVisibles.push("...");

    }


    paginasVisibles.push(
        totalPaginas
    );

}


// =================================================
// CREAR BOTONES
// =================================================

paginasVisibles.forEach(
    pagina => {

        // Puntos suspensivos
        if (pagina === "...") {

            const puntos =
                document.createElement(
                    "span"
                );


            puntos.className =
                "page-dots";


            puntos.textContent =
                "…";


            paginacion.appendChild(
                puntos
            );


            return;

        }


        // Botón de página
        const boton =
            document.createElement(
                "button"
            );


        boton.className =
            "page-button";


        boton.textContent =
            pagina;


        // Página actual
        if (
            pagina === paginaActual
        ) {

            boton.classList.add(
                "active"
            );

        }


        // Cambiar página
        boton.addEventListener(
            "click",
            () => {

                paginaActual =
                    pagina;


                mostrarProductos();


                document
                    .getElementById(
                        "catalogo"
                    )
                    .scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );


        paginacion.appendChild(
            boton
        );

    }
);


    /* =================================================
       BOTÓN SIGUIENTE
    ================================================= */

    const siguiente =
        document.createElement("button");


    siguiente.className =
        "page-button";


    siguiente.textContent =
        "›";


    siguiente.disabled =
        paginaActual === totalPaginas;


    siguiente.addEventListener(
        "click",
        () => {

            if (
                paginaActual <
                totalPaginas
            ) {

                paginaActual++;

                mostrarProductos();

            }

        }
    );


    paginacion.appendChild(
        siguiente
    );

}


/* =====================================================
   CAMBIAR CATEGORÍA
===================================================== */

botonesFiltro.forEach(boton => {

    boton.addEventListener(
        "click",
        () => {

            // Seleccionar categoría
            categoriaActual =
                boton.dataset.category;

            paginaActual = 1;

            // Quitar cualquier marca seleccionada
            marcaActual = "Todas";


            // Actualizar botones
            botonesFiltro.forEach(
                btn => {

                    btn.classList.remove(
                        "active"
                    );

                }
            );


            boton.classList.add(
                "active"
            );

            
            botonesFiltro.forEach(
                btn => {

                    btn.classList.remove(
                        "active"
                    );

                }
            );


            boton.classList.add(
                "active"
            );


            // Actualizar catálogo

            mostrarMarcas();

            mostrarProductos();

        }
    );

});


/* =====================================================
   BUSCADOR
   Comportamiento optimizado para computadora y teléfono
===================================================== */

// Controla si ya llevamos al usuario al catálogo
let buscadorYaDesplazado = false;


/* =====================================================
   AL ENTRAR AL BUSCADOR
===================================================== */

buscador.addEventListener(
    "focus",
    () => {

        /*
           En teléfono llevamos al usuario al catálogo
           una sola vez al tocar el buscador.
        */

        if (
            window.matchMedia(
                "(max-width: 768px)"
            ).matches
        ) {

            const catalogo =
                document.getElementById(
                    "catalogo"
                );

            if (!catalogo) return;


            setTimeout(() => {

                const header =
                    document.querySelector(
                        "header"
                    );


                const alturaHeader =
                    header
                        ? header.offsetHeight
                        : 0;


                const posicion =
                    catalogo.getBoundingClientRect().top +
                    window.pageYOffset;


                const margen = 15;


                window.scrollTo({

                    top:
                        posicion -
                        alturaHeader -
                        margen,

                    behavior: "smooth"

                });

            }, 100);

        }

    }
);


/* =====================================================
   ESCRIBIR EN EL BUSCADOR
===================================================== */

buscador.addEventListener(
    "input",
    () => {

        const texto =
            buscador.value.trim();


        // Reiniciar paginación
        paginaActual = 1;


        // Quitar filtros de marca y categoría
        marcaActual = "Todas";
        categoriaActual = "Todos";


        // Activar botón "Todos"
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


        // Actualizar productos
        mostrarProductos();


        /* =================================================
           COMPUTADORA
           Llevar al catálogo solamente una vez
        ================================================= */

        if (
            texto !== "" &&
            !buscadorYaDesplazado &&
            !window.matchMedia(
                "(max-width: 768px)"
            ).matches
        ) {

            const catalogo =
                document.getElementById(
                    "catalogo"
                );


            if (catalogo) {

                catalogo.scrollIntoView({

                    behavior: "smooth",
                    block: "start"

                });


                buscadorYaDesplazado = true;

            }

        }

    }
);


/* =====================================================
   ENTER EN EL BUSCADOR
   Cerrar teclado del teléfono
===================================================== */

buscador.addEventListener(
    "keydown",
    (evento) => {

        if (evento.key === "Enter") {

            evento.preventDefault();


            /*
               Quitar foco del buscador.
               En teléfono esto cierra el teclado.
            */

            buscador.blur();


            /*
               Permitir una nueva búsqueda
               posteriormente.
            */

            buscadorYaDesplazado = false;

        }

    }
);


/* =====================================================
   CUANDO SE BORRA COMPLETAMENTE LA BÚSQUEDA
===================================================== */

buscador.addEventListener(
    "input",
    () => {

        if (
            buscador.value.trim() === ""
        ) {

            buscadorYaDesplazado = false;

        }

    }
);


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


/* =====================================================
   INICIAR CATÁLOGO
===================================================== */

mostrarMarcas();

mostrarProductos();

/* =====================================================
   FILTRO DESPLEGABLE PARA TELÉFONO
===================================================== */

const mobileCategoryFilter =
    document.getElementById(
        "mobileCategoryFilter"
    );


if (mobileCategoryFilter) {

    mobileCategoryFilter.addEventListener(
        "change",
        function () {

            categoriaActual =
                this.value;

            marcaActual =
                "Todas";

            paginaActual = 1;

            /* Reiniciar apariencia de las marcas */
            mostrarMarcas();

            /* Actualizar productos */
            mostrarProductos();

        }
    );

}

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
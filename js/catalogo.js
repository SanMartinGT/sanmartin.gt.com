/* =====================================================
   SAN MARTÍN
   CATÁLOGO DE PRODUCTOS
===================================================== */


/* =====================================================
   CONFIGURACIÓN DE SAN MARTÍN
===================================================== */

const WHATSAPP_SAN_MARTIN = "50249027035";

/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
    "https://zqksriwvqbhjpixbsbgu.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_w6a5Hx0aO9C8mdtvGIw6rA_G0XaQbrQ";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

/* =====================================================
   INVENTARIO
===================================================== */

let inventario = {};


async function cargarInventario() {

    const {
        data,
        error
    } = await supabaseClient
        .from("inventario")
        .select("codigo, stock");


    if (error) {

        console.error(
            "Error al cargar inventario:",
            error
        );

        return;

    }


    inventario = {};


    data.forEach(item => {

        inventario[
            String(item.codigo)
        ] = Number(item.stock || 0);

    });


    console.log(
        "Inventario cargado:",
        data.length,
        "productos"
    );


    mostrarProductos();

}


/* =====================================================
   CATEGORÍA ACTUAL
===================================================== */

let categoriaActual = "Todos";
let marcaActual = "Todas";

/* =====================================================
   FILTRO DE PRECIO
===================================================== */

let precioMinimo = null;
let precioMaximo = null;

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

/* =====================================================
   ELEMENTOS DE LA PÁGINA
===================================================== */

const contenedorProductos =
    document.getElementById("products");

const productResultsInfo =
    document.getElementById("productResultsInfo");

const buscador =
    document.getElementById("search");

const botonesFiltro =
    document.querySelectorAll(".filter");

const paginacion =
    document.getElementById("pagination");

/* =====================================================
   ELEMENTOS DEL FILTRO DE PRECIO
===================================================== */

const precioMinInput =
    document.getElementById("precioMin");

const precioMaxInput =
    document.getElementById("precioMax");

const aplicarPrecio =
    document.getElementById("applyPriceFilter");

const limpiarPrecio =
    document.getElementById("clearPriceFilter");

const mensajePrecio =
    document.getElementById("priceFilterMessage");

/* =====================================================
   FILTROS APLICADOS
===================================================== */

const activeFilters =
    document.getElementById("activeFilters");

const activeFilterList =
    document.getElementById("activeFilterList");

const clearAllFilters =
    document.getElementById("clearAllFilters");

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
   MOSTRAR FILTROS APLICADOS
===================================================== */

function mostrarFiltrosAplicados() {

    if (
        !activeFilters ||
        !activeFilterList
    ) {
        return;
    }


    activeFilterList.innerHTML = "";


    const filtros = [];


    /* =================================================
       MARCA
    ================================================= */

    if (
        marcaActual !== "Todas"
    ) {

        filtros.push({
            tipo: "marca",
            texto: marcaActual
        });

    }


    /* =================================================
       CATEGORÍA
    ================================================= */

    if (
        categoriaActual !== "Todos"
    ) {

        filtros.push({
            tipo: "categoria",
            texto: categoriaActual
        });

    }


    /* =================================================
       PRECIO
    ================================================= */

    if (
        precioMinimo !== null &&
        precioMaximo !== null
    ) {

        filtros.push({
            tipo: "precio",
            texto:
                `Q${precioMinimo.toFixed(2)} – Q${precioMaximo.toFixed(2)}`
        });

    }

    else if (
        precioMinimo !== null
    ) {

        filtros.push({
            tipo: "precio-min",
            texto:
                `Desde Q${precioMinimo.toFixed(2)}`
        });

    }

    else if (
        precioMaximo !== null
    ) {

        filtros.push({
            tipo: "precio-max",
            texto:
                `Hasta Q${precioMaximo.toFixed(2)}`
        });

    }


    /* =================================================
       BÚSQUEDA
    ================================================= */

    const busqueda =
        buscador.value.trim();


    if (busqueda !== "") {

        filtros.push({
            tipo: "busqueda",
            texto:
                `🔎 ${busqueda}`
        });

    }


    /* =================================================
       SI NO HAY FILTROS
    ================================================= */

    if (
        filtros.length === 0
    ) {

        activeFilters.classList.remove(
            "visible"
        );

        return;

    }


    /* =================================================
       MOSTRAR CONTENEDOR
    ================================================= */

    activeFilters.classList.add(
        "visible"
    );


    /* =================================================
       CREAR ETIQUETAS
    ================================================= */

    filtros.forEach(filtro => {

        const etiqueta =
            document.createElement("span");


        etiqueta.className =
            "active-filter-tag";


        etiqueta.innerHTML = `

            <span>
                ${filtro.texto}
            </span>

            <button
                type="button"
                class="active-filter-remove"
                aria-label="Quitar filtro"
            >
                ×
            </button>

        `;


        const botonQuitar =
            etiqueta.querySelector(
                ".active-filter-remove"
            );


        botonQuitar.addEventListener(
            "click",
            () => {

                quitarFiltro(
                    filtro.tipo
                );

            }
        );


        activeFilterList.appendChild(
            etiqueta
        );

    });

}

/* =====================================================
   QUITAR FILTRO INDIVIDUAL
===================================================== */

function quitarFiltro(tipo) {

    /* =================================================
       MARCA
    ================================================= */

    if (
        tipo === "marca"
    ) {

        marcaActual =
            "Todas";

        mostrarMarcas();

    }


    /* =================================================
       CATEGORÍA
    ================================================= */

    if (
        tipo === "categoria"
    ) {

        categoriaActual =
            "Todos";


        botonesFiltro.forEach(
            btn => {

                btn.classList.remove(
                    "active"
                );

            }
        );


        const botonTodos =
            document.querySelector(
                '.filter[data-category="Todos"]'
            );


        if (botonTodos) {

            botonTodos.classList.add(
                "active"
            );

        }


        if (
            mobileCategoryFilter
        ) {

            mobileCategoryFilter.value =
                "Todos";

        }

    }


    /* =================================================
       PRECIO
    ================================================= */

    if (
        tipo === "precio" ||
        tipo === "precio-min" ||
        tipo === "precio-max"
    ) {

        precioMinimo =
            null;

        precioMaximo =
            null;


        if (precioMinInput) {

            precioMinInput.value =
                "";

        }


        if (precioMaxInput) {

            precioMaxInput.value =
                "";

        }


        if (mensajePrecio) {

            mensajePrecio.textContent =
                "";

        }

    }


    /* =================================================
       BÚSQUEDA
    ================================================= */

    if (
        tipo === "busqueda"
    ) {

        buscador.value =
            "";

        buscadorYaDesplazado =
            false;

    }


    paginaActual =
        1;


    mostrarProductos();

}

/* =====================================================
   GALERÍA / LIGHTBOX DE PRODUCTOS
   SAN MARTÍN
===================================================== */

let visorProducto = null;
let imagenVisor = null;

/* =====================================================
   GALERÍA DE FOTOGRAFÍAS
===================================================== */

let imagenesProductoActual = [];
let indiceImagenActual = 0;


/* =====================================================
   ZOOM
===================================================== */

let escalaZoom = 1;
let posicionX = 0;
let posicionY = 0;

let arrastrando = false;
let inicioX = 0;
let inicioY = 0;

let distanciaInicialPinch = null;
let escalaInicialPinch = 1;

let ultimoToque = 0;

let inicioSwipeX = null;
let inicioSwipeY = null;

/* =====================================================
   CREAR VISOR DEL PRODUCTO
===================================================== */

function crearVisorProducto() {

    // Si ya existe, no volver a crearlo
    if (document.getElementById("sanMartinProductLightbox")) {

        visorProducto =
            document.getElementById(
                "sanMartinProductLightbox"
            );

        imagenVisor =
            document.getElementById(
                "sanMartinLightboxImage"
            );

        return;

    }

    /* =================================================
        BOTONES DE GALERÍA
    ================================================= */

    const botonAnterior =
        document.getElementById(
            "sanMartinGalleryPrev"
        );


    const botonSiguiente =
        document.getElementById(
            "sanMartinGalleryNext"
        );


    if (botonAnterior) {

        botonAnterior.addEventListener(
            "click",
            evento => {

                evento.preventDefault();
                evento.stopPropagation();

                imagenAnteriorProducto();

            }
        );

    }


    if (botonSiguiente) {

        botonSiguiente.addEventListener(
            "click",
            evento => {

                evento.preventDefault();
                evento.stopPropagation();

                imagenSiguienteProducto();

            }
        );

    }

    /* =================================================
       CREAR CONTENEDOR PRINCIPAL
    ================================================= */

    visorProducto =
        document.createElement("div");


    visorProducto.id =
        "sanMartinProductLightbox";


    visorProducto.className =
        "san-martin-lightbox";


    visorProducto.setAttribute(
        "aria-hidden",
        "true"
    );


    visorProducto.innerHTML = `

    <div class="lightbox-backdrop"></div>


        <div
            class="lightbox-container"
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada del producto"
        >


            <!-- =====================================
                BOTÓN CERRAR
            ====================================== -->

            <button
                type="button"
                class="lightbox-close"
                id="sanMartinLightboxClose"
                aria-label="Cerrar"
            >
                ×
            </button>


            <!-- =====================================
                ÁREA DE IMAGEN
            ====================================== -->

            <div
                class="lightbox-image-area"
                id="sanMartinLightboxImageArea"
            >

                <!-- BOTÓN ANTERIOR -->

                <button
                    type="button"
                    class="lightbox-gallery-arrow lightbox-gallery-prev"
                    id="sanMartinGalleryPrev"
                    aria-label="Fotografía anterior"
                >
                    ‹
                </button>


                <!-- IMAGEN -->

                <img
                    id="sanMartinLightboxImage"
                    class="lightbox-image"
                    src=""
                    alt=""
                    draggable="false"
                >


                <!-- BOTÓN SIGUIENTE -->

                <button
                    type="button"
                    class="lightbox-gallery-arrow lightbox-gallery-next"
                    id="sanMartinGalleryNext"
                    aria-label="Fotografía siguiente"
                >
                    ›
                </button>

            </div>


        <!-- =====================================
             CONTADOR DE FOTOGRAFÍAS
        ====================================== -->

        <div
            class="lightbox-gallery-counter"
            id="sanMartinGalleryCounter"
        >
            1 / 1
        </div>


        <!-- =====================================
             MINIATURAS
        ====================================== -->

        <div
            class="lightbox-thumbnails"
            id="sanMartinLightboxThumbnails"
        ></div>


        <!-- =====================================
             CONTROLES DE ZOOM
        ====================================== -->

        <div class="lightbox-zoom-controls">

            <button
                type="button"
                id="sanMartinZoomOut"
                aria-label="Alejar"
            >
                −
            </button>


            <span
                id="sanMartinZoomPercentage"
            >
                100%
            </span>


            <button
                type="button"
                id="sanMartinZoomIn"
                aria-label="Acercar"
            >
                +
            </button>

        </div>


        <!-- =====================================
             INFORMACIÓN DEL PRODUCTO
        ====================================== -->

        <div
            class="lightbox-product-info"
            id="sanMartinLightboxInfo"
        >

            <div
                class="lightbox-category"
                id="lightboxCategory"
            ></div>


            <h2
                id="lightboxProductName"
            ></h2>


            <div
                class="lightbox-brand"
                id="lightboxBrand"
            ></div>


            <div
                class="lightbox-description"
                id="lightboxDescription"
            ></div>


            <div
                class="lightbox-price"
                id="lightboxPrice"
            ></div>


            <div
                class="lightbox-code"
                id="lightboxCode"
            ></div>


            <div
                class="lightbox-stock"
                id="lightboxStock"
            ></div>


            <button
                type="button"
                class="lightbox-whatsapp"
                id="lightboxWhatsApp"
            >
                💬 Consultar por WhatsApp
            </button>

        </div>


        <!-- =====================================
             AYUDA
        ====================================== -->

        <div
            class="lightbox-help"
            id="sanMartinLightboxHelp"
        >
            ← → Cambiar fotografías · Desliza · Zoom
        </div>

    </div>

`;


    document.body.appendChild(
        visorProducto
    );


    imagenVisor =
        document.getElementById(
            "sanMartinLightboxImage"
        );


    /* =================================================
       CERRAR
    ================================================= */

    const botonCerrar =
        document.getElementById(
            "sanMartinLightboxClose"
        );


    botonCerrar.addEventListener(
        "click",
        cerrarVisorProducto
    );


    /* =================================================
       CERRAR AL TOCAR EL FONDO
    ================================================= */

    const fondo =
        visorProducto.querySelector(
            ".lightbox-backdrop"
        );


    fondo.addEventListener(
        "click",
        cerrarVisorProducto
    );


    /* =================================================
       ZOOM +
    ================================================= */

    document
        .getElementById(
            "sanMartinZoomIn"
        )
        .addEventListener(
            "click",
            () => {

                cambiarZoom(
                    0.25
                );

            }
        );


    /* =================================================
       ZOOM -
    ================================================= */

    document
        .getElementById(
            "sanMartinZoomOut"
        )
        .addEventListener(
            "click",
            () => {

                cambiarZoom(
                    -0.25
                );

            }
        );


    /* =================================================
       RUEDA DEL MOUSE
    ================================================= */

    const areaImagen =
        document.getElementById(
            "sanMartinLightboxImageArea"
        );


    areaImagen.addEventListener(
        "wheel",
        evento => {

            evento.preventDefault();


            const cantidad =
                evento.deltaY < 0
                    ? 0.20
                    : -0.20;


            cambiarZoom(
                cantidad
            );

        },
        {
            passive: false
        }
    );

    /* =================================================
        SWIPE EN TELÉFONO
    ================================================= */

    areaImagen.addEventListener(
        "touchstart",
        evento => {

            if (
                evento.touches.length !== 1
            ) {

                return;

            }

            inicioSwipeX =
                evento.touches[0].clientX;

            inicioSwipeY =
                evento.touches[0].clientY;

        },
        {
            passive: true
        }
    );


    areaImagen.addEventListener(
        "touchend",
        evento => {

            if (
                inicioSwipeX === null
            ) {

                return;

            }

            const finalX =
                evento.changedTouches[0].clientX;

            const finalY =
                evento.changedTouches[0].clientY;

            const diferenciaX =
                finalX -
                inicioSwipeX;

            const diferenciaY =
                finalY -
                inicioSwipeY;


            /*
                Solo consideramos
                movimientos horizontales
            */

            if (
                Math.abs(diferenciaX) > 50 &&
                Math.abs(diferenciaX) >
                Math.abs(diferenciaY)
            ) {

                /*
                    Izquierda = siguiente
                */

                if (
                    diferenciaX < 0
                ) {

                    imagenSiguienteProducto();

                }

                /*
                    Derecha = anterior
                */

                else {

                    imagenAnteriorProducto();

                }

            }


            inicioSwipeX = null;
            inicioSwipeY = null;

        },
        {
            passive: true
        }
    );


    /* =================================================
       DOBLE CLIC
    ================================================= */

    imagenVisor.addEventListener(
        "dblclick",
        evento => {

            evento.preventDefault();


            if (escalaZoom <= 1) {

                establecerZoom(2);

            }

            else {

                establecerZoom(1);

            }

        }
    );


    /* =================================================
       TOUCH / POINTER
    ================================================= */

    areaImagen.addEventListener(
        "pointerdown",
        iniciarMovimiento
    );


    areaImagen.addEventListener(
        "pointermove",
        moverImagen
    );


    areaImagen.addEventListener(
        "pointerup",
        terminarMovimiento
    );


    areaImagen.addEventListener(
        "pointercancel",
        terminarMovimiento
    );


    areaImagen.addEventListener(
        "pointerleave",
        terminarMovimiento
    );


    /* =================================================
       DOBLE TOQUE EN TELÉFONO
    ================================================= */

    imagenVisor.addEventListener(
        "touchend",
        manejarDobleToque
    );

}


    /* =====================================================
        TECLA ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Escape" &&
                visorProducto &&
                visorProducto.classList.contains(
                    "visible"
                )
            ) {

                cerrarVisorProducto();

            }

        }
    );


    /* =====================================================
        NAVEGACIÓN DE GALERÍA CON TECLADO
    ===================================================== */

    document.addEventListener(
        "keydown",
        evento => {

            if (
                !visorProducto ||
                !visorProducto.classList.contains(
                    "visible"
                )
            ) {

                return;

            }


            /*
                No interferir con campos de texto
            */

            if (
                evento.target.tagName === "INPUT" ||
                evento.target.tagName === "TEXTAREA"
            ) {

                return;

            }


            /*
                Fotografía anterior
            */

            if (
                evento.key === "ArrowLeft"
            ) {

                evento.preventDefault();

                imagenAnteriorProducto();

            }


            /*
                Fotografía siguiente
            */

            if (
                evento.key === "ArrowRight"
            ) {

                evento.preventDefault();

                imagenSiguienteProducto();

            }

        }
    );
    
/* =====================================================
   OBTENER FOTOGRAFÍAS DEL PRODUCTO
===================================================== */

function obtenerImagenesProducto(producto) {

    let imagenes = [];


    /* =================================================
       NUEVO SISTEMA
       imagenes: [...]
    ================================================= */

    if (
        Array.isArray(producto.imagenes) &&
        producto.imagenes.length > 0
    ) {

        imagenes =
            producto.imagenes.filter(
                imagen =>
                    typeof imagen === "string" &&
                    imagen.trim() !== ""
            );

    }


    /* =================================================
       COMPATIBILIDAD CON SISTEMA ANTERIOR
    ================================================= */

    if (
        imagenes.length === 0 &&
        producto.imagen
    ) {

        imagenes = [
            producto.imagen
        ];

    }


    /* =================================================
       ELIMINAR DUPLICADOS
    ================================================= */

    imagenes =
        [...new Set(imagenes)];


    return imagenes;

}


/* =====================================================
   MOSTRAR MINIATURAS
===================================================== */

function mostrarMiniaturasProducto() {

    const contenedor =
        document.getElementById(
            "sanMartinLightboxThumbnails"
        );


    if (!contenedor) return;


    contenedor.innerHTML = "";


    /*
       Si solamente existe una fotografía,
       ocultamos las miniaturas.
    */

    if (
        imagenesProductoActual.length <= 1
    ) {

        contenedor.style.display =
            "none";

        return;

    }


    contenedor.style.display =
        "flex";


    imagenesProductoActual.forEach(
        (imagen, indice) => {

            const miniatura =
                document.createElement(
                    "button"
                );


            miniatura.type =
                "button";


            miniatura.className =
                "lightbox-thumbnail";


            if (
                indice ===
                indiceImagenActual
            ) {

                miniatura.classList.add(
                    "active"
                );

            }


            miniatura.setAttribute(
                "aria-label",
                `Ver fotografía ${indice + 1}`
            );


            miniatura.innerHTML = `

                <img
                    src="${imagen}"
                    alt="Fotografía ${indice + 1}"
                    loading="lazy"
                >

            `;


            miniatura.addEventListener(
                "click",
                () => {

                    cambiarImagenProducto(
                        indice
                    );

                }
            );


            contenedor.appendChild(
                miniatura
            );

        }
    );

}


/* =====================================================
   CAMBIAR FOTOGRAFÍA
===================================================== */

function cambiarImagenProducto(indice) {

    if (
        imagenesProductoActual.length === 0
    ) {

        return;

    }


    /*
       Mantener índice dentro del rango
    */

    if (
        indice < 0
    ) {

        indice =
            imagenesProductoActual.length - 1;

    }


    if (
        indice >=
        imagenesProductoActual.length
    ) {

        indice = 0;

    }


    indiceImagenActual =
        indice;


    /*
       Reiniciar zoom al cambiar fotografía
    */

    escalaZoom = 1;
    posicionX = 0;
    posicionY = 0;


    actualizarTransformacion();
    actualizarPorcentaje();


    /*
       Cambiar imagen
    */

    if (imagenVisor) {

        imagenVisor.src =
            imagenesProductoActual[
                indiceImagenActual
            ];

    }


    /*
       Actualizar contador
    */

    const contador =
        document.getElementById(
            "sanMartinGalleryCounter"
        );


    if (contador) {

        contador.textContent =
            `${indiceImagenActual + 1} / ${imagenesProductoActual.length}`;

    }


    /*
       Actualizar miniaturas
    */

    mostrarMiniaturasProducto();

}


/* =====================================================
   FOTOGRAFÍA ANTERIOR
===================================================== */

function imagenAnteriorProducto() {

    cambiarImagenProducto(
        indiceImagenActual - 1
    );

}


/* =====================================================
   FOTOGRAFÍA SIGUIENTE
===================================================== */

function imagenSiguienteProducto() {

    cambiarImagenProducto(
        indiceImagenActual + 1
    );

}


/* =====================================================
   ACTUALIZAR VISIBILIDAD DE CONTROLES
===================================================== */

function actualizarControlesGaleria() {

    const anterior =
        document.getElementById(
            "sanMartinGalleryPrev"
        );


    const siguiente =
        document.getElementById(
            "sanMartinGalleryNext"
        );


    const contador =
        document.getElementById(
            "sanMartinGalleryCounter"
        );


    const multiples =
        imagenesProductoActual.length > 1;


    if (anterior) {

        anterior.style.display =
            multiples
                ? "flex"
                : "none";

    }


    if (siguiente) {

        siguiente.style.display =
            multiples
                ? "flex"
                : "none";

    }


    if (contador) {

        contador.style.display =
            multiples
                ? "block"
                : "none";

    }

}

/* =====================================================
   ABRIR VISOR
===================================================== */

function abrirVisorProducto(producto) {

    crearVisorProducto();


    /* =================================================
       REINICIAR ZOOM
    ================================================= */

    escalaZoom = 1;
    posicionX = 0;
    posicionY = 0;


    actualizarTransformacion();


    /* =================================================
        CARGAR GALERÍA
    ================================================= */

    imagenesProductoActual =
        obtenerImagenesProducto(
            producto
        );


    indiceImagenActual = 0;


    /*
        Mostrar primera fotografía
    */

    if (
        imagenesProductoActual.length > 0
    ) {

        imagenVisor.src =
            imagenesProductoActual[0];

    }


    imagenVisor.alt =
        producto.nombre ||
        "Producto San Martín";


    /*
        Crear miniaturas
    */

    mostrarMiniaturasProducto();


    /*
        Actualizar controles
    */

    actualizarControlesGaleria();

    /* =================================================
       DATOS DEL PRODUCTO
    ================================================= */

    document.getElementById(
        "lightboxCategory"
    ).textContent =
        producto.categoria || "";


    document.getElementById(
        "lightboxProductName"
    ).textContent =
        producto.nombre || "Producto";


    document.getElementById(
        "lightboxBrand"
    ).textContent =
        `Marca: ${producto.marca || "San Martín"}`;


    document.getElementById(
        "lightboxDescription"
    ).textContent =
        producto.descripcion || "";


    document.getElementById(
        "lightboxPrice"
    ).textContent =
        `Q${Number(producto.precio || 0).toFixed(2)}`;


    document.getElementById(
        "lightboxCode"
    ).textContent =
        `Código: ${producto.codigo || "No disponible"}`;


    /* =================================================
       STOCK
    ================================================= */

    const stockDisponible =
        inventario[
            String(producto.codigo)
        ] ?? 0;


    let textoStock = "";


    if (stockDisponible <= 0) {

        textoStock =
            "🔴 Agotado";

    }

    else if (stockDisponible <= 5) {

        textoStock =
            `🟡 Pocas unidades · ${stockDisponible} disponibles`;

    }

    else {

        textoStock =
            `🟢 Disponible · ${stockDisponible} unidades`;

    }


    document.getElementById(
        "lightboxStock"
    ).textContent =
        textoStock;


    /* =================================================
       WHATSAPP
    ================================================= */

    const botonWhatsApp =
        document.getElementById(
            "lightboxWhatsApp"
        );


    botonWhatsApp.onclick =
        () => {

            consultarWhatsApp(
                producto
            );

        };


    /* =================================================
       MOSTRAR
    ================================================= */

    visorProducto.classList.add(
        "visible"
    );


    visorProducto.setAttribute(
        "aria-hidden",
        "false"
    );


    /* =================================================
       BLOQUEAR SCROLL DE LA PÁGINA
    ================================================= */

    document.body.classList.add(
        "lightbox-open"
    );


    /* =================================================
       OCULTAR AYUDA DESPUÉS DE UNOS SEGUNDOS
    ================================================= */

    const ayuda =
        document.getElementById(
            "sanMartinLightboxHelp"
        );


    ayuda.classList.remove(
        "hidden"
    );


    clearTimeout(
        window.sanMartinHelpTimer
    );


    window.sanMartinHelpTimer =
        setTimeout(
            () => {

                ayuda.classList.add(
                    "hidden"
                );

            },
            4000
        );

}


/* =====================================================
   CERRAR VISOR
===================================================== */

function cerrarVisorProducto() {

    if (!visorProducto) return;


    visorProducto.classList.remove(
        "visible"
    );


    visorProducto.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "lightbox-open"
    );


    /* Reiniciar */
    escalaZoom = 1;
    posicionX = 0;
    posicionY = 0;


    if (imagenVisor) {

        imagenVisor.style.transform =
            "translate3d(0, 0, 0) scale(1)";

    }

}


/* =====================================================
   ESTABLECER ZOOM
===================================================== */

function establecerZoom(nuevaEscala) {

    escalaZoom =
        Math.max(
            1,
            Math.min(
                4,
                nuevaEscala
            )
        );


    /* Si volvemos al 100%, centrar imagen */

    if (escalaZoom === 1) {

        posicionX = 0;
        posicionY = 0;

    }


    actualizarTransformacion();


    actualizarPorcentaje();

}


/* =====================================================
   CAMBIAR ZOOM
===================================================== */

function cambiarZoom(cantidad) {

    establecerZoom(
        escalaZoom + cantidad
    );

}


/* =====================================================
   ACTUALIZAR TRANSFORMACIÓN
===================================================== */

function actualizarTransformacion() {

    if (!imagenVisor) return;


    imagenVisor.style.transform =
        `
        translate3d(
            ${posicionX}px,
            ${posicionY}px,
            0
        )
        scale(${escalaZoom})
        `;

}


/* =====================================================
   PORCENTAJE DE ZOOM
===================================================== */

function actualizarPorcentaje() {

    const porcentaje =
        document.getElementById(
            "sanMartinZoomPercentage"
        );


    if (!porcentaje) return;


    porcentaje.textContent =
        `${Math.round(
            escalaZoom * 100
        )}%`;

}


/* =====================================================
   INICIAR ARRASTRE
===================================================== */

function iniciarMovimiento(evento) {

    /*
       Si estamos usando dos dedos,
       no iniciar arrastre normal.
    */

    if (
        evento.pointerType === "touch" &&
        evento.isPrimary === false
    ) {

        return;

    }


    arrastrando = true;


    inicioX =
        evento.clientX -
        posicionX;


    inicioY =
        evento.clientY -
        posicionY;


    try {

        evento.currentTarget.setPointerCapture(
            evento.pointerId
        );

    }

    catch (error) {

        // No hacer nada

    }

}


/* =====================================================
   MOVER IMAGEN
===================================================== */

function moverImagen(evento) {

    if (!arrastrando) return;


    /*
       En zoom 1 no permitimos mover
       la imagen.
    */

    if (escalaZoom <= 1) return;


    posicionX =
        evento.clientX -
        inicioX;


    posicionY =
        evento.clientY -
        inicioY;


    actualizarTransformacion();

}


/* =====================================================
   TERMINAR ARRASTRE
===================================================== */

function terminarMovimiento(evento) {

    arrastrando = false;


    try {

        evento.currentTarget.releasePointerCapture(
            evento.pointerId
        );

    }

    catch (error) {

        // No hacer nada

    }

}


/* =====================================================
   DOBLE TOQUE
===================================================== */

function manejarDobleToque(evento) {

    const ahora =
        Date.now();


    const diferencia =
        ahora -
        ultimoToque;


    if (
        diferencia < 300 &&
        diferencia > 0
    ) {

        evento.preventDefault();


        if (escalaZoom <= 1) {

            establecerZoom(2);

        }

        else {

            establecerZoom(1);

        }

    }


    ultimoToque =
        ahora;

}


/* =====================================================
   PINCH / ZOOM CON DOS DEDOS
===================================================== */

const dedosActivos =
    new Map();


document.addEventListener(
    "pointerdown",
    evento => {

        if (
            !visorProducto ||
            !visorProducto.classList.contains(
                "visible"
            )
        ) {

            return;

        }


        if (
            evento.pointerType !== "touch"
        ) {

            return;

        }


        dedosActivos.set(
            evento.pointerId,
            {
                x: evento.clientX,
                y: evento.clientY
            }
        );


        if (
            dedosActivos.size === 2
        ) {

            const puntos =
                Array.from(
                    dedosActivos.values()
                );


            distanciaInicialPinch =
                calcularDistancia(
                    puntos[0],
                    puntos[1]
                );


            escalaInicialPinch =
                escalaZoom;

        }

    },
    {
        passive: false
    }
);


document.addEventListener(
    "pointermove",
    evento => {

        if (
            !visorProducto ||
            !visorProducto.classList.contains(
                "visible"
            )
        ) {

            return;

        }


        if (
            evento.pointerType !== "touch"
        ) {

            return;

        }


        if (
            !dedosActivos.has(
                evento.pointerId
            )
        ) {

            return;

        }


        dedosActivos.set(
            evento.pointerId,
            {
                x: evento.clientX,
                y: evento.clientY
            }
        );


        if (
            dedosActivos.size === 2
        ) {

            evento.preventDefault();


            const puntos =
                Array.from(
                    dedosActivos.values()
                );


            const distanciaActual =
                calcularDistancia(
                    puntos[0],
                    puntos[1]
                );


            if (
                distanciaInicialPinch
            ) {

                const factor =
                    distanciaActual /
                    distanciaInicialPinch;


                const nuevaEscala =
                    escalaInicialPinch *
                    factor;


                establecerZoom(
                    nuevaEscala
                );

            }

        }

    },
    {
        passive: false
    }
);


document.addEventListener(
    "pointerup",
    evento => {

        dedosActivos.delete(
            evento.pointerId
        );


        if (
            dedosActivos.size < 2
        ) {

            distanciaInicialPinch =
                null;

        }

    }
);


document.addEventListener(
    "pointercancel",
    evento => {

        dedosActivos.delete(
            evento.pointerId
        );


        if (
            dedosActivos.size < 2
        ) {

            distanciaInicialPinch =
                null;

        }

    }
);


/* =====================================================
   CALCULAR DISTANCIA ENTRE DOS DEDOS
===================================================== */

function calcularDistancia(
    punto1,
    punto2
) {

    const dx =
        punto1.x -
        punto2.x;


    const dy =
        punto1.y -
        punto2.y;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );

}


/* =====================================================
   ACTIVAR VISOR EN IMÁGENES DE PRODUCTOS
===================================================== */

function activarVisorEnProducto(
    tarjeta,
    producto
) {

    const imagen =
        tarjeta.querySelector(
            ".product-image img"
        );


    /*
       Si el producto no tiene imagen,
       no hacemos nada.
    */

    if (!imagen) return;


    imagen.classList.add(
        "product-image-clickable"
    );


    imagen.setAttribute(
        "role",
        "button"
    );


    imagen.setAttribute(
        "tabindex",
        "0"
    );


    imagen.setAttribute(
        "aria-label",
        `Ver imagen ampliada de ${producto.nombre}`
    );


    /* =================================================
       CLICK
    ================================================= */

    imagen.addEventListener(
        "click",
        evento => {

            evento.preventDefault();
            evento.stopPropagation();


            abrirVisorProducto(
                producto
            );

        }
    );


    /* =================================================
       ENTER / ESPACIO
    ================================================= */

    imagen.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Enter" ||
                evento.key === " "
            ) {

                evento.preventDefault();


                abrirVisorProducto(
                    producto
                );

            }

        }
    );

}


/* =====================================================
   CREAR VISOR AL CARGAR LA PÁGINA
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        crearVisorProducto();

    }
);

/* =====================================================
   MOSTRAR PRODUCTOS
===================================================== */

function mostrarProductos() {

    const busqueda =
        buscador.value
            .trim();

        mostrarFiltrosAplicados();

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


        /* =================================================
           FILTRO DE PRECIO
        ================================================= */

        const precioProducto =
            Number(producto.precio);


        const coincidePrecioMinimo =
            precioMinimo === null ||
            precioProducto >= precioMinimo;


        const coincidePrecioMaximo =
            precioMaximo === null ||
            precioProducto <= precioMaximo;


        return (
            coincideCategoria &&
            coincideMarca &&
            coincideBusqueda &&
            coincidePrecioMinimo &&
            coincidePrecioMaximo
        );

    });

/* =================================================
   MOSTRAR TOTAL DE PRODUCTOS ENCONTRADOS
================================================= */

if (productResultsInfo) {

    const totalProductos =
        productosFiltrados.length;

    productResultsInfo.textContent =
        totalProductos === 1
            ? "1 producto encontrado"
            : `${totalProductos} productos encontrados`;

}

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

        const stockDisponible =
            inventario[
                String(producto.codigo)
            ] ?? 0;


        let textoStock = "";

        if (stockDisponible <= 0) {

            textoStock =
                "🔴 Agotado";

        } else if (stockDisponible <= 5) {

            textoStock =
                `🟡 Pocas unidades · ${stockDisponible} disponibles`;

        } else {

            textoStock =
                `🟢 Disponible · ${stockDisponible} unidades`;

        }

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

                    ${textoStock}

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
        ACTIVAR GALERÍA DE PRODUCTO
        ================================================= */

        activarVisorEnProducto(
            tarjeta,
            producto
        );


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
   LIMPIAR TODOS LOS FILTROS
===================================================== */

if (clearAllFilters) {

    clearAllFilters.addEventListener(
        "click",
        () => {

            /* =============================================
               MARCA
            ============================================= */

            marcaActual =
                "Todas";


            /* =============================================
               CATEGORÍA
            ============================================= */

            categoriaActual =
                "Todos";


            botonesFiltro.forEach(
                btn => {

                    btn.classList.remove(
                        "active"
                    );

                }
            );


            const botonTodos =
                document.querySelector(
                    '.filter[data-category="Todos"]'
                );


            if (botonTodos) {

                botonTodos.classList.add(
                    "active"
                );

            }


            if (
                mobileCategoryFilter
            ) {

                mobileCategoryFilter.value =
                    "Todos";

            }


            /* =============================================
               PRECIO
            ============================================= */

            precioMinimo =
                null;

            precioMaximo =
                null;


            if (precioMinInput) {

                precioMinInput.value =
                    "";

            }


            if (precioMaxInput) {

                precioMaxInput.value =
                    "";

            }


            if (mensajePrecio) {

                mensajePrecio.textContent =
                    "";

            }


            /* =============================================
               BÚSQUEDA
            ============================================= */

            buscador.value =
                "";


            buscadorYaDesplazado =
                false;


            /* =============================================
               PAGINACIÓN
            ============================================= */

            paginaActual =
                1;


            /* =============================================
               ACTUALIZAR
            ============================================= */

            mostrarMarcas();

            mostrarProductos();

        }
    );

}


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

cargarInventario();

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
   APLICAR FILTRO DE PRECIO
===================================================== */

if (aplicarPrecio) {

    aplicarPrecio.addEventListener(
        "click",
        () => {

            const minimo =
                precioMinInput.value.trim();

            const maximo =
                precioMaxInput.value.trim();


            /* =============================================
               CONVERTIR VALORES
            ============================================= */

            precioMinimo =
                minimo === ""
                    ? null
                    : Number(minimo);


            precioMaximo =
                maximo === ""
                    ? null
                    : Number(maximo);


            /* =============================================
               VALIDAR PRECIOS
            ============================================= */

            if (
                precioMinimo !== null &&
                (
                    isNaN(precioMinimo) ||
                    precioMinimo < 0
                )
            ) {

                precioMinimo = null;

                precioMinInput.value = "";

            }


            if (
                precioMaximo !== null &&
                (
                    isNaN(precioMaximo) ||
                    precioMaximo < 0
                )
            ) {

                precioMaximo = null;

                precioMaxInput.value = "";

            }


            /* =============================================
               VALIDAR RANGO
            ============================================= */

            if (
                precioMinimo !== null &&
                precioMaximo !== null &&
                precioMinimo > precioMaximo
            ) {

                mensajePrecio.textContent =
                    "El precio mínimo no puede ser mayor que el máximo.";

                return;

            }


            /* =============================================
               REINICIAR PAGINACIÓN
            ============================================= */

            paginaActual = 1;


            /* =============================================
               MOSTRAR PRODUCTOS
            ============================================= */

            mostrarProductos();


            /* =============================================
               MENSAJE
            ============================================= */

            if (
                precioMinimo !== null &&
                precioMaximo !== null
            ) {

                mensajePrecio.textContent =
                    `Mostrando productos entre Q${precioMinimo.toFixed(2)} y Q${precioMaximo.toFixed(2)}.`;

            }

            else if (
                precioMinimo !== null
            ) {

                mensajePrecio.textContent =
                    `Mostrando productos desde Q${precioMinimo.toFixed(2)}.`;

            }

            else if (
                precioMaximo !== null
            ) {

                mensajePrecio.textContent =
                    `Mostrando productos hasta Q${precioMaximo.toFixed(2)}.`;

            }

            else {

                mensajePrecio.textContent = "";

            }

        }
    );

}


/* =====================================================
   LIMPIAR FILTRO DE PRECIO
===================================================== */

if (limpiarPrecio) {

    limpiarPrecio.addEventListener(
        "click",
        () => {

            precioMinimo = null;

            precioMaximo = null;


            precioMinInput.value = "";

            precioMaxInput.value = "";


            mensajePrecio.textContent = "";


            paginaActual = 1;


            mostrarProductos();

        }
    );

}


/* =====================================================
   ENTER EN LOS CAMPOS DE PRECIO
===================================================== */

[precioMinInput, precioMaxInput].forEach(
    input => {

        if (!input) return;


        input.addEventListener(
            "keydown",
            evento => {

                if (evento.key === "Enter") {

                    evento.preventDefault();

                    aplicarPrecio.click();

                    input.blur();

                }

            }
        );

    }
);

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
/* =====================================================
   GALERÍA / LIGHTBOX DE PRODUCTOS
   SAN MARTÍN
   VERSIÓN CORREGIDA Y MEJORADA
===================================================== */


/* =====================================================
   VARIABLES GLOBALES
===================================================== */

let visorProducto = null;
let imagenVisor = null;


/* =====================================================
   GALERÍA
===================================================== */

let imagenesProductoActual = [];
let indiceImagenActual = 0;


/* =====================================================
   ZOOM
===================================================== */

let escalaZoom = 1;

let posicionX = 0;
let posicionY = 0;

const ZOOM_MINIMO = 1;
const ZOOM_MAXIMO = 4;
const ZOOM_PASO = 0.25;


/* =====================================================
   ARRASTRE
===================================================== */

let arrastrando = false;

let inicioX = 0;
let inicioY = 0;

let pointerArrastreId = null;


/* =====================================================
   PINCH
===================================================== */

const dedosActivos = new Map();

let distanciaInicialPinch = null;
let escalaInicialPinch = 1;


/* =====================================================
   DOBLE TOQUE
===================================================== */

let ultimoToque = 0;


/* =====================================================
   SWIPE
===================================================== */

let inicioSwipeX = null;
let inicioSwipeY = null;

let movimientoSwipe = false;


/* =====================================================
   TEMPORIZADOR DE AYUDA
===================================================== */

window.sanMartinHelpTimer = null;


/* =====================================================
   CREAR VISOR DEL PRODUCTO
===================================================== */

function crearVisorProducto() {

    /*
       Si ya existe, simplemente reutilizamos
       el visor.
    */

    if (
        document.getElementById(
            "sanMartinProductLightbox"
        )
    ) {

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
       CREAR CONTENEDOR
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
                title="Cerrar"
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
                    title="Fotografía anterior"
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
                    title="Fotografía siguiente"
                >
                    ›
                </button>


            </div>


            <!-- =====================================
                 CONTADOR
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
                    title="Alejar"
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
                    title="Acercar"
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


    /*
       MUY IMPORTANTE:
       Primero agregamos el visor al DOM.
       Después buscamos los botones.
    */

    document.body.appendChild(
        visorProducto
    );


    /* =================================================
       REFERENCIA A LA IMAGEN
    ================================================= */

    imagenVisor =
        document.getElementById(
            "sanMartinLightboxImage"
        );


    /* =================================================
       BOTÓN CERRAR
    ================================================= */

    const botonCerrar =
        document.getElementById(
            "sanMartinLightboxClose"
        );


    if (botonCerrar) {

        botonCerrar.addEventListener(
            "click",
            evento => {

                evento.preventDefault();
                evento.stopPropagation();

                cerrarVisorProducto();

            }
        );

    }


    /* =================================================
       FONDO
    ================================================= */

    const fondo =
        visorProducto.querySelector(
            ".lightbox-backdrop"
        );


    if (fondo) {

        fondo.addEventListener(
            "click",
            cerrarVisorProducto
        );

    }


    /* =================================================
       BOTÓN ANTERIOR
    ================================================= */

    const botonAnterior =
        document.getElementById(
            "sanMartinGalleryPrev"
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


    /* =================================================
       BOTÓN SIGUIENTE
    ================================================= */

    const botonSiguiente =
        document.getElementById(
            "sanMartinGalleryNext"
        );


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
       ZOOM +
    ================================================= */

    const botonZoomIn =
        document.getElementById(
            "sanMartinZoomIn"
        );


    if (botonZoomIn) {

        botonZoomIn.addEventListener(
            "click",
            evento => {

                evento.preventDefault();
                evento.stopPropagation();

                cambiarZoom(
                    ZOOM_PASO
                );

            }
        );

    }


    /* =================================================
       ZOOM -
    ================================================= */

    const botonZoomOut =
        document.getElementById(
            "sanMartinZoomOut"
        );


    if (botonZoomOut) {

        botonZoomOut.addEventListener(
            "click",
            evento => {

                evento.preventDefault();
                evento.stopPropagation();

                cambiarZoom(
                    -ZOOM_PASO
                );

            }
        );

    }


    /* =================================================
       ÁREA DE IMAGEN
    ================================================= */

    const areaImagen =
        document.getElementById(
            "sanMartinLightboxImageArea"
        );


    if (!areaImagen) {

        console.warn(
            "SAN MARTÍN: No se encontró el área del visor."
        );

        return;

    }


    /* =================================================
       RUEDA DEL MOUSE
    ================================================= */

    areaImagen.addEventListener(
        "wheel",
        evento => {

            /*
               Solo hacer zoom si el visor
               está visible.
            */

            if (
                !visorProducto.classList.contains(
                    "visible"
                )
            ) {

                return;

            }


            evento.preventDefault();


            const cantidad =
                evento.deltaY < 0
                    ? ZOOM_PASO
                    : -ZOOM_PASO;


            cambiarZoom(
                cantidad
            );

        },
        {
            passive: false
        }
    );


    /* =================================================
       POINTER DOWN
    ================================================= */

    areaImagen.addEventListener(
        "pointerdown",
        manejarPointerDown
    );


    /* =================================================
       POINTER MOVE
    ================================================= */

    areaImagen.addEventListener(
        "pointermove",
        manejarPointerMove
    );


    /* =================================================
       POINTER UP
    ================================================= */

    areaImagen.addEventListener(
        "pointerup",
        manejarPointerUp
    );


    /* =================================================
       POINTER CANCEL
    ================================================= */

    areaImagen.addEventListener(
        "pointercancel",
        manejarPointerUp
    );


    /* =================================================
       POINTER LEAVE
    ================================================= */

    areaImagen.addEventListener(
        "pointerleave",
        evento => {

            /*
               Solo terminar arrastre con mouse.
               En touch no queremos cortar el gesto
               porque el dedo puede salir ligeramente.
            */

            if (
                evento.pointerType === "mouse"
            ) {

                terminarMovimiento(
                    evento
                );

            }

        }
    );


    /* =================================================
       DOBLE CLIC
    ================================================= */

    imagenVisor.addEventListener(
        "dblclick",
        evento => {

            evento.preventDefault();
            evento.stopPropagation();


            alternarZoomDoble();

        }
    );


    /* =================================================
       TOUCH START
       SWIPE
    ================================================= */

    areaImagen.addEventListener(
        "touchstart",
        manejarTouchStart,
        {
            passive: false
        }
    );


    /* =================================================
       TOUCH MOVE
    ================================================= */

    areaImagen.addEventListener(
        "touchmove",
        manejarTouchMove,
        {
            passive: false
        }
    );


    /* =================================================
       TOUCH END
    ================================================= */

    areaImagen.addEventListener(
        "touchend",
        manejarTouchEnd,
        {
            passive: false
        }
    );


    /* =================================================
       TECLADO
    ================================================= */

    configurarTecladoVisor();

}


/* =====================================================
   CONFIGURAR TECLADO
===================================================== */

function configurarTecladoVisor() {

    /*
       Evitamos registrar varias veces
       el mismo listener.
    */

    if (
        window.sanMartinTecladoVisorConfigurado
    ) {

        return;

    }


    window.sanMartinTecladoVisorConfigurado =
        true;


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


            /* ESC */

            if (
                evento.key === "Escape"
            ) {

                evento.preventDefault();

                cerrarVisorProducto();

                return;

            }


            /*
               No interferir con campos
               de texto.
            */

            const elemento =
                evento.target;


            if (
                elemento &&
                (
                    elemento.tagName === "INPUT" ||
                    elemento.tagName === "TEXTAREA" ||
                    elemento.tagName === "SELECT"
                )
            ) {

                return;

            }


            /* ANTERIOR */

            if (
                evento.key === "ArrowLeft"
            ) {

                evento.preventDefault();

                imagenAnteriorProducto();

                return;

            }


            /* SIGUIENTE */

            if (
                evento.key === "ArrowRight"
            ) {

                evento.preventDefault();

                imagenSiguienteProducto();

                return;

            }

        }
    );

}


/* =====================================================
   OBTENER FOTOGRAFÍAS
===================================================== */

function obtenerImagenesProducto(
    producto
) {

    let imagenes = [];


    if (
        producto &&
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


    /*
       Compatibilidad con imagen única.
    */

    if (
        imagenes.length === 0 &&
        producto &&
        typeof producto.imagen === "string" &&
        producto.imagen.trim() !== ""
    ) {

        imagenes = [
            producto.imagen.trim()
        ];

    }


    /*
       Eliminar duplicados.
    */

    imagenes =
        [
            ...new Set(
                imagenes
            )
        ];


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


    if (!contenedor) {

        return;

    }


    contenedor.innerHTML = "";


    /*
       Una sola imagen:
       ocultar miniaturas.
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


            miniatura.dataset.indice =
                String(indice);


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


            miniatura.setAttribute(
                "aria-current",
                indice === indiceImagenActual
                    ? "true"
                    : "false"
            );


            const imagenMiniatura =
                document.createElement(
                    "img"
                );


            imagenMiniatura.src =
                imagen;


            imagenMiniatura.alt =
                `Fotografía ${indice + 1}`;


            imagenMiniatura.loading =
                "lazy";


            imagenMiniatura.draggable =
                false;


            miniatura.appendChild(
                imagenMiniatura
            );


            miniatura.addEventListener(
                "click",
                evento => {

                    evento.preventDefault();
                    evento.stopPropagation();

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

function cambiarImagenProducto(
    indice
) {

    if (
        imagenesProductoActual.length === 0
    ) {

        return;

    }


    /*
       Navegación circular.
    */

    const cantidad =
        imagenesProductoActual.length;


    indice =
        (
            indice % cantidad +
            cantidad
        ) % cantidad;


    indiceImagenActual =
        indice;


    /*
       Reiniciar zoom.
    */

    reiniciarZoom();


    /* =================================================
       CAMBIAR IMAGEN
    ================================================= */

    if (imagenVisor) {

        imagenVisor.style.opacity =
            "0.55";


        const nuevaImagen =
            imagenesProductoActual[
                indiceImagenActual
            ];


        imagenVisor.src =
            nuevaImagen;


        imagenVisor.onload =
            () => {

                imagenVisor.style.opacity =
                    "1";

            };

    }


    /* =================================================
       CONTADOR
    ================================================= */

    const contador =
        document.getElementById(
            "sanMartinGalleryCounter"
        );


    if (contador) {

        contador.textContent =
            `${indiceImagenActual + 1} / ${cantidad}`;

    }


    /* =================================================
       MINIATURAS
    ================================================= */

    actualizarMiniaturaActiva();


    /*
       Actualizar descripción de accesibilidad.
    */

    if (imagenVisor) {

        imagenVisor.setAttribute(
            "aria-label",
            `Fotografía ${indiceImagenActual + 1} de ${cantidad}`
        );

    }

}


/* =====================================================
   ACTUALIZAR MINIATURA ACTIVA
===================================================== */

function actualizarMiniaturaActiva() {

    const miniaturas =
        document.querySelectorAll(
            "#sanMartinLightboxThumbnails .lightbox-thumbnail"
        );


    miniaturas.forEach(
        (miniatura, indice) => {

            const activa =
                indice ===
                indiceImagenActual;


            miniatura.classList.toggle(
                "active",
                activa
            );


            miniatura.setAttribute(
                "aria-current",
                activa
                    ? "true"
                    : "false"
            );

        }
    );


    /*
       Intentar mantener visible la miniatura
       seleccionada.
    */

    const miniaturaActiva =
        document.querySelector(
            "#sanMartinLightboxThumbnails .lightbox-thumbnail.active"
        );


    if (miniaturaActiva) {

        miniaturaActiva.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
        });

    }

}


/* =====================================================
   FOTOGRAFÍA ANTERIOR
===================================================== */

function imagenAnteriorProducto() {

    if (
        imagenesProductoActual.length <= 1
    ) {

        return;

    }


    cambiarImagenProducto(
        indiceImagenActual - 1
    );

}


/* =====================================================
   FOTOGRAFÍA SIGUIENTE
===================================================== */

function imagenSiguienteProducto() {

    if (
        imagenesProductoActual.length <= 1
    ) {

        return;

    }


    cambiarImagenProducto(
        indiceImagenActual + 1
    );

}


/* =====================================================
   CONTROLES DE GALERÍA
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

        anterior.disabled =
            !multiples;

    }


    if (siguiente) {

        siguiente.style.display =
            multiples
                ? "flex"
                : "none";

        siguiente.disabled =
            !multiples;

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

function abrirVisorProducto(
    producto
) {

    if (!producto) {

        return;

    }


    crearVisorProducto();


    /*
       Seguridad por si el visor no pudo crearse.
    */

    if (
        !visorProducto ||
        !imagenVisor
    ) {

        return;

    }


    /* =================================================
       OBTENER GALERÍA
    ================================================= */

    imagenesProductoActual =
        obtenerImagenesProducto(
            producto
        );


    indiceImagenActual = 0;


    /*
       Reiniciar zoom.
    */

    reiniciarZoom();


    /* =================================================
       MOSTRAR PRIMERA IMAGEN
    ================================================= */

    if (
        imagenesProductoActual.length > 0
    ) {

        imagenVisor.src =
            imagenesProductoActual[0];

    }

    else {

        imagenVisor.removeAttribute(
            "src"
        );

    }


    imagenVisor.alt =
        producto.nombre ||
        "Producto San Martín";


    /* =================================================
       MINIATURAS
    ================================================= */

    mostrarMiniaturasProducto();


    /* =================================================
       CONTROLES
    ================================================= */

    actualizarControlesGaleria();


    /* =================================================
       INFORMACIÓN
    ================================================= */

    const categoria =
        document.getElementById(
            "lightboxCategory"
        );


    const nombre =
        document.getElementById(
            "lightboxProductName"
        );


    const marca =
        document.getElementById(
            "lightboxBrand"
        );


    const descripcion =
        document.getElementById(
            "lightboxDescription"
        );


    const precio =
        document.getElementById(
            "lightboxPrice"
        );


    const codigo =
        document.getElementById(
            "lightboxCode"
        );


    const stock =
        document.getElementById(
            "lightboxStock"
        );


    if (categoria) {

        categoria.textContent =
            producto.categoria || "";

    }


    if (nombre) {

        nombre.textContent =
            producto.nombre ||
            "Producto";

    }


    if (marca) {

        marca.textContent =
            `Marca: ${
                producto.marca ||
                "San Martín"
            }`;

    }


    if (descripcion) {

        descripcion.textContent =
            producto.descripcion || "";

    }


    if (precio) {

        precio.textContent =
            `Q${Number(
                producto.precio || 0
            ).toFixed(2)}`;

    }


    if (codigo) {

        codigo.textContent =
            `Código: ${
                producto.codigo ||
                "No disponible"
            }`;

    }


    /* =================================================
       STOCK
    ================================================= */

    let stockDisponible = 0;


    if (
        typeof inventario !== "undefined" &&
        inventario
    ) {

        stockDisponible =
            Number(
                inventario[
                    String(producto.codigo)
                ] ?? 0
            );

    }


    let textoStock = "";


    if (
        stockDisponible <= 0
    ) {

        textoStock =
            "🔴 Agotado";

    }

    else if (
        stockDisponible <= 5
    ) {

        textoStock =
            `🟡 Pocas unidades · ${stockDisponible} disponibles`;

    }

    else {

        textoStock =
            `🟢 Disponible · ${stockDisponible} unidades`;

    }


    if (stock) {

        stock.textContent =
            textoStock;

    }


    /* =================================================
       WHATSAPP
    ================================================= */

    const botonWhatsApp =
        document.getElementById(
            "lightboxWhatsApp"
        );


    if (botonWhatsApp) {

        /*
           Evitar acumular listeners.
        */

        botonWhatsApp.onclick =
            evento => {

                evento.preventDefault();
                evento.stopPropagation();


                if (
                    typeof consultarWhatsApp ===
                    "function"
                ) {

                    consultarWhatsApp(
                        producto
                    );

                }

            };

    }


    /* =================================================
       MOSTRAR VISOR
    ================================================= */

    visorProducto.classList.add(
        "visible"
    );


    visorProducto.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "lightbox-open"
    );


    /*
       Evitar que el navegador restaure
       accidentalmente una posición anterior.
    */

    window.scrollTo({
        top: window.scrollY,
        behavior: "instant"
    });


    /* =================================================
       AYUDA
    ================================================= */

    const ayuda =
        document.getElementById(
            "sanMartinLightboxHelp"
        );


    if (ayuda) {

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


    /*
       Enfocar el botón cerrar para accesibilidad.
    */

    const botonCerrar =
        document.getElementById(
            "sanMartinLightboxClose"
        );


    if (botonCerrar) {

        setTimeout(
            () => {

                botonCerrar.focus();

            },
            50
        );

    }

}


/* =====================================================
   CERRAR VISOR
===================================================== */

function cerrarVisorProducto() {

    if (!visorProducto) {

        return;

    }


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


    /*
       Cancelar arrastre.
    */

    arrastrando = false;

    pointerArrastreId = null;


    /*
       Limpiar dedos.
    */

    dedosActivos.clear();


    distanciaInicialPinch =
        null;


    escalaInicialPinch =
        1;


    /*
       Reiniciar swipe.
    */

    inicioSwipeX =
        null;

    inicioSwipeY =
        null;


    movimientoSwipe =
        false;


    /*
       Reiniciar zoom.
    */

    reiniciarZoom();


    /*
       Ocultar ayuda.
    */

    const ayuda =
        document.getElementById(
            "sanMartinLightboxHelp"
        );


    if (ayuda) {

        ayuda.classList.add(
            "hidden"
        );

    }

}


/* =====================================================
   REINICIAR ZOOM
===================================================== */

function reiniciarZoom() {

    escalaZoom = 1;

    posicionX = 0;
    posicionY = 0;

    arrastrando = false;

    pointerArrastreId = null;


    actualizarTransformacion();
    actualizarPorcentaje();

}


/* =====================================================
   ESTABLECER ZOOM
===================================================== */

function establecerZoom(
    nuevaEscala
) {

    escalaZoom =
        Math.max(
            ZOOM_MINIMO,
            Math.min(
                ZOOM_MAXIMO,
                Number(nuevaEscala) || 1
            )
        );


    /*
       Si regresamos a 100%,
       centrar imagen.
    */

    if (
        escalaZoom <= 1
    ) {

        escalaZoom = 1;

        posicionX = 0;
        posicionY = 0;

    }


    actualizarTransformacion();
    actualizarPorcentaje();

}


/* =====================================================
   CAMBIAR ZOOM
===================================================== */

function cambiarZoom(
    cantidad
) {

    establecerZoom(
        escalaZoom + cantidad
    );

}


/* =====================================================
   DOBLE ZOOM
===================================================== */

function alternarZoomDoble() {

    if (
        escalaZoom <= 1
    ) {

        establecerZoom(2);

    }

    else {

        establecerZoom(1);

    }

}


/* =====================================================
   ACTUALIZAR TRANSFORMACIÓN
===================================================== */

function actualizarTransformacion() {

    if (!imagenVisor) {

        return;

    }


    imagenVisor.style.transform =
        `translate3d(
            ${posicionX}px,
            ${posicionY}px,
            0
        ) scale(${escalaZoom})`;


    /*
       Cambiar cursor según zoom.
    */

    if (
        escalaZoom > 1
    ) {

        imagenVisor.style.cursor =
            arrastrando
                ? "grabbing"
                : "grab";

    }

    else {

        imagenVisor.style.cursor =
            "zoom-in";

    }

}


/* =====================================================
   ACTUALIZAR PORCENTAJE
===================================================== */

function actualizarPorcentaje() {

    const porcentaje =
        document.getElementById(
            "sanMartinZoomPercentage"
        );


    if (!porcentaje) {

        return;

    }


    porcentaje.textContent =
        `${Math.round(
            escalaZoom * 100
        )}%`;

}


/* =====================================================
   POINTER DOWN
===================================================== */

function manejarPointerDown(
    evento
) {

    if (
        !visorProducto ||
        !visorProducto.classList.contains(
            "visible"
        )
    ) {

        return;

    }


    /*
       TOUCH:
       Registrar dedo para pinch.
    */

    if (
        evento.pointerType === "touch"
    ) {

        dedosActivos.set(
            evento.pointerId,
            {
                x: evento.clientX,
                y: evento.clientY
            }
        );


        /*
           Segundo dedo:
           iniciar pinch.
        */

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


            arrastrando =
                false;


            pointerArrastreId =
                null;


            return;

        }


        /*
           Primer dedo:
           guardamos inicio del posible swipe.
        */

        if (
            dedosActivos.size === 1
        ) {

            inicioSwipeX =
                evento.clientX;

            inicioSwipeY =
                evento.clientY;

            movimientoSwipe =
                false;

        }

    }


    /*
       MOUSE:
       Arrastre solamente cuando
       hay zoom.
    */

    if (
        evento.pointerType === "mouse" &&
        evento.button !== 0
    ) {

        return;

    }


    if (
        escalaZoom <= 1
    ) {

        return;

    }


    /*
       Si hay dos dedos no iniciar
       arrastre.
    */

    if (
        dedosActivos.size >= 2
    ) {

        return;

    }


    arrastrando = true;

    pointerArrastreId =
        evento.pointerId;


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

        /* No hacer nada */

    }


    actualizarTransformacion();

}


/* =====================================================
   POINTER MOVE
===================================================== */

function manejarPointerMove(
    evento
) {

    if (
        !visorProducto ||
        !visorProducto.classList.contains(
            "visible"
        )
    ) {

        return;

    }


    /*
       TOUCH
       Actualizar posición del dedo.
    */

    if (
        evento.pointerType === "touch" &&
        dedosActivos.has(
            evento.pointerId
        )
    ) {

        dedosActivos.set(
            evento.pointerId,
            {
                x: evento.clientX,
                y: evento.clientY
            }
        );


        /*
           PINCH CON DOS DEDOS
        */

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
                distanciaInicialPinch &&
                distanciaInicialPinch > 0
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


            return;

        }

    }


    /*
       Si no estamos arrastrando,
       no hacemos nada.
    */

    if (!arrastrando) {

        return;

    }


    /*
       Solo mover con el pointer
       que inició el arrastre.
    */

    if (
        pointerArrastreId !== null &&
        evento.pointerId !==
        pointerArrastreId
    ) {

        return;

    }


    /*
       No mover si el zoom volvió a 1.
    */

    if (
        escalaZoom <= 1
    ) {

        terminarMovimiento(
            evento
        );

        return;

    }


    /*
       Si es touch y hay más de un dedo,
       no arrastrar.
    */

    if (
        evento.pointerType === "touch" &&
        dedosActivos.size > 1
    ) {

        return;

    }


    if (
        evento.pointerType === "touch"
    ) {

        movimientoSwipe = true;

    }


    evento.preventDefault();


    posicionX =
        evento.clientX -
        inicioX;


    posicionY =
        evento.clientY -
        inicioY;


    actualizarTransformacion();

}


/* =====================================================
   POINTER UP
===================================================== */

function manejarPointerUp(
    evento
) {

    if (
        evento.pointerType === "touch"
    ) {

        dedosActivos.delete(
            evento.pointerId
        );


        /*
           Cuando queda un dedo,
           reiniciar pinch.
        */

        if (
            dedosActivos.size < 2
        ) {

            distanciaInicialPinch =
                null;

        }

    }


    if (
        pointerArrastreId ===
        evento.pointerId
    ) {

        terminarMovimiento(
            evento
        );

    }

}


/* =====================================================
   TERMINAR ARRASTRE
===================================================== */

function terminarMovimiento(
    evento
) {

    arrastrando = false;


    if (
        pointerArrastreId ===
        evento.pointerId
    ) {

        pointerArrastreId =
            null;

    }


    try {

        if (
            evento.currentTarget &&
            evento.currentTarget.hasPointerCapture &&
            evento.currentTarget.hasPointerCapture(
                evento.pointerId
            )
        ) {

            evento.currentTarget.releasePointerCapture(
                evento.pointerId
            );

        }

    }

    catch (error) {

        /* No hacer nada */

    }


    actualizarTransformacion();

}


/* =====================================================
   TOUCH START
===================================================== */

function manejarTouchStart(
    evento
) {

    if (
        !visorProducto ||
        !visorProducto.classList.contains(
            "visible"
        )
    ) {

        return;

    }


    if (
        evento.touches.length !== 1
    ) {

        return;

    }


    const toque =
        evento.touches[0];


    inicioSwipeX =
        toque.clientX;

    inicioSwipeY =
        toque.clientY;


    movimientoSwipe =
        false;

}


/* =====================================================
   TOUCH MOVE
===================================================== */

function manejarTouchMove(
    evento
) {

    /*
       Si hay dos dedos,
       dejamos que pointer events
       maneje el pinch.
    */

    if (
        evento.touches.length >= 2
    ) {

        evento.preventDefault();

        return;

    }


    if (
        inicioSwipeX === null ||
        inicioSwipeY === null
    ) {

        return;

    }


    const toque =
        evento.touches[0];


    const diferenciaX =
        toque.clientX -
        inicioSwipeX;


    const diferenciaY =
        toque.clientY -
        inicioSwipeY;


    /*
       Cuando hay zoom,
       el movimiento corresponde
       al arrastre de la imagen.
    */

    if (
        escalaZoom > 1
    ) {

        return;

    }


    /*
       Detectar desplazamiento horizontal.
    */

    if (
        Math.abs(diferenciaX) > 10 &&
        Math.abs(diferenciaX) >
        Math.abs(diferenciaY)
    ) {

        movimientoSwipe =
            true;


        /*
           Evitar que la página
           se desplace horizontalmente.
        */

        evento.preventDefault();

    }

}


/* =====================================================
   TOUCH END
===================================================== */

function manejarTouchEnd(
    evento
) {

    if (
        inicioSwipeX === null ||
        inicioSwipeY === null
    ) {

        return;

    }


    const toque =
        evento.changedTouches[0];


    if (!toque) {

        limpiarSwipe();

        return;

    }


    const finalX =
        toque.clientX;


    const finalY =
        toque.clientY;


    const diferenciaX =
        finalX -
        inicioSwipeX;


    const diferenciaY =
        finalY -
        inicioSwipeY;


    /*
       Swipe solamente con zoom 1.
    */

    if (
        escalaZoom <= 1 &&
        Math.abs(diferenciaX) > 50 &&
        Math.abs(diferenciaX) >
        Math.abs(diferenciaY)
    ) {

        evento.preventDefault();


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


    limpiarSwipe();

}


/* =====================================================
   LIMPIAR SWIPE
===================================================== */

function limpiarSwipe() {

    inicioSwipeX =
        null;

    inicioSwipeY =
        null;

    movimientoSwipe =
        false;

}


/* =====================================================
   DOBLE TOQUE
===================================================== */

function manejarDobleToque(
    evento
) {

    const ahora =
        Date.now();


    const diferencia =
        ahora -
        ultimoToque;


    if (
        diferencia > 0 &&
        diferencia < 300
    ) {

        evento.preventDefault();


        /*
           Solo doble toque si
           estamos trabajando con
           un solo dedo.
        */

        if (
            evento.changedTouches &&
            evento.changedTouches.length === 1
        ) {

            alternarZoomDoble();

        }

    }


    ultimoToque =
        ahora;

}


/* =====================================================
   ACTIVAR DOBLE TOQUE
===================================================== */

function activarDobleToque() {

    if (!imagenVisor) {

        return;

    }


    /*
       Evitar duplicados.
    */

    if (
        imagenVisor.dataset.dobleToqueActivo ===
        "true"
    ) {

        return;

    }


    imagenVisor.dataset.dobleToqueActivo =
        "true";


    imagenVisor.addEventListener(
        "touchend",
        manejarDobleToque,
        {
            passive: false
        }
    );

}


/* =====================================================
   CALCULAR DISTANCIA PINCH
===================================================== */

function calcularDistancia(
    punto1,
    punto2
) {

    if (
        !punto1 ||
        !punto2
    ) {

        return 0;

    }


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
   ACTIVAR VISOR EN PRODUCTO
===================================================== */

function activarVisorEnProducto(
    tarjeta,
    producto
) {

    if (
        !tarjeta ||
        !producto
    ) {

        return;

    }


    const imagen =
        tarjeta.querySelector(
            ".product-image img"
        );


    if (!imagen) {

        return;

    }


    /*
       Evitar conectar el mismo producto
       dos veces.
    */

    if (
        imagen.dataset.visorActivo ===
        "true"
    ) {

        return;

    }


    imagen.dataset.visorActivo =
        "true";


    /* =================================================
       ACCESIBILIDAD
    ================================================= */

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
        `Ver imagen ampliada de ${
            producto.nombre ||
            "producto"
        }`
    );


    imagen.title =
        "Ver imagen ampliada";


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
                evento.stopPropagation();


                abrirVisorProducto(
                    producto
                );

            }

        }
    );

}


/* =====================================================
   INICIALIZACIÓN
===================================================== */

function inicializarVisorSanMartin() {

    crearVisorProducto();


    /*
       Activar doble toque después de que
       exista la imagen.
    */

    activarDobleToque();

}


/* =====================================================
   DOM READY
===================================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        inicializarVisorSanMartin,
        {
            once: true
        }
    );

}

else {

    inicializarVisorSanMartin();

}
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
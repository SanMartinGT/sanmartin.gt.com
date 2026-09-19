/* =====================================================
   SAN MARTÍN
   CATÁLOGO
===================================================== */


/* =====================================================
   ESTADO DEL CATÁLOGO
===================================================== */

let categoriaActual = "Todos";

let marcaActual = "Todas";

let precioMinimo = null;

let precioMaximo = null;

let ordenActual = "original";

const productosPorPagina = 20;

let paginaActual = 1;

/* =====================================================
   REFERENCIAS DOM
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
   FILTRO DE PRECIO
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

const selectOrdenPrecio =
    document.getElementById("sortPrice");


/* =====================================================
   FILTROS ACTIVOS
===================================================== */

const activeFilters =
    document.getElementById("activeFilters");

const activeFilterList =
    document.getElementById("activeFilterList");

const clearAllFilters =
    document.getElementById("clearAllFilters");

const mobileCategoryFilter =
    document.getElementById(
        "mobileCategoryFilter"
    );
    
/* =====================================================
   NORMALIZAR TEXTO
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
   BÚSQUEDA INTELIGENTE
===================================================== */

function coincideBusquedaInteligente(
    producto,
    busqueda
) {

    const textoBusqueda =
        normalizarTexto(busqueda);

    if (!textoBusqueda) {
        return true;
    }

    const textoProducto =
        normalizarTexto(`
            ${producto.nombre || ""}
            ${producto.marca || ""}
            ${producto.codigo || ""}
            ${producto.categoria || ""}
        `);

    const palabras =
        textoBusqueda.split(" ");

    return palabras.every(
        palabra =>
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
   MOSTRAR PRODUCTOS
===================================================== */

function mostrarProductos() {

    const busqueda =
        buscador.value
            .trim();

        mostrarFiltrosAplicados();

    let productosFiltrados =
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
   ORDENAR PRODUCTOS POR PRECIO
================================================= */

if (ordenActual === "precio-asc") {

    productosFiltrados.sort(
        (productoA, productoB) =>
            Number(productoA.precio) -
            Number(productoB.precio)
    );

}

else if (ordenActual === "precio-desc") {

    productosFiltrados.sort(
        (productoA, productoB) =>
            Number(productoB.precio) -
            Number(productoA.precio)
    );

}

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

                <button
                    type="button"
                    class="btn-favorito-producto ${
                        productoEsFavorito(producto.codigo) ? "activo" : ""
                    }"
                    data-codigo="${producto.codigo}"
                    aria-label="${
                        productoEsFavorito(producto.codigo)
                            ? "Quitar de favoritos"
                            : "Agregar a favoritos"
                    }"
                    title="${
                        productoEsFavorito(producto.codigo)
                            ? "Quitar de favoritos"
                            : "Agregar a favoritos"
                    }"
                >
                    ${
                        productoEsFavorito(producto.codigo)
                            ? "♥"
                            : "♡"
                    }
                </button>

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

                <button
                    class="product-add-cart"
                    type="button"
                    data-codigo="${producto.codigo}"
                    ${stockDisponible <= 0 ? "disabled" : ""}
                >
                    🛒 Agregar al carrito
                </button>


            </div>

        `;


        /* =================================================
           AGREGAR TARJETA AL CATÁLOGO
        ================================================= */

        contenedorProductos.appendChild(tarjeta);

        /* =================================================
            CONECTAR FAVORITO
        ================================================= */

        const botonFavorito =
        tarjeta.querySelector(
            ".btn-favorito-producto"
        );


        if (botonFavorito) {

            botonFavorito.addEventListener(
                "click",
                evento => {

                    evento.preventDefault();
                    evento.stopPropagation();

                    cambiarFavorito(
                        producto,
                        botonFavorito
                    );

                }
            );

        }


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
   FILTROS POR CATEGORÍA
===================================================== */

botonesFiltro.forEach(boton => {

    boton.addEventListener("click", () => {

        categoriaActual =
            boton.dataset.category;

        paginaActual = 1;

        marcaActual = "Todas";


        botonesFiltro.forEach(btn => {

            btn.classList.remove("active");

        });


        boton.classList.add("active");


        mostrarMarcas();

        mostrarProductos();

    });

});

/* =====================================================
   BUSCADOR
   Búsqueda en tiempo real + scroll solamente con ENTER
===================================================== */


/* =====================================================
   BUSCAR MIENTRAS ESCRIBE
===================================================== */

if (buscador) {

    buscador.addEventListener(
        "input",
        () => {

            /*
               Actualizamos los resultados mientras
               el usuario escribe.

               IMPORTANTE:
               Aquí NO hacemos scroll.
            */

            paginaActual = 1;

            mostrarProductos();

        }
    );


    /* =================================================
       ENTER EN EL BUSCADOR
    ================================================= */

    buscador.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key !== "Enter"
            ) {
                return;
            }


            /*
               Evitar que el formulario,
               si existe, se envíe.
            */

            evento.preventDefault();


            /*
               Reiniciar paginación.
            */

            paginaActual = 1;


            /*
               Ejecutar búsqueda.
            */

            mostrarProductos();


            /*
               Esperamos un momento para que el DOM
               termine de actualizar los productos.
            */

            setTimeout(() => {

                const catalogo =
                    document.getElementById(
                        "catalogo"
                    );


                if (!catalogo) {
                    return;
                }


                /*
                   Altura del encabezado fijo,
                   si existe.
                */

                const header =
                    document.querySelector(
                        "header"
                    );


                const alturaHeader =
                    header
                        ? header.offsetHeight
                        : 0;


                /*
                   Posición real del catálogo.
                */

                const posicion =
                    catalogo.getBoundingClientRect().top +
                    window.pageYOffset;


                /*
                   Pequeño espacio visual debajo
                   del encabezado.
                */

                const margen = 20;


                /*
                   Scroll suave hacia el catálogo.
                */

                window.scrollTo({

                    top:
                        posicion -
                        alturaHeader -
                        margen,

                    behavior: "smooth"

                });

            }, 50);

        }
    );

}

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

            ordenActual = "original";

            if (selectOrdenPrecio) {

                selectOrdenPrecio.value =
                    "original";

            }


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
   FILTRO DESPLEGABLE PARA TELÉFONO
===================================================== */

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
   ORDENAR POR PRECIO
===================================================== */

if (selectOrdenPrecio) {

    selectOrdenPrecio.addEventListener(
        "change",
        () => {

            ordenActual =
                selectOrdenPrecio.value;

            paginaActual = 1;

            mostrarProductos();

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

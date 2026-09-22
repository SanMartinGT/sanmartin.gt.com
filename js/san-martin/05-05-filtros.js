/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-05 FILTROS
===================================================== */


/* =====================================================
   MOSTRAR FILTROS APLICADOS
   -----------------------------------------------------
   Genera visualmente las etiquetas de filtros activos.
===================================================== */

function mostrarFiltrosAplicados() {

    if (
        !activeFilters ||
        !activeFilterList
    ) {
        return;
    }


    /* -------------------------------------------------
       Limpiamos los filtros anteriores.
    ------------------------------------------------- */

    activeFilterList.innerHTML = "";


    let hayFiltros = false;


    /* =================================================
       FUNCIÓN INTERNA
       -------------------------------------------------
       Crea una etiqueta de filtro.
    ================================================= */

    function crearFiltro(
        texto,
        tipo
    ) {

        hayFiltros = true;


        const etiqueta =
            document.createElement("span");

        etiqueta.className =
            "active-filter-tag";


        etiqueta.innerHTML = `

            <span>
                ${texto}
            </span>

            <button
                type="button"
                class="active-filter-remove"
                data-filter="${tipo}"
                aria-label="Quitar filtro ${texto}"
            >
                ×
            </button>

        `;


        const botonEliminar =
            etiqueta.querySelector(
                ".active-filter-remove"
            );


        if (botonEliminar) {

            botonEliminar.addEventListener(
                "click",
                function () {

                    quitarFiltro(tipo);

                }
            );

        }


        activeFilterList.appendChild(
            etiqueta
        );

    }


    /* =================================================
       FILTRO DE MARCA
    ================================================= */

    if (
        marcaActual &&
        marcaActual !== "Todas"
    ) {

        crearFiltro(
            `Marca: ${marcaActual}`,
            "marca"
        );

    }


    /* =================================================
       FILTRO DE CATEGORÍA
    ================================================= */

    if (
        categoriaActual &&
        categoriaActual !== "Todos"
    ) {

        crearFiltro(
            `Categoría: ${categoriaActual}`,
            "categoria"
        );

    }


    /* =================================================
       FILTRO DE PRECIO MÍNIMO
    ================================================= */

    if (
        precioMinimo !== null &&
        precioMinimo !== ""
    ) {

        crearFiltro(
            `Desde: Q${precioMinimo.toFixed(2)}`,
            "precioMin"
        );

    }


    /* =================================================
       FILTRO DE PRECIO MÁXIMO
    ================================================= */

    if (
        precioMaximo !== null &&
        precioMaximo !== ""
    ) {

        crearFiltro(
            `Hasta: Q${precioMaximo.toFixed(2)}`,
            "precioMax"
        );

    }


    /* =================================================
       FILTRO DE RANGO DE PRECIO
       -------------------------------------------------
       Si existen mínimo y máximo, sustituimos las
       dos etiquetas anteriores por una sola.
    ================================================= */

    if (
        precioMinimo !== null &&
        precioMaximo !== null
    ) {

        const etiquetas =
            activeFilterList.querySelectorAll(
                ".active-filter-tag"
            );


        etiquetas.forEach(
            etiqueta => {

                const boton =
                    etiqueta.querySelector(
                        ".active-filter-remove"
                    );


                if (
                    boton &&
                    (
                        boton.dataset.filter ===
                            "precioMin"
                        ||
                        boton.dataset.filter ===
                            "precioMax"
                    )
                ) {

                    etiqueta.remove();

                }

            }
        );


        crearFiltro(
            `Precio: Q${precioMinimo.toFixed(2)} – Q${precioMaximo.toFixed(2)}`,
            "precio"
        );

    }


    /* =================================================
       FILTRO DE BÚSQUEDA
    ================================================= */

    if (
        buscador &&
        buscador.value.trim()
    ) {

        crearFiltro(
            `Búsqueda: ${buscador.value.trim()}`,
            "busqueda"
        );

    }


    /* =================================================
       MOSTRAR / OCULTAR CONTENEDOR
    ================================================= */

    if (hayFiltros) {

        activeFilters.classList.add(
            "visible"
        );

    } else {

        activeFilters.classList.remove(
            "visible"
        );

    }

}


/* =====================================================
   QUITAR FILTRO INDIVIDUAL
===================================================== */

function quitarFiltro(tipo) {


    /* =================================================
       MARCA
    ================================================= */

    if (tipo === "marca") {

        marcaActual = "Todas";


        if (
            typeof mostrarMarcas ===
            "function"
        ) {

            mostrarMarcas();

        }

    }


    /* =================================================
       CATEGORÍA
    ================================================= */

    if (tipo === "categoria") {

        categoriaActual = "Todos";


        /* ---------------------------------------------
           Restaurar botones de categorías.
        --------------------------------------------- */

        if (botonesFiltro) {

            botonesFiltro.forEach(
                boton => {

                    boton.classList.remove(
                        "active"
                    );

                }
            );

        }


        const botonTodos =
            document.querySelector(
                '[data-category="Todos"]'
            );


        if (botonTodos) {

            botonTodos.classList.add(
                "active"
            );

        }


        /* ---------------------------------------------
           Restaurar selector móvil.
        --------------------------------------------- */

        if (mobileCategoryFilter) {

            mobileCategoryFilter.value =
                "Todos";

        }

    }


    /* =================================================
       PRECIO MÍNIMO
    ================================================= */

    if (
        tipo === "precioMin" ||
        tipo === "precio"
    ) {

        precioMinimo = null;

        if (precioMinInput) {
            precioMinInput.value = "";
        }

    }


    /* =================================================
       PRECIO MÁXIMO
    ================================================= */

    if (
        tipo === "precioMax" ||
        tipo === "precio"
    ) {

        precioMaximo = null;

        if (precioMaxInput) {
            precioMaxInput.value = "";
        }

    }


    /* =================================================
       BÚSQUEDA
    ================================================= */

    if (
        tipo === "busqueda"
    ) {

        if (buscador) {

            buscador.value = "";

        }


        /*
           Esta variable existía en la versión
           original. La protegemos por si está
           declarada en otro módulo.
        */

        if (
            typeof buscadorYaDesplazado !==
            "undefined"
        ) {

            buscadorYaDesplazado = false;

        }

    }


    /* =================================================
       LIMPIAR MENSAJE DE PRECIO
    ================================================= */

    if (
        tipo === "precioMin" ||
        tipo === "precioMax" ||
        tipo === "precio"
    ) {

        if (mensajePrecio) {

            mensajePrecio.textContent = "";

        }

    }


    /* =================================================
       VOLVER A LA PRIMERA PÁGINA
    ================================================= */

    paginaActual = 1;


    /* =================================================
       ACTUALIZAR PRODUCTOS
    ================================================= */

    mostrarProductos();

}


/* =====================================================
   EVENTOS — CATEGORÍAS
===================================================== */

if (botonesFiltro) {

    botonesFiltro.forEach(
        boton => {

            boton.addEventListener(
                "click",
                function () {

                    categoriaActual =
                        this.dataset.category ||
                        "Todos";


                    paginaActual = 1;


                    /* ---------------------------------
                       Al cambiar categoría se reinicia
                       la marca.
                    --------------------------------- */

                    marcaActual = "Todas";


                    /* ---------------------------------
                       Actualizar estado visual.
                    --------------------------------- */

                    botonesFiltro.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    this.classList.add(
                        "active"
                    );


                    /* ---------------------------------
                       Actualizar marcas disponibles.
                    --------------------------------- */

                    if (
                        typeof mostrarMarcas ===
                        "function"
                    ) {

                        mostrarMarcas();

                    }


                    /* ---------------------------------
                       Actualizar productos.
                    --------------------------------- */

                    mostrarProductos();

                }
            );

        }
    );

}


/* =====================================================
   EVENTO — CATEGORÍA MÓVIL
===================================================== */

if (mobileCategoryFilter) {

    mobileCategoryFilter.addEventListener(
        "change",
        function () {

            categoriaActual =
                this.value || "Todos";


            paginaActual = 1;


            /* -----------------------------------------
               Reiniciar marca.
            ----------------------------------------- */

            marcaActual = "Todas";


            /* -----------------------------------------
               Sincronizar botones normales.
            ----------------------------------------- */

            if (botonesFiltro) {

                botonesFiltro.forEach(
                    boton => {

                        boton.classList.remove(
                            "active"
                        );

                    }
                );

            }


            const botonCategoria =
                document.querySelector(
                    `[data-category="${CSS.escape(
                        categoriaActual
                    )}"]`
                );


            if (botonCategoria) {

                botonCategoria.classList.add(
                    "active"
                );

            }


            /* -----------------------------------------
               Actualizar marcas.
            ----------------------------------------- */

            if (
                typeof mostrarMarcas ===
                "function"
            ) {

                mostrarMarcas();

            }


            /* -----------------------------------------
               Actualizar productos.
            ----------------------------------------- */

            mostrarProductos();

        }
    );

}


/* =====================================================
   EVENTO — LIMPIAR TODOS LOS FILTROS
===================================================== */

if (clearAllFilters) {

    clearAllFilters.addEventListener(
        "click",
        function () {


            /* =========================================
               MARCA
            ========================================= */

            marcaActual = "Todas";


            /* =========================================
               CATEGORÍA
            ========================================= */

            categoriaActual = "Todos";


            if (botonesFiltro) {

                botonesFiltro.forEach(
                    boton => {

                        boton.classList.remove(
                            "active"
                        );

                    }
                );

            }


            const botonTodos =
                document.querySelector(
                    '[data-category="Todos"]'
                );


            if (botonTodos) {

                botonTodos.classList.add(
                    "active"
                );

            }


            if (mobileCategoryFilter) {

                mobileCategoryFilter.value =
                    "Todos";

            }


            /* =========================================
               PRECIO
            ========================================= */

            precioMinimo = null;

            precioMaximo = null;


            if (precioMinInput) {
                precioMinInput.value = "";
            }


            if (precioMaxInput) {
                precioMaxInput.value = "";
            }


            if (mensajePrecio) {

                mensajePrecio.textContent = "";

            }


            /* =========================================
               ORDEN
            ========================================= */

            ordenActual = "original";


            if (selectOrdenPrecio) {

                selectOrdenPrecio.value =
                    "original";

            }


            /* =========================================
               BÚSQUEDA
            ========================================= */

            if (buscador) {

                buscador.value = "";

            }


            if (
                typeof buscadorYaDesplazado !==
                "undefined"
            ) {

                buscadorYaDesplazado = false;

            }


            /* =========================================
               PRIMERA PÁGINA
            ========================================= */

            paginaActual = 1;


            /* =========================================
               ACTUALIZAR MARCAS
            ========================================= */

            if (
                typeof mostrarMarcas ===
                "function"
            ) {

                mostrarMarcas();

            }


            /* =========================================
               ACTUALIZAR PRODUCTOS
            ========================================= */

            mostrarProductos();

        }
    );

}
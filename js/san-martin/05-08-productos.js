/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-08 PRODUCTOS
===================================================== */


/* =====================================================
   OBTENER PRODUCTOS FILTRADOS
   -----------------------------------------------------
   Aplica todos los filtros actuales al catálogo.
===================================================== */

function obtenerProductosFiltrados() {

    /* -------------------------------------------------
       Verificamos que exista el catálogo.
    ------------------------------------------------- */

    if (
        !Array.isArray(productos)
    ) {

        console.warn(
            "San Martín: no existe un arreglo válido de productos."
        );

        return [];

    }


    /* =================================================
       BÚSQUEDA ACTUAL
    ================================================= */

    const busqueda =
        buscador
            ? buscador.value.trim()
            : "";


    /* =================================================
       FILTRAR PRODUCTOS
    ================================================= */

    const productosFiltrados =
        productos.filter(
            function (producto) {


                /* =====================================
                   CATEGORÍA
                ===================================== */

                if (
                    categoriaActual !== "Todos"
                ) {

                    const categoriaProducto =
                        normalizarTexto(
                            producto.categoria
                        );


                    const categoriaSeleccionada =
                        normalizarTexto(
                            categoriaActual
                        );


                    if (
                        categoriaProducto !==
                        categoriaSeleccionada
                    ) {

                        return false;

                    }

                }


                /* =====================================
                   MARCA
                ===================================== */

                if (
                    marcaActual !== "Todas"
                ) {

                    const marcaProducto =
                        normalizarTexto(
                            producto.marca
                        );


                    const marcaSeleccionada =
                        normalizarTexto(
                            marcaActual
                        );


                    if (
                        marcaProducto !==
                        marcaSeleccionada
                    ) {

                        return false;

                    }

                }


                /* =====================================
                   BÚSQUEDA INTELIGENTE
                ===================================== */

                if (
                    busqueda &&
                    !coincideBusquedaInteligente(
                        producto,
                        busqueda
                    )
                ) {

                    return false;

                }


                /* =====================================
                   PRECIO
                ===================================== */

                const precioProducto =
                    Number(producto.precio);


                /* -------------------------------------
                   Precio mínimo
                ------------------------------------- */

                if (
                    precioMinimo !== null &&
                    (
                        !Number.isFinite(
                            precioProducto
                        )
                        ||
                        precioProducto <
                        precioMinimo
                    )
                ) {

                    return false;

                }


                /* -------------------------------------
                   Precio máximo
                ------------------------------------- */

                if (
                    precioMaximo !== null &&
                    (
                        !Number.isFinite(
                            precioProducto
                        )
                        ||
                        precioProducto >
                        precioMaximo
                    )
                ) {

                    return false;

                }


                return true;

            }
        );


    /* =================================================
       ORDENAR RESULTADOS
    ================================================= */

    return ordenarProductos(
        productosFiltrados
    );

}


/* =====================================================
   MOSTRAR PRODUCTOS
   -----------------------------------------------------
   Controla:

   • filtros
   • resultados
   • paginación
   • tarjetas
   • mensaje sin resultados
===================================================== */

function mostrarProductos() {


    /* =================================================
       VERIFICAR CONTENEDOR
    ================================================= */

    if (!contenedorProductos) {

        console.warn(
            "San Martín: no se encontró #products."
        );

        return;

    }


    /* =================================================
       MOSTRAR FILTROS ACTIVOS
    ================================================= */

    if (
        typeof mostrarFiltrosAplicados ===
        "function"
    ) {

        mostrarFiltrosAplicados();

    }


    /* =================================================
       OBTENER PRODUCTOS
    ================================================= */

    const productosFiltrados =
        obtenerProductosFiltrados();


    const totalProductos =
        productosFiltrados.length;


    /* =================================================
       INFORMACIÓN DE RESULTADOS
    ================================================= */

    if (productResultsInfo) {

        if (totalProductos === 0) {

            productResultsInfo.textContent =
                "No se encontraron productos.";

        }

        else if (totalProductos === 1) {

            productResultsInfo.textContent =
                "1 producto encontrado.";

        }

        else {

            productResultsInfo.textContent =
                `${totalProductos} productos encontrados.`;

        }

    }


    /* =================================================
       LIMPIAR CONTENEDOR
    ================================================= */

    contenedorProductos.innerHTML = "";


    /* =================================================
       CALCULAR TOTAL DE PÁGINAS
    ================================================= */

    const totalPaginas =
        Math.ceil(
            totalProductos /
            productosPorPagina
        );


    /* =================================================
       CORREGIR PÁGINA ACTUAL
    ================================================= */

    if (
        totalPaginas > 0 &&
        paginaActual > totalPaginas
    ) {

        paginaActual =
            totalPaginas;

    }


    if (
        paginaActual < 1
    ) {

        paginaActual = 1;

    }


    /* =================================================
       SIN RESULTADOS
    ================================================= */

    if (
        totalProductos === 0
    ) {

        const mensaje =
            document.createElement(
                "div"
            );


        mensaje.className =
            "no-results";


        mensaje.innerHTML = `

            <div class="no-results-icon">
                🔎
            </div>

            <h3>
                No encontramos productos
            </h3>

            <p>
                Intenta cambiar la búsqueda
                o quitar alguno de los filtros.
            </p>

        `;


        contenedorProductos.appendChild(
            mensaje
        );


        /* ---------------------------------------------
           Limpiar paginación
        --------------------------------------------- */

        if (paginacion) {

            paginacion.innerHTML = "";

        }


        return;

    }


    /* =================================================
       CALCULAR PRODUCTOS DE LA PÁGINA
    ================================================= */

    const inicio =
        (
            paginaActual - 1
        ) *
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
       CREAR TARJETAS
    ================================================= */

    productosPagina.forEach(
        function (producto) {

            const tarjeta =
                crearTarjetaProducto(
                    producto
                );


            if (tarjeta) {

                contenedorProductos.appendChild(
                    tarjeta
                );

            }

        }
    );


    /* =================================================
       ACTUALIZAR PAGINACIÓN
    ================================================= */

    if (
        typeof mostrarPaginacion ===
        "function"
    ) {

        mostrarPaginacion(
            totalPaginas
        );

    }

}
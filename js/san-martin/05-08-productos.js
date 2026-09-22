/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-08 PRODUCTOS
   -----------------------------------------------------
   MOTOR CENTRAL DE PRODUCTOS

   FUNCIONA EN:

   • CATÁLOGO
   • OFERTAS

   UTILIZA:

   • Un solo buscador #search
   • Una sola tarjeta de producto
   • Una sola paginación
   • Los mismos filtros
   • El inventario existente
===================================================== */


/* =====================================================
   1. OBTENER VISTA ACTUAL
===================================================== */

function obtenerVistaProductos() {

    /*
       03-ofertas.js establece:

           window.vistaActual = "catalogo"
           window.vistaActual = "ofertas"

       Si todavía no existe, usamos catálogo.
    */

    if (
        window.vistaActual === "ofertas"
    ) {

        return "ofertas";

    }


    return "catalogo";

}


/* =====================================================
   2. OBTENER CONTENEDOR ACTIVO
===================================================== */

function obtenerContenedorProductosActivo() {

    const vista =
        obtenerVistaProductos();


    /* =================================================
       OFERTAS
    ================================================= */

    if (
        vista === "ofertas"
    ) {

        const contenedorOfertas =
            document.getElementById(
                "offersProducts"
            );


        if (
            contenedorOfertas
        ) {

            return contenedorOfertas;

        }

    }


    /* =================================================
       CATÁLOGO
    ================================================= */

    const contenedorCatalogo =
        document.getElementById(
            "products"
        );


    return contenedorCatalogo || null;

}


/* =====================================================
   3. OBTENER CONTENEDOR DE PAGINACIÓN
   -----------------------------------------------------
   Actualmente ambos sistemas pueden utilizar el mismo
   #pagination.

   Si posteriormente Ofertas tiene una paginación
   independiente, esta función permitirá ampliarlo
   fácilmente.
===================================================== */

function obtenerPaginacionActiva() {

    const paginacionOfertas =
        document.getElementById(
            "offersPagination"
        );


    const vista =
        obtenerVistaProductos();


    if (
        vista === "ofertas" &&
        paginacionOfertas
    ) {

        return paginacionOfertas;

    }


    if (
        typeof paginacion !==
        "undefined" &&
        paginacion
    ) {

        return paginacion;

    }


    return document.getElementById(
        "pagination"
    );

}


/* =====================================================
   4. OBTENER INFORMACIÓN DE RESULTADOS
===================================================== */

function obtenerElementoResultadosActivo() {

    const vista =
        obtenerVistaProductos();


    /* =================================================
       OFERTAS
    ================================================= */

    if (
        vista === "ofertas"
    ) {

        const resultadoOfertas =
            document.getElementById(
                "offersResultsInfo"
            );


        if (
            resultadoOfertas
        ) {

            return resultadoOfertas;

        }

    }


    /* =================================================
       CATÁLOGO
    ================================================= */

    if (
        typeof productResultsInfo !==
        "undefined" &&
        productResultsInfo
    ) {

        return productResultsInfo;

    }


    return document.getElementById(
        "productResultsInfo"
    );

}


/* =====================================================
   5. OBTENER MENSAJE DE OFERTAS VACÍAS
===================================================== */

function obtenerElementoOfertaVacia() {

    return document.getElementById(
        "offersEmpty"
    );

}


/* =====================================================
   6. OBTENER PRECIO SEGÚN LA VISTA
===================================================== */

function obtenerPrecioParaVista(
    producto,
    vista
) {

    /*
       En ofertas utilizamos el precio final.

       03-ofertas.js expone:

           obtenerPrecioVenta()
    */

    if (
        vista === "ofertas" &&
        typeof window.obtenerPrecioVenta ===
        "function"
    ) {

        return window.obtenerPrecioVenta(
            producto,
            {
                modo: "ofertas"
            }
        );

    }


    const precio =
        Number(
            producto?.precio
        );


    return Number.isFinite(
        precio
    )
        ? precio
        : 0;

}


/* =====================================================
   7. VERIFICAR SI ESTÁ EN OFERTA
===================================================== */

function productoEsOferta(
    producto
) {

    if (
        typeof window.productoEstaEnOferta ===
        "function"
    ) {

        return window.productoEstaEnOferta(
            producto
        );

    }


    const oferta =
        Number(
            producto?.oferta
        );


    return (
        Number.isFinite(
            oferta
        ) &&
        oferta > 0
    );

}


/* =====================================================
   8. OBTENER PRODUCTOS FILTRADOS
   -----------------------------------------------------
   Esta función es utilizada tanto por:

   • Catálogo
   • Ofertas
===================================================== */

function obtenerProductosFiltrados() {

    /* =================================================
       VERIFICAR PRODUCTOS
    ================================================= */

    if (
        !Array.isArray(
            productos
        )
    ) {

        console.warn(
            "San Martín: no existe un arreglo válido de productos."
        );

        return [];

    }


    /* =================================================
       VISTA ACTUAL
    ================================================= */

    const vista =
        obtenerVistaProductos();


    /* =================================================
       BÚSQUEDA
       -------------------------------------------------
       Siempre utiliza el mismo #search.
    ================================================= */

    const buscadorActual =
        document.getElementById(
            "search"
        );


    const busqueda =
        buscadorActual
            ? buscadorActual.value.trim()
            : "";


    /* =================================================
       FILTRAR
    ================================================= */

    const productosFiltrados =
        productos.filter(
            function (producto) {

                if (
                    !producto ||
                    typeof producto !== "object"
                ) {

                    return false;

                }


                /* =====================================
                   OFERTAS
                   -------------------------------------
                   Cuando estamos dentro de #ofertas,
                   SOLO entran productos con descuento.
                ===================================== */

                if (
                    vista === "ofertas" &&
                    !productoEsOferta(
                        producto
                    )
                ) {

                    return false;

                }


                /* =====================================
                   CATEGORÍA
                ===================================== */

                if (
                    categoriaActual !== "Todos"
                ) {

                    const categoriaProducto =
                        typeof normalizarTexto ===
                        "function"
                            ? normalizarTexto(
                                producto.categoria
                            )
                            : String(
                                producto.categoria ||
                                ""
                            ).toLowerCase();


                    const categoriaSeleccionada =
                        typeof normalizarTexto ===
                        "function"
                            ? normalizarTexto(
                                categoriaActual
                            )
                            : String(
                                categoriaActual ||
                                ""
                            ).toLowerCase();


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
                        typeof normalizarTexto ===
                        "function"
                            ? normalizarTexto(
                                producto.marca
                            )
                            : String(
                                producto.marca ||
                                ""
                            ).toLowerCase();


                    const marcaSeleccionada =
                        typeof normalizarTexto ===
                        "function"
                            ? normalizarTexto(
                                marcaActual
                            )
                            : String(
                                marcaActual ||
                                ""
                            ).toLowerCase();


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
                    typeof coincideBusquedaInteligente ===
                    "function" &&
                    !coincideBusquedaInteligente(
                        producto,
                        busqueda
                    )
                ) {

                    return false;

                }


                /* =====================================
                   PRECIO
                   -------------------------------------
                   Catálogo:
                       precio normal

                   Ofertas:
                       precio final descontado
                ===================================== */

                const precioProducto =
                    obtenerPrecioParaVista(
                        producto,
                        vista
                    );


                /* =====================================
                   PRECIO MÍNIMO
                ===================================== */

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


                /* =====================================
                   PRECIO MÁXIMO
                ===================================== */

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
       ORDENAR
    ================================================= */

    if (
        typeof ordenarProductos ===
        "function"
    ) {

        return ordenarProductos(
            productosFiltrados,
            {
                modo:
                    vista
            }
        );

    }


    return productosFiltrados;

}


/* =====================================================
   9. MOSTRAR INFORMACIÓN DE RESULTADOS
===================================================== */

function actualizarInformacionResultados(
    totalProductos,
    vista
) {

    const elemento =
        obtenerElementoResultadosActivo();


    if (
        !elemento
    ) {

        return;

    }


    /* =================================================
       OFERTAS
    ================================================= */

    if (
        vista === "ofertas"
    ) {

        if (
            totalProductos === 0
        ) {

            elemento.textContent =
                "No se encontraron ofertas.";

        }

        else if (
            totalProductos === 1
        ) {

            elemento.textContent =
                "1 oferta encontrada.";

        }

        else {

            elemento.textContent =
                `${totalProductos} ofertas encontradas.`;

        }


        return;

    }


    /* =================================================
       CATÁLOGO
    ================================================= */

    if (
        totalProductos === 0
    ) {

        elemento.textContent =
            "No se encontraron productos.";

    }

    else if (
        totalProductos === 1
    ) {

        elemento.textContent =
            "1 producto encontrado.";

    }

    else {

        elemento.textContent =
            `${totalProductos} productos encontrados.`;

    }

}


/* =====================================================
   10. MOSTRAR MENSAJE SIN RESULTADOS
===================================================== */

function mostrarSinResultados(
    contenedor,
    vista
) {

    if (
        !contenedor
    ) {

        return;

    }


    /* =================================================
       MENSAJE ESPECIAL DE OFERTAS
    ================================================= */

    if (
        vista === "ofertas"
    ) {

        const mensajeOfertas =
            obtenerElementoOfertaVacia();


        if (
            mensajeOfertas
        ) {

            mensajeOfertas.style.display =
                "block";

            mensajeOfertas.innerHTML = `

                <div class="no-results-icon">
                    🔥
                </div>

                <h3>
                    No encontramos ofertas
                </h3>

                <p>
                    Prueba con otra búsqueda
                    o revisa nuevamente más tarde.
                </p>

            `;

        }

        else {

            const mensaje =
                document.createElement(
                    "div"
                );


            mensaje.className =
                "no-results";


            mensaje.innerHTML = `

                <div class="no-results-icon">
                    🔥
                </div>

                <h3>
                    No encontramos ofertas
                </h3>

                <p>
                    Prueba con otra búsqueda
                    o revisa nuevamente más tarde.
                </p>

            `;


            contenedor.appendChild(
                mensaje
            );

        }


        return;

    }


    /* =================================================
       MENSAJE NORMAL DEL CATÁLOGO
    ================================================= */

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


    contenedor.appendChild(
        mensaje
    );

}


/* =====================================================
   11. OCULTAR MENSAJE DE OFERTAS VACÍAS
===================================================== */

function ocultarMensajeOfertaVacia() {

    const mensaje =
        obtenerElementoOfertaVacia();


    if (
        mensaje
    ) {

        mensaje.style.display =
            "none";

    }

}


/* =====================================================
   12. MOSTRAR PRODUCTOS
   -----------------------------------------------------
   MOTOR PRINCIPAL

   Catálogo:
       #products

   Ofertas:
       #offersProducts
===================================================== */

function mostrarProductos() {

    /* =================================================
       VISTA
    ================================================= */

    const vista =
        obtenerVistaProductos();


    /* =================================================
       CONTENEDOR
    ================================================= */

    const contenedor =
        obtenerContenedorProductosActivo();


    if (
        !contenedor
    ) {

        console.warn(
            `San Martín: no se encontró el contenedor de productos para la vista "${vista}".`
        );

        return;

    }


    /* =================================================
       MOSTRAR / ACTUALIZAR FILTROS
    ================================================= */

    if (
        typeof mostrarFiltrosAplicados ===
        "function"
    ) {

        mostrarFiltrosAplicados();

    }


    /* =================================================
       OCULTAR MENSAJE DE OFERTAS
    ================================================= */

    ocultarMensajeOfertaVacia();


    /* =================================================
       OBTENER PRODUCTOS
    ================================================= */

    const productosFiltrados =
        obtenerProductosFiltrados();


    const totalProductos =
        productosFiltrados.length;


    /* =================================================
       INFORMACIÓN
    ================================================= */

    actualizarInformacionResultados(
        totalProductos,
        vista
    );


    /* =================================================
       LIMPIAR CONTENEDOR
    ================================================= */

    contenedor.innerHTML =
        "";


    /* =================================================
       CALCULAR PÁGINAS
    ================================================= */

    const productosPaginaCantidad =
        Number(
            productosPorPagina
        ) || 12;


    const totalPaginas =
        Math.ceil(
            totalProductos /
            productosPaginaCantidad
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

        paginaActual =
            1;

    }


    /* =================================================
       SIN RESULTADOS
    ================================================= */

    if (
        totalProductos === 0
    ) {

        mostrarSinResultados(
            contenedor,
            vista
        );


        const paginacionActiva =
            obtenerPaginacionActiva();


        if (
            paginacionActiva
        ) {

            paginacionActiva.innerHTML =
                "";

        }


        return;

    }


    /* =================================================
       CALCULAR RANGO
    ================================================= */

    const inicio =
        (
            paginaActual -
            1
        ) *
        productosPaginaCantidad;


    const fin =
        inicio +
        productosPaginaCantidad;


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

            if (
                typeof crearTarjetaProducto !==
                "function"
            ) {

                console.warn(
                    "San Martín: crearTarjetaProducto no está disponible."
                );

                return;

            }


            /*
               Una sola función de tarjeta.

               En catálogo:

                   modo: "catalogo"

               En ofertas:

                   modo: "oferta"
            */

            const tarjeta =
                crearTarjetaProducto(
                    producto,
                    {
                        modo:
                            vista === "ofertas"
                                ? "oferta"
                                : "catalogo"
                    }
                );


            if (
                tarjeta
            ) {

                contenedor.appendChild(
                    tarjeta
                );

            }

        }
    );


    /* =================================================
       PAGINACIÓN
    ================================================= */

    const paginacionActiva =
        obtenerPaginacionActiva();


    if (
        typeof mostrarPaginacion ===
        "function"
    ) {

        /*
           05-10-paginacion.js actualmente utiliza
           la referencia global "paginacion".

           Si existe una paginación específica de ofertas,
           temporalmente sincronizamos la referencia
           global para que el módulo pueda utilizarla.
        */

        const paginacionAnterior =
            typeof paginacion !==
            "undefined"
                ? paginacion
                : null;


        if (
            paginacionActiva &&
            paginacionActiva !==
            paginacionAnterior
        ) {

            /*
               No reasignamos variables const/let del
               estado original.

               La paginación específica se manejará
               en la siguiente reconstrucción de
               05-10-paginacion.js.
            */

        }


        mostrarPaginacion(
            totalPaginas
        );

    }

}


/* =====================================================
   13. OBTENER PRODUCTOS VISIBLES
   -----------------------------------------------------
   API útil para otros módulos.
===================================================== */

window.obtenerProductosVisiblesSanMartin =
    function () {

        return obtenerProductosFiltrados();

    };


/* =====================================================
   14. OBTENER TOTAL DE PRODUCTOS
===================================================== */

window.obtenerTotalProductosSanMartin =
    function () {

        return obtenerProductosFiltrados().length;

    };


/* =====================================================
   15. OBTENER TOTAL DE OFERTAS
===================================================== */

window.obtenerTotalOfertasSanMartin =
    function () {

        if (
            !Array.isArray(
                productos
            )
        ) {

            return 0;

        }


        return productos.filter(
            function (producto) {

                return productoEsOferta(
                    producto
                );

            }
        ).length;

    };


/* =====================================================
   FIN — 05-08 PRODUCTOS
===================================================== */
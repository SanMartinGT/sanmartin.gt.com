/* =====================================================
   SAN MARTÍN
   INVENTARIO — CARGAR CATÁLOGO DESDE SUPABASE
   INCLUYENDO GALERÍA DE IMÁGENES
===================================================== */

async function cargarInventario() {

    console.log(
        "Cargando catálogo desde Supabase..."
    );

    try {

        /* =================================================
           1. CARGAR PRODUCTOS
        ================================================= */

        const {
            data: datosInventario,
            error: errorInventario
        } = await supabaseClient
            .from("inventario")
            .select(`
                id,
                codigo,
                nombre,
                marca,
                categoria,
                descripcion,
                precio,
                stock,
                stock_maximo,
                activo,
                imagen_url,
                oferta
            `)
            .eq("activo", true)
            .order("id", {
                ascending: true
            });


        /* =================================================
           ERROR AL CARGAR PRODUCTOS
        ================================================= */

        if (errorInventario) {

            console.error(
                "Error al cargar catálogo desde Supabase:",
                errorInventario
            );

            productos = [];
            inventario = {};

            if (
                typeof mostrarProductos === "function"
            ) {

                mostrarProductos();

            }

            if (
                typeof mostrarProductosEnOferta === "function"
            ) {

                mostrarProductosEnOferta();

            }

            return;

        }


        /* =================================================
           2. CARGAR IMÁGENES ADICIONALES
        ================================================= */

        const {
            data: datosImagenes,
            error: errorImagenes
        } = await supabaseClient
            .from("producto_imagenes")
            .select(`
                id,
                producto_id,
                ruta,
                url,
                orden,
                principal
            `)
            .order("orden", {
                ascending: true
            });


        /* =================================================
           ERROR AL CARGAR IMÁGENES
        ================================================= */

        if (errorImagenes) {

            console.error(
                "Error al cargar imágenes de productos:",
                errorImagenes
            );

        }


        /* =================================================
           3. LIMPIAR DATOS ANTERIORES
        ================================================= */

        productos = [];
        inventario = {};


        /* =================================================
           4. AGRUPAR IMÁGENES POR PRODUCTO
        ================================================= */

        const imagenesPorProducto = {};


        (datosImagenes || []).forEach(imagen => {

            const productoId =
                String(
                    imagen.producto_id
                );


            if (
                !imagenesPorProducto[productoId]
            ) {

                imagenesPorProducto[productoId] = [];

            }


            if (
                imagen.url &&
                String(imagen.url).trim() !== ""
            ) {

                imagenesPorProducto[productoId].push({

                    id:
                        imagen.id,

                    url:
                        String(
                            imagen.url
                        ).trim(),

                    ruta:
                        imagen.ruta || "",

                    orden:
                        Number(
                            imagen.orden || 0
                        ),

                    principal:
                        imagen.principal === true

                });

            }

        });


        /* =================================================
           5. CREAR PRODUCTOS
        ================================================= */

        (datosInventario || []).forEach(item => {

            const codigo =
                String(
                    item.codigo || ""
                ).trim();


            const productoId =
                String(
                    item.id
                );


            /* =============================================
               INVENTARIO
            ============================================= */

            inventario[codigo] =
                Number(
                    item.stock || 0
                );


            /* =============================================
               IMÁGENES DEL PRODUCTO
            ============================================= */

            const imagenesBD =
                imagenesPorProducto[
                    productoId
                ] || [];


            imagenesBD.sort(
                (imagenA, imagenB) =>
                    Number(
                        imagenA.orden || 0
                    ) -
                    Number(
                        imagenB.orden || 0
                    )
            );


            /* =============================================
               CREAR GALERÍA DE URLs
            ============================================= */

            let imagenes =
                imagenesBD
                    .map(
                        imagen =>
                            imagen.url
                    )
                    .filter(
                        url =>
                            url &&
                            String(url).trim() !== ""
                    );


            /* =============================================
               AGREGAR IMAGEN PRINCIPAL
            ============================================= */

            if (
                item.imagen_url &&
                String(
                    item.imagen_url
                ).trim() !== ""
            ) {

                const imagenPrincipal =
                    String(
                        item.imagen_url
                    ).trim();


                if (
                    !imagenes.includes(
                        imagenPrincipal
                    )
                ) {

                    imagenes.unshift(
                        imagenPrincipal
                    );

                }

            }


            /* =============================================
               ELIMINAR DUPLICADOS
            ============================================= */

            imagenes =
                [...new Set(imagenes)];


            /* =============================================
               RESPALDO DE IMAGEN PRINCIPAL
            ============================================= */

            if (
                imagenes.length === 0 &&
                item.imagen_url
            ) {

                imagenes = [
                    String(
                        item.imagen_url
                    ).trim()
                ];

            }


            /* =============================================
               CREAR PRODUCTO
            ============================================= */

            productos.push({

                id:
                    item.id,

                codigo:
                    codigo,

                nombre:
                    item.nombre ||
                    "Producto",

                marca:
                    item.marca ||
                    "",

                categoria:
                    item.categoria ||
                    "Otros",

                descripcion:
                    item.descripcion ||
                    "",

                precio:
                    Number(
                        item.precio || 0
                    ),

                stock:
                    Number(
                        item.stock || 0
                    ),

                stock_maximo:
                    Number(
                        item.stock_maximo || 0
                    ),

                activo:
                    item.activo !== false,

                /* Imagen principal */

                imagen:
                    item.imagen_url ||
                    "",

                imagen_url:
                    item.imagen_url ||
                    "",

                /* Galería */

                imagenes:
                    imagenes,

                /* Información completa */

                imagenesDetalle:
                    imagenesBD,

                /* Oferta */

                oferta:
                    Number(
                        item.oferta || 0
                    )

            });

        });


        /* =================================================
           6. INFORMACIÓN EN CONSOLA
        ================================================= */

        console.log(
            "Catálogo cargado desde Supabase:",
            productos.length,
            "productos"
        );


        console.log(
            "Imágenes de productos cargadas:",
            (datosImagenes || []).length
        );


        const productosConGaleria =
            productos.filter(
                producto =>
                    Array.isArray(
                        producto.imagenes
                    ) &&
                    producto.imagenes.length > 1
            );


        console.log(
            "Productos con galería:",
            productosConGaleria.length
        );


        /* =================================================
           7. ACTUALIZAR INTERFAZ
        ================================================= */

        if (
            typeof mostrarMarcas === "function"
        ) {

            mostrarMarcas();

        }


        if (
            typeof mostrarProductos === "function"
        ) {

            mostrarProductos();

        }


        if (
            typeof mostrarProductosEnOferta === "function"
        ) {

            mostrarProductosEnOferta();

        }


        /* =================================================
           8. AVISAR QUE EL INVENTARIO TERMINÓ
        ================================================= */

        window.dispatchEvent(
            new CustomEvent(
                "sanMartin:inventarioCargado",
                {
                    detail: {
                        productos:
                            productos.length,

                        imagenes:
                            (datosImagenes || []).length,

                        galerias:
                            productosConGaleria.length
                    }
                }
            )
        );


        console.log(
            "✓ San Martín: inventario sincronizado correctamente"
        );


    } catch (error) {

        console.error(
            "Error inesperado cargando catálogo:",
            error
        );


        productos = [];
        inventario = {};


        if (
            typeof mostrarProductos === "function"
        ) {

            mostrarProductos();

        }


        if (
            typeof mostrarProductosEnOferta === "function"
        ) {

            mostrarProductosEnOferta();

        }


        /* =============================================
           AVISAR ERROR
        ============================================= */

        window.dispatchEvent(
            new CustomEvent(
                "sanMartin:inventarioError",
                {
                    detail: error
                }
            )
        );

    }

}


/* =====================================================
   INICIALIZACIÓN
===================================================== */

cargarInventario();
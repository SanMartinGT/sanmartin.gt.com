/* =====================================================
   CARGAR CATÁLOGO DESDE SUPABASE
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

            mostrarProductos();
            mostrarProductosEnOferta();

            return;

        }


        /* =================================================
           2. CARGAR TODAS LAS IMÁGENES ADICIONALES
              DESDE producto_imagenes
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

            /*
               No detenemos el catálogo.
               Si las imágenes fallan, todavía
               mostramos la imagen principal.
            */

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


            /*
               Crear arreglo para ese producto
               si todavía no existe.
            */

            if (
                !imagenesPorProducto[productoId]
            ) {

                imagenesPorProducto[productoId] = [];

            }


            /*
               Solamente agregar imágenes
               que tengan URL válida.
            */

            if (
                imagen.url &&
                String(imagen.url).trim() !== ""
            ) {

                imagenesPorProducto[productoId].push({

                    id:
                        imagen.id,

                    url:
                        String(imagen.url).trim(),

                    ruta:
                        imagen.ruta || "",

                    orden:
                        Number(imagen.orden || 0),

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


            /*
               Ordenar nuevamente por seguridad.
            */

            imagenesBD.sort(
                (imagenA, imagenB) =>
                    Number(imagenA.orden || 0) -
                    Number(imagenB.orden || 0)
            );


            /*
               Crear arreglo únicamente
               con las URLs.
            */

                        /*
               Crear arreglo únicamente
               con las URLs.
            */

            let imagenes =
                imagenesBD
                    .map(imagen => imagen.url)
                    .filter(url =>
                        url &&
                        url.trim() !== ""
                    );


            /*
               Agregar la imagen principal
               si existe y todavía no está
               dentro de la galería.
            */

            if (
                item.imagen_url &&
                String(item.imagen_url).trim() !== ""
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


            /*
               Eliminar URLs duplicadas.
            */

            imagenes =
                [...new Set(imagenes)]; 


            /*
               Si producto_imagenes no tiene
               imágenes, utilizar imagen_url
               como respaldo.
            */

            if (
                imagenes.length === 0 &&
                item.imagen_url
            ) {

                imagenes = [
                    item.imagen_url
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
                    item.nombre || "Producto",

                marca:
                    item.marca || "",

                categoria:
                    item.categoria || "Otros",

                descripcion:
                    item.descripcion || "",

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

                /*
                   Imagen principal tradicional
                */

                imagen:
                    item.imagen_url || "",

                imagen_url:
                    item.imagen_url || "",

                /*
                   NUEVO:
                   Todas las fotografías
                */

                imagenes:
                    imagenes,

                /*
                   Información completa de las imágenes.
                   Se conserva por si posteriormente
                   queremos utilizarla.
                */

                imagenesDetalle:
                    imagenesBD,

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


        /*
           Mostrar cuántos productos tienen
           más de una fotografía.
        */

        const productosConGaleria =
            productos.filter(
                producto =>
                    Array.isArray(producto.imagenes) &&
                    producto.imagenes.length > 1
            );


        console.log(
            "Productos con galería:",
            productosConGaleria.length
        );


        /* =================================================
           7. ACTUALIZAR CATÁLOGO
        ================================================= */

        mostrarMarcas();

        mostrarProductos();

        mostrarProductosEnOferta();


    } catch (error) {

        console.error(
            "Error inesperado cargando catálogo:",
            error
        );

        productos = [];
        inventario = {};

        mostrarProductos();
        mostrarProductosEnOferta();

    }

}

/* =====================================================
   INICIALIZACIÓN DEL INVENTARIO
===================================================== */

/*
   El catálogo ahora se carga directamente
   desde Supabase.
*/

cargarInventario();
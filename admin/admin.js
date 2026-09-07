/* =====================================================
   SAN MARTÍN
   PANEL DE ADMINISTRACIÓN
   CATÁLOGO + INVENTARIO + REPOSICIÓN
===================================================== */


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
   CONFIGURACIÓN
===================================================== */

const PORCENTAJE_REPOSICION = 0.30;


const ADMIN_EMAIL =
    "sanmartinlibreriapapeleria@gmail.com";


/* =====================================================
   ESTADO
===================================================== */

let inventarioAdmin = [];

let productoEditando = null;


/*=====================================================
IMÁGENES DEL PRODUCTO
=====================================================*/


let imagenesSeleccionadas = [];

let imagenesExistentes = [];

let imagenesEliminadas = [];

/* =====================================================
   ELEMENTOS
===================================================== */

const loginSection =
    document.getElementById(
        "loginSection"
    );


const adminSection =
    document.getElementById(
        "adminSection"
    );


const loginForm =
    document.getElementById(
        "loginForm"
    );


const emailInput =
    document.getElementById(
        "email"
    );


const passwordInput =
    document.getElementById(
        "password"
    );


const loginButton =
    document.getElementById(
        "loginButton"
    );


const loginMessage =
    document.getElementById(
        "loginMessage"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const adminEmail =
    document.getElementById(
        "adminEmail"
    );


const inventoryTable =
    document.getElementById(
        "inventoryTable"
    );


const purchaseTable =
    document.getElementById(
        "purchaseTable"
    );


const purchaseEmpty =
    document.getElementById(
        "purchaseEmpty"
    );


const purchaseTableContainer =
    document.getElementById(
        "purchaseTableContainer"
    );


const purchaseCount =
    document.getElementById(
        "purchaseCount"
    );


const adminSearch =
    document.getElementById(
        "adminSearch"
    );


const refreshButton =
    document.getElementById(
        "refreshButton"
    );


const newProductButton =
    document.getElementById(
        "newProductButton"
    );


const statusMessage =
    document.getElementById(
        "statusMessage"
    );


/* =====================================================
   MODAL
===================================================== */

const productModal =
    document.getElementById(
        "productModal"
    );


const productModalTitle =
    document.getElementById(
        "productModalTitle"
    );


const closeProductModal =
    document.getElementById(
        "closeProductModal"
    );


const cancelProductButton =
    document.getElementById(
        "cancelProductButton"
    );


const productForm =
    document.getElementById(
        "productForm"
    );


const productId =
    document.getElementById(
        "productId"
    );


const productCodigo =
    document.getElementById(
        "productCodigo"
    );


const productNombre =
    document.getElementById(
        "productNombre"
    );


const productMarca =
    document.getElementById(
        "productMarca"
    );


const productCategoria =
    document.getElementById(
        "productCategoria"
    );


const productDescripcion =
    document.getElementById(
        "productDescripcion"
    );


const productPrecio =
    document.getElementById(
        "productPrecio"
    );

const productOferta =
    document.getElementById(
        "productOferta"
    );

const productStock =
    document.getElementById(
        "productStock"
    );


const productStockMaximo =
    document.getElementById(
        "productStockMaximo"
    );


const productActivo =
    document.getElementById(
        "productActivo"
    );


const productImagenes = 
    document.getElementById(
        "productImagenes"
    );

const imagesPreviewContainer = 
    document.getElementById(
        "imagesPreviewContainer"
    );

const imagesPreviewGrid = 
    document.getElementById(
        "imagesPreviewGrid"
    );

const saveProductButton =
    document.getElementById(
        "saveProductButton"
    );


const productFormMessage =
    document.getElementById(
        "productFormMessage"
    );


/* =====================================================
   INICIAR
===================================================== */

iniciarPanel();


async function iniciarPanel() {

    const {
        data: {
            session
        }
    } =
        await supabaseClient
            .auth
            .getSession();


    if (
        session &&
        session.user
    ) {

        verificarAdministrador(
            session.user
        );

    } else {

        mostrarLogin();

    }

}


/* =====================================================
   VERIFICAR ADMINISTRADOR
===================================================== */

function verificarAdministrador(
    usuario
) {

    const correo =
        String(
            usuario.email || ""
        )
        .toLowerCase()
        .trim();


    if (
        correo !==
        ADMIN_EMAIL
    ) {

        supabaseClient
            .auth
            .signOut();


        mostrarLogin();


        loginMessage.textContent =
            "Este usuario no tiene permisos de administrador.";


        return;

    }


    mostrarPanel(
        usuario
    );

}


/* =====================================================
   MOSTRAR LOGIN
===================================================== */

function mostrarLogin() {

    loginSection.classList.remove(
        "hidden"
    );


    adminSection.classList.add(
        "hidden"
    );

}


/* =====================================================
   MOSTRAR PANEL
===================================================== */

function mostrarPanel(
    usuario
) {

    loginSection.classList.add(
        "hidden"
    );


    adminSection.classList.remove(
        "hidden"
    );


    adminEmail.textContent =
        usuario.email;


    cargarInventarioAdmin();

}


/* =====================================================
   LOGIN
===================================================== */

loginForm.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();


        loginMessage.textContent =
            "";


        loginButton.disabled =
            true;


        loginButton.textContent =
            "⏳ Iniciando...";


        const email =
            emailInput.value
                .trim();


        const password =
            passwordInput.value;


        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({

                    email,

                    password

                });


        if (error) {

            console.error(
                "Error de inicio de sesión:",
                error
            );


            loginMessage.textContent =
                "Correo o contraseña incorrectos.";


            loginButton.disabled =
                false;


            loginButton.textContent =
                "🔐 Iniciar sesión";


            return;

        }


        if (
            data &&
            data.user
        ) {

            verificarAdministrador(
                data.user
            );

        }


        loginButton.disabled =
            false;


        loginButton.textContent =
            "🔐 Iniciar sesión";

    }
);


/* =====================================================
   CERRAR SESIÓN
===================================================== */

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient
            .auth
            .signOut();


        inventarioAdmin = [];


        inventoryTable.innerHTML =
            "";


        purchaseTable.innerHTML =
            "";


        cerrarModalProducto();


        mostrarLogin();


        emailInput.value =
            "";


        passwordInput.value =
            "";

    }
);


/* =====================================================
   CARGAR INVENTARIO
===================================================== */

async function cargarInventarioAdmin() {

    mostrarEstado(
        "⏳ Cargando inventario..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("inventario")
            .select("*")
            .order(
                "codigo",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error cargando inventario:",
            error
        );


        mostrarEstado(
            "❌ No se pudo cargar el inventario."
        );


        return;

    }


    inventarioAdmin =
        data || [];


    actualizarEstadisticas();


    mostrarInventario();


    mostrarProductosPorComprar();


    mostrarEstado(
        `✅ Inventario cargado: ${inventarioAdmin.length} productos.`
    );

}

async function subirImagenesProducto(productoId, archivos) {

    console.log(
        "📸 Archivos recibidos para subir:",
        archivos.length,
        archivos
    );

    const imagenesSubidas = [];

    for (let i = 0; i < archivos.length; i++) {

        const archivo = archivos[i];

        const extension =
            archivo.name.split(".").pop().toLowerCase();

        const nombreArchivo =
            `${crypto.randomUUID()}.${extension}`;

        const ruta =
            `productos/${productoId}/${nombreArchivo}`;

        console.log("Subiendo imagen:", ruta);

        const { error: errorUpload } =
            await supabaseClient
                .storage
                .from("productos")
                .upload(ruta, archivo, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: archivo.type
                });

        if (errorUpload) {
            console.error(
                "Error subiendo imagen:",
                errorUpload
            );

            throw errorUpload;
        }

        const { data: urlData } =
            supabaseClient
                .storage
                .from("productos")
                .getPublicUrl(ruta);

        const url = urlData.publicUrl;

        imagenesSubidas.push({
            ruta,
            url,
            orden: i,
            principal: i === 0
        });
    }

    return imagenesSubidas;
}

async function guardarImagenesProducto(
    productoId,
    imagenes
) {

    if (!imagenes.length) {
        return;
    }

    const registros = imagenes.map(imagen => ({
        producto_id: productoId,
        ruta: imagen.ruta,
        url: imagen.url,
        orden: imagen.orden,
        principal: imagen.principal
    }));

    const { error } =
        await supabaseClient
            .from("producto_imagenes")
            .insert(registros);

    if (error) {

        console.error(
            "Error guardando imágenes:",
            JSON.stringify(
                error,
                null,
                2
            )
        );

        throw error;
    }
}

/* =====================================================
   CARGAR IMÁGENES DEL PRODUCTO
===================================================== */

async function cargarImagenesProducto(
    productoId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("producto_imagenes")
            .select("*")
            .eq(
                "producto_id",
                productoId
            )
            .order(
                "orden",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error cargando imágenes del producto:",
            error
        );

        return [];

    }


    return data || [];

}

/* =====================================================
   HACER IMAGEN PRINCIPAL
===================================================== */

function hacerImagenPrincipal(imagenId) {

    imagenesExistentes =
        imagenesExistentes.map(
            imagen => ({

                ...imagen,

                principal:
                    imagen.id === imagenId

            })
        );


    mostrarVistaPreviaImagenesExistentes();

}


function eliminarImagenExistente(imagenId) {

    const imagen =
        imagenesExistentes.find(
            imagen =>
                Number(imagen.id) ===
                Number(imagenId)
        );


    if (!imagen) {

        console.error(
            "No se encontró la imagen:",
            imagenId
        );

        return;

    }


    /* ==========================================
       AGREGAR A LA LISTA DE ELIMINACIÓN
    ========================================== */

    const yaMarcada =
        imagenesEliminadas.some(
            eliminada =>
                Number(eliminada.id) ===
                Number(imagen.id)
        );


    if (!yaMarcada) {

        imagenesEliminadas.push(
            imagen
        );

    }


    /* ==========================================
       QUITAR DE LA VISTA ACTUAL
    ========================================== */

    imagenesExistentes =
        imagenesExistentes.filter(
            imagenActual =>
                Number(imagenActual.id) !==
                Number(imagen.id)
        );


    /* ==========================================
       SI ERA LA PRINCIPAL,
       ELEGIR OTRA AUTOMÁTICAMENTE
    ========================================== */

    if (
        imagen.principal &&
        imagenesExistentes.length > 0
    ) {

        imagenesExistentes =
            imagenesExistentes.map(
                (imagenActual, index) => ({

                    ...imagenActual,

                    principal:
                        index === 0

                })
            );

    }


    /* ==========================================
       ACTUALIZAR ORDEN
    ========================================== */

    actualizarOrdenImagenes();


    /* ==========================================
       ACTUALIZAR VISTA
    ========================================== */

    mostrarVistaPreviaImagenesExistentes();


    console.log(
        "🗑️ Imagen marcada para eliminar:",
        imagen
    );

}


/* =====================================================
   SUBIR IMAGEN EN EL ORDEN
===================================================== */

function subirImagenOrden(imagenId) {

    const index =
        imagenesExistentes.findIndex(
            imagen =>
                imagen.id === imagenId
        );


    if (
        index <= 0
    ) {

        return;
    }


    const temporal =
        imagenesExistentes[index - 1];


    imagenesExistentes[index - 1] =
        imagenesExistentes[index];


    imagenesExistentes[index] =
        temporal;


    actualizarOrdenImagenes();

    mostrarVistaPreviaImagenesExistentes();

}


/* =====================================================
   BAJAR IMAGEN EN EL ORDEN
===================================================== */

function bajarImagenOrden(imagenId) {

    const index =
        imagenesExistentes.findIndex(
            imagen =>
                imagen.id === imagenId
        );


    if (
        index === -1 ||
        index >= imagenesExistentes.length - 1
    ) {

        return;
    }


    const temporal =
        imagenesExistentes[index + 1];


    imagenesExistentes[index + 1] =
        imagenesExistentes[index];


    imagenesExistentes[index] =
        temporal;


    actualizarOrdenImagenes();

    mostrarVistaPreviaImagenesExistentes();

}


/* =====================================================
   ACTUALIZAR ORDEN
===================================================== */

function actualizarOrdenImagenes() {

    imagenesExistentes =
        imagenesExistentes.map(
            (imagen, index) => ({

                ...imagen,

                orden: index

            })
        );

}

/* =====================================================
   GUARDAR CAMBIOS DE IMÁGENES
===================================================== */

async function guardarCambiosImagenesProducto(
    productoId
) {

    /* =================================================
       1. ELIMINAR IMÁGENES MARCADAS
    ================================================= */

    if (
        imagenesEliminadas.length > 0
    ) {

        console.log(
            "🗑️ Imágenes a eliminar:",
            imagenesEliminadas
        );


        /* ==========================================
           OBTENER LAS RUTAS DE STORAGE
        ========================================== */

        const rutasStorage =
            imagenesEliminadas
                .map(
                    imagen =>
                        imagen.ruta
                )
                .filter(
                    ruta =>
                        typeof ruta === "string" &&
                        ruta.length > 0
                );


        /* ==========================================
           ELIMINAR ARCHIVOS DE STORAGE
        ========================================== */

        if (
            rutasStorage.length > 0
        ) {

            console.log(
                "🗑️ Eliminando de Storage:",
                rutasStorage
            );


            const {
                data: storageData,
                error: errorStorage
            } =
                await supabaseClient
                    .storage
                    .from("productos")
                    .remove(
                        rutasStorage
                    );


            if (errorStorage) {

                console.error(
                    "❌ Error eliminando imágenes de Storage:",
                    errorStorage
                );

                throw errorStorage;

            }


            console.log(
                "✅ Imágenes eliminadas de Storage:",
                storageData
            );

        }


        /* ==========================================
           ELIMINAR REGISTROS DE LA BASE DE DATOS
        ========================================== */

        const idsEliminar =
            imagenesEliminadas
                .map(
                    imagen =>
                        Number(imagen.id)
                )
                .filter(
                    id =>
                        Number.isFinite(id)
                );


        if (
            idsEliminar.length > 0
        ) {

            console.log(
                "🗑️ Eliminando registros de BD:",
                idsEliminar
            );


            const {
                error: errorDB
            } =
                await supabaseClient
                    .from("producto_imagenes")
                    .delete()
                    .in(
                        "id",
                        idsEliminar
                    );


            if (errorDB) {

                console.error(
                    "❌ Error eliminando registros de BD:",
                    errorDB
                );

                throw errorDB;

            }


            console.log(
                "✅ Registros eliminados de BD"
            );

        }


        /* ==========================================
           LIMPIAR LISTA
        ========================================== */

        imagenesEliminadas = [];

    }


    /* =================================================
       2. SUBIR NUEVAS IMÁGENES
    ================================================= */

    let nuevasImagenes = [];


    if (
        imagenesSeleccionadas.length > 0
    ) {

        nuevasImagenes =
            await subirImagenesProducto(
                productoId,
                imagenesSeleccionadas
            );

    }


    /* =================================================
       3. GUARDAR NUEVAS IMÁGENES EN BD
    ================================================= */

    if (
        nuevasImagenes.length > 0
    ) {

        /*
         * Las imágenes nuevas se agregan
         * después de las existentes.
         */

        const ultimoOrden =
            imagenesExistentes.length > 0
                ? Math.max(
                    ...imagenesExistentes.map(
                        imagen =>
                            Number(imagen.orden)
                    )
                )
                : -1;


        const registrosNuevos =
            nuevasImagenes.map(
                (imagen, index) => ({

                    producto_id:
                        productoId,

                    ruta:
                        imagen.ruta,

                    url:
                        imagen.url,

                    orden:
                        ultimoOrden +
                        index +
                        1,

                    /*
                     * Las imágenes nuevas
                     * NO reemplazan automáticamente
                     * a la principal existente.
                     */

                    principal: false

                })
            );


        const {
            data: imagenesInsertadas,
            error
        } =
            await supabaseClient
                .from("producto_imagenes")
                .insert(
                    registrosNuevos
                )
                .select();


        if (error) {

            console.error(
                "Error guardando nuevas imágenes:",
                error
            );

            throw error;

        }


        imagenesExistentes =
            [
                ...imagenesExistentes,
                ...(imagenesInsertadas || [])
            ];

    }


    /* =================================================
       4. ASEGURAR QUE EXISTA UNA PRINCIPAL
    ================================================= */

    if (
        imagenesExistentes.length > 0
    ) {

        let indicePrincipal =
            imagenesExistentes.findIndex(
                imagen =>
                    imagen.principal === true
            );


        /*
         * Si no hay principal,
         * la primera será principal.
         */

        if (
            indicePrincipal === -1
        ) {

            indicePrincipal = 0;

        }


        imagenesExistentes =
            imagenesExistentes.map(
                (imagen, index) => ({

                    ...imagen,

                    principal:
                        index === indicePrincipal,

                    orden:
                        index

                })
            );

    }


    /* =================================================
       5. ACTUALIZAR ORDEN Y PRINCIPAL EN BD
    ================================================= */

    for (
        const imagen of imagenesExistentes
    ) {

        const {
            error
        } =
            await supabaseClient
                .from("producto_imagenes")
                .update({

                    orden:
                        imagen.orden,

                    principal:
                        imagen.principal

                })
                .eq(
                    "id",
                    imagen.id
                );


        if (error) {

            console.error(
                "Error actualizando imagen:",
                error
            );

            throw error;

        }

    }


    /* =================================================
       6. OBTENER IMAGEN PRINCIPAL
    ================================================= */

    const imagenPrincipal =
        imagenesExistentes.find(
            imagen =>
                imagen.principal === true
        );


    /* =================================================
       7. SINCRONIZAR inventario.imagen_url
    ================================================= */

    const {
        error: errorImagenPrincipal
    } =
        await supabaseClient
            .from("inventario")
            .update({

                imagen_url:
                    imagenPrincipal
                        ? imagenPrincipal.url
                        : null

            })
            .eq(
                "id",
                productoId
            );


    if (
        errorImagenPrincipal
    ) {

        console.error(
            "Error actualizando imagen_url:",
            errorImagenPrincipal
        );

        throw errorImagenPrincipal;

    }

}

/* =====================================================
   MOSTRAR INVENTARIO
===================================================== */

function mostrarInventario() {

    const busqueda =
        adminSearch.value
            .toLowerCase()
            .trim();


    const productosFiltrados =
        inventarioAdmin.filter(
            producto => {

                const texto =
                    `
                    ${producto.codigo || ""}
                    ${producto.nombre || ""}
                    ${producto.marca || ""}
                    ${producto.categoria || ""}
                    ${producto.descripcion || ""}
                    `
                    .toLowerCase();


                return texto.includes(
                    busqueda
                );

            }
        );


    inventoryTable.innerHTML =
        "";


    if (
        productosFiltrados.length === 0
    ) {

        inventoryTable.innerHTML = `

            <tr>

                <td
                    colspan="11"
                    class="empty-table"
                >

                    No encontramos productos.

                </td>

            </tr>

        `;


        return;

    }


    productosFiltrados.forEach(
        producto => {

            const fila =
                document.createElement(
                    "tr"
                );


            const stock =
                obtenerStock(
                    producto
                );


            const stockMaximo =
                obtenerStockMaximo(
                    producto
                );


            fila.innerHTML = `

                <!-- IMAGEN -->

                <td>

                    ${
                        producto.imagen_url
                            ? `

                                <img
                                    src="${escaparAtributo(producto.imagen_url)}"
                                    alt="${escaparAtributo(producto.nombre || "Producto")}"
                                    class="admin-product-image"
                                    loading="lazy"
                                    onerror="this.style.display='none';"
                                >

                              `
                            : `

                                <div class="no-product-image">
                                    🖼️
                                </div>

                              `
                    }

                </td>


                <!-- NOMBRE -->

                <td>

                    <div class="product-name">

                        ${
                            escaparHTML(
                                producto.nombre ||
                                "Sin nombre"
                            )
                        }

                    </div>


                    ${
                        producto.descripcion
                            ? `

                                <small>
                                    ${
                                        escaparHTML(
                                            producto.descripcion
                                        )
                                    }
                                </small>

                              `
                            : ""
                    }

                </td>


                <!-- MARCA -->

                <td>

                    ${
                        escaparHTML(
                            producto.marca ||
                            "—"
                        )
                    }

                </td>


                <!-- CATEGORÍA -->

                <td>

                    ${
                        escaparHTML(
                            producto.categoria ||
                            "—"
                        )
                    }

                </td>


                <!-- CÓDIGO -->

                <td>

                    ${
                        escaparHTML(
                            String(
                                producto.codigo ||
                                ""
                            )
                        )
                    }

                </td>


                <!-- PRECIO -->

                <td>

                    ${
                        producto.precio !== null &&
                        producto.precio !== undefined
                            ? `Q ${Number(producto.precio).toFixed(2)}`
                            : "Sin precio"
                    }

                </td>

                <!-- OFERTA -->

                <td>

                    ${
                        Number(producto.oferta || 0) > 0
                            ? `
                                <strong
                                    style="color: #d32f2f;"
                                >
                                    🔥 -${Number(producto.oferta)}%
                                </strong>
                            `
                        : `
                                <span>
                                    —
                                </span>
                            `
                    }

                </td>

                <!-- STOCK -->

                <td>

                    <strong>
                        ${stock}
                    </strong>

                </td>


                <!-- STOCK MÁXIMO -->

                <td>

                    ${stockMaximo}

                </td>


                <!-- ESTADO -->

                <td>

                    ${
                        crearEstadoProducto(
                            producto
                        )
                    }

                </td>


                <!-- ACCIÓN -->

                <td>

                    <button
                        class="edit-button"
                        type="button"
                        data-id="${escaparAtributo(producto.id)}"
                    >

                        ✏️ Editar

                    </button>

                </td>

            `;


            inventoryTable.appendChild(
                fila
            );

        }
    );

}


/* =====================================================
   ESTADO DEL PRODUCTO
===================================================== */

function crearEstadoProducto(
    producto
) {

    if (
        producto.activo === false
    ) {

        return `

            <span class="stock-status status-inactive">
                ⚫ Inactivo
            </span>

        `;

    }


    return crearEstadoStock(
        obtenerStock(producto),
        obtenerStockMaximo(producto)
    );

}


/* =====================================================
   MOSTRAR PRODUCTOS POR COMPRAR
===================================================== */

function mostrarProductosPorComprar() {

    const productosPorComprar =
        inventarioAdmin
            .filter(
                producto =>
                    producto.activo !== false &&
                    necesitaReposicion(
                        producto
                    )
            )
            .sort(
                (
                    a,
                    b
                ) => {

                    const porcentajeA =
                        calcularPorcentajeStock(
                            obtenerStock(a),
                            obtenerStockMaximo(a)
                        );


                    const porcentajeB =
                        calcularPorcentajeStock(
                            obtenerStock(b),
                            obtenerStockMaximo(b)
                        );


                    return porcentajeA -
                        porcentajeB;

                }
            );


    purchaseTable.innerHTML =
        "";


    purchaseCount.textContent =
        `${productosPorComprar.length} ${
            productosPorComprar.length === 1
                ? "producto"
                : "productos"
        }`;


    if (
        productosPorComprar.length === 0
    ) {

        purchaseEmpty.classList.remove(
            "hidden"
        );


        purchaseTableContainer.classList.add(
            "hidden"
        );


        return;

    }


    purchaseEmpty.classList.add(
        "hidden"
    );


    purchaseTableContainer.classList.remove(
        "hidden"
    );


    productosPorComprar.forEach(
        producto => {

            const stock =
                obtenerStock(
                    producto
                );


            const stockMaximo =
                obtenerStockMaximo(
                    producto
                );


            const nivelReposicion =
                calcularNivelReposicion(
                    stockMaximo
                );


            const cantidadComprar =
                calcularCantidadComprar(
                    stock,
                    stockMaximo
                );


            const porcentajeActual =
                calcularPorcentajeStock(
                    stock,
                    stockMaximo
                );


            const fila =
                document.createElement(
                    "tr"
                );


            fila.innerHTML = `

                <td>

                    <div class="purchase-product-name">

                        ${
                            escaparHTML(
                                producto.nombre ||
                                "Producto"
                            )
                        }

                    </div>

                </td>


                <td>

                    ${
                        escaparHTML(
                            producto.marca ||
                            "—"
                        )
                    }

                </td>


                <td>

                    ${
                        escaparHTML(
                            String(
                                producto.codigo ||
                                ""
                            )
                        )
                    }

                </td>


                <td>

                    <span class="current-stock-alert">

                        ${stock}

                    </span>


                    <small>

                        ${formatearNumero(
                            porcentajeActual
                        )}% del máximo

                    </small>

                </td>


                <td>

                    ${stockMaximo}

                </td>


                <td>

                    ${formatearNumero(
                        nivelReposicion
                    )}

                </td>


                <td>

                    <strong class="buy-quantity">

                        ${cantidadComprar}

                    </strong>

                    <span class="buy-label">
                        unidades
                    </span>

                </td>

            `;


            purchaseTable.appendChild(
                fila
            );

        }
    );

}


/* =====================================================
   EVENTOS DE INVENTARIO
===================================================== */

inventoryTable.addEventListener(
    "click",
    evento => {

        const boton =
            evento.target.closest(
                "button"
            );


        if (!boton) return;


        const id =
            boton.dataset.id;


        if (!id) return;


        if (
            boton.classList.contains(
                "edit-button"
            )
        ) {

            const producto =
                inventarioAdmin.find(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(id)
                );


            if (producto) {

                abrirEditarProducto(
                    producto
                );

            }

        }

    }
);


/* =====================================================
   NUEVO PRODUCTO
===================================================== */

newProductButton.addEventListener(
    "click",
    () => {

        abrirNuevoProducto();

    }
);


/* =====================================================
   ABRIR NUEVO PRODUCTO
===================================================== */

function abrirNuevoProducto() {

    productoEditando =
        null;


    productForm.reset();

    imagenesSeleccionadas = [];
    imagenesExistentes = [];
    imagenesEliminadas = [];

    productImagenes.value = "";

    ocultarVistaPreviaImagenes();
    

    productId.value =
        "";


    productActivo.checked =
        true;


    productStock.value =
        "0";


    productStockMaximo.value =
        "0";
    
    productOferta.value =
        "0";

    productModalTitle.textContent =
        "Nuevo producto";


    saveProductButton.textContent =
        "💾 Crear producto";


    productFormMessage.textContent =
        "";


    productCodigo.disabled =
        false;


    abrirModalProducto();

}


/* =====================================================
   ABRIR EDITAR PRODUCTO
===================================================== */

function abrirEditarProducto(
    producto
) {

    productoEditando =
        producto;


    productModalTitle.textContent =
        "Editar producto";


    saveProductButton.textContent =
        "💾 Guardar cambios";


    productFormMessage.textContent =
        "";


    productId.value =
        producto.id || "";


    productCodigo.value =
        producto.codigo || "";


    productNombre.value =
        producto.nombre || "";


    productMarca.value =
        producto.marca || "";


    productCategoria.value =
        producto.categoria || "";


    productDescripcion.value =
        producto.descripcion || "";


    productPrecio.value =
        producto.precio !== null &&
        producto.precio !== undefined
            ? producto.precio
            : "";

    productOferta.value =
        producto.oferta !== null &&
        producto.oferta !== undefined
            ? producto.oferta
            : 0;

    productStock.value =
        obtenerStock(
            producto
        );


    productStockMaximo.value =
        obtenerStockMaximo(
            producto
        );


    productActivo.checked =
        producto.activo !== false;


    imagenesSeleccionadas = [];

    productImagenes.value = "";

    imagenesExistentes = [];

    imagenesEliminadas = [];

    ocultarVistaPreviaImagenes();


    cargarImagenesProducto(
        producto.id
    )
    .then(
        imagenes => {

            imagenesExistentes =
                imagenes;

            mostrarVistaPreviaImagenesExistentes();

        }
    );


    /*
       El código es el identificador
       principal del producto.
    */

    productCodigo.disabled =
        true;


    abrirModalProducto();

}


/* =====================================================
   ABRIR MODAL
===================================================== */

function abrirModalProducto() {

    productModal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "modal-open"
    );


    setTimeout(
        () => {

            productNombre.focus();

        },
        100
    );

}


/* =====================================================
   CERRAR MODAL
===================================================== */

function cerrarModalProducto() {

    productModal.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "modal-open"
    );


    productoEditando =
        null;

}


/* =====================================================
   BOTONES CERRAR
===================================================== */

closeProductModal.addEventListener(
    "click",
    cerrarModalProducto
);


cancelProductButton.addEventListener(
    "click",
    cerrarModalProducto
);


/* =====================================================
   CERRAR AL TOCAR FONDO
===================================================== */

const modalOverlay =
    productModal.querySelector(
        ".product-modal-overlay"
    );


if (modalOverlay) {

    modalOverlay.addEventListener(
        "click",
        cerrarModalProducto
    );

}


/* =====================================================
   ESC PARA CERRAR
===================================================== */

document.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key === "Escape" &&
            !productModal.classList.contains(
                "hidden"
            )
        ) {

            cerrarModalProducto();

        }

    }
);


/* =====================================================
   GUARDAR PRODUCTO
===================================================== */

productForm.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();


        productFormMessage.textContent =
            "";


        const codigo =
            productCodigo.value
                .trim();


        const nombre =
            productNombre.value
                .trim();


        const marca =
            productMarca.value
                .trim();


        const categoria =
            productCategoria.value
                .trim();


        const descripcion =
            productDescripcion.value
                .trim();


        const precioTexto =
            productPrecio.value
                .trim();


        const stockTexto =
            productStock.value
                .trim();


        const stockMaximoTexto =
            productStockMaximo.value
                .trim();

        const ofertaTexto =
            productOferta.value
                .trim();


        const activo =
            productActivo.checked;


        /* ==========================================
           VALIDACIONES
        ========================================== */

        if (!codigo) {

            mostrarMensajeFormulario(
                "❌ El código es obligatorio."
            );

            productCodigo.focus();

            return;

        }


        if (!nombre) {

            mostrarMensajeFormulario(
                "❌ El nombre del producto es obligatorio."
            );

            productNombre.focus();

            return;

        }


        const stock =
            convertirEnteroNoNegativo(
                stockTexto
            );


        const stockMaximo =
            convertirEnteroNoNegativo(
                stockMaximoTexto
            );


        if (
            stock === null ||
            stockMaximo === null
        ) {

            mostrarMensajeFormulario(
                "❌ El stock debe ser un número entero igual o mayor que 0."
            );

            return;

        }


        let precio =
            null;


        if (
            precioTexto !== ""
        ) {

            precio =
                Number(
                    precioTexto
                );


            if (
                !Number.isFinite(
                    precio
                ) ||
                precio < 0
            ) {

                mostrarMensajeFormulario(
                    "❌ El precio no es válido."
                );

                return;

            }


            precio =
                Math.round(
                    precio * 100
                ) / 100;

        }

        /* ==========================================
            VALIDAR OFERTA
        ========================================== */

        let oferta =
            ofertaTexto === ""
                ? 0
                : Number(
                    ofertaTexto
                );


        if (
            !Number.isFinite(oferta) ||
            oferta < 0 ||
            oferta > 100
        ) {

            mostrarMensajeFormulario(
                "❌ La oferta debe ser un porcentaje entre 0 y 100."
            );

            productOferta.focus();

            return;

        }


        oferta =
            Math.round(
                oferta * 100
            ) / 100;

        /* ==========================================
           DATOS
        ========================================== */

        const datosProducto = {

            codigo,

            nombre,

            marca:
                marca || null,

            categoria:
                categoria || null,

            descripcion:
                descripcion || null,

            precio,

            oferta,

            stock,

            stock_maximo:
                stockMaximo,

            activo,

            imagen_url:
                productoEditando
                    ? productoEditando.imagen_url
                    : null

        };


        saveProductButton.disabled =
            true;


        saveProductButton.textContent =
            "⏳ Guardando...";


        /* ==========================================
            EDITAR
        ========================================== */

        if (
            productoEditando
        ) {

            /* ==========================================
                1. ACTUALIZAR DATOS DEL PRODUCTO
            ========================================== */

            const {
                error
            } =
                await supabaseClient
                    .from("inventario")
                    .update(
                        datosProducto
                    )
                    .eq(
                        "id",
                        productoEditando.id
                    );


            if (error) {

                console.error(
                    "Error actualizando producto:",
                    error
                );


                mostrarMensajeFormulario(
                    "❌ No se pudo actualizar el producto."
                );


                saveProductButton.disabled =
                    false;


                saveProductButton.textContent =
                    "💾 Guardar cambios";


                return;

            }


            /* ==========================================
                2. GUARDAR CAMBIOS DE IMÁGENES
            ========================================== */

            try {

                await guardarCambiosImagenesProducto(
                    productoEditando.id
                );

            } catch (errorImagenes) {

                console.error(
                    "Error actualizando imágenes:",
                    errorImagenes
                );


                mostrarMensajeFormulario(
                    "⚠️ El producto se actualizó, pero hubo un problema con las imágenes."
                );


                saveProductButton.disabled =
                    false;


                saveProductButton.textContent =
                    "💾 Guardar cambios";


                return;

            }


            /* ==========================================
                3. ACTUALIZAR PRODUCTO LOCAL
            ========================================== */

            const indice =
                inventarioAdmin.findIndex(
                    producto =>
                        producto.id ===
                        productoEditando.id
                );


            if (
                indice !== -1
            ) {

                inventarioAdmin[indice] = {

                    ...inventarioAdmin[indice],

                    ...datosProducto,

                    imagen_url:
                        imagenesExistentes.length > 0
                            ? (
                                imagenesExistentes.find(
                                    imagen =>
                                        imagen.principal === true
                                )?.url || null
                            )
                            : null

                };

            }


            /* ==========================================
                4. MENSAJE DE ÉXITO
            ========================================== */

            mostrarEstado(
                `✅ Producto "${nombre}" actualizado correctamente.`
            );

        }

        /* ==========================================
            CREAR
        ========================================== */

        else {

            const {
                data: productoCreado,
                error
            } =
                await supabaseClient
                    .from("inventario")
                    .insert(
                        datosProducto
                    )
                    .select()
                    .single();


            /* ==========================================
                COMPROBAR ERROR AL CREAR
            ========================================== */

                if (error) {

                    console.error(
                        "Error creando producto:",
                        error
                    );


                    if (
                        error.code === "23505"
                    ) {

                        mostrarMensajeFormulario(
                            "❌ Ya existe un producto con ese código."
                        );

                    } else {

                        mostrarMensajeFormulario(
                            "❌ No se pudo crear el producto."
                    );

                }


                saveProductButton.disabled =
                    false;


                saveProductButton.textContent =
                    "💾 Crear producto";


                return;

            }


            /* ==========================================
                SUBIR IMÁGENES
            ========================================== */

            if (
                imagenesSeleccionadas.length > 0
            ) {

                try {

                    const imagenesSubidas =
                        await subirImagenesProducto(
                            productoCreado.id,
                            imagenesSeleccionadas
                        );


                    await guardarImagenesProducto(
                        productoCreado.id,
                        imagenesSubidas
                    );

                    /* ==========================================
                        GUARDAR IMAGEN PRINCIPAL
                    ========================================== */

                    const imagenPrincipal =
                        imagenesSubidas.find(
                            imagen =>
                            imagen.principal === true
                        );


                    if (
                        imagenPrincipal
                    ) {

                        const {
                            error: errorImagenPrincipal
                        } =
                            await supabaseClient
                                .from("inventario")
                                .update({
                                    imagen_url:
                                        imagenPrincipal.url
                                })
                                .eq(
                                    "id",
                                    productoCreado.id
                                );


                        if (
                            errorImagenPrincipal
                        ) {

                            console.error(
                                "Error guardando imagen principal:",
                                errorImagenPrincipal
                            );

                        }

                    }

                } catch (errorImagenes) {

                    console.error(
                        "Error procesando imágenes:",
                        errorImagenes
                    );


                    mostrarMensajeFormulario(
                        "⚠️ El producto se creó, pero hubo un problema al subir las imágenes."
                    );

                }

            }


            /* ==========================================
                AGREGAR PRODUCTO AL INVENTARIO LOCAL
            ========================================== */

                inventarioAdmin.push(
                    productoCreado
                );


                mostrarEstado(
                    `✅ Producto "${nombre}" creado correctamente.`
                );

            }


        /* ==========================================
           ACTUALIZAR INTERFAZ
        ========================================== */

        if (
            productoEditando
        ) {

            const indice =
                inventarioAdmin.findIndex(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(
                            productoEditando.id
                        )
                );


            if (
                indice !== -1
            ) {

                inventarioAdmin[
                    indice
                ] = {

                    ...inventarioAdmin[
                        indice
                    ],

                    ...datosProducto

                };

            }

        }


        actualizarEstadisticas();


        mostrarInventario();


        mostrarProductosPorComprar();


        cerrarModalProducto();


        saveProductButton.disabled =
            false;


        saveProductButton.textContent =
            "💾 Guardar producto";

    }
);



/*=====================================================
SELECCIÓN Y VISTA PREVIA DE IMÁGENES
=====================================================*/

productImagenes.addEventListener("change", manejarSeleccionImagenes);

function manejarSeleccionImagenes() {

    const archivos =
        Array.from(
            productImagenes.files
        );


    if (!archivos.length) {
        return;
    }


    /* ==========================================
       AGREGAR LAS NUEVAS IMÁGENES
       A LAS QUE YA EXISTEN EN MEMORIA
    ========================================== */

    imagenesSeleccionadas = [
        ...imagenesSeleccionadas,
        ...archivos
    ];


    /* ==========================================
       EVITAR DUPLICADOS
    ========================================== */

    imagenesSeleccionadas =
        imagenesSeleccionadas.filter(
            (archivo, index, array) =>
                index ===
                array.findIndex(
                    otroArchivo =>
                        otroArchivo.name ===
                        archivo.name &&
                        otroArchivo.size ===
                        archivo.size &&
                        otroArchivo.lastModified ===
                        archivo.lastModified
                )
        );


    mostrarVistaPreviaImagenes();


    /* ==========================================
       PERMITIR VOLVER A SELECCIONAR
       EL MISMO ARCHIVO
    ========================================== */

    productImagenes.value = "";

}


function mostrarVistaPreviaImagenes() {

    imagesPreviewGrid.innerHTML = "";

    if (!imagenesSeleccionadas.length) {
        ocultarVistaPreviaImagenes();
        return;
    }

    imagesPreviewContainer.classList.remove("hidden");

    imagenesSeleccionadas.forEach((archivo, index) => {

        const reader = new FileReader();

        reader.onload = function (evento) {

            const item = document.createElement("div");

            item.className =
                "image-preview-item" +
                (index === 0 ? " principal" : "");

            item.innerHTML = `
                <img
                    src="${evento.target.result}"
                    alt="Imagen ${index + 1}"
                >

                <div class="image-preview-number">
                    ${index + 1}
                </div>

                ${
                    index === 0
                        ? `
                            <div class="image-preview-badge">
                                ⭐ Principal
                            </div>
                          `
                        : ""
                }
            `;

            imagesPreviewGrid.appendChild(item);
        };

        reader.readAsDataURL(archivo);
    });
}

function mostrarVistaPreviaImagenesExistentes() {

    imagesPreviewGrid.innerHTML = "";

    if (!imagenesExistentes.length) {

        ocultarVistaPreviaImagenes();

        return;
    }

    imagesPreviewContainer.classList.remove(
        "hidden"
    );


    imagenesExistentes.forEach(
        (imagen, index) => {

            const item =
                document.createElement("div");


            item.className =
                "image-preview-item" +
                (
                    imagen.principal
                        ? " principal"
                        : ""
                );


            item.innerHTML = `

                <img
                    src="${escaparAtributo(imagen.url)}"
                    alt="Imagen ${index + 1}"
                >

                <div class="image-preview-number">
                    ${index + 1}
                </div>

                ${
                    imagen.principal
                        ? `
                            <div class="image-preview-badge">
                                ⭐ Principal
                            </div>
                          `
                        : ""
                }


                <div class="image-preview-actions">

                    <button
                        type="button"
                        class="image-action-button"
                        title="Hacer principal"
                        onclick="hacerImagenPrincipal(${imagen.id})"
                    >
                        ⭐
                    </button>


                    <button
                        type="button"
                        class="image-action-button"
                        title="Subir"
                        onclick="subirImagenOrden(${imagen.id})"
                    >
                        ⬆️
                    </button>


                    <button
                        type="button"
                        class="image-action-button"
                        title="Bajar"
                        onclick="bajarImagenOrden(${imagen.id})"
                    >
                        ⬇️
                    </button>


                    <button
                        type="button"
                        class="image-action-button danger"
                        title="Eliminar"
                        onclick="eliminarImagenExistente(${imagen.id})"
                    >
                        🗑️
                    </button>

                </div>

            `;


            imagesPreviewGrid.appendChild(
                item
            );

        }
    );

}

function ocultarVistaPreviaImagenes() {

    imagesPreviewGrid.innerHTML = "";

    imagesPreviewContainer.classList.add("hidden");
}


/* =====================================================
   MENSAJE DEL FORMULARIO
===================================================== */

function mostrarMensajeFormulario(
    mensaje
) {

    productFormMessage.textContent =
        mensaje;

}


/* =====================================================
   ESTADÍSTICAS
===================================================== */

function actualizarEstadisticas() {

    let disponibles = 0;

    let pocas = 0;

    let agotados = 0;

    let porComprar = 0;


    inventarioAdmin.forEach(
        producto => {

            if (
                producto.activo === false
            ) {

                return;

            }


            const stock =
                obtenerStock(
                    producto
                );


            const stockMaximo =
                obtenerStockMaximo(
                    producto
                );


            if (
                stock <= 0
            ) {

                agotados++;

            }

            else if (
                stock <= 5
            ) {

                pocas++;

            }

            else {

                disponibles++;

            }


            if (
                necesitaReposicion(
                    producto
                )
            ) {

                porComprar++;

            }

        }
    );


    document.getElementById(
        "totalProducts"
    ).textContent =
        inventarioAdmin.length;


    document.getElementById(
        "availableProducts"
    ).textContent =
        disponibles;


    document.getElementById(
        "lowStockProducts"
    ).textContent =
        pocas;


    document.getElementById(
        "outOfStockProducts"
    ).textContent =
        agotados;


    document.getElementById(
        "reorderProducts"
    ).textContent =
        porComprar;

}


/* =====================================================
   BUSCADOR
===================================================== */

adminSearch.addEventListener(
    "input",
    () => {

        mostrarInventario();

    }
);


/* =====================================================
   ACTUALIZAR
===================================================== */

refreshButton.addEventListener(
    "click",
    () => {

        cargarInventarioAdmin();

    }
);


/* =====================================================
   MENSAJES
===================================================== */

function mostrarEstado(
    mensaje
) {

    statusMessage.textContent =
        mensaje;

}


/* =====================================================
   NIVEL DE REPOSICIÓN
===================================================== */

function calcularNivelReposicion(
    stockMaximo
) {

    stockMaximo =
        Number(
            stockMaximo || 0
        );


    if (
        stockMaximo <= 0
    ) {

        return 0;

    }


    return stockMaximo *
        PORCENTAJE_REPOSICION;

}


/* =====================================================
   NECESITA REPOSICIÓN
===================================================== */

function necesitaReposicion(
    producto
) {

    if (
        producto.activo === false
    ) {

        return false;

    }


    const stock =
        obtenerStock(
            producto
        );


    const stockMaximo =
        obtenerStockMaximo(
            producto
        );


    if (
        stockMaximo <= 0
    ) {

        return false;

    }


    return stock <=
        calcularNivelReposicion(
            stockMaximo
        );

}


/* =====================================================
   CANTIDAD A COMPRAR
===================================================== */

function calcularCantidadComprar(
    stock,
    stockMaximo
) {

    stock =
        Number(
            stock || 0
        );


    stockMaximo =
        Number(
            stockMaximo || 0
        );


    if (
        stockMaximo <= 0
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.ceil(
            stockMaximo -
            stock
        )
    );

}


/* =====================================================
   PORCENTAJE STOCK
===================================================== */

function calcularPorcentajeStock(
    stock,
    stockMaximo
) {

    stock =
        Number(
            stock || 0
        );


    stockMaximo =
        Number(
            stockMaximo || 0
        );


    if (
        stockMaximo <= 0
    ) {

        return 0;

    }


    return (
        stock /
        stockMaximo
    ) * 100;

}


/* =====================================================
   OBTENER STOCK
===================================================== */

function obtenerStock(
    producto
) {

    return Math.max(
        0,
        Number(
            producto.stock || 0
        )
    );

}


/* =====================================================
   OBTENER STOCK MÁXIMO
===================================================== */

function obtenerStockMaximo(
    producto
) {

    return Math.max(
        0,
        Number(
            producto.stock_maximo || 0
        )
    );

}


/* =====================================================
   ESTADO STOCK
===================================================== */

function crearEstadoStock(
    stock,
    stockMaximo
) {

    stock =
        Number(
            stock || 0
        );


    stockMaximo =
        Number(
            stockMaximo || 0
        );


    if (
        stock <= 0
    ) {

        return `

            <span
                class="stock-status status-out"
            >
                🔴 Agotado
            </span>

        `;

    }


    if (
        stockMaximo > 0 &&
        stock <=
        calcularNivelReposicion(
            stockMaximo
        )
    ) {

        return `

            <span
                class="stock-status status-reorder"
            >
                🛒 Comprar
            </span>

        `;

    }


    if (
        stock <= 5
    ) {

        return `

            <span
                class="stock-status status-low"
            >
                🟡 Pocas unidades
            </span>

        `;

    }


    return `

        <span
            class="stock-status status-available"
        >
            🟢 Disponible
        </span>

    `;

}


/* =====================================================
   ENTERO NO NEGATIVO
===================================================== */

function convertirEnteroNoNegativo(
    valor
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            numero
        ) ||
        numero < 0
    ) {

        return null;

    }


    return Math.floor(
        numero
    );

}


/* =====================================================
   FORMATEAR NÚMERO
===================================================== */

function formatearNumero(
    numero
) {

    return Number(
        numero
    )
    .toLocaleString(
        "es-GT",
        {
            maximumFractionDigits: 2
        }
    );

}


/* =====================================================
   ESCAPAR HTML
===================================================== */

function escaparHTML(
    texto
) {

    return String(texto)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   ESCAPAR ATRIBUTO
===================================================== */

function escaparAtributo(
    texto
) {

    return escaparHTML(
        String(
            texto ?? ""
        )
    );

}


/* =====================================================
   DETECTAR CAMBIOS DE SESIÓN
===================================================== */

supabaseClient
    .auth
    .onAuthStateChange(
        (
            evento,
            session
        ) => {

            if (
                session &&
                session.user
            ) {

                verificarAdministrador(
                    session.user
                );

            }

            else {

                mostrarLogin();

            }

        }
    );
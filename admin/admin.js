/* =====================================================
   SAN MARTÍN
   PANEL DE ADMINISTRACIÓN
   INVENTARIO + STOCK MÁXIMO + REPOSICIÓN
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

/*
   El sistema considera que un producto necesita
   reposición cuando su stock actual es igual o menor
   al 30% de su stock máximo.
*/

const PORCENTAJE_REPOSICION = 0.30;


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


const statusMessage =
    document.getElementById(
        "statusMessage"
    );


/* =====================================================
   INVENTARIO
===================================================== */

let inventarioAdmin = [];


/* =====================================================
   ADMINISTRADOR PERMITIDO
===================================================== */

const ADMIN_EMAIL =
    "sanmartinlibreriapapeleria@gmail.com";


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
                    colspan="8"
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


            const nivelReposicion =
                calcularNivelReposicion(
                    stockMaximo
                );


            fila.innerHTML = `

                <!-- PRODUCTO -->

                <td>

                    <div class="product-name">

                        ${
                            escaparHTML(
                                producto.nombre ||
                                "Producto"
                            )
                        }

                    </div>

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


                <!-- STOCK ACTUAL -->

                <td>

                    <div class="stock-control">

                        <button
                            class="stock-button decrease"
                            type="button"
                            data-code="${escaparAtributo(producto.codigo)}"
                        >
                            −
                        </button>


                        <input
                            class="stock-input"
                            type="number"
                            min="0"
                            step="1"
                            value="${stock}"
                            data-code="${escaparAtributo(producto.codigo)}"
                        >


                        <button
                            class="stock-button increase"
                            type="button"
                            data-code="${escaparAtributo(producto.codigo)}"
                        >
                            +
                        </button>

                    </div>

                </td>


                <!-- STOCK MÁXIMO -->

                <td>

                    <input
                        class="max-stock-input"
                        type="number"
                        min="0"
                        step="1"
                        value="${stockMaximo}"
                        data-code="${escaparAtributo(producto.codigo)}"
                        aria-label="Stock máximo"
                    >

                </td>


                <!-- NIVEL DEL 30% -->

                <td>

                    <div class="reorder-level">

                        ${
                            stockMaximo > 0
                                ? `
                                    <strong>
                                        ${formatearNumero(nivelReposicion)}
                                    </strong>

                                    <span>
                                        unidades
                                    </span>
                                  `
                                : `
                                    <span class="not-configured">
                                        Sin definir
                                    </span>
                                  `
                        }

                    </div>

                </td>


                <!-- ESTADO -->

                <td class="status-cell">

                    ${crearEstadoStock(
                        stock,
                        stockMaximo
                    )}

                </td>


                <!-- GUARDAR -->

                <td>

                    <button
                        class="save-button"
                        type="button"
                        data-code="${escaparAtributo(producto.codigo)}"
                    >
                        💾 Guardar
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
   MOSTRAR PRODUCTOS POR COMPRAR
===================================================== */

function mostrarProductosPorComprar() {

    const productosPorComprar =
        inventarioAdmin
            .filter(
                producto =>
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


                    return porcentajeA - porcentajeB;

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

                <!-- PRODUCTO -->

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


                <!-- MARCA -->

                <td>

                    ${
                        escaparHTML(
                            producto.marca ||
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


                <!-- STOCK ACTUAL -->

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


                <!-- STOCK MÁXIMO -->

                <td>

                    ${stockMaximo}

                </td>


                <!-- 30% -->

                <td>

                    ${formatearNumero(
                        nivelReposicion
                    )}

                </td>


                <!-- CANTIDAD A COMPRAR -->

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
   EVENTOS DE TABLA
===================================================== */

inventoryTable.addEventListener(
    "click",
    evento => {

        const boton =
            evento.target.closest(
                "button"
            );


        if (!boton) return;


        const codigo =
            boton.dataset.code;


        if (!codigo) return;


        const fila =
            boton.closest("tr");


        if (!fila) return;


        const stockInput =
            fila.querySelector(
                ".stock-input"
            );


        const maxStockInput =
            fila.querySelector(
                ".max-stock-input"
            );


        if (!stockInput) return;


        /* ==========================================
           AUMENTAR
        ========================================== */

        if (
            boton.classList.contains(
                "increase"
            )
        ) {

            stockInput.value =
                Math.max(
                    0,
                    obtenerNumeroInput(
                        stockInput.value
                    ) + 1
                );


            actualizarVistaFila(
                fila
            );


            return;

        }


        /* ==========================================
           DISMINUIR
        ========================================== */

        if (
            boton.classList.contains(
                "decrease"
            )
        ) {

            stockInput.value =
                Math.max(
                    0,
                    obtenerNumeroInput(
                        stockInput.value
                    ) - 1
                );


            actualizarVistaFila(
                fila
            );


            return;

        }


        /* ==========================================
           GUARDAR
        ========================================== */

        if (
            boton.classList.contains(
                "save-button"
            )
        ) {

            if (!maxStockInput) {

                return;

            }


            guardarInventario(
                codigo,
                stockInput.value,
                maxStockInput.value,
                boton
            );

        }

    }
);


/* =====================================================
   ACTUALIZAR VISTA AL CAMBIAR VALORES
===================================================== */

inventoryTable.addEventListener(
    "input",
    evento => {

        if (
            !evento.target.classList.contains(
                "stock-input"
            ) &&
            !evento.target.classList.contains(
                "max-stock-input"
            )
        ) {

            return;

        }


        const fila =
            evento.target.closest("tr");


        if (!fila) return;


        actualizarVistaFila(
            fila
        );

    }
);


/* =====================================================
   ACTUALIZAR VISTA DE UNA FILA
===================================================== */

function actualizarVistaFila(
    fila
) {

    const stockInput =
        fila.querySelector(
            ".stock-input"
        );


    const maxStockInput =
        fila.querySelector(
            ".max-stock-input"
        );


    const estadoCelda =
        fila.querySelector(
            ".status-cell"
        );


    const nivelCelda =
        fila.querySelector(
            ".reorder-level"
        );


    if (
        !stockInput ||
        !maxStockInput
    ) {

        return;

    }


    const stock =
        Math.max(
            0,
            Math.floor(
                obtenerNumeroInput(
                    stockInput.value
                )
            )
        );


    const stockMaximo =
        Math.max(
            0,
            Math.floor(
                obtenerNumeroInput(
                    maxStockInput.value
                )
            )
        );


    /* ==========================================
       ACTUALIZAR ESTADO
    ========================================== */

    if (estadoCelda) {

        estadoCelda.innerHTML =
            crearEstadoStock(
                stock,
                stockMaximo
            );

    }


    /* ==========================================
       ACTUALIZAR NIVEL 30%
    ========================================== */

    if (nivelCelda) {

        const nivel =
            calcularNivelReposicion(
                stockMaximo
            );


        if (
            stockMaximo > 0
        ) {

            nivelCelda.innerHTML = `

                <strong>
                    ${formatearNumero(nivel)}
                </strong>

                <span>
                    unidades
                </span>

            `;

        } else {

            nivelCelda.innerHTML = `

                <span class="not-configured">
                    Sin definir
                </span>

            `;

        }

    }

}


/* =====================================================
   GUARDAR INVENTARIO
===================================================== */

async function guardarInventario(
    codigo,
    nuevoStock,
    nuevoStockMaximo,
    boton
) {

    nuevoStock =
        convertirEnteroNoNegativo(
            nuevoStock
        );


    nuevoStockMaximo =
        convertirEnteroNoNegativo(
            nuevoStockMaximo
        );


    if (
        nuevoStock === null ||
        nuevoStockMaximo === null
    ) {

        alert(
            "Los valores de stock deben ser números enteros iguales o mayores que 0."
        );

        return;

    }


    boton.disabled =
        true;


    boton.textContent =
        "⏳ Guardando";


    const {
        error
    } =
        await supabaseClient
            .from("inventario")
            .update({

                stock:
                    nuevoStock,

                stock_maximo:
                    nuevoStockMaximo

            })
            .eq(
                "codigo",
                codigo
            );


    if (error) {

        console.error(
            "Error actualizando inventario:",
            error
        );


        mostrarEstado(
            "❌ No se pudo guardar el cambio."
        );


        boton.disabled =
            false;


        boton.textContent =
            "💾 Guardar";


        return;

    }


    /* ================================================
       ACTUALIZAR MEMORIA LOCAL
    ================================================= */

    const producto =
        inventarioAdmin.find(
            item =>
                String(
                    item.codigo
                ) ===
                String(codigo)
        );


    if (producto) {

        producto.stock =
            nuevoStock;


        producto.stock_maximo =
            nuevoStockMaximo;

    }


    /* ================================================
       ACTUALIZAR TODO
    ================================================= */

    actualizarEstadisticas();


    mostrarProductosPorComprar();


    boton.textContent =
        "✅ Guardado";


    mostrarEstado(
        `✅ Inventario actualizado para el código ${codigo}.`
    );


    setTimeout(
        () => {

            boton.disabled =
                false;

            boton.textContent =
                "💾 Guardar";

        },
        1200
    );

}


/* =====================================================
   ESTADO DEL STOCK
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


    /* ================================================
       AGOTADO
    ================================================= */

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


    /* ================================================
       NECESITA REPOSICIÓN
    ================================================= */

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


    /* ================================================
       POCAS UNIDADES
    ================================================= */

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


    /* ================================================
       DISPONIBLE
    ================================================= */

    return `

        <span
            class="stock-status status-available"
        >

            🟢 Disponible

        </span>

    `;

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

            } else if (
                stock <= 5
            ) {

                pocas++;

            } else {

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
   CALCULAR NIVEL DE REPOSICIÓN
===================================================== */

/*
   EJEMPLO:

   Stock máximo = 50

   50 × 0.30 = 15

   Por lo tanto:

   Si stock actual <= 15
   necesita comprar.
*/

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
   DETERMINAR SI NECESITA COMPRA
===================================================== */

function necesitaReposicion(
    producto
) {

    const stock =
        obtenerStock(
            producto
        );


    const stockMaximo =
        obtenerStockMaximo(
            producto
        );


    /*
       Si todavía no se ha definido
       el stock máximo, no se genera alerta.
    */

    if (
        stockMaximo <= 0
    ) {

        return false;

    }


    const nivelReposicion =
        calcularNivelReposicion(
            stockMaximo
        );


    return stock <=
        nivelReposicion;

}


/* =====================================================
   CALCULAR CANTIDAD A COMPRAR
===================================================== */

/*
   IMPORTANTE:

   El 30% solamente determina CUÁNDO comprar.

   La cantidad que debemos comprar se calcula así:

   STOCK MÁXIMO - STOCK ACTUAL

   Ejemplo:

   máximo = 50
   actual = 1

   50 - 1 = 49

   Debemos comprar 49 unidades.
*/

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
   PORCENTAJE ACTUAL DEL STOCK
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
   CONVERTIR A ENTERO NO NEGATIVO
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
   OBTENER NÚMERO DE INPUT
===================================================== */

function obtenerNumeroInput(
    valor
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            numero
        )
    ) {

        return 0;

    }


    return numero;

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

            } else {

                mostrarLogin();

            }

        }
    );
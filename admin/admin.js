/* =====================================================
   SAN MARTÍN
   PANEL DE ADMINISTRACIÓN
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
   USUARIO ADMINISTRADOR PERMITIDO
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
                    colspan="6"
                    style="text-align:center;padding:30px;"
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
                Number(
                    producto.stock || 0
                );


            fila.innerHTML = `

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

                    <div class="stock-control">

                        <button
                            class="stock-button decrease"
                            type="button"
                            data-code="${producto.codigo}"
                        >
                            −
                        </button>


                        <input
                            class="stock-input"
                            type="number"
                            min="0"
                            value="${stock}"
                            data-code="${producto.codigo}"
                        >


                        <button
                            class="stock-button increase"
                            type="button"
                            data-code="${producto.codigo}"
                        >
                            +
                        </button>

                    </div>

                </td>


                <td>

                    ${crearEstadoStock(stock)}

                </td>


                <td>

                    <button
                        class="save-button"
                        type="button"
                        data-code="${producto.codigo}"
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


        const input =
            inventoryTable.querySelector(
                `.stock-input[data-code="${CSS.escape(String(codigo))}"]`
            );


        if (!input) return;


        if (
            boton.classList.contains(
                "increase"
            )
        ) {

            input.value =
                Number(input.value || 0) + 1;

            return;

        }


        if (
            boton.classList.contains(
                "decrease"
            )
        ) {

            input.value =
                Math.max(
                    0,
                    Number(
                        input.value || 0
                    ) - 1
                );

            return;

        }


        if (
            boton.classList.contains(
                "save-button"
            )
        ) {

            guardarStock(
                codigo,
                input.value,
                boton
            );

        }

    }
);


/* =====================================================
   ACTUALIZAR ESTADO AL CAMBIAR STOCK
===================================================== */

inventoryTable.addEventListener(
    "input",
    evento => {

        if (
            !evento.target.classList.contains(
                "stock-input"
            )
        ) {

            return;

        }


        const input =
            evento.target;


        const fila =
            input.closest("tr");


        const celdaEstado =
            fila.children[4];


        const stock =
            Math.max(
                0,
                Number(
                    input.value || 0
                )
            );


        celdaEstado.innerHTML =
            crearEstadoStock(
                stock
            );

    }
);


/* =====================================================
   GUARDAR STOCK
===================================================== */

async function guardarStock(
    codigo,
    nuevoStock,
    boton
) {

    nuevoStock =
        Number(nuevoStock);


    if (
        !Number.isFinite(
            nuevoStock
        ) ||
        nuevoStock < 0
    ) {

        alert(
            "La existencia no puede ser negativa."
        );

        return;

    }


    nuevoStock =
        Math.floor(
            nuevoStock
        );


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
                    nuevoStock

            })
            .eq(
                "codigo",
                codigo
            );


    if (error) {

        console.error(
            "Error actualizando stock:",
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
       Actualizar memoria local
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

    }


    actualizarEstadisticas();


    boton.textContent =
        "✅ Guardado";


    mostrarEstado(
        `✅ Stock actualizado para el código ${codigo}.`
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
    stock
) {

    stock =
        Number(stock || 0);


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
   ESTADÍSTICAS
===================================================== */

function actualizarEstadisticas() {

    let disponibles = 0;

    let pocas = 0;

    let agotados = 0;


    inventarioAdmin.forEach(
        producto => {

            const stock =
                Number(
                    producto.stock || 0
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
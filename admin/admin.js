/* =====================================================
   SAN MARTÍN
   PANEL ADMINISTRATIVO 2.0
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
   ADMINISTRADOR AUTORIZADO
===================================================== */

const ADMIN_UID =
    "0ef868b1-b816-4eb4-97ce-c9558a47caeb";


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


const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


const brandFilter =
    document.getElementById(
        "brandFilter"
    );


const stockFilter =
    document.getElementById(
        "stockFilter"
    );


const clearFilters =
    document.getElementById(
        "clearFilters"
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

    if (
        usuario.id !==
        ADMIN_UID
    ) {

        console.warn(
            "Usuario no autorizado."
        );


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
   CERRAR SESIÓN
===================================================== */

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient
            .auth
            .signOut();


        inventarioAdmin =
            [];


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
            .select(
                "codigo, stock"
            )
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


    construirFiltros();


    actualizarDashboard();


    mostrarInventario();


    mostrarEstado(
        `✅ Inventario actualizado · ${inventarioAdmin.length} productos`
    );

}


/* =====================================================
   BUSCAR DATOS DEL PRODUCTO
===================================================== */

function obtenerProducto(
    codigo
) {

    return productos.find(
        producto =>
            String(
                producto.codigo
            ) ===
            String(codigo)
    );

}


/* =====================================================
   ACTUALIZAR DASHBOARD
===================================================== */

function actualizarDashboard() {

    let totalUnidades =
        0;


    let disponibles =
        0;


    let stockBajo =
        0;


    let agotados =
        0;


    let valorInventario =
        0;


    inventarioAdmin.forEach(
        item => {

            const stock =
                Number(
                    item.stock || 0
                );


            const producto =
                obtenerProducto(
                    item.codigo
                );


            const precio =
                producto
                    ? Number(
                        producto.precio || 0
                    )
                    : 0;


            totalUnidades +=
                stock;


            valorInventario +=
                stock * precio;


            if (
                stock <= 0
            ) {

                agotados++;

            } else if (
                stock <= 5
            ) {

                stockBajo++;

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
        "totalUnits"
    ).textContent =
        totalUnidades.toLocaleString(
            "es-GT"
        );


    document.getElementById(
        "inventoryValue"
    ).textContent =
        formatearQuetzales(
            valorInventario
        );


    document.getElementById(
        "availableProducts"
    ).textContent =
        disponibles;


    document.getElementById(
        "lowStockProducts"
    ).textContent =
        stockBajo;


    document.getElementById(
        "outOfStockProducts"
    ).textContent =
        agotados;


    actualizarAlerta(
        stockBajo,
        agotados
    );

}


/* =====================================================
   ALERTA
===================================================== */

function actualizarAlerta(
    stockBajo,
    agotados
) {

    const alerta =
        document.getElementById(
            "inventoryAlert"
        );


    const texto =
        document.getElementById(
            "inventoryAlertText"
        );


    if (
        agotados === 0 &&
        stockBajo === 0
    ) {

        alerta.style.background =
            "var(--verde-suave)";


        alerta.style.borderColor =
            "#c7dfd2";


        texto.style.color =
            "#176b3a";


        texto.textContent =
            "Todo está en orden. No tienes productos agotados ni con stock bajo.";

        return;

    }


    if (
        agotados > 0 &&
        stockBajo > 0
    ) {

        texto.textContent =
            `Tienes ${agotados} producto${
                agotados === 1 ? "" : "s"
            } agotado${
                agotados === 1 ? "" : "s"
            } y ${stockBajo} con stock bajo.`;

        return;

    }


    if (
        agotados > 0
    ) {

        texto.textContent =
            `Tienes ${agotados} producto${
                agotados === 1 ? "" : "s"
            } agotado${
                agotados === 1 ? "" : "s"
            } que necesitan reposición.`;

        return;

    }


    texto.textContent =
        `Tienes ${stockBajo} producto${
            stockBajo === 1 ? "" : "s"
        } con stock bajo.`;

}


/* =====================================================
   CONSTRUIR FILTROS
===================================================== */

function construirFiltros() {

    const categorias =
        new Set();


    const marcas =
        new Set();


    productos.forEach(
        producto => {

            if (
                producto.categoria
            ) {

                categorias.add(
                    producto.categoria
                );

            }


            if (
                producto.marca
            ) {

                marcas.add(
                    producto.marca
                );

            }

        }
    );


    categoryFilter.innerHTML = `

        <option value="Todas">
            Todas las categorías
        </option>

    `;


    [...categorias]
        .sort()
        .forEach(
            categoria => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    categoria;


                option.textContent =
                    categoria;


                categoryFilter.appendChild(
                    option
                );

            }
        );


    brandFilter.innerHTML = `

        <option value="Todas">
            Todas las marcas
        </option>

    `;


    [...marcas]
        .sort()
        .forEach(
            marca => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    marca;


                option.textContent =
                    marca;


                brandFilter.appendChild(
                    option
                );

            }
        );

}


/* =====================================================
   MOSTRAR INVENTARIO
===================================================== */

function mostrarInventario() {

    const busqueda =
        normalizar(
            adminSearch.value
        );


    const categoria =
        categoryFilter.value;


    const marca =
        brandFilter.value;


    const estado =
        stockFilter.value;


    const resultados =
        inventarioAdmin.filter(
            item => {

                const producto =
                    obtenerProducto(
                        item.codigo
                    );


                if (!producto) {

                    return false;

                }


                const stock =
                    Number(
                        item.stock || 0
                    );


                const texto =
                    normalizar(`

                        ${producto.nombre || ""}

                        ${producto.marca || ""}

                        ${producto.categoria || ""}

                        ${producto.codigo || ""}

                    `);


                const coincideBusqueda =
                    !busqueda ||
                    texto.includes(
                        busqueda
                    );


                const coincideCategoria =
                    categoria ===
                        "Todas" ||
                    producto.categoria ===
                        categoria;


                const coincideMarca =
                    marca ===
                        "Todas" ||
                    producto.marca ===
                        marca;


                let coincideEstado =
                    true;


                if (
                    estado ===
                    "available"
                ) {

                    coincideEstado =
                        stock > 5;

                }


                if (
                    estado ===
                    "low"
                ) {

                    coincideEstado =
                        stock > 0 &&
                        stock <= 5;

                }


                if (
                    estado ===
                    "out"
                ) {

                    coincideEstado =
                        stock <= 0;

                }


                return (
                    coincideBusqueda &&
                    coincideCategoria &&
                    coincideMarca &&
                    coincideEstado
                );

            }
        );


    inventoryTable.innerHTML =
        "";


    if (
        resultados.length === 0
    ) {

        inventoryTable.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="no-results"
                >

                    <strong>
                        No encontramos productos
                    </strong>

                    Prueba con otro término o filtro.

                </td>

            </tr>

        `;

        return;

    }


    resultados.forEach(
        item => {

            const producto =
                obtenerProducto(
                    item.codigo
                );


            crearFila(
                producto,
                item
            );

        }
    );

}


/* =====================================================
   CREAR FILA
===================================================== */

function crearFila(
    producto,
    item
) {

    const fila =
        document.createElement(
            "tr"
        );


    const stock =
        Number(
            item.stock || 0
        );


    fila.innerHTML = `

        <td>

            <div class="product-name">

                ${escaparHTML(
                    producto.nombre
                )}

            </div>

        </td>


        <td>

            ${escaparHTML(
                producto.marca ||
                "—"
            )}

        </td>


        <td>

            ${escaparHTML(
                producto.categoria ||
                "—"
            )}

        </td>


        <td>

            <span class="product-code">

                ${escaparHTML(
                    String(
                        producto.codigo
                    )
                )}

            </span>

        </td>


        <td>

            <span class="product-price">

                ${formatearQuetzales(
                    Number(
                        producto.precio || 0
                    )
                )}

            </span>

        </td>


        <td>

            <div class="stock-control">

                <button
                    type="button"
                    class="stock-button decrease"
                    data-code="${producto.codigo}"
                >
                    −
                </button>


                <input
                    type="number"
                    min="0"
                    class="stock-input"
                    value="${stock}"
                    data-code="${producto.codigo}"
                >


                <button
                    type="button"
                    class="stock-button increase"
                    data-code="${producto.codigo}"
                >
                    +
                </button>

            </div>

        </td>


        <td>

            ${crearEstadoStock(
                stock
            )}

        </td>


        <td>

            <button
                type="button"
                class="save-button"
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


/* =====================================================
   BOTONES DE STOCK
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
                Number(
                    input.value || 0
                ) + 1;


            actualizarEstadoFila(
                input
            );


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


            actualizarEstadoFila(
                input
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
   CAMBIO MANUAL DE STOCK
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


        actualizarEstadoFila(
            evento.target
        );

    }
);


/* =====================================================
   ACTUALIZAR ESTADO DE FILA
===================================================== */

function actualizarEstadoFila(
    input
) {

    const fila =
        input.closest(
            "tr"
        );


    if (!fila) return;


    const stock =
        Math.max(
            0,
            Number(
                input.value || 0
            )
        );


    fila.children[6].innerHTML =
        crearEstadoStock(
            stock
        );

}


/* =====================================================
   GUARDAR STOCK
===================================================== */

async function guardarStock(
    codigo,
    nuevoStock,
    boton
) {

    nuevoStock =
        Number(
            nuevoStock
        );


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


    actualizarDashboard();


    boton.textContent =
        "✅ Guardado";


    mostrarEstado(
        `✅ Stock actualizado · Código ${codigo}`
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
   ESTADO
===================================================== */

function crearEstadoStock(
    stock
) {

    stock =
        Number(
            stock || 0
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
        stock <= 5
    ) {

        return `

            <span
                class="stock-status status-low"
            >

                🟡 Stock bajo

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
   BUSCADOR
===================================================== */

adminSearch.addEventListener(
    "input",
    mostrarInventario
);


/* =====================================================
   FILTROS
===================================================== */

categoryFilter.addEventListener(
    "change",
    mostrarInventario
);


brandFilter.addEventListener(
    "change",
    mostrarInventario
);


stockFilter.addEventListener(
    "change",
    mostrarInventario
);


/* =====================================================
   LIMPIAR FILTROS
===================================================== */

clearFilters.addEventListener(
    "click",
    () => {

        adminSearch.value =
            "";


        categoryFilter.value =
            "Todas";


        brandFilter.value =
            "Todas";


        stockFilter.value =
            "Todos";


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
   FORMATEAR QUETZALES
===================================================== */

function formatearQuetzales(
    cantidad
) {

    return new Intl.NumberFormat(
        "es-GT",
        {
            style:
                "currency",

            currency:
                "GTQ",

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    ).format(
        cantidad
    );

}


/* =====================================================
   NORMALIZAR TEXTO
===================================================== */

function normalizar(
    texto
) {

    return String(
        texto || ""
    )
    .toLowerCase()
    .normalize(
        "NFD"
    )
    .replace(
        /[\u0300-\u036f]/g,
        ""
    )
    .replace(
        /\s+/g,
        " "
    )
    .trim();

}


/* =====================================================
   ESCAPAR HTML
===================================================== */

function escaparHTML(
    texto
) {

    return String(
        texto || ""
    )
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
   CAMBIOS DE SESIÓN
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
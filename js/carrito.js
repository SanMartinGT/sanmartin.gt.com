/* =====================================================
   SAN MARTÍN - CARRITO Y CHECKOUT
   Cargar después de productos.js, catalogo.js y auth.js.
===================================================== */

const CLAVE_CARRITO = "sanmartin_carrito_v1";
const COSTO_ENVIO = 0;

let carrito = leerCarrito();
let direccionesCheckout = [];
let pedidoEnProceso = false;

const btnAbrirCarrito = document.getElementById("btnAbrirCarrito");
const btnCerrarCarrito = document.getElementById("btnCerrarCarrito");
const carritoPanel = document.getElementById("carritoPanel");
const carritoCantidad = document.getElementById("carritoCantidad");
const carritoItems = document.getElementById("carritoItems");
const carritoVacio = document.getElementById("carritoVacio");
const carritoContenido = document.getElementById("carritoContenido");
const carritoSubtotal = document.getElementById("carritoSubtotal");
const carritoEnvio = document.getElementById("carritoEnvio");
const carritoTotal = document.getElementById("carritoTotal");
const btnVaciarCarrito = document.getElementById("btnVaciarCarrito");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutDireccion = document.getElementById("checkoutDireccion");
const checkoutMensaje = document.getElementById("checkoutMensaje");
const btnRealizarPedido = document.getElementById("btnRealizarPedido");

function leerCarrito() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_CARRITO));

        if (!Array.isArray(datos)) {
            return [];
        }

        return datos
            .filter(item =>
                item &&
                item.codigo != null &&
                Number(item.cantidad) > 0 &&
                Number(item.precio) >= 0
            )
            .map(item => ({
                codigo: String(item.codigo),
                nombre: String(item.nombre || "Producto"),
                marca: String(item.marca || "San Martín"),
                imagen: String(item.imagen || ""),
                precio: Number(item.precio),
                cantidad: Math.max(1, Math.floor(Number(item.cantidad)))
            }));
    } catch (error) {
        console.warn("No se pudo leer el carrito guardado:", error);
        return [];
    }
}

function guardarCarrito() {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

function escaparHTMLCarrito(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function dinero(valor) {
    return `Q${Number(valor || 0).toFixed(2)}`;
}

function obtenerStockActual(codigo) {
    if (typeof inventario === "undefined") {
        return null;
    }

    const stock = inventario[String(codigo)];

    return Number.isFinite(Number(stock))
        ? Number(stock)
        : null;
}

function obtenerSubtotalCarrito() {
    return carrito.reduce(
        (acumulado, item) => acumulado + item.precio * item.cantidad,
        0
    );
}

function obtenerCantidadCarrito() {
    return carrito.reduce(
        (acumulado, item) => acumulado + item.cantidad,
        0
    );
}

function actualizarContadorCarrito() {
    if (!carritoCantidad) {
        return;
    }

    carritoCantidad.textContent = String(obtenerCantidadCarrito());
}

function mostrarMensajeCheckout(mensaje = "", tipo = "") {
    if (!checkoutMensaje) {
        return;
    }

    checkoutMensaje.textContent = mensaje;
    checkoutMensaje.dataset.tipo = tipo;
}

function renderizarCarrito() {
    actualizarContadorCarrito();

    if (!carritoItems || !carritoVacio || !carritoContenido) {
        return;
    }

    const estaVacio = carrito.length === 0;

    carritoVacio.hidden = !estaVacio;
    carritoContenido.hidden = estaVacio;

    if (estaVacio) {
        carritoItems.innerHTML = "";
        actualizarTotalesCarrito();
        return;
    }

    carritoItems.innerHTML = carrito.map(item => {
        const stock = obtenerStockActual(item.codigo);
        const llegoAlMaximo = stock !== null && item.cantidad >= stock;
        const imagen = item.imagen
            ? `<img src="${escaparHTMLCarrito(item.imagen)}" alt="${escaparHTMLCarrito(item.nombre)}">`
            : "<span aria-hidden=\"true\">📦</span>";

        return `
            <article class="carrito-item" data-codigo="${escaparHTMLCarrito(item.codigo)}">
                <div class="carrito-item-imagen">${imagen}</div>
                <div class="carrito-item-info">
                    <h4>${escaparHTMLCarrito(item.nombre)}</h4>
                    <p>${escaparHTMLCarrito(item.marca)}</p>
                    <p>Código: ${escaparHTMLCarrito(item.codigo)}</p>
                    <strong>${dinero(item.precio)}</strong>
                </div>
                <div class="carrito-item-acciones">
                    <div>
                        <button type="button" class="carrito-restar" data-codigo="${escaparHTMLCarrito(item.codigo)}" aria-label="Restar una unidad">−</button>
                        <span aria-label="Cantidad">${item.cantidad}</span>
                        <button type="button" class="carrito-sumar" data-codigo="${escaparHTMLCarrito(item.codigo)}" aria-label="Sumar una unidad" ${llegoAlMaximo ? "disabled" : ""}>+</button>
                    </div>
                    <strong>${dinero(item.precio * item.cantidad)}</strong>
                    <button type="button" class="carrito-eliminar" data-codigo="${escaparHTMLCarrito(item.codigo)}">Eliminar</button>
                </div>
            </article>
        `;
    }).join("");

    carritoItems.querySelectorAll(".carrito-restar").forEach(boton => {
        boton.addEventListener("click", () => cambiarCantidad(boton.dataset.codigo, -1));
    });

    carritoItems.querySelectorAll(".carrito-sumar").forEach(boton => {
        boton.addEventListener("click", () => cambiarCantidad(boton.dataset.codigo, 1));
    });

    carritoItems.querySelectorAll(".carrito-eliminar").forEach(boton => {
        boton.addEventListener("click", () => eliminarDelCarrito(boton.dataset.codigo));
    });

    actualizarTotalesCarrito();
}

function actualizarTotalesCarrito() {
    const subtotal = obtenerSubtotalCarrito();
    const total = subtotal + COSTO_ENVIO;

    if (carritoSubtotal) {
        carritoSubtotal.textContent = dinero(subtotal);
    }

    if (carritoEnvio) {
        carritoEnvio.textContent = dinero(COSTO_ENVIO);
    }

    if (carritoTotal) {
        carritoTotal.textContent = dinero(total);
    }
}

function agregarProductoAlCarrito(producto, precioFinal = null) {
    if (!producto || producto.codigo == null) {
        return;
    }

    const codigo = String(producto.codigo);
    const stock = obtenerStockActual(codigo);

    if (stock === null) {
        alert("El inventario aún se está cargando. Intenta de nuevo en un momento.");
        return;
    }

    if (stock <= 0) {
        alert("Este producto está agotado.");
        return;
    }

    const precio = Number(precioFinal ?? producto.precio);

    if (!Number.isFinite(precio) || precio < 0) {
        alert("Este producto no tiene un precio válido.");
        return;
    }

    const itemExistente = carrito.find(item => item.codigo === codigo);

    if (itemExistente) {
        if (itemExistente.cantidad >= stock) {
            alert(`Solo hay ${stock} unidad(es) disponible(s) de este producto.`);
            return;
        }

        itemExistente.cantidad += 1;
        itemExistente.precio = precio;
    } else {
        carrito.push({
            codigo,
            nombre: producto.nombre || "Producto",
            marca: producto.marca || "San Martín",
            imagen: producto.imagen || "",
            precio,
            cantidad: 1
        });
    }

    guardarCarrito();
    renderizarCarrito();
}

function obtenerPrecioVenta(producto) {
    const precioNormal = Number(producto?.precio);
    const porcentajeOferta = Number(producto?.oferta || 0);

    if (!Number.isFinite(precioNormal)) {
        return null;
    }

    if (porcentajeOferta > 0 && porcentajeOferta < 100) {
        return Number((precioNormal * (1 - porcentajeOferta / 100)).toFixed(2));
    }

    return precioNormal;
}

function conectarBotonesAgregarCarrito() {
    document.addEventListener("click", evento => {
        if (!(evento.target instanceof Element)) {
            return;
        }

        const boton = evento.target.closest(".product-add-cart");

        if (!boton) {
            return;
        }

        evento.preventDefault();
        evento.stopPropagation();

        if (typeof productos === "undefined") {
            console.error("No se encontró el listado de productos.");
            return;
        }

        const producto = productos.find(item =>
            String(item.codigo) === String(boton.dataset.codigo)
        );

        const precio = obtenerPrecioVenta(producto);

        if (!producto || precio === null) {
            alert("No fue posible encontrar este producto.");
            return;
        }

        agregarProductoAlCarrito(producto, precio);
    });
}

function cambiarCantidad(codigo, cambio) {
    const item = carrito.find(producto => producto.codigo === String(codigo));

    if (!item) {
        return;
    }

    const nuevaCantidad = item.cantidad + cambio;
    const stock = obtenerStockActual(item.codigo);

    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(item.codigo);
        return;
    }

    if (stock !== null && nuevaCantidad > stock) {
        alert(`Solo hay ${stock} unidad(es) disponible(s) de este producto.`);
        return;
    }

    item.cantidad = nuevaCantidad;
    guardarCarrito();
    renderizarCarrito();
}

function eliminarDelCarrito(codigo) {
    carrito = carrito.filter(item => item.codigo !== String(codigo));
    guardarCarrito();
    renderizarCarrito();
}

function vaciarCarrito() {
    if (carrito.length === 0) {
        return;
    }

    if (!confirm("¿Deseas vaciar todo el carrito?")) {
        return;
    }

    carrito = [];
    guardarCarrito();
    renderizarCarrito();
    mostrarMensajeCheckout("");
}

async function cargarDireccionesCheckout() {
    if (!checkoutDireccion) {
        return;
    }

    checkoutDireccion.innerHTML = "<option value=\"\">Cargando direcciones...</option>";
    direccionesCheckout = [];

    const {
        data: { user },
        error: errorUsuario
    } = await supabaseClient.auth.getUser();

    if (errorUsuario || !user) {
        checkoutDireccion.innerHTML = "<option value=\"\">Inicia sesión para elegir una dirección</option>";
        mostrarMensajeCheckout("Inicia sesión antes de confirmar tu pedido.", "error");
        return;
    }

    const { data, error } = await supabaseClient
        .from("direcciones")
        .select("id, nombre_direccion, nombre_receptor, telefono, departamento, municipio, direccion, referencia, principal")
        .eq("usuario_id", user.id)
        .order("principal", { ascending: false })
        .order("id", { ascending: false });

    if (error) {
        console.error("Error cargando direcciones para checkout:", error);
        checkoutDireccion.innerHTML = "<option value=\"\">No fue posible cargar tus direcciones</option>";
        mostrarMensajeCheckout("No fue posible cargar tus direcciones. Intenta nuevamente.", "error");
        return;
    }

    direccionesCheckout = data || [];

    if (direccionesCheckout.length === 0) {
        checkoutDireccion.innerHTML = "<option value=\"\">No tienes una dirección guardada</option>";
        mostrarMensajeCheckout("Guarda una dirección en Mi cuenta antes de confirmar el pedido.", "error");
        return;
    }

    checkoutDireccion.innerHTML = '<option value="">Selecciona una dirección</option>';

    direccionesCheckout.forEach(direccion => {
        const opcion = document.createElement("option");
        opcion.value = String(direccion.id);
        opcion.textContent = `${direccion.nombre_direccion} — ${direccion.direccion}, ${direccion.municipio}`;

        if (direccion.principal) {
            opcion.selected = true;
        }

        checkoutDireccion.appendChild(opcion);
    });

    mostrarMensajeCheckout("");
}

function abrirCarrito() {
    if (!carritoPanel) {
        return;
    }

    carritoPanel.hidden = false;
    renderizarCarrito();
    cargarDireccionesCheckout();
}

function cerrarCarrito() {
    if (carritoPanel) {
        carritoPanel.hidden = true;
    }
}

function pedirInicioSesion() {
    if (typeof mostrarVistaCuenta === "function") {
        mostrarVistaCuenta("login");
    }

    document.getElementById("cuenta")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function validarInventarioAntesDeComprar() {
    const codigos = carrito.map(item => item.codigo);

    const { data, error } = await supabaseClient
        .from("inventario")
        .select("codigo, stock")
        .in("codigo", codigos);

    if (error) {
        throw new Error("No fue posible validar el inventario.");
    }

    const inventarioActual = new Map(
        (data || []).map(item => [String(item.codigo), Number(item.stock || 0)])
    );

    const sinExistencias = carrito.find(item => {
        const stock = inventarioActual.get(item.codigo);
        return stock == null || item.cantidad > stock;
    });

    if (sinExistencias) {
        throw new Error(`El producto “${sinExistencias.nombre}” ya no tiene la cantidad solicitada.`);
    }
}

async function crearPedido(evento) {
    evento.preventDefault();

    if (pedidoEnProceso) {
        return;
    }

    if (carrito.length === 0) {
        mostrarMensajeCheckout("Agrega al menos un producto al carrito.", "error");
        return;
    }

    const {
        data: { user },
        error: errorUsuario
    } = await supabaseClient.auth.getUser();

    if (errorUsuario || !user) {
        mostrarMensajeCheckout("Debes iniciar sesión para realizar el pedido.", "error");
        pedirInicioSesion();
        return;
    }

    const direccionId = checkoutDireccion?.value;
    const direccion = direccionesCheckout.find(item => String(item.id) === String(direccionId));

    if (!direccion) {
        mostrarMensajeCheckout("Selecciona una dirección de entrega.", "error");
        return;
    }

    pedidoEnProceso = true;

    if (btnRealizarPedido) {
        btnRealizarPedido.disabled = true;
        btnRealizarPedido.textContent = "Procesando pedido...";
    }

    mostrarMensajeCheckout("Validando inventario...", "");

    try {
        await validarInventarioAntesDeComprar();

        const subtotal = Number(obtenerSubtotalCarrito().toFixed(2));
        const total = Number((subtotal + COSTO_ENVIO).toFixed(2));

        const { data: pedido, error: errorPedido } = await supabaseClient
            .from("pedidos")
            .insert({
                usuario_id: user.id,
                estado: "pendiente",
                subtotal,
                costo_envio: COSTO_ENVIO,
                total,
                cantidad_productos: obtenerCantidadCarrito(),
                metodo_pago: "contra_entrega",
                nombre_direccion: direccion.nombre_direccion,
                nombre_receptor: direccion.nombre_receptor,
                telefono: direccion.telefono,
                departamento: direccion.departamento,
                municipio: direccion.municipio,
                direccion: direccion.direccion,
                referencia: direccion.referencia || ""
            })
            .select("id")
            .single();

        if (errorPedido || !pedido) {
            console.error("Error creando pedido:", errorPedido);
            throw new Error("No fue posible crear el pedido.");
        }

        const itemsPedido = carrito.map(item => ({
            pedido_id: pedido.id,
            producto_codigo: item.codigo,
            producto_nombre: item.nombre,
            producto_marca: item.marca,
            producto_imagen: item.imagen || null,
            precio: Number(item.precio.toFixed(2)),
            cantidad: item.cantidad,
            subtotal: Number((item.precio * item.cantidad).toFixed(2))
        }));

        const { error: errorItems } = await supabaseClient
            .from("pedido_items")
            .insert(itemsPedido);

        if (errorItems) {
            console.error("Error creando items del pedido:", errorItems);
            throw new Error("El pedido no pudo guardar sus productos.");
        }

        const numeroPedido = typeof obtenerNumeroPedido === "function"
            ? obtenerNumeroPedido(pedido.id)
            : String(pedido.id).padStart(6, "0");
        carrito = [];
        guardarCarrito();
        renderizarCarrito();
        mostrarMensajeCheckout(`Pedido #${numeroPedido} creado. Te contactaremos para confirmar la entrega.`, "exito");

        if (typeof cargarMisPedidos === "function") {
            cargarMisPedidos();
        }
    } catch (error) {
        console.error("Error en checkout:", error);
        mostrarMensajeCheckout(error.message || "Ocurrió un error al crear el pedido.", "error");
    } finally {
        pedidoEnProceso = false;

        if (btnRealizarPedido) {
            btnRealizarPedido.disabled = false;
            btnRealizarPedido.textContent = "Confirmar pedido";
        }
    }
}

if (btnAbrirCarrito) {
    btnAbrirCarrito.addEventListener("click", abrirCarrito);
}

if (btnCerrarCarrito) {
    btnCerrarCarrito.addEventListener("click", cerrarCarrito);
}

if (btnVaciarCarrito) {
    btnVaciarCarrito.addEventListener("click", vaciarCarrito);
}

if (checkoutForm) {
    checkoutForm.addEventListener("submit", crearPedido);
}

conectarBotonesAgregarCarrito();
renderizarCarrito();
/* =====================================================
   SAN MARTÍN
   CONFIGURACIÓN Y DOM DE CUENTA DE CLIENTE
   00-configuracion-dom-cuenta.js
===================================================== */

"use strict";


/* =====================================================
   CONFIGURACIÓN SUPABASE
===================================================== */

/*
 * Este módulo solamente crea la referencia que utilizarán
 * los demás módulos para trabajar con autenticación.
 *
 * La lógica de autenticación pertenece exclusivamente
 * a 02-autenticacion-perfil-cuenta.js
 */
const supabaseAuth = supabaseClient;


/* =====================================================
   CUENTA / AUTENTICACIÓN
===================================================== */

const cuentaAcceso =
    document.getElementById("cuentaAcceso");

const formularioLogin =
    document.getElementById("formularioLogin");

const formularioRegistro =
    document.getElementById("formularioRegistro");

const formularioRecuperacion =
    document.getElementById("formularioRecuperacion");

const cuentaUsuario =
    document.getElementById("cuentaUsuario");


/* =====================================================
   BOTONES DE AUTENTICACIÓN
===================================================== */

const mostrarLogin =
    document.getElementById("mostrarLogin");

const mostrarRegistro =
    document.getElementById("mostrarRegistro");

const mostrarRecuperacion =
    document.getElementById("mostrarRecuperacion");

const volverCuenta =
    document.getElementById("volverCuenta");

const volverCuentaRegistro =
    document.getElementById("volverCuentaRegistro");

const volverLogin =
    document.getElementById("volverLogin");

const btnCerrarSesion =
    document.getElementById("btnCerrarSesion");


/* =====================================================
   FORMULARIOS DE AUTENTICACIÓN
===================================================== */

const loginForm =
    document.getElementById("loginForm");

const registroForm =
    document.getElementById("registroForm");

const recuperacionForm =
    document.getElementById("recuperacionForm");


/* =====================================================
   MENSAJES DE AUTENTICACIÓN
===================================================== */

const mensajeLogin =
    document.getElementById("mensajeLogin");

const mensajeRegistro =
    document.getElementById("mensajeRegistro");

const mensajeRecuperacion =
    document.getElementById("mensajeRecuperacion");

const nombreUsuario =
    document.getElementById("nombreUsuario");

const mensajeCuenta =
    document.getElementById("mensajeCuenta");


/* =====================================================
   MIS FAVORITOS
===================================================== */

const btnMisFavoritos =
    document.getElementById("btnMisFavoritos");

const misFavoritos =
    document.getElementById("misFavoritos");

const listaFavoritos =
    document.getElementById("listaFavoritos");

const btnVolverCuentaFavoritos =
    document.getElementById("btnVolverCuentaFavoritos");


/* =====================================================
   MIS DATOS
===================================================== */

const misDatos =
    document.getElementById("misDatos");

const formularioMisDatos =
    document.getElementById("formularioMisDatos");

const btnMisDatos =
    document.getElementById("btnMisDatos");

const btnVolverCuenta =
    document.getElementById("btnVolverCuenta");

const mensajeMisDatos =
    document.getElementById("mensajeMisDatos");

const datosNombre =
    document.getElementById("datosNombre");

const datosApellido =
    document.getElementById("datosApellido");

const datosEmail =
    document.getElementById("datosEmail");

const datosTelefono =
    document.getElementById("datosTelefono");


/* =====================================================
   MIS PEDIDOS
===================================================== */

const btnMisPedidos =
    document.getElementById("btnMisPedidos");

const misPedidos =
    document.getElementById("misPedidos");

const listaPedidosVista =
    document.getElementById("listaPedidosVista");

const detallePedidoVista =
    document.getElementById("detallePedidoVista");

const listaPedidos =
    document.getElementById("listaPedidos");

const contenidoDetallePedido =
    document.getElementById("contenidoDetallePedido");

const btnVolverCuentaPedidos =
    document.getElementById("btnVolverCuentaPedidos");

const btnVolverListaPedidos =
    document.getElementById("btnVolverListaPedidos");

const mensajePedidos =
    document.getElementById("mensajePedidos");


/* =====================================================
   MIS DIRECCIONES
===================================================== */

const btnMisDirecciones =
    document.getElementById("btnMisDirecciones");

const misDirecciones =
    document.getElementById("misDirecciones");

const listaDirecciones =
    document.getElementById("listaDirecciones");

const btnAgregarDireccion =
    document.getElementById("btnAgregarDireccion");

const formularioDireccionContainer =
    document.getElementById(
        "formularioDireccionContainer"
    );

const tituloFormularioDireccion =
    document.getElementById(
        "tituloFormularioDireccion"
    );

const formularioDireccion =
    document.getElementById(
        "formularioDireccion"
    );

const direccionId =
    document.getElementById("direccionId");

const direccionNombre =
    document.getElementById("direccionNombre");

const direccionReceptor =
    document.getElementById("direccionReceptor");

const direccionTelefono =
    document.getElementById("direccionTelefono");

const direccionDepartamento =
    document.getElementById("direccionDepartamento");

const direccionMunicipio =
    document.getElementById("direccionMunicipio");

const direccionCompleta =
    document.getElementById("direccionCompleta");

const direccionReferencia =
    document.getElementById("direccionReferencia");

const direccionPrincipal =
    document.getElementById("direccionPrincipal");

const btnCancelarDireccion =
    document.getElementById(
        "btnCancelarDireccion"
    );

const btnVolverCuentaDirecciones =
    document.getElementById(
        "btnVolverCuentaDirecciones"
    );

const mensajeDireccion =
    document.getElementById("mensajeDireccion");


/* =====================================================
   VERIFICACIÓN DE ELEMENTOS CRÍTICOS
===================================================== */

/*
 * Estos elementos son indispensables para que el sistema
 * de cuenta funcione correctamente.
 *
 * Si alguno falta en el HTML, aparecerá un aviso claro
 * en la consola en lugar de producir errores difíciles
 * de localizar posteriormente.
 */

const elementosCriticosCuenta = {
    cuentaAcceso,
    cuentaUsuario,
    formularioLogin,
    formularioRegistro,
    formularioRecuperacion,

    mostrarLogin,
    mostrarRegistro,
    mostrarRecuperacion,

    loginForm,
    registroForm,
    recuperacionForm,

    btnCerrarSesion
};


const elementosFaltantesCuenta = Object.entries(
    elementosCriticosCuenta
)
    .filter(([, elemento]) => !elemento)
    .map(([nombre]) => nombre);


if (elementosFaltantesCuenta.length > 0) {

    console.warn(
        "⚠ San Martín: faltan elementos críticos " +
        "del sistema de cuenta en el HTML:",
        elementosFaltantesCuenta
    );

}


/* =====================================================
   INICIO DEL MÓDULO
===================================================== */

console.log(
    "✓ San Martín: configuración DOM de cuenta cargada"
);
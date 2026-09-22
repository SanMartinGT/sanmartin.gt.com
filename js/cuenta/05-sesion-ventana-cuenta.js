/* =====================================================
   SAN MARTÍN
   05-sesion-ventana-cuenta.js

   SISTEMA DE VENTANA "MI CUENTA"

   RESPONSABILIDADES:
   - Abrir ventana de Mi cuenta
   - Cerrar ventana de Mi cuenta
   - Cerrar al hacer clic en el fondo
   - Cerrar con tecla ESC
   - Controlar aria-expanded
   - Controlar clase visual del body

   IMPORTANTE:
   Este archivo NO controla la autenticación.

   La sesión de Supabase se controla en:

   02-autenticacion-perfil-cuenta.js

   Este módulo tampoco debe decidir si el usuario
   está autenticado basándose en hidden.
===================================================== */


/* =====================================================
   ELEMENTOS PRINCIPALES
===================================================== */

const cuentaOverlay =
    document.getElementById(
        "cuentaOverlay"
    );


const btnAbrirCuenta =
    document.getElementById(
        "btnAbrirCuenta"
    );


const btnCerrarCuenta =
    document.getElementById(
        "btnCerrarCuenta"
    );


/* =====================================================
   OBTENER VISTAS DE CUENTA
===================================================== */

function obtenerVistasCuenta() {

    return {

        acceso:
            document.getElementById(
                "cuentaAcceso"
            ),

        login:
            document.getElementById(
                "formularioLogin"
            ),

        registro:
            document.getElementById(
                "formularioRegistro"
            ),

        recuperacion:
            document.getElementById(
                "formularioRecuperacion"
            ),

        usuario:
            document.getElementById(
                "cuentaUsuario"
            )

    };

}


/* =====================================================
   COMPROBAR SI EXISTE UNA VISTA ACTIVA
===================================================== */

function existeVistaCuentaActiva() {

    const vistas =
        obtenerVistasCuenta();


    /*
     * Una vista está activa cuando existe
     * y no está oculta.
     */

    return Object.values(
        vistas
    ).some(
        vista =>
            vista &&
            !vista.hidden
    );

}


/* =====================================================
   PREPARAR VISTA INICIAL DE RESPALDO
===================================================== */

function prepararVistaInicialCuenta() {

    /*
     * Si el sistema principal ya tiene una vista
     * activa, no hacemos absolutamente nada.
     *
     * Esto es importante porque:
     *
     * - el usuario podría estar en Mis pedidos
     * - Mis favoritos
     * - Mis datos
     * - Mis direcciones
     * - login
     * - registro
     *
     * y abrir nuevamente la ventana no debe
     * destruir su estado.
     */

    if (
        existeVistaCuentaActiva()
    ) {

        return;

    }


    /*
     * Si no existe ninguna vista activa,
     * utilizamos el controlador principal.
     */

    if (
        typeof mostrarVistaCuenta ===
        "function"
    ) {

        mostrarVistaCuenta(
            "acceso"
        );

        return;

    }


    /*
     * Respaldo por si el controlador todavía
     * no estuviera disponible.
     */

    const vistas =
        obtenerVistasCuenta();


    if (vistas.acceso) {

        vistas.acceso.hidden =
            false;

    }

}


/* =====================================================
   ABRIR VENTANA MI CUENTA
===================================================== */

function abrirVentanaCuenta() {

    if (!cuentaOverlay) {

        return;

    }


    /*
     * Mostrar ventana.
     */

    cuentaOverlay.hidden =
        false;


    /*
     * Actualizar accesibilidad.
     */

    if (btnAbrirCuenta) {

        btnAbrirCuenta.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    /*
     * Marcar body como cuenta abierta.
     */

    document.body.classList.add(
        "cuenta-abierta"
    );


    /*
     * Evitar scroll de fondo cuando
     * la ventana está abierta.
     */

    document.body.classList.add(
        "bloquear-scroll-cuenta"
    );


    /*
     * Comprobar si existe una vista.
     *
     * IMPORTANTE:
     * NO comprobamos autenticación aquí.
     */

    prepararVistaInicialCuenta();


    /*
     * Intentar llevar el foco a un elemento
     * útil dentro de la ventana.
     */

    const elementoFoco =
        cuentaOverlay.querySelector(
            "button, a, input, select, textarea"
        );


    if (
        elementoFoco &&
        typeof elementoFoco.focus ===
            "function"
    ) {

        /*
         * Esperar un instante para que el
         * navegador haya mostrado la ventana.
         */

        setTimeout(
            () => {

                try {

                    elementoFoco.focus();

                } catch (error) {

                    /*
                     * No interrumpir la apertura
                     * por un problema de foco.
                     */

                }

            },
            0
        );

    }

}


/* =====================================================
   BOTÓN ABRIR CUENTA
===================================================== */

if (btnAbrirCuenta) {

    btnAbrirCuenta.addEventListener(
        "click",
        event => {

            event.preventDefault();

            abrirVentanaCuenta();

        }
    );

}


/* =====================================================
   CERRAR VENTANA MI CUENTA
===================================================== */

function cerrarVentanaCuenta() {

    if (!cuentaOverlay) {

        return;

    }


    /*
     * Ocultar ventana.
     */

    cuentaOverlay.hidden =
        true;


    /*
     * Actualizar accesibilidad.
     */

    if (btnAbrirCuenta) {

        btnAbrirCuenta.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    /*
     * Quitar clases del body.
     */

    document.body.classList.remove(
        "cuenta-abierta"
    );


    document.body.classList.remove(
        "bloquear-scroll-cuenta"
    );


    /*
     * Devolver foco al botón que abrió
     * la ventana.
     */

    if (
        btnAbrirCuenta &&
        typeof btnAbrirCuenta.focus ===
            "function"
    ) {

        setTimeout(
            () => {

                try {

                    btnAbrirCuenta.focus();

                } catch (error) {

                    /*
                     * No hacer nada si el elemento
                     * ya no está disponible.
                     */

                }

            },
            0
        );

    }

}


/* =====================================================
   BOTÓN X
===================================================== */

if (btnCerrarCuenta) {

    btnCerrarCuenta.addEventListener(
        "click",
        event => {

            event.preventDefault();

            cerrarVentanaCuenta();

        }
    );

}


/* =====================================================
   CERRAR AL HACER CLIC EN EL FONDO
===================================================== */

if (cuentaOverlay) {

    cuentaOverlay.addEventListener(
        "click",
        event => {

            /*
             * Solo cerrar cuando el clic sea
             * directamente sobre el overlay.
             *
             * Si el usuario hace clic dentro de
             * la ventana, no se debe cerrar.
             */

            if (
                event.target ===
                cuentaOverlay
            ) {

                cerrarVentanaCuenta();

            }

        }
    );

}


/* =====================================================
   CERRAR CON ESC
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        if (
            !cuentaOverlay
        ) {

            return;

        }


        if (
            cuentaOverlay.hidden
        ) {

            return;

        }


        cerrarVentanaCuenta();

    }
);


/* =====================================================
   CERRAR CUANDO SE ACTIVA OTRO ESTADO DEL SITIO
===================================================== */

/*
 * Función pública para que otros módulos puedan
 * cerrar la ventana sin conocer directamente
 * cuentaOverlay.
 */

function cerrarCuentaDesdeModulo() {

    cerrarVentanaCuenta();

}


/* =====================================================
   EXPONER FUNCIONES PRINCIPALES
===================================================== */

/*
 * Las dejamos disponibles globalmente para que
 * otros módulos puedan utilizarlas si lo necesitan.
 */

window.abrirVentanaCuenta =
    abrirVentanaCuenta;


window.cerrarVentanaCuenta =
    cerrarVentanaCuenta;


window.cerrarCuentaDesdeModulo =
    cerrarCuentaDesdeModulo;


/* =====================================================
   INICIALIZACIÓN
===================================================== */

if (btnAbrirCuenta) {

    /*
     * Si por alguna razón el HTML no tiene
     * aria-expanded, lo inicializamos.
     */

    if (
        !btnAbrirCuenta.hasAttribute(
            "aria-expanded"
        )
    ) {

        btnAbrirCuenta.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


/* =====================================================
   FIN 05-sesion-ventana-cuenta.js
===================================================== */
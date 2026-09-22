/* =====================================================
   SAN MARTÍN
   INICIO DE CUENTA DE CLIENTE
   06-inicio-cuenta.js
===================================================== */

(function () {

    "use strict";

    /*
     * Evita que la inicialización se ejecute más de una vez.
     */
    let inicializado = false;


    /*
     * =====================================================
     * INICIALIZAR CUENTA
     * =====================================================
     *
     * La autenticación real pertenece al módulo 02.
     *
     * Este módulo solamente inicia la comprobación de sesión
     * una vez que todos los módulos anteriores fueron cargados.
     */
    async function inicializarCuenta() {

        if (inicializado) return;

        inicializado = true;


        /*
         * Verificamos que el módulo de autenticación
         * haya cargado correctamente.
         */
        if (typeof comprobarSesion !== "function") {

            console.error(
                "✕ San Martín: no se encontró comprobarSesion(). " +
                "Verifica que 02-autenticacion-perfil-cuenta.js " +
                "se haya cargado correctamente."
            );

            return;
        }


        /*
         * Comprobar la sesión actual de Supabase.
         *
         * Este proceso decidirá si el usuario debe ver:
         *
         * - cuentaAcceso
         * - cuentaUsuario
         */
        try {

            await comprobarSesion();

        } catch (error) {

            console.error(
                "✕ San Martín: error inicializando la cuenta de cliente:",
                error
            );

        }

    }


    /*
     * =====================================================
     * INICIO SEGURO
     * =====================================================
     *
     * Si el documento todavía está cargando, esperamos a
     * DOMContentLoaded.
     *
     * Si el DOM ya está disponible, iniciamos inmediatamente.
     */
    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            inicializarCuenta,
            { once: true }
        );

    } else {

        inicializarCuenta();

    }


    /*
     * Exponer una función opcional para poder reiniciar
     * manualmente la comprobación desde otros módulos
     * si en el futuro fuera necesario.
     */
    window.inicializarCuentaCliente = inicializarCuenta;

})();
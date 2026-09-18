/* =====================================================
   FAVORITOS DEL USUARIO

   - Usuario sin sesión = estado normal, NO es un error.
   - Usuario autenticado = favoritos almacenados en Supabase.
   - Los errores reales de Supabase sí se muestran en consola.
===================================================== */

const TABLA_FAVORITOS = "favoritos";

// Debe coincidir exactamente con la columna de tu tabla favoritos.
const COLUMNA_CODIGO_FAVORITO = "codigo_producto";

let favoritosUsuario = new Set();


/* =====================================================
   COMPROBAR FAVORITO
===================================================== */

function productoEsFavorito(codigo) {
    return favoritosUsuario.has(String(codigo));
}


/* =====================================================
   ACTUALIZAR BOTÓN DE FAVORITO
===================================================== */

function actualizarBotonFavorito(boton, activo, animar = false) {

    if (!boton) return;

    const etiqueta = activo
        ? "Quitar de favoritos"
        : "Agregar a favoritos";

    boton.classList.toggle("activo", activo);

    boton.textContent = activo
        ? "♥"
        : "♡";

    boton.setAttribute(
        "aria-label",
        etiqueta
    );

    boton.title = etiqueta;


    if (animar) {

        boton.classList.remove(
            "favorito-animacion"
        );

        void boton.offsetWidth;

        boton.classList.add(
            "favorito-animacion"
        );
    }
}


/* =====================================================
   ACTUALIZAR TODOS LOS BOTONES
===================================================== */

function actualizarBotonesFavoritos(
    botonAnimado = null
) {

    document
        .querySelectorAll(".btn-favorito-producto")
        .forEach(boton => {

            actualizarBotonFavorito(
                boton,
                productoEsFavorito(
                    boton.dataset.codigo
                ),
                boton === botonAnimado
            );

        });
}


/* =====================================================
   NOTIFICAR CAMBIOS
===================================================== */

function notificarFavoritosActualizados() {

    document.dispatchEvent(
        new CustomEvent(
            "favoritos:actualizados"
        )
    );
}


/* =====================================================
   LIMPIAR FAVORITOS DEL USUARIO

   Esto NO significa que haya ocurrido un error.
   Simplemente significa que no hay favoritos cargados.
===================================================== */

function limpiarFavoritosUsuario() {

    favoritosUsuario.clear();

    actualizarBotonesFavoritos();

    notificarFavoritosActualizados();
}


/* =====================================================
   CARGAR FAVORITOS DEL USUARIO
===================================================== */

async function cargarFavoritosUsuario() {

    try {

        /*
         * getSession() es apropiado aquí porque solamente
         * necesitamos saber si existe una sesión local.
         *
         * Un visitante sin sesión es un estado normal.
         */

        const {
            data: { session },
            error: errorSesion
        } = await supabaseClient.auth.getSession();


        /*
         * Error REAL obteniendo la sesión.
         */

        if (errorSesion) {

            console.error(
                "Error obteniendo sesión:",
                errorSesion
            );

            limpiarFavoritosUsuario();

            return;
        }


        /*
         * VISITANTE SIN SESIÓN
         *
         * Esto NO es un error.
         */

        if (!session?.user) {

            limpiarFavoritosUsuario();

            return;
        }


        /*
         * USUARIO AUTENTICADO
         */

        const user = session.user;


        const {
            data,
            error
        } = await supabaseClient
            .from(TABLA_FAVORITOS)
            .select(COLUMNA_CODIGO_FAVORITO)
            .eq(
                "usuario_id",
                user.id
            );


        /*
         * Error REAL consultando favoritos.
         */

        if (error) {

            console.error(
                "Error cargando favoritos:",
                error
            );

            limpiarFavoritosUsuario();

            return;
        }


        /*
         * Crear Set de favoritos
         */

        favoritosUsuario = new Set(

            (data ?? []).map(
                favorito =>
                    String(
                        favorito[
                            COLUMNA_CODIGO_FAVORITO
                        ]
                    )
            )

        );


        actualizarBotonesFavoritos();

        notificarFavoritosActualizados();

    }

    catch (error) {

        /*
         * Solo mostramos errores inesperados.
         */

        console.error(
            "Error inesperado cargando favoritos:",
            error
        );

        limpiarFavoritosUsuario();
    }
}


/* =====================================================
   CAMBIAR FAVORITO
===================================================== */

async function cambiarFavorito(
    producto,
    boton
) {

    if (
        !producto ||
        producto.codigo == null ||
        !boton
    ) {
        return;
    }


    /*
     * Evitar doble clic
     */

    if (
        boton.dataset.procesando === "true"
    ) {
        return;
    }


    boton.dataset.procesando = "true";

    boton.disabled = true;


    try {

        /*
         * Obtener sesión.
         *
         * getSession() NO genera AuthSessionMissingError
         * cuando el usuario está desconectado.
         */

        const {
            data: { session },
            error: errorSesion
        } = await supabaseClient.auth.getSession();


        /*
         * Error REAL de sesión.
         */

        if (errorSesion) {

            console.error(
                "Error obteniendo sesión:",
                errorSesion
            );

            alert(
                "No fue posible comprobar tu sesión. Intenta nuevamente."
            );

            return;
        }


        /*
         * USUARIO NO AUTENTICADO
         *
         * Esto es completamente normal.
         */

        if (!session?.user) {

            document
                .getElementById("cuenta")
                ?.scrollIntoView({
                    behavior: "smooth"
                });


            if (
                typeof mostrarVistaCuenta ===
                "function"
            ) {

                mostrarVistaCuenta(
                    "acceso"
                );
            }


            alert(
                "Para guardar productos en favoritos debes iniciar sesión en tu cuenta de San Martín."
            );

            return;
        }


        const user = session.user;

        const codigo =
            String(producto.codigo);


        const yaEsFavorito =
            productoEsFavorito(codigo);


        /* =================================================
           ELIMINAR FAVORITO
        ================================================= */

        if (yaEsFavorito) {

            const {
                error
            } = await supabaseClient
                .from(TABLA_FAVORITOS)
                .delete()
                .eq(
                    "usuario_id",
                    user.id
                )
                .eq(
                    COLUMNA_CODIGO_FAVORITO,
                    codigo
                );


            if (error) {

                console.error(
                    "Error eliminando favorito:",
                    error
                );

                alert(
                    "No fue posible quitar este producto de favoritos."
                );

                return;
            }


            favoritosUsuario.delete(
                codigo
            );
        }


        /* =================================================
           AGREGAR FAVORITO
        ================================================= */

        else {

            const {
                error
            } = await supabaseClient
                .from(TABLA_FAVORITOS)
                .insert({

                    usuario_id:
                        user.id,

                    [COLUMNA_CODIGO_FAVORITO]:
                        codigo
                });


            /*
             * 23505 = favorito duplicado.
             *
             * No lo consideramos un error grave porque
             * significa que el producto ya estaba guardado.
             */

            if (
                error &&
                error.code !== "23505"
            ) {

                console.error(
                    "Error agregando favorito:",
                    error
                );

                alert(
                    "No fue posible guardar este producto en favoritos."
                );

                return;
            }


            favoritosUsuario.add(
                codigo
            );
        }


        /*
         * Sincronizar todas las apariciones
         * del producto.
         */

        actualizarBotonesFavoritos(
            boton
        );

        notificarFavoritosActualizados();

    }

    catch (error) {

        console.error(
            "Error inesperado con favorito:",
            error
        );

        alert(
            "Ocurrió un error. Intenta nuevamente."
        );

    }

    finally {

        boton.dataset.procesando =
            "false";

        boton.disabled = false;
    }
}


/* =====================================================
   SINCRONIZAR FAVORITOS CON LA SESIÓN
===================================================== */

supabaseClient.auth.onAuthStateChange(
    async (evento, session) => {

        console.log(
            "Cambio de sesión para favoritos:",
            evento
        );


        /*
         * INITIAL_SESSION
         * SIGNED_IN
         * TOKEN_REFRESHED
         *
         * Si existe usuario, cargar favoritos.
         */

        if (session?.user) {

            await cargarFavoritosUsuario();

            return;
        }


        /*
         * SIGNED_OUT
         *
         * Usuario cerró sesión.
         */

        limpiarFavoritosUsuario();

    }
);

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

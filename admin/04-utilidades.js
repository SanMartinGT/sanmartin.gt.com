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
        !Number.isFinite(numero) ||
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

    return String(
        texto
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



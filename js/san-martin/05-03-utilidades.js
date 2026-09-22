/* =====================================================
   SAN MARTÍN
   CATÁLOGO — 05-03 UTILIDADES
===================================================== */


/* =====================================================
   NORMALIZAR TEXTO
   -----------------------------------------------------
   Convierte el texto a un formato uniforme para
   facilitar las búsquedas y comparaciones.
   
   Ejemplo:
   
   "Lápices  De  Colores"
   
   se convierte en:
   
   "lapices de colores"
===================================================== */

function normalizarTexto(texto) {

    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();

}
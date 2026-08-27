// ProComex — aviso de copyright del footer.
// Arrancó en 2026: muestra solo ese año mientras dure, y a partir de 2027
// pasa a mostrar el rango "2026–20XX" automáticamente, sin tocar el HTML.
(function () {
  var el = document.getElementById('copyright-year');
  if (!el) return;

  var startYear = 2026;
  var currentYear = new Date().getFullYear();

  el.textContent = currentYear > startYear
    ? startYear + '–' + currentYear
    : String(startYear);
})();

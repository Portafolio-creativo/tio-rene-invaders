/* Instalar el juego en la pantalla de inicio.
 *
 * El boton solo aparece si REALMENTE se puede instalar:
 *   - Chrome / Edge / Android avisan con el evento beforeinstallprompt, que se
 *     guarda para lanzarlo cuando el usuario pulse el boton.
 *   - Si ya esta instalada (la pagina corre en modo app), no se muestra nada.
 *   - iPhone no admite ese evento: ahi se explica el camino a mano, que es la
 *     unica forma que da Safari.
 *
 * Instalar tiene un premio extra: una app instalada arranca con el audio ya
 * autorizado, asi que la frase de bienvenida suena sola al abrirla.
 */
(function (global) {
  'use strict';

  var evento = null;          // el beforeinstallprompt guardado
  var boton = null;
  var ayuda = null;

  function estaInstalada() {
    try {
      if (global.matchMedia && global.matchMedia('(display-mode: standalone)').matches) { return true; }
      if (global.matchMedia && global.matchMedia('(display-mode: fullscreen)').matches) { return true; }
    } catch (e) { /* navegador antiguo */ }
    // iOS marca las apps de pantalla de inicio con esta propiedad.
    return !!(global.navigator && global.navigator.standalone);
  }

  function esIOS() {
    var ua = (global.navigator && global.navigator.userAgent) || '';
    var iPadNuevo = /Macintosh/.test(ua) && global.navigator.maxTouchPoints > 1;
    return /iPhone|iPad|iPod/.test(ua) || iPadNuevo;
  }

  function ocultar() {
    if (boton) { boton.hidden = true; }
    if (ayuda) { ayuda.hidden = true; }
  }

  function mostrarBoton() {
    if (boton && !estaInstalada()) { boton.hidden = false; }
  }

  function alPulsar() {
    if (evento) {
      var guardado = evento;
      evento = null;
      boton.hidden = true;
      guardado.prompt();
      if (guardado.userChoice && guardado.userChoice.then) {
        guardado.userChoice.then(function (resultado) {
          // Si lo rechaza, se vuelve a ofrecer mas adelante.
          if (!resultado || resultado.outcome !== 'accepted') { mostrarBoton(); }
        })['catch'](function () { mostrarBoton(); });
      }
      return;
    }
    // iPhone: no hay instalacion automatica, solo se puede explicar.
    if (ayuda) {
      ayuda.textContent = 'En iPhone: botón Compartir → "Añadir a pantalla de inicio".';
      ayuda.hidden = false;
    }
  }

  var Instalar = {
    iniciar: function () {
      boton = document.getElementById('btn-instalar');
      ayuda = document.getElementById('ayuda-instalar');
      if (!boton) { return; }

      if (estaInstalada()) { ocultar(); return; }

      boton.addEventListener('click', alPulsar);

      global.addEventListener('beforeinstallprompt', function (ev) {
        ev.preventDefault();          // se lanza cuando el usuario quiera
        evento = ev;
        mostrarBoton();
      });

      global.addEventListener('appinstalled', function () {
        evento = null;
        ocultar();
      });

      // En iPhone no llega ningun evento: se ofrece igual, con instrucciones.
      if (esIOS()) { mostrarBoton(); }
    },

    estaInstalada: estaInstalada
  };

  global.TRI = global.TRI || {};
  global.TRI.Instalar = Instalar;
})(window);

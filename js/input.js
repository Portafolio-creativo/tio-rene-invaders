/* InputManager: teclado + botones tactiles.
 *
 * El juego nunca consulta eventos del DOM directamente: pregunta por el estado
 * (izquierda / derecha / disparo) o se suscribe a acciones puntuales.
 */
(function (global) {
  'use strict';

  var estado = { izquierda: false, derecha: false, disparo: false };
  var suscriptores = [];
  var tactil = false;

  var TECLAS_IZQ = { ArrowLeft: 1, KeyA: 1 };
  var TECLAS_DER = { ArrowRight: 1, KeyD: 1 };
  var TECLAS_DISPARO = { Space: 1, KeyW: 1, ArrowUp: 1 };

  function emitir(accion) {
    for (var i = 0; i < suscriptores.length; i++) {
      suscriptores[i](accion);
    }
  }

  function alPulsarTecla(ev) {
    var c = ev.code;
    // El atajo de depuracion se comprueba primero: KeyD tambien mueve a la derecha.
    if (c === 'KeyD' && ev.ctrlKey && ev.shiftKey) {
      ev.preventDefault();
      emitir('depurar');
      return;
    }
    if (TECLAS_IZQ[c]) { estado.izquierda = true; ev.preventDefault(); }
    else if (TECLAS_DER[c]) { estado.derecha = true; ev.preventDefault(); }
    else if (TECLAS_DISPARO[c]) { estado.disparo = true; ev.preventDefault(); }
    else if (c === 'KeyP' || c === 'Escape') { ev.preventDefault(); emitir('pausa'); }
    else if (c === 'Enter' || c === 'NumpadEnter') { ev.preventDefault(); emitir('aceptar'); }
    else if (c === 'KeyM') { emitir('silencio'); }
    if (ev.repeat) { return; }
    emitir('cualquiera');
  }

  function alSoltarTecla(ev) {
    var c = ev.code;
    if (TECLAS_IZQ[c]) { estado.izquierda = false; }
    else if (TECLAS_DER[c]) { estado.derecha = false; }
    else if (TECLAS_DISPARO[c]) { estado.disparo = false; }
  }

  function conectarBoton(el) {
    var accion = el.getAttribute('data-accion');
    if (!accion) { return; }

    function activar(ev) {
      ev.preventDefault();
      tactil = true;
      if (accion === 'izquierda') { estado.izquierda = true; }
      else if (accion === 'derecha') { estado.derecha = true; }
      else if (accion === 'disparo') { estado.disparo = true; }
      else if (accion === 'pausa') { emitir('pausa'); }
      el.classList.add('pulsado');
      emitir('cualquiera');
      if (el.setPointerCapture && ev.pointerId !== undefined) {
        try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignorado */ }
      }
    }

    function soltar() {
      if (accion === 'izquierda') { estado.izquierda = false; }
      else if (accion === 'derecha') { estado.derecha = false; }
      else if (accion === 'disparo') { estado.disparo = false; }
      el.classList.remove('pulsado');
    }

    el.addEventListener('pointerdown', activar);
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
    el.addEventListener('pointerleave', soltar);
    el.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
  }

  var Input = {
    estado: estado,

    iniciar: function (contenedorBotones) {
      global.addEventListener('keydown', alPulsarTecla);
      global.addEventListener('keyup', alSoltarTecla);
      global.addEventListener('blur', function () {
        estado.izquierda = false; estado.derecha = false; estado.disparo = false;
        emitir('foco-perdido');
      });
      // Se conectan TODOS los [data-accion] del documento, no solo los de un
      // contenedor: asi el boton de pausa puede vivir en la barra superior y
      // los de mover/disparar en la botonera de abajo.
      var raiz = contenedorBotones && contenedorBotones.ownerDocument
        ? contenedorBotones.ownerDocument : global.document;
      var botones = raiz.querySelectorAll('[data-accion]');
      for (var i = 0; i < botones.length; i++) { conectarBoton(botones[i]); }
      tactil = ('ontouchstart' in global) || (global.navigator && global.navigator.maxTouchPoints > 0);
      return tactil;
    },

    esTactil: function () { return tactil; },

    /* callback(accion) con: pausa | aceptar | silencio | depurar | cualquiera |
       foco-perdido */
    alAccion: function (cb) {
      if (typeof cb === 'function') { suscriptores.push(cb); }
    },

    limpiar: function () {
      estado.izquierda = false;
      estado.derecha = false;
      estado.disparo = false;
    }
  };

  global.TRI = global.TRI || {};
  global.TRI.Input = Input;
})(window);

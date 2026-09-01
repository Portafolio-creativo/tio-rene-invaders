/* InputManager: teclado + botones tactiles.
 *
 * El juego nunca consulta eventos del DOM directamente: pregunta por el estado
 * (izquierda / derecha / disparo) o se suscribe a acciones puntuales.
 */
(function (global) {
  'use strict';

  /* 'absoluto' es la posicion pedida por la palanca, de 0 (izquierda del todo)
     a 1 (derecha del todo), o null si no se esta arrastrando. Con eso el
     recorrido del dedo se corresponde con el de la cabeza. */
  var estado = { izquierda: false, derecha: false, disparo: false, absoluto: null };
  var suscriptores = [];
  var tactil = false;
  var autoDisparo = true;    // dispara solo por defecto; el jugador solo se mueve

  /* Proporcion del radio que hay que pasar para que la palanca cuente como
     movimiento. Sin esta zona muerta, el dedo quieto en el centro haria
     temblar al personaje. */
  var ZONA_MUERTA = 0.16;

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
    if (TECLAS_IZQ[c]) { estado.izquierda = true; ev.preventDefault(); emitir('mover'); }
    else if (TECLAS_DER[c]) { estado.derecha = true; ev.preventDefault(); emitir('mover'); }
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
      if (accion === 'izquierda') { estado.izquierda = true; emitir('mover'); }
      else if (accion === 'derecha') { estado.derecha = true; emitir('mover'); }
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

  /* La palanca: se arrastra el dedo sin levantarlo. Se usa la captura del
     puntero para no perder el dedo si sale del circulo mientras arrastra. */
  function conectarPalanca(el) {
    if (!el) { return; }
    var mando = el.querySelector('#palanca-mando');
    var arrastrando = false;

    /* Reparte el recorrido: el ancho util de la palanca (descontando el mando,
       que no puede salirse) se corresponde con TODO el recorrido de la cabeza.
       Asi el dedo y el personaje avanzan lo mismo. */
    function mover(clienteX) {
      var caja = el.getBoundingClientRect();
      var anchoMando = mando ? mando.getBoundingClientRect().width : 0;
      var util = caja.width - anchoMando;
      if (util <= 0) { return; }
      var t = (clienteX - caja.left - anchoMando / 2) / util;
      t = Math.max(0, Math.min(1, t));
      estado.absoluto = t;
      // Las banderas se mantienen por si algo las consulta (depuracion).
      estado.izquierda = false;
      estado.derecha = false;
      if (mando) { mando.style.left = (anchoMando / 2 + t * util) + 'px'; }
    }

    function soltar() {
      arrastrando = false;
      estado.absoluto = null;      // deja de mandar: la cabeza se queda quieta
      estado.izquierda = false;
      estado.derecha = false;
      el.classList.remove('pulsado');
    }

    el.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      tactil = true;
      arrastrando = true;
      el.classList.add('pulsado');
      if (el.setPointerCapture && ev.pointerId !== undefined) {
        try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignorado */ }
      }
      mover(ev.clientX);
      // El primer contacto con la palanca es lo que lanza la partida desde la
      // portada: se avisa ANTES de 'cualquiera' para que la posicion del dedo
      // ya este puesta cuando el jugador aparezca.
      emitir('mover');
      emitir('cualquiera');
    });
    el.addEventListener('pointermove', function (ev) {
      if (!arrastrando) { return; }
      ev.preventDefault();
      mover(ev.clientX);
    });
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
    el.addEventListener('lostpointercapture', soltar);
    el.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
  }

  var Input = {
    estado: estado,

    iniciar: function (contenedorBotones) {
      global.addEventListener('keydown', alPulsarTecla);
      global.addEventListener('keyup', alSoltarTecla);
      global.addEventListener('blur', function () {
        estado.izquierda = false; estado.derecha = false; estado.disparo = false;
        estado.absoluto = null;
        emitir('foco-perdido');
      });
      // Se conectan TODOS los [data-accion] del documento, no solo los de un
      // contenedor: asi el boton de pausa puede vivir en la barra superior y
      // los de mover/disparar en la botonera de abajo.
      var raiz = contenedorBotones && contenedorBotones.ownerDocument
        ? contenedorBotones.ownerDocument : global.document;
      var botones = raiz.querySelectorAll('[data-accion]');
      for (var i = 0; i < botones.length; i++) { conectarBoton(botones[i]); }
      conectarPalanca(raiz.getElementById('palanca'));
      tactil = ('ontouchstart' in global) || (global.navigator && global.navigator.maxTouchPoints > 0);
      return tactil;
    },

    esTactil: function () { return tactil; },

    /* Lo que el juego debe consultar para saber si hay que disparar: junta el
       boton pulsado y el modo automatico. */
    disparando: function () {
      return autoDisparo || estado.disparo;
    },

    /* Posicion pedida por la palanca (0 a 1) o null si no se arrastra. */
    posicionAbsoluta: function () {
      return estado.absoluto;
    },

    autoDisparoActivo: function () { return autoDisparo; },

    fijarAutoDisparo: function (activo) {
      autoDisparo = !!activo;
      return autoDisparo;
    },

    /* Cambia entre palanca y flechas sueltas. Al cambiar se sueltan las
       direcciones, para no dejar al personaje corriendo solo. */
    fijarPalanca: function (activa) {
      document.body.classList.toggle('control-palanca', !!activa);
      estado.izquierda = false;
      estado.derecha = false;
      return !!activa;
    },

    /* callback(accion) con: pausa | aceptar | silencio | depurar | mover |
       cualquiera | foco-perdido */
    alAccion: function (cb) {
      if (typeof cb === 'function') { suscriptores.push(cb); }
    },

    /* El arranque del juego limpia la entrada (para no arrastrar teclas de un
       nivel al siguiente), pero el dedo o la tecla que ACABA de lanzar la
       partida siguen puestos. Con estas dos se guarda ese gesto y se vuelve a
       poner, para que el jugador no tenga que soltar y repetir. */
    instantanea: function () {
      return {
        izquierda: estado.izquierda,
        derecha: estado.derecha,
        disparo: estado.disparo,
        absoluto: estado.absoluto
      };
    },

    restaurar: function (s) {
      if (!s) { return; }
      estado.izquierda = !!s.izquierda;
      estado.derecha = !!s.derecha;
      estado.disparo = !!s.disparo;
      estado.absoluto = typeof s.absoluto === 'number' ? s.absoluto : null;
    },

    limpiar: function () {
      estado.izquierda = false;
      estado.derecha = false;
      estado.disparo = false;
      estado.absoluto = null;
    }
  };

  global.TRI = global.TRI || {};
  global.TRI.Input = Input;
})(window);

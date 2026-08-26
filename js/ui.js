/* UIManager: las pantallas de menu, pausa, game over y victoria.
 *
 * Son HTML real (botones de verdad, accesibles con teclado y lector de
 * pantalla) superpuestos al canvas. Todo el texto se escribe con textContent:
 * en el juego no hay ni una sola linea de innerHTML, asi no existe superficie
 * de inyeccion de HTML.
 */
(function (global) {
  'use strict';

  var TRI = global.TRI;
  var ESTADOS = TRI.ESTADOS;
  var Audio = TRI.Audio;
  var Util = TRI.Util;

  function $(id) { return document.getElementById(id); }

  function UI(acciones) {
    this.acciones = acciones;
    this.capas = {
      menu: $('capa-menu'),
      pausa: $('capa-pausa'),
      gameOver: $('capa-game-over'),
      victoria: $('capa-victoria')
    };
    this.textoCarga = $('texto-carga');
    this.botonJugar = $('btn-jugar');
    this.recordMenu = $('record-menu');
    this.puntosFinal = $('puntos-final');
    this.recordFinal = $('record-final');
    this.mensajeFinal = $('mensaje-final');
    this.puntosVictoria = $('puntos-victoria');
    this.avisoAlmacenamiento = $('aviso-almacenamiento');
    this.botonSonido = $('btn-sonido');
    this.control = $('control-volumen');
    this.chkAuto = $('chk-auto');
    this.conectar();
  }

  UI.prototype.conectar = function () {
    var self = this;
    var mapa = [
      ['btn-jugar', 'jugar'],
      ['btn-reanudar', 'reanudar'],
      ['btn-menu-pausa', 'menu'],
      ['btn-reintentar', 'jugar'],
      ['btn-menu-final', 'menu'],
      ['btn-seguir', 'seguir'],
      ['btn-menu-victoria', 'menu']
    ];
    mapa.forEach(function (par) {
      var el = $(par[0]);
      if (!el) { return; }
      el.addEventListener('click', function () {
        Audio.desbloquear();
        // En JUGAR no suena el "bip": lo que toca es la frase de bienvenida,
        // y las dos comparten canal de voz.
        if (par[1] !== 'jugar') { Audio.reproducir('menu'); }
        self.acciones[par[1]]();
      });
    });

    if (this.botonSonido) {
      this.botonSonido.addEventListener('click', function () {
        Audio.desbloquear();
        self.pintarBotonSonido(Audio.alternarActivo());
      });
    }
    if (this.control) {
      this.control.value = String(Math.round(Audio.obtenerVolumen() * 100));
      this.control.addEventListener('input', function () {
        Audio.desbloquear();
        Audio.ajustarVolumen(Number(self.control.value) / 100);
      });
      this.control.addEventListener('change', function () {
        Audio.reproducir('menu');
      });
    }
    if (this.chkAuto) {
      var autoGuardado = TRI.Storage.leerAutoDisparo();
      TRI.Input.fijarAutoDisparo(autoGuardado);
      this.chkAuto.checked = autoGuardado;
      this.pintarAutoDisparo(autoGuardado);
      this.chkAuto.addEventListener('change', function () {
        var activo = TRI.Input.fijarAutoDisparo(self.chkAuto.checked);
        TRI.Storage.guardarAutoDisparo(activo);
        self.pintarAutoDisparo(activo);
        Audio.desbloquear();
        Audio.reproducir('menu');
      });
    }
    this.pintarBotonSonido(Audio.estaActivo());
  };

  /* Con el disparo automatico encendido, el boton de disparo pasa a decir
     AUTO y se atenua: sigue funcionando, pero ya no hace falta apretarlo. */
  UI.prototype.pintarAutoDisparo = function (activo) {
    document.body.classList.toggle('auto-disparo', activo);
    var boton = document.querySelector('.tacto.disparo');
    if (boton) { boton.textContent = activo ? 'AUTO' : 'DISPARO'; }
  };

  UI.prototype.pintarBotonSonido = function (activo) {
    if (!this.botonSonido) { return; }
    this.botonSonido.textContent = activo ? 'SONIDO: SI' : 'SONIDO: NO';
    this.botonSonido.setAttribute('aria-pressed', activo ? 'true' : 'false');
    this.botonSonido.classList.toggle('apagado', !activo);
  };

  /* Mientras cargan los dibujos, el boton JUGAR esta apagado y debajo se ve
     el avance. Como todo pesa poco, normalmente dura un pestaneo. */
  UI.prototype.progresoCarga = function (hechos, total) {
    if (this.botonJugar) { this.botonJugar.disabled = true; }
    if (this.textoCarga) {
      this.textoCarga.hidden = false;
      this.textoCarga.textContent = 'CARGANDO ' + hechos + ' / ' + total;
    }
  };

  UI.prototype.listoParaJugar = function () {
    if (this.botonJugar) { this.botonJugar.disabled = false; }
    if (this.textoCarga) { this.textoCarga.hidden = true; }
  };

  UI.prototype.ocultarTodo = function () {
    var claves = Object.keys(this.capas);
    for (var i = 0; i < claves.length; i++) {
      var capa = this.capas[claves[i]];
      if (capa) { capa.hidden = true; }
    }
  };

  UI.prototype.avisar = function (texto) {
    if (!this.avisoAlmacenamiento) { return; }
    this.avisoAlmacenamiento.textContent = texto;
    this.avisoAlmacenamiento.hidden = !texto;
  };

  UI.prototype.mostrar = function (estado, datos) {
    this.ocultarTodo();
    if (estado === ESTADOS.CARGANDO || estado === ESTADOS.MENU) {
      this.capas.menu.hidden = false;
      if (this.recordMenu) { this.recordMenu.textContent = Util.formatearPuntos(datos.record); }
      this.enfocar('btn-jugar');
    } else if (estado === ESTADOS.PAUSA) {
      this.capas.pausa.hidden = false;
      this.enfocar('btn-reanudar');
    } else if (estado === ESTADOS.GAME_OVER) {
      this.capas.gameOver.hidden = false;
      if (this.puntosFinal) { this.puntosFinal.textContent = Util.formatearPuntos(datos.puntos); }
      if (this.recordFinal) { this.recordFinal.textContent = Util.formatearPuntos(datos.record); }
      if (this.mensajeFinal) {
        this.mensajeFinal.textContent = datos.puntos >= datos.record && datos.puntos > 0
          ? 'NUEVO RECORD, TIO'
          : 'LOS MARCIANOS GANARON ESTA';
      }
      this.enfocar('btn-reintentar');
    } else if (estado === ESTADOS.VICTORIA) {
      this.capas.victoria.hidden = false;
      if (this.puntosVictoria) { this.puntosVictoria.textContent = Util.formatearPuntos(datos.puntos); }
      this.enfocar('btn-seguir');
    }
  };

  UI.prototype.enfocar = function (id) {
    var el = $(id);
    if (!el) { return; }
    // Sin scroll para no mover la pagina en movil.
    global.setTimeout(function () {
      try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    }, 30);
  };

  TRI.UI = UI;
})(window);

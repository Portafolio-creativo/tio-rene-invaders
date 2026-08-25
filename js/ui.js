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
      carga: $('capa-carga'),
      menu: $('capa-menu'),
      pausa: $('capa-pausa'),
      gameOver: $('capa-game-over'),
      victoria: $('capa-victoria')
    };
    this.progreso = $('barra-progreso');
    this.textoCarga = $('texto-carga');
    this.recordMenu = $('record-menu');
    this.puntosFinal = $('puntos-final');
    this.recordFinal = $('record-final');
    this.mensajeFinal = $('mensaje-final');
    this.puntosVictoria = $('puntos-victoria');
    this.avisoAlmacenamiento = $('aviso-almacenamiento');
    this.botonSonido = $('btn-sonido');
    this.control = $('control-volumen');
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
        Audio.reproducir('menu');
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
    this.pintarBotonSonido(Audio.estaActivo());
  };

  UI.prototype.pintarBotonSonido = function (activo) {
    if (!this.botonSonido) { return; }
    this.botonSonido.textContent = activo ? 'SONIDO: SI' : 'SONIDO: NO';
    this.botonSonido.setAttribute('aria-pressed', activo ? 'true' : 'false');
    this.botonSonido.classList.toggle('apagado', !activo);
  };

  UI.prototype.progresoCarga = function (hechos, total) {
    if (this.progreso) {
      this.progreso.style.width = Math.round((hechos / total) * 100) + '%';
    }
    if (this.textoCarga) {
      this.textoCarga.textContent = 'CARGANDO ' + hechos + ' / ' + total;
    }
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
    if (estado === ESTADOS.CARGANDO) {
      this.capas.carga.hidden = false;
    } else if (estado === ESTADOS.MENU) {
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

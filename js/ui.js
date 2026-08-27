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

  /* Lo que tarda la cara en crecer. Pasado ese tiempo aparece el control
     parpadeando: no antes, para que no compita con la entrada. */
  var ESPERA_INVITACION = 900;

  function UI(acciones) {
    this.acciones = acciones;
    this.capas = {
      menu: $('capa-menu'),
      pausa: $('capa-pausa'),
      gameOver: $('capa-game-over'),
      victoria: $('capa-victoria')
    };
    this.textoCarga = $('texto-carga');
    this.invitacion = $('invitacion');
    this.portadaLista = false;
    this.puntosFinal = $('puntos-final');
    this.recordFinal = $('record-final');
    this.mensajeFinal = $('mensaje-final');
    this.puntosVictoria = $('puntos-victoria');
    this.avisoAlmacenamiento = $('aviso-almacenamiento');
    /* Ultimo resultado, para poder compartirlo desde el final de la partida. */
    this.ultimoResultado = { puntos: 0, record: 0, nivel: 0 };
    this.botonSonido = $('btn-sonido');
    this.control = $('control-volumen');
    this.conectar();
  }

  UI.prototype.conectar = function () {
    var self = this;
    this.conectarCompartir();
    var mapa = [
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
    /* Los dos interruptores viven DENTRO de los controles, no en el menu:
       se pueden cambiar en plena partida. */
    var botonModo = $('btn-modo-control');
    if (botonModo) {
      botonModo.addEventListener('click', function () {
        var activa = !TRI.Storage.leerPalanca();
        TRI.Storage.guardarPalanca(activa);
        self.pintarModoControl(activa);
        Audio.desbloquear();
        Audio.reproducir('menu');
      });
    }

    var botonAuto = $('btn-modo-auto');
    if (botonAuto) {
      botonAuto.addEventListener('click', function () {
        var activo = !TRI.Input.autoDisparoActivo();
        TRI.Storage.guardarAutoDisparo(activo);
        self.pintarAutoDisparo(activo);
        Audio.desbloquear();
        Audio.reproducir('menu');
      });
    }

    this.pintarModoControl(TRI.Storage.leerPalanca());
    this.pintarAutoDisparo(TRI.Storage.leerAutoDisparo());
    this.pintarBotonSonido(Audio.estaActivo());
  };

  /* Con el disparo automatico encendido, el boton de disparo pasa a decir
     AUTO y se atenua: sigue funcionando, pero ya no hace falta apretarlo. */
  UI.prototype.pintarAutoDisparo = function (activo) {
    TRI.Input.fijarAutoDisparo(activo);
    document.body.classList.toggle('auto-disparo', activo);
    var texto = $('texto-disparo');
    if (texto) { texto.textContent = activo ? 'DISPARANDO' : 'DISPARO'; }
    var mini = $('btn-modo-auto');
    if (mini) { mini.setAttribute('aria-pressed', activo ? 'true' : 'false'); }
  };

  /* Palanca o flechas. El icono del interruptor muestra a que se cambia. */
  UI.prototype.pintarModoControl = function (conPalanca) {
    TRI.Input.fijarPalanca(conPalanca);
    var mini = $('btn-modo-control');
    if (mini) { mini.setAttribute('aria-pressed', conPalanca ? 'true' : 'false'); }
    var icono = $('icono-modo');
    if (icono) { icono.textContent = conPalanca ? '⇹' : '◀▶'; }
  };

  UI.prototype.pintarBotonSonido = function (activo) {
    if (!this.botonSonido) { return; }
    this.botonSonido.textContent = activo ? 'SONIDO: SI' : 'SONIDO: NO';
    this.botonSonido.setAttribute('aria-pressed', activo ? 'true' : 'false');
    this.botonSonido.classList.toggle('apagado', !activo);
  };

  /* Mientras cargan los dibujos se ve el avance y el primer gesto todavia
     no arranca la partida. Como todo pesa poco, dura un pestaneo. */
  UI.prototype.progresoCarga = function (hechos, total) {
    this.portadaLista = false;
    if (this.textoCarga) {
      this.textoCarga.hidden = false;
      this.textoCarga.textContent = 'CARGANDO ' + hechos + ' / ' + total;
    }
  };

  UI.prototype.listoParaJugar = function () {
    this.portadaLista = true;
    if (this.textoCarga) { this.textoCarga.hidden = true; }
  };

  /* True cuando el primer movimiento ya puede lanzar la partida. */
  UI.prototype.puedeArrancar = function () {
    return this.portadaLista;
  };

  /* Portada: la cara entra desde el centro y, al terminar, se enciende la
     invitacion a mover. Se marca en el <body> para que el control de abajo
     empiece a parpadear a la vez. */
  UI.prototype.mostrarPortada = function () {
    var cara = this.capas.menu ? this.capas.menu.querySelector('#intro-cara') : null;
    document.body.classList.remove('portada-lista');
    if (cara) {                       // reinicia la animacion de entrada
      cara.style.animation = 'none';
      void cara.offsetWidth;
      cara.style.animation = '';
    }
    var self = this;
    global.clearTimeout(this.temporizadorPortada);
    this.temporizadorPortada = global.setTimeout(function () {
      document.body.classList.add('portada-lista');
      if (self.invitacion) { self.invitacion.hidden = false; }
    }, ESPERA_INVITACION);
  };

  UI.prototype.ocultarTodo = function () {
    var claves = Object.keys(this.capas);
    for (var i = 0; i < claves.length; i++) {
      var capa = this.capas[claves[i]];
      if (capa) { capa.hidden = true; }
    }
  };

  /* Se anota el resultado que se acaba de lograr, para la tarjeta que se
     comparte. El remate cambia segun se haya perdido, ganado o hecho record. */
  UI.prototype.guardarResultado = function (datos, remate) {
    var esRecord = datos.puntos >= datos.record && datos.puntos > 0;
    this.ultimoResultado = {
      puntos: datos.puntos || 0,
      record: datos.record || 0,
      nivel: datos.nivel || 0,
      remate: esRecord ? '¡NUEVO RÉCORD!' : remate
    };
  };

  /* Compartir el resultado: el mismo comportamiento al perder y al ganar. */
  UI.prototype.conectarCompartir = function () {
    var self = this;
    ['btn-compartir', 'btn-compartir-victoria'].forEach(function (id) {
      var el = $(id);
      if (!el) { return; }
      el.addEventListener('click', function () {
        Audio.desbloquear();
        Audio.reproducir('menu');
        var rotulo = el.textContent;
        el.disabled = true;
        el.textContent = 'PREPARANDO…';
        TRI.Compartir.resultado(self.ultimoResultado).then(function (mensaje) {
          el.disabled = false;
          el.textContent = rotulo;
          if (mensaje) { self.avisar(mensaje); }
        });
      });
    });
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
      this.mostrarPortada();
    } else if (estado === ESTADOS.PAUSA) {
      this.capas.pausa.hidden = false;
      this.enfocar('btn-reanudar');
    } else if (estado === ESTADOS.GAME_OVER) {
      this.capas.gameOver.hidden = false;
      this.guardarResultado(datos, 'LOS MARCIANOS GANARON ESTA');
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
      this.guardarResultado(datos, '¡ME LOS GANÉ A TODOS!');
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

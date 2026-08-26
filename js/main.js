/* Arranque: junta todas las piezas y mantiene el bucle principal. */
(function (global) {
  'use strict';

  var TRI = global.TRI;
  var CONFIG = TRI.CONFIG;
  var ESTADOS = TRI.ESTADOS;
  var Assets = TRI.Assets;
  var Audio = TRI.Audio;
  var Input = TRI.Input;
  var Storage = TRI.Storage;

  var canvas = document.getElementById('lienzo');
  var marco = document.getElementById('marco');
  var escenario = document.getElementById('escenario');
  var botonera = document.getElementById('botonera');

  var renderer = new TRI.Renderer(canvas);
  var juego = new TRI.Juego(renderer);

  var ui = new TRI.UI({
    jugar: function () { juego.nuevaPartida(true); },
    menu: function () { juego.irAlMenu(); },
    reanudar: function () { juego.alternarPausa(); },
    seguir: function () { juego.continuarTrasVictoria(); }
  });

  juego.alCambiarEstado = function (estado, datos) {
    ui.mostrar(estado, datos);
    document.body.classList.toggle('en-partida', estado === ESTADOS.JUGANDO);
  };

  /* ---- Tamano: el area de juego siempre conserva la proporcion 600x800 ---- */
  function redimensionar() {
    // clientWidth/Height incluyen el relleno: hay que descontarlo o el lienzo
    // se sale del contenedor justo por ese margen.
    var estilo = global.getComputedStyle(escenario);
    var anchoDisponible = escenario.clientWidth -
      (parseFloat(estilo.paddingLeft) || 0) - (parseFloat(estilo.paddingRight) || 0);
    var altoDisponible = escenario.clientHeight -
      (parseFloat(estilo.paddingTop) || 0) - (parseFloat(estilo.paddingBottom) || 0);
    if (anchoDisponible <= 0 || altoDisponible <= 0) { return; }
    var escala = Math.min(anchoDisponible / CONFIG.ANCHO, altoDisponible / CONFIG.ALTO);
    var ancho = Math.max(160, Math.floor(CONFIG.ANCHO * escala));
    var alto = Math.max(213, Math.floor(CONFIG.ALTO * escala));
    marco.style.width = ancho + 'px';
    marco.style.height = alto + 'px';
    renderer.ajustar(ancho, alto);
  }

  var reajustePendiente = null;
  function pedirReajuste() {
    if (reajustePendiente) { global.clearTimeout(reajustePendiente); }
    reajustePendiente = global.setTimeout(function () {
      reajustePendiente = null;
      redimensionar();
    }, 60);
  }

  global.addEventListener('resize', pedirReajuste);
  global.addEventListener('orientationchange', pedirReajuste);

  /* ---- Entrada ---- */
  TRI.Instalar.iniciar();

  var esTactil = Input.iniciar(botonera);
  var conTacto = esTactil || (global.matchMedia && global.matchMedia('(pointer: coarse)').matches);
  if (conTacto) { document.body.classList.add('tactil'); }
  // La eleccion palanca/flechas solo se ofrece si hay pantalla tactil.
  ui.mostrarOpcionPalanca(conTacto);

  Input.alAccion(function (accion) {
    if (accion === 'cualquiera') { Audio.desbloquear(); return; }
    if (accion === 'pausa') {
      if (juego.estado === ESTADOS.JUGANDO || juego.estado === ESTADOS.PAUSA) { juego.alternarPausa(); }
      return;
    }
    if (accion === 'aceptar') { juego.aceptar(); return; }
    if (accion === 'silencio') { ui.pintarBotonSonido(Audio.alternarActivo()); return; }
    if (accion === 'depurar') { juego.alternarDepuracion(); return; }
    if (accion === 'foco-perdido' && juego.estado === ESTADOS.JUGANDO) { juego.alternarPausa(); }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && juego.estado === ESTADOS.JUGANDO) { juego.alternarPausa(); }
  });

  /* ---- Bucle principal ---- */
  function bucle(t) {
    juego.tick(t);
    global.requestAnimationFrame(bucle);
  }

  /* Referencias vivas para depurar desde la consola del navegador
     (por ejemplo: TRI.instancia.juego.alternarDepuracion()). */
  TRI.instancia = { juego: juego, ui: ui, renderer: renderer, redimensionar: redimensionar };

  /* ---- Arranque ----
     Se entra DIRECTO al menu: la cara y el boton JUGAR estan desde el primer
     instante, asi el marco nunca se ve vacio. */
  juego.irAlMenu();              // el estado tambien arranca en MENU
  ui.progresoCarga(0, 1);        // ...pero JUGAR espera a que carguen los dibujos
  redimensionar();
  global.requestAnimationFrame(bucle);

  if (!Storage.hayPersistencia()) {
    ui.avisar('Tu navegador no deja guardar datos: el record no se conservara al cerrar.');
  }

  /* Red barredera: el PRIMER contacto en cualquier parte de la pagina
     desbloquea el audio. Da igual donde caiga el dedo; se retira sola. */
  var EVENTOS_DESPERTAR = ['pointerdown', 'touchstart', 'mousedown', 'keydown'];
  function despertar() {
    EVENTOS_DESPERTAR.forEach(function (nombre) {
      document.removeEventListener(nombre, despertar, true);
    });
    Audio.desbloquear();
  }
  EVENTOS_DESPERTAR.forEach(function (nombre) {
    document.addEventListener(nombre, despertar, true);   // fase de captura
  });

  /* Se intenta arrancar el audio sin pedir nada: si el navegador ya lo
     autoriza (segunda visita, o app instalada), al pulsar JUGAR la frase de
     bienvenida sale al instante. */
  Audio.intentarArranque(function () { /* el resultado no cambia la pantalla */ });

  Assets.cargarTodo(function (hechos, total) {
    ui.progresoCarga(hechos, total);
  }).then(function (resultado) {
    juego.assetsFallidos = resultado.fallidos.length;
    if (resultado.fallidos.length > 0) {
      // No se rompe nada: esos sprites se dibujan con el arte de emergencia.
      ui.avisar('Faltan ' + resultado.fallidos.length + ' imagenes; se usan dibujos de reserva.');
    }
    redimensionar();
    ui.listoParaJugar();
  });
})(window);

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
    jugar: function () { juego.nuevaPartida(); },
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
  var esTactil = Input.iniciar(botonera);
  if (esTactil || (global.matchMedia && global.matchMedia('(pointer: coarse)').matches)) {
    document.body.classList.add('tactil');
  }

  Input.alAccion(function (accion) {
    if (juego.estado === ESTADOS.CARGANDO && accion !== 'foco-perdido') {
      toqueEnIntro();
      return;
    }
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

  /* ---- Arranque ---- */
  ui.mostrar(ESTADOS.CARGANDO, juego.datosHUD());
  redimensionar();
  global.requestAnimationFrame(bucle);

  if (!Storage.hayPersistencia()) {
    ui.avisar('Tu navegador no deja guardar datos: el record no se conservara al cerrar.');
  }

  /* La intro se ve un momento aunque los assets carguen al instante: si no,
     pasaria de largo en un parpadeo. Se puede saltar tocando o con cualquier
     tecla. */
  var INTRO_MINIMA = 3000;   // cubre la frase de bienvenida (2,65 s)
  var arranqueIntro = (global.performance && global.performance.now)
    ? global.performance.now() : Date.now();
  var assetsListos = false;

  function ahoraMs() {
    return (global.performance && global.performance.now)
      ? global.performance.now() : Date.now();
  }

  var introRevelada = false;
  var temporizadorIntro = null;

  function terminarIntro() {
    if (!assetsListos || !introRevelada || juego.estado !== ESTADOS.CARGANDO) { return; }
    assetsListos = false;              // evita entrar dos veces
    ui.cerrarIntro(function () {
      redimensionar();
      juego.irAlMenu();
    });
  }

  function programarFinIntro() {
    if (!assetsListos || !introRevelada) { return; }
    if (temporizadorIntro) { global.clearTimeout(temporizadorIntro); }
    temporizadorIntro = global.setTimeout(terminarIntro,
      Math.max(0, INTRO_MINIMA - (ahoraMs() - arranqueIntro)));
  }

  /* Aparece la cara Y suena la frase, a la vez. Si hubo que esperar un toque,
     el minimo de la intro se cuenta desde este momento, no desde la carga. */
  function revelarIntro() {
    if (introRevelada) { return; }
    introRevelada = true;
    if (capaCarga) { capaCarga.classList.remove('esperando-toque'); }
    Audio.desbloquear();
    Audio.reproducirCuandoSePueda('intro');
    arranqueIntro = ahoraMs();
    programarFinIntro();
  }

  /* Un toque durante la intro: el primero la revela, los siguientes la saltan. */
  function toqueEnIntro() {
    if (!introRevelada) { revelarIntro(); } else { terminarIntro(); }
  }

  var capaCarga = document.getElementById('capa-carga');
  if (capaCarga) {
    capaCarga.addEventListener('pointerdown', toqueEnIntro);
  }

  /* Red barredera: el PRIMER contacto en cualquier parte de la pagina revela
     la intro. Da igual si el dedo cae en el tablero, en la cabecera o en el
     pie; no hace falta acertarle al cartel. Se quitan solos al primer uso. */
  var EVENTOS_DESPERTAR = ['pointerdown', 'touchstart', 'mousedown', 'keydown'];
  function despertar() {
    EVENTOS_DESPERTAR.forEach(function (nombre) {
      document.removeEventListener(nombre, despertar, true);
    });
    if (juego.estado === ESTADOS.CARGANDO) { toqueEnIntro(); }
    else { Audio.desbloquear(); }
  }
  EVENTOS_DESPERTAR.forEach(function (nombre) {
    document.addEventListener(nombre, despertar, true);   // fase de captura
  });

  /* Se intenta arrancar el sonido sin pedir nada. Solo si el navegador se
     niega aparece el cartel de "toca para empezar". */
  Audio.intentarArranque(function (pudoSonar) {
    if (pudoSonar || !Audio.estaActivo()) {
      revelarIntro();
    } else if (capaCarga && !introRevelada) {
      capaCarga.classList.add('esperando-toque');
    }
  });

  Assets.cargarTodo(function (hechos, total) {
    ui.progresoCarga(hechos, total);
  }).then(function (resultado) {
    juego.assetsFallidos = resultado.fallidos.length;
    if (resultado.fallidos.length > 0) {
      // No se rompe nada: esos sprites se dibujan con el arte de emergencia.
      ui.avisar('Faltan ' + resultado.fallidos.length + ' imagenes; se usan dibujos de reserva.');
    }
    redimensionar();
    assetsListos = true;
    programarFinIntro();
  });
})(window);

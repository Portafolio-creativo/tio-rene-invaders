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

  /* Empieza una partida conservando el gesto en curso: nuevaPartida limpia la
     entrada (para no arrastrar teclas de un nivel a otro), pero el dedo o la
     tecla que acaban de lanzarla siguen puestos, asi que se reponen. De ese
     modo el Tio Rene sale ya moviendose hacia donde apunta el dedo. */
  function empezarPartida() {
    Audio.desbloquear();
    Audio.reproducir('intro');
    var gesto = Input.instantanea();
    juego.nuevaPartida(false, true);
    Input.restaurar(gesto);
  }

  /* Arranque de un solo gesto desde la portada: el primer movimiento del
     jugador lanza la voz y mete de lleno en la partida. Ese gesto es ademas lo
     que autoriza el audio en el navegador, asi que la frase de bienvenida sale
     sin pelear con la politica de reproduccion. */
  function arrancarDesdePortada() {
    if (juego.estado !== ESTADOS.MENU || !ui.puedeArrancar()) { return; }
    empezarPartida();
  }

  var ui = new TRI.UI({
    // "OTRA VEZ" tras perder: empieza sin exigir estar en la portada.
    jugar: empezarPartida,
    menu: function () { juego.irAlMenu(); },
    reanudar: function () { juego.alternarPausa(); },
    seguir: function () { juego.continuarTrasVictoria(); }
  });

  // ENTER en la portada tambien arranca, para quien juegue con teclado.
  juego.alPulsarJugar = arrancarDesdePortada;


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
    // Los controles tactiles miden lo MISMO que el tablero: asi el recorrido
    // del dedo sobre la palanca coincide con el del personaje en pantalla.
    if (botonera) { botonera.style.setProperty('--ancho-tablero', ancho + 'px'); }
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

  /* Selector de dificultad de la portada. Se lee lo guardado, se marca el
     boton activo y cada eleccion se aplica y se guarda. Afecta desde la
     siguiente partida. */
  (function () {
    var guardada = Storage.leerDificultad();
    CONFIG.fijarDificultad(guardada);
    var botones = document.querySelectorAll('#dificultad .dif');
    function marcar(clave) {
      for (var i = 0; i < botones.length; i++) {
        var b = botones[i];
        b.setAttribute('aria-pressed', b.getAttribute('data-dif') === clave ? 'true' : 'false');
      }
    }
    marcar(guardada);
    for (var i = 0; i < botones.length; i++) {
      botones[i].addEventListener('click', function (ev) {
        ev.stopPropagation();   // que no dispare el arranque de la portada
        var clave = this.getAttribute('data-dif');
        CONFIG.fijarDificultad(clave);
        Storage.guardarDificultad(clave);
        marcar(clave);
      });
    }
  })();

  var esTactil = Input.iniciar(botonera);
  var conTacto = esTactil || (global.matchMedia && global.matchMedia('(pointer: coarse)').matches);
  if (conTacto) { document.body.classList.add('tactil'); }

  Input.alAccion(function (accion) {
    if (accion === 'mover') { arrancarDesdePortada(); return; }
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

  /* ---- Atajo secreto ----
     Cinco toques seguidos en el titulo de la barra saltan al siguiente nivel
     de jefe. No hay nada que lo anuncie: el titulo parece un texto mas, no se
     ilumina ni cambia el cursor, y cinco toques en menos de dos segundos no
     salen por accidente. En teclado, Ctrl+Shift+J hace lo mismo.
     Sirve para probar los jefes sin jugarse los niveles de en medio. */
  var marca = document.getElementById('marca');
  if (marca) {
    var toques = 0, ultimoToque = 0;
    marca.addEventListener('pointerdown', function () {
      var ahora = Date.now();
      toques = (ahora - ultimoToque > 700) ? 1 : toques + 1;
      ultimoToque = ahora;
      if (toques >= 5) {
        toques = 0;
        Audio.desbloquear();
        juego.saltarAJefe();
      }
    });
  }

  global.addEventListener('keydown', function (ev) {
    if (ev.code === 'KeyJ' && ev.ctrlKey && ev.shiftKey) {
      ev.preventDefault();
      Audio.desbloquear();
      juego.saltarAJefe();
    }
  });

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

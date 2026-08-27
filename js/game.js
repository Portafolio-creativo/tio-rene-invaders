/* Juego: maquina de estados y orquestacion.
 *
 * Estados: CARGANDO -> MENU -> JUGANDO <-> PAUSA
 *                              JUGANDO -> ENTRE_NIVELES -> JUGANDO
 *                              JUGANDO -> GAME_OVER | VICTORIA -> MENU/JUGANDO
 *
 * No hay booleanos sueltos controlando el flujo: siempre this.estado.
 */
(function (global) {
  'use strict';

  var TRI = global.TRI;
  var CONFIG = TRI.CONFIG;
  var Util = TRI.Util;
  var Audio = TRI.Audio;
  var Colisiones = TRI.Colisiones;
  var Input = TRI.Input;

  var ESTADOS = {
    CARGANDO: 'CARGANDO',
    MENU: 'MENU',
    JUGANDO: 'JUGANDO',
    PAUSA: 'PAUSA',
    ENTRE_NIVELES: 'ENTRE_NIVELES',
    GAME_OVER: 'GAME_OVER',
    VICTORIA: 'VICTORIA'
  };

  /* Paso fijo de simulacion: el juego se comporta igual a 30, 60 o 144 Hz. */
  var PASO_FIJO = 1 / 120;
  var ACUMULADO_MAX = 0.25;

  function Juego(renderer) {
    this.renderer = renderer;
    this.jugador = new TRI.Jugador();
    this.enemigos = new TRI.GestorEnemigos();
    this.proyectiles = new TRI.GestorProyectiles();
    this.barreras = TRI.crearBarreras();
    this.ovni = new TRI.Ovni();
    this.jefe = new TRI.Jefe();
    this.efectos = new TRI.GestorEfectos();
    this.puntuacion = new TRI.SistemaPuntuacion();
    this.niveles = new TRI.SistemaNiveles();

    this.estado = ESTADOS.CARGANDO;
    this.temporizador = 0;
    this.temporizadorAmbiente = CONFIG.AUDIO.AMBIENTE.PRIMERA_ESPERA;
    this.bajasSeguidas = 0;      // naves derribadas desde la ultima felicitacion
    this.rachasLogradas = 0;     // para ir turnando las frases
    this.ovnisDerribados = 0;    // para alternar las dos mitades de "te paso por"
    this.muertes = 0;            // para turnar las frases de "se murio"
    this.veniaDeSuperarNivel = false;
    this.nivelesSuperados = 0;   // para turnar las frases de fin de etapa
    this.acumulado = 0;
    this.ultimoTiempo = 0;
    this.fps = 0;
    this.contadorFps = 0;
    this.tiempoFps = 0;
    this.debug = CONFIG.DEBUG;
    this.alCambiarEstado = null;
    this.assetsFallidos = 0;
  }

  Juego.ESTADOS = ESTADOS;

  /* ---------------- Estados ---------------- */

  Juego.prototype.cambiarEstado = function (nuevo) {
    if (this.estado === nuevo) { return; }
    this.estado = nuevo;
    if (nuevo !== ESTADOS.JUGANDO) { Audio.silenciarSostenidos(); }
    if (typeof this.alCambiarEstado === 'function') {
      this.alCambiarEstado(nuevo, this.datosHUD());
    }
  };

  Juego.prototype.datosHUD = function () {
    return {
      puntos: this.puntuacion.puntos,
      record: this.puntuacion.record,
      vidas: this.puntuacion.vidas,
      nivel: this.niveles.nivel,
      etiquetaNivel: this.niveles.etiqueta()
    };
  };

  Juego.prototype.irAlMenu = function () {
    this.cambiarEstado(ESTADOS.MENU);
  };

  /* conBienvenida: al pulsar JUGAR desde el menu suena "ya llegamos" en vez
     del aviso de nivel. Las dos frases juntas se pisarian (van por el mismo
     canal de voz), asi que se elige una. */
  /* conBienvenida: suena "ya llegamos" en vez del aviso de nivel.
     sinSonido: la entrada ya lo hizo sonar, no hay que repetirlo. */
  Juego.prototype.nuevaPartida = function (conBienvenida, sinSonido) {
    this.puntuacion.reiniciar();
    this.niveles.reiniciar();
    this.bajasSeguidas = 0;
    this.rachasLogradas = 0;
    this.ovnisDerribados = 0;
    this.muertes = 0;
    this.nivelesSuperados = 0;
    this.prepararNivel();
    if (!sinSonido) { Audio.reproducir(conBienvenida ? 'intro' : 'nivel'); }
    this.cambiarEstado(ESTADOS.JUGANDO);
  };

  Juego.prototype.prepararNivel = function () {
    /* En los niveles de jefe no hay formacion: toda la pantalla es la cabezota.
       Asi el nivel se siente distinto de verdad, no solo mas rapido. */
    this.esNivelDeJefe = this.niveles.esNivelDeJefe();
    if (this.esNivelDeJefe) {
      this.jefe.preparar(this.niveles.nivel);
      this.enemigos.vaciar();
    } else {
      this.jefe.reiniciar();
      this.enemigos.preparar(this.niveles.nivel);
    }
    this.proyectiles.limpiar();
    this.efectos.limpiar();
    this.ovni.reiniciar();
    this.jugador.reiniciar(true);
    for (var i = 0; i < this.barreras.length; i++) { this.barreras[i].reiniciar(); }
    this.temporizadorAmbiente = CONFIG.AUDIO.AMBIENTE.PRIMERA_ESPERA;
    Input.limpiar();
  };

  Juego.prototype.alternarPausa = function () {
    if (this.estado === ESTADOS.JUGANDO) {
      Audio.silenciarSostenidos();
      this.cambiarEstado(ESTADOS.PAUSA);
    } else if (this.estado === ESTADOS.PAUSA) {
      Input.limpiar();
      this.cambiarEstado(ESTADOS.JUGANDO);
    }
  };

  /* Tecla Enter / boton principal segun el estado actual. */
  Juego.prototype.aceptar = function () {
    Audio.desbloquear();
    if (this.estado === ESTADOS.MENU) { this.alPulsarJugar(); }
    else if (this.estado === ESTADOS.PAUSA) { this.alternarPausa(); }
    else if (this.estado === ESTADOS.GAME_OVER) { Audio.reproducir('menu'); this.nuevaPartida(); }
    else if (this.estado === ESTADOS.VICTORIA) { this.continuarTrasVictoria(); }
  };

  Juego.prototype.continuarTrasVictoria = function () {
    Audio.reproducir('menu');
    this.niveles.activarInfinito();
    this.niveles.avanzar();
    this.prepararNivel();
    this.temporizador = CONFIG.NIVELES.ESPERA_ENTRE_NIVELES;
    this.cambiarEstado(ESTADOS.ENTRE_NIVELES);
  };

  /* Lo asigna main.js: la entrada (cara + voz) y luego la partida. */
  Juego.prototype.alPulsarJugar = function () { this.nuevaPartida(true); };

  /* Salta al siguiente nivel de jefe. Es para probar los jefes sin tener que
     jugarse los niveles de en medio; no hay nada en pantalla que lo anuncie. */
  Juego.prototype.saltarAJefe = function () {
    var cada = CONFIG.JEFES.CADA;
    var desde = (this.estado === ESTADOS.JUGANDO || this.estado === ESTADOS.PAUSA)
      ? this.niveles.nivel : 0;
    var destino = (Math.floor(desde / cada) + 1) * cada;
    if (destino > CONFIG.NIVELES.TOTAL) { destino = cada; }   // vuelve al primero

    if (this.estado !== ESTADOS.JUGANDO) {
      this.nuevaPartida(false, true);
    }
    this.niveles.nivel = destino;
    this.prepararNivel();
    this.cambiarEstado(ESTADOS.JUGANDO);
    return this.jefe.nombre;
  };

  Juego.prototype.alternarDepuracion = function () {
    this.debug = !this.debug;
    return this.debug;
  };

  /* ---------------- Ciclo ---------------- */

  Juego.prototype.tick = function (tiempoMs) {
    if (!this.ultimoTiempo) { this.ultimoTiempo = tiempoMs; }
    var dt = (tiempoMs - this.ultimoTiempo) / 1000;
    this.ultimoTiempo = tiempoMs;
    if (dt < 0) { dt = 0; }

    this.contadorFps++;
    this.tiempoFps += dt;
    if (this.tiempoFps >= 0.5) {
      this.fps = Math.round(this.contadorFps / this.tiempoFps);
      this.contadorFps = 0;
      this.tiempoFps = 0;
    }

    this.acumulado = Math.min(this.acumulado + dt, ACUMULADO_MAX);
    while (this.acumulado >= PASO_FIJO) {
      this.actualizar(PASO_FIJO);
      this.acumulado -= PASO_FIJO;
    }
    this.dibujar();
  };

  Juego.prototype.actualizar = function (dt) {
    this.renderer.actualizarFondo(dt);

    if (this.estado === ESTADOS.MENU || this.estado === ESTADOS.CARGANDO) {
      this.animarMenu(dt);
      return;
    }

    if (this.estado === ESTADOS.ENTRE_NIVELES) {
      this.temporizador -= dt;
      this.efectos.actualizar(dt);
      if (this.temporizador <= 0) {
        // Si venimos de superar una etapa, la frase de "me rio toa la noche"
        // sigue sonando: no se le encima el aviso de nivel (comparten canal).
        if (!this.veniaDeSuperarNivel) { Audio.reproducir('nivel'); }
        this.veniaDeSuperarNivel = false;
        this.cambiarEstado(ESTADOS.JUGANDO);
      }
      return;
    }

    if (this.estado !== ESTADOS.JUGANDO) { return; }

    this.efectos.actualizar(dt);
    this.jugador.actualizar(dt, Input.estado);
    this.proyectiles.actualizar(dt);

    if (this.jugador.estado === 'muerto') {
      this.temporizador -= dt;
      if (this.temporizador <= 0) { this.terminarPartida(); }
      return;
    }

    this.actualizarDisparoJugador();
    if (this.esNivelDeJefe) { this.actualizarJefe(dt); }
    else { this.actualizarEnemigos(dt); }
    this.actualizarOvni(dt);
    this.actualizarAmbiente(dt);
    this.resolverColisiones();
    this.comprobarFinDeNivel();
  };

  Juego.prototype.actualizarDisparoJugador = function () {
    if (!Input.disparando()) { return; }
    if (this.proyectiles.contar(true) >= CONFIG.JUGADOR.MAX_PROYECTILES) { return; }
    var boca = this.jugador.intentarDisparar();
    if (!boca) { return; }
    this.proyectiles.lanzar(boca.x, boca.y, true);
    this.efectos.chispas(boca.x, boca.y, 4, '#fff3c4');
    Audio.reproducir('disparo');
  };

  Juego.prototype.actualizarEnemigos = function (dt) {
    var evento = this.enemigos.actualizar(dt);
    if (evento.paso) { Audio.marcha(evento.indice); }
    if (evento.descendio) { Audio.reproducir('descenso'); }
    if (evento.disparo && this.proyectiles.contar(false) < this.enemigos.params.maxProyectiles) {
      var e = evento.disparo;
      this.proyectiles.lanzar(e.x + e.w / 2, e.y + e.h, false, this.enemigos.params.velocidadDisparo);
    }
    if (this.enemigos.hanInvadido() || Colisiones.enemigoContraJugador(this.enemigos, this.jugador)) {
      this.puntuacion.vidas = 0;
      this.golpearJugador();
    }
  };

  Juego.prototype.actualizarOvni = function (dt) {
    var puedeAparecer = this.enemigos.vivos > 2 && this.jugador.estado === 'normal';
    var evento = this.ovni.actualizar(dt, puedeAparecer);
    if (evento === 'aparece') {
      Audio.reproducir('ovniAparece');   // el "miau": avisa que llego la nave
      Audio.iniciarSirena();
    }
    else if (evento === 'sale') { Audio.detenerSirena(); }
  };

  /* Cada cierto rato el Tio Rene suelta una frase de fondo. Si en ese momento
     hay algo mas importante sonando, se salta el turno y se reintenta luego:
     el ambiente nunca compite con un aviso del juego. */
  Juego.prototype.actualizarAmbiente = function (dt) {
    var cfg = CONFIG.AUDIO.AMBIENTE;
    if (!cfg.ACTIVO) { return; }
    if (this.jugador.estado !== 'normal') { return; }
    this.temporizadorAmbiente -= dt;
    if (this.temporizadorAmbiente > 0) { return; }
    var sono = Audio.ambiente();
    this.temporizadorAmbiente = sono
      ? Util.azar(cfg.ESPERA_MIN, cfg.ESPERA_MAX)
      : 2;                                    // ocupado: se reintenta pronto
  };

  Juego.prototype.actualizarJefe = function (dt) {
    if (!this.jefe.activo) { return; }
    if (this.jefe.actualizar(dt) && this.proyectiles.contar(false) < 4) {
      var boca = this.jefe.bocaDeFuego();
      this.proyectiles.lanzar(boca.x, boca.y, false, this.enemigos.params.velocidadDisparo);
    }
    // Si la cabezota llega abajo, se acabo: igual que la invasion clasica.
    if (this.jefe.y + CONFIG.JEFES.ALTO >= CONFIG.ENEMIGOS.LINEA_INVASION) {
      this.puntuacion.vidas = 0;
      this.golpearJugador();
    }
  };

  Juego.prototype.resolverColisiones = function () {
    var self = this;

    Colisiones.jugadorContraEnemigos(this.proyectiles, this.enemigos, function (enemigo) {
      if (!self.enemigos.matar(enemigo)) { return; }
      var cx = enemigo.x + enemigo.w / 2;
      var cy = enemigo.y + enemigo.h / 2;
      self.efectos.destello(cx, cy, 44);
      self.efectos.chispas(cx, cy, 10, '#ffd86b');
      self.efectos.texto(cx, cy, String(enemigo.puntos), '#ffe36b');
      if (self.puntuacion.sumar(enemigo.puntos)) { Audio.reproducir('vidaExtra'); }
      Audio.reproducir('enemigoMuere');
      self.contarBaja();
    });

    if (this.jefe.activo) {
      var jefe = this.jefe;
      var caja = jefe.hitbox();
      this.proyectiles.lista.forEach(function (p) {
        if (!p.vivo || !p.deJugador) { return; }
        var px = p.x + p.w / 2, py = p.y;
        if (px < caja.x || px > caja.x + caja.w) { return; }
        if (py < caja.y || py > caja.y + caja.h) { return; }
        if (!jefe.impactar(px, py)) { return; }   // cayo en un hueco ya abierto
        p.vivo = false;
        self.efectos.chispas(px, py, 7, '#ffd0a0');
        if (self.puntuacion.sumar(10)) { Audio.reproducir('vidaExtra'); }
        Audio.reproducir('enemigoMuere');
        if (jefe.derrotado()) {
          jefe.activo = false;
          var cx = jefe.x + CONFIG.JEFES.ANCHO / 2;
          var cy = jefe.y + CONFIG.JEFES.ALTO / 2;
          /* Estalla y desaparece: en vez de un solo fogonazo en el centro, se
             revienta por toda la cara para que se lea como que salta en
             pedazos, no como que se apaga. */
          self.efectos.destello(cx, cy, 200);
          for (var e = 0; e < 7; e++) {
            var ex = jefe.x + CONFIG.JEFES.ANCHO * (0.2 + 0.6 * Math.random());
            var ey = jefe.y + CONFIG.JEFES.ALTO * (0.2 + 0.6 * Math.random());
            self.efectos.destello(ex, ey, 70 + Math.random() * 50);
            self.efectos.chispas(ex, ey, 14, e % 2 ? '#ffd0a0' : '#ff7a4a');
          }
          self.efectos.chispas(cx, cy, 40, '#ffd0a0');
          self.efectos.texto(cx, cy, String(CONFIG.JEFES.PUNTOS), '#7cf29a');
          if (self.puntuacion.sumar(CONFIG.JEFES.PUNTOS)) { Audio.reproducir('vidaExtra'); }
          Audio.reproducir('victoria');
        }
      });
    }

    Colisiones.jugadorContraOvni(this.proyectiles, this.ovni, function (ovni) {
      var puntos = ovni.puntos();
      var cx = ovni.x + ovni.w / 2;
      var cy = ovni.y + ovni.h / 2;
      ovni.activo = false;
      Audio.detenerSirena();
      var clips = CONFIG.AUDIO.OVNI_CLIPS;
      Audio.reproducir(clips[self.ovnisDerribados % clips.length]);
      self.ovnisDerribados++;
      self.efectos.destello(cx, cy, 70);
      self.efectos.chispas(cx, cy, 18, '#ffd0a0');
      self.efectos.texto(cx, cy, String(puntos), '#7cf29a');
      if (self.puntuacion.sumar(puntos)) { Audio.reproducir('vidaExtra'); }
    });

    Colisiones.proyectilesContraBarreras(this.proyectiles, this.barreras, function (barrera, p, px, py) {
      var radio = p.deJugador ? CONFIG.BARRERAS.RADIO_IMPACTO : CONFIG.BARRERAS.RADIO_IMPACTO_ENEMIGO;
      barrera.impactar(px, py, radio);
      self.efectos.chispas(px, py, 6, '#7cf29a');
      Audio.reproducir('barrera');
    });

    Colisiones.proyectilContraProyectil(this.proyectiles, function (x, y) {
      self.efectos.chispas(x, y, 6, '#ffffff');
    });

    Colisiones.enemigosContraBarreras(this.enemigos, this.barreras, function (barrera) {
      self.efectos.chispas(barrera.x + barrera.w / 2, barrera.y, 5, '#7cf29a');
    });

    Colisiones.enemigosContraJugador(this.proyectiles, this.jugador, function (p) {
      self.efectos.chispas(p.x + p.w / 2, p.y, 8, '#ff8ae0');
      self.puntuacion.perderVida();
      self.golpearJugador();
    });
  };

  /* Cada N naves derribadas, el Tio Rene se felicita solo. Las frases se
     turnan para que no sea siempre la misma. */
  Juego.prototype.contarBaja = function () {
    var cfg = CONFIG.AUDIO.RACHA;
    if (!cfg.ACTIVO || cfg.CADA <= 0) { return; }
    this.bajasSeguidas++;
    if (this.bajasSeguidas < cfg.CADA) { return; }
    this.bajasSeguidas = 0;
    var clip = cfg.CLIPS[this.rachasLogradas % cfg.CLIPS.length];
    this.rachasLogradas++;
    Audio.reproducir(clip);
    // Un guino visual para que la racha tambien se vea, no solo se oiga.
    this.efectos.texto(this.jugador.x, this.jugador.y - 16,
      '+' + (this.rachasLogradas * cfg.CADA), '#7cf29a');
  };

  Juego.prototype.golpearJugador = function () {
    var ultima = this.puntuacion.sinVidas();
    this.jugador.recibirImpacto(ultima);
    this.proyectiles.limpiarDe(false);
    var p = this.jugador.piezas();
    this.efectos.destello(this.jugador.x, p.cabeza.y + 30, 90);
    this.efectos.chispas(this.jugador.x, p.cabeza.y + 30, 16, '#ff9b6e');
    Audio.detenerSirena();
    // En CADA vida perdida suena una frase de "se murio", turnandose. Si es la
    // ultima, ademas se le suma la frase de final de partida.
    var frases = CONFIG.AUDIO.MUERTE_CLIPS;
    Audio.reproducir(frases[this.muertes % frases.length]);
    this.muertes++;
    if (ultima) {
      this.temporizador = 2.0;
    }
  };

  Juego.prototype.terminarPartida = function () {
    Audio.reproducir('gameOver');
    this.cambiarEstado(ESTADOS.GAME_OVER);
  };

  Juego.prototype.comprobarFinDeNivel = function () {
    if (this.esNivelDeJefe) {
      if (this.jefe.activo) { return; }
    } else if (this.enemigos.vivos > 0) { return; }
    this.proyectiles.limpiar();
    this.ovni.activo = false;
    Audio.detenerSirena();
    if (this.niveles.esFinalDelJuego()) {
      Audio.reproducir('victoria');
      this.cambiarEstado(ESTADOS.VICTORIA);
      return;
    }
    var clipsNivel = CONFIG.AUDIO.NIVEL_CLIPS;
    Audio.reproducir(clipsNivel[this.nivelesSuperados % clipsNivel.length]);
    this.nivelesSuperados++;
    this.veniaDeSuperarNivel = true;
    this.niveles.avanzar();
    this.prepararNivel();
    this.temporizador = CONFIG.NIVELES.ESPERA_ENTRE_NIVELES;
    this.cambiarEstado(ESTADOS.ENTRE_NIVELES);
  };

  /* ---------------- Dibujo ---------------- */

  Juego.prototype.dibujar = function () {
    var r = this.renderer;
    r.limpiar();

    if (this.estado === ESTADOS.CARGANDO) { return; }

    var enPartida = this.estado === ESTADOS.JUGANDO || this.estado === ESTADOS.PAUSA ||
      this.estado === ESTADOS.ENTRE_NIVELES || this.estado === ESTADOS.GAME_OVER ||
      this.estado === ESTADOS.VICTORIA;

    if (enPartida) {
      r.dibujarBarreras(this.barreras);
      r.dibujarOvni(this.ovni);
      r.dibujarEnemigos(this.enemigos);
      r.dibujarJefe(this.jefe);
      r.dibujarProyectiles(this.proyectiles);
      r.dibujarJugador(this.jugador);
      r.dibujarEfectos(this.efectos);
      r.dibujarSuelo();
      r.dibujarHUD(this.datosHUD());
    } else {
      // En el menu el Tio Rene se queda abajo, masticando, como aperitivo.
      r.dibujarJugador(this.jugador);
      r.dibujarSuelo();
    }

    if (this.estado === ESTADOS.ENTRE_NIVELES) {
      r.dibujarCartel(this.niveles.etiqueta(), 'PREPARATE');
    } else if (this.estado === ESTADOS.PAUSA) {
      r.dibujarCartel('PAUSA', 'P o ENTER para seguir');
    }

    if (this.debug) {
      r.dibujarDepuracion({
        jugador: this.jugador,
        enemigos: this.enemigos,
        proyectiles: this.proyectiles,
        ovni: this.ovni,
        fps: this.fps,
        estado: this.estado,
        nivel: this.niveles.nivel,
        assetsFallidos: this.assetsFallidos
      });
    }
  };

  /* En el menu el Tio Rene pasea y abre la mandibula cada cierto rato, para
     que se vea el corte horizontal antes incluso de empezar a jugar. */
  Juego.prototype.animarMenu = function (dt) {
    this.tiempoMenu = (this.tiempoMenu || 0) + dt;
    this.jugador.direccion = Math.sin(this.tiempoMenu * 1.1) > 0 ? 1 : -1;
    this.jugador.balanceo += dt;
    this.jugador.x = CONFIG.ANCHO / 2 + Math.sin(this.tiempoMenu * 1.1) * 46;
    if (this.jugador.mandibula.fase === 'cerrada' && this.tiempoMenu - (this.ultimoBostezo || 0) > 1.6) {
      this.ultimoBostezo = this.tiempoMenu;
      this.jugador.mandibula.fase = 'abriendo';
      this.jugador.mandibula.t = 0;
    }
    this.jugador.actualizarMandibula(dt);
    Colisiones.limitarJugador(this.jugador);
  };

  global.TRI.Juego = Juego;
  global.TRI.ESTADOS = ESTADOS;
})(window);

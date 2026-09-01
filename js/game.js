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
    this.explosionJefe = null;
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
    // Cielo del nivel: uno distinto por nivel, el rojizo para los jefes.
    this.renderer.fijarTema(this.esNivelDeJefe ? CONFIG.TEMA_JEFE
      : CONFIG.TEMAS[(this.niveles.nivel - 1) % CONFIG.TEMAS.length]);
    if (this.esNivelDeJefe) {
      this.jefe.preparar(this.niveles.nivel);
      this.enemigos.vaciar();
      if (this.jefe.voces.aparece) { Audio.reproducir(this.jefe.voces.aparece); }
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
    /* La explosion del jefe y la sacudida siguen corriendo aunque el nivel ya
       haya cambiado de estado: si no, al morir el jefe se pasaba a
       ENTRE_NIVELES en el acto y la explosion no llegaba a verse. */
    this.renderer.avanzarSacudida(dt);
    this.actualizarExplosionJefe(dt);

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
    var evento = this.enemigos.actualizar(dt, this.jugador.x);
    if (evento.paso) { Audio.marcha(evento.indice); }
    if (evento.descendio) { Audio.reproducir('descenso'); }
    var tope = this.enemigos.params.maxProyectiles + 2;   // margen para las picadas
    if (evento.disparo && this.proyectiles.contar(false) < this.enemigos.params.maxProyectiles) {
      var e = evento.disparo;
      this.proyectiles.lanzar(e.x + e.w / 2, e.y + e.h, false, this.enemigos.params.velocidadDisparo);
    }
    // Disparos de las naves en picada (mas rapidos, que caen sobre el jugador).
    for (var k = 0; k < evento.picadas.length; k++) {
      if (this.proyectiles.contar(false) >= tope) { break; }
      var pd = evento.picadas[k];
      this.proyectiles.lanzar(pd.x, pd.y, false, this.enemigos.params.velocidadDisparo + 60);
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

  /* Los estallidos que quedan de la explosion del jefe. Van saliendo uno tras
     otro para que la cabezota reviente por partes, no de golpe. */
  Juego.prototype.actualizarExplosionJefe = function (dt) {
    var ex = this.explosionJefe;
    if (!ex || ex.restan <= 0) { return; }
    ex.t -= dt;
    if (ex.t > 0) { return; }
    ex.t = CONFIG.JEFES.ESTALLIDO_CADA;
    ex.restan--;
    var x = ex.caja.x + ex.caja.w * (0.12 + 0.76 * Math.random());
    var y = ex.caja.y + ex.caja.h * (0.12 + 0.76 * Math.random());
    this.efectos.destello(x, y, 90 + Math.random() * 90);
    this.efectos.chispas(x, y, 14, ex.restan % 2 ? '#ffd0a0' : '#ff7a4a');
    this.efectos.fuego(x, y, 7);
    // Cada dos estallidos se vuelve a zarandear: la sacudida no se apaga
    // hasta que termina de reventar del todo.
    if (ex.restan % 2 === 0) { this.renderer.sacudir(0.3, 13); }
    Audio.reproducir('enemigoMuere');
  };

  Juego.prototype.actualizarJefe = function (dt) {
    if (!this.jefe.activo) { return; }

    // Agonizando: arde en el sitio y, al agotarse, revienta en pedazos.
    if (this.jefe.enAgonia()) {
      this.jefe.actualizar(dt);
      this.arderJefe(dt);
      if (!this.jefe.enAgonia()) { this.reventarJefe(); }
      return;
    }

    if (this.jefe.actualizar(dt) && this.proyectiles.contar(false) < CONFIG.JEFES.MAX_PROYECTILES) {
      var boca = this.jefe.bocaDeFuego();
      this.proyectiles.lanzar(boca.x, boca.y, false, this.enemigos.params.velocidadDisparo);
    }
    /* El jefe ya no baja sin freno: se mueve dentro de su zona, asi que no
       hay linea de invasion que valga. Lo que si puede es aplastar al jugador
       si se le echa encima. */
    var caja = this.jefe.hitbox();
    var h = this.jugador.hitbox();
    if (this.jugador.esVulnerable() &&
        caja.x < h.x + h.w && caja.x + caja.w > h.x &&
        caja.y < h.y + h.h && caja.y + caja.h > h.y) {
      this.puntuacion.perderVida();
      this.golpearJugador();
    }
  };

  /* Mientras agoniza: fuego que va a mas y sacudidas cortas encadenadas. */
  Juego.prototype.arderJefe = function (dt) {
    var caja = this.jefe.hitbox();
    var q = this.jefe.progresoMuerte();      // 0 -> 1
    // El fuego arrecia segun se acerca el estallido.
    var brotes = Math.round(1 + q * 3);
    for (var i = 0; i < brotes; i++) {
      var x = caja.x + caja.w * (0.12 + 0.76 * Math.random());
      var y = caja.y + caja.h * (0.12 + 0.76 * Math.random());
      this.efectos.fuego(x, y, 2);
      if (Math.random() < 0.30) { this.efectos.chispas(x, y, 4, '#ff7a4a'); }
    }
    if (this.renderer.sacudidaT <= 0) { this.renderer.sacudir(0.25, 6 + q * 8); }
  };

  /* El estallido final: la cara salta en pedazos, hoguera enorme y una tanda
     de estallidos encadenados. Recien aqui deja de dibujarse el jefe. */
  Juego.prototype.reventarJefe = function () {
    var caja = this.jefe.hitbox();
    var cx = caja.x + caja.w / 2, cy = caja.y + caja.h / 2;
    // Trozos de la propia cara volando: se reservan ANTES de la hoguera, que
    // si no el fuego se comeria sus huecos.
    this.efectos.escombros(this.jefe.lienzo, caja, CONFIG.JEFES.TROZOS);
    this.jefe.activo = false;
    this.renderer.sacudir(0.9, 26);
    this.efectos.destello(cx, cy, 320);
    this.efectos.chispas(cx, cy, 70, '#ffd0a0');
    for (var f = 0; f < CONFIG.JEFES.LLAMARADAS; f += 8) {
      this.efectos.fuego(caja.x + caja.w * (0.1 + 0.8 * Math.random()),
                         caja.y + caja.h * (0.1 + 0.8 * Math.random()), 8);
    }
    // Estallidos que siguen sonando y reventando un momento mas.
    this.explosionJefe = { caja: caja, restan: CONFIG.JEFES.ESTALLIDOS, t: 0 };
    Audio.reproducir('enemigoMuere');
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
      this.proyectiles.lista.forEach(function (p) {
        if (!p.vivo || !p.deJugador) { return; }
        // La caja se pide dentro del bucle: el jefe cambia de tamano.
        var caja = jefe.hitbox();
        var px = p.x + p.w / 2, py = p.y;
        if (px < caja.x || px > caja.x + caja.w) { return; }
        if (py < caja.y || py > caja.y + caja.h) { return; }
        // La cara tiene el fondo transparente: si el disparo cae en una
        // esquina vacia, sigue de largo en vez de reventar en el aire.
        if (!jefe.tocado(px, py)) { return; }
        jefe.impactar(px, py);
        // Suelta una frase cada tantos golpes: en cada impacto seria un loro.
        // La voz de golpe puede ser una sola o una LISTA que se va turnando,
        // para que no repita siempre lo mismo.
        if (jefe.voces.golpe && jefe.impactos % CONFIG.JEFES.VOZ_CADA === 0) {
          var g = jefe.voces.golpe;
          if (Array.isArray(g)) {
            // Al azar pero sin repetir el ultimo, para que no salga el mismo
            // dos veces seguidas.
            var op = g;
            if (g.length > 1 && jefe.ultimoGolpe) {
              op = g.filter(function (x) { return x !== jefe.ultimoGolpe; });
            }
            g = op[Math.floor(Math.random() * op.length)];
            jefe.ultimoGolpe = g;
          }
          Audio.reproducir(g);
        }
        p.vivo = false;
        self.efectos.chispas(px, py, 7, '#ffd0a0');
        if (self.puntuacion.sumar(10)) { Audio.reproducir('vidaExtra'); }
        Audio.reproducir('enemigoMuere');
        if (jefe.derrotado() && !jefe.enAgonia()) {
          // No se apaga: empieza a AGONIZAR. La cara se queda ardiendo y
          // temblando; el estallido en pedazos viene al final (actualizarJefe).
          var caja = jefe.iniciarMuerte();
          self.puntuacion.sumar(CONFIG.JEFES.PUNTOS);
          self.efectos.texto(caja.x + caja.w / 2, caja.y + caja.h / 2,
                             String(CONFIG.JEFES.PUNTOS), '#7cf29a');
          self.renderer.sacudir(0.5, 10);
          Audio.reproducir(jefe.voces.muere || 'victoria');
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
      if (this.jefe.activo) { return; }   // incluye la agonia
      // Que termine de reventar antes de pasar de nivel.
      if (this.explosionJefe && this.explosionJefe.restan > 0) { return; }
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
      r.cerrar();
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
    r.cerrar();
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

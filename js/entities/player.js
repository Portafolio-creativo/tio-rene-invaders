/* El Tio Rene: cabezota arriba, cuerpo chico abajo y una MANDIBULA que es una
 * pieza independiente. Esta clase solo contiene logica y geometria; de pintarla
 * se encarga renderer.js.
 *
 * Piezas y como encajan (medidas en px logicos):
 *
 *      y            +-------------------+
 *                   |   player-head     |  88 x 55
 *      y+55  =====CORTE HORIZONTAL=====     <- aqui empieza la mandibula
 *                   |   player-jaw      |  70 x 28  (baja hasta 22 px al abrirse)
 *      y+84         |   player-body     |  50 x 30
 *      y+114        +-------------------+
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var Util = global.TRI.Util;
  var J = CONFIG.JUGADOR;
  var M = J.MANDIBULA;

  /* Medidas sacadas de la propia foto: la cabeza y la mandibula salen del
     mismo recorte, asi que comparten ancho y encajan al pixel. */
  var ANCHO_CABEZA = 88, ALTO_CABEZA = 61;
  var ANCHO_MANDIBULA = 88, ALTO_MANDIBULA = 36;
  var ANCHO_BOCA = 88;
  var ANCHO_CUERPO = 44, ALTO_CUERPO = 27;
  // El cuerpo arranca por debajo de la mandibula cerrada: cabezota grande,
  // cuerpecito chico asomando por abajo.
  var DESPLAZAMIENTO_CUERPO = 88;

  function Jugador() {
    this.reiniciar(true);
  }

  Jugador.prototype.reiniciar = function (completo) {
    this.x = CONFIG.ANCHO / 2;
    this.y = CONFIG.ALTO - 14 - J.ALTO_TOTAL;
    this.estado = 'normal';           // normal | golpeado | muerto
    this.tiempoEstado = 0;
    this.enfriamiento = 0;
    this.balanceo = 0;
    this.direccion = 0;
    this.mandibula = { fase: 'cerrada', t: 0, apertura: 0 };
    if (completo) { this.invulnerable = 0; }
    else { this.invulnerable = J.INVULNERABILIDAD; }
  };

  /* ---- Geometria (la usa el renderer y el sistema de colisiones) ---- */

  Jugador.prototype.corteY = function () {
    return this.y + ALTO_CABEZA;
  };

  Jugador.prototype.aperturaPx = function () {
    return this.mandibula.apertura * M.APERTURA_MAX;
  };

  Jugador.prototype.piezas = function () {
    var corte = this.corteY();
    var abre = this.aperturaPx();
    return {
      cabeza: { x: this.x - ANCHO_CABEZA / 2, y: this.y, w: ANCHO_CABEZA, h: ALTO_CABEZA },
      boca: { x: this.x - ANCHO_BOCA / 2, y: corte - 1, w: ANCHO_BOCA, h: 1 + abre },
      mandibula: { x: this.x - ANCHO_MANDIBULA / 2, y: corte + abre, w: ANCHO_MANDIBULA, h: ALTO_MANDIBULA },
      cuerpo: { x: this.x - ANCHO_CUERPO / 2, y: this.y + DESPLAZAMIENTO_CUERPO, w: ANCHO_CUERPO, h: ALTO_CUERPO }
    };
  };

  Jugador.prototype.hitbox = function () {
    return { x: this.x + J.HITBOX.dx, y: this.y + J.HITBOX.dy, w: J.HITBOX.w, h: J.HITBOX.h };
  };

  Jugador.prototype.spriteCabeza = function () {
    if (!J.EXPRESIONES_SEPARADAS) { return 'player-head'; }
    if (this.estado === 'muerto') { return 'player-head-dead'; }
    if (this.estado === 'golpeado') { return 'player-head-hit'; }
    if (this.mandibula.fase === 'abriendo' || this.mandibula.fase === 'sosteniendo') {
      return 'player-head-shoot';
    }
    return 'player-head';
  };

  /* ---- Logica ---- */

  Jugador.prototype.actualizarMandibula = function (dt) {
    var m = this.mandibula;
    m.t += dt;
    if (m.fase === 'abriendo') {
      m.apertura = Util.suavizar(m.t / M.T_ABRIR);
      if (m.t >= M.T_ABRIR) { m.fase = 'sosteniendo'; m.t = 0; m.apertura = 1; }
    } else if (m.fase === 'sosteniendo') {
      m.apertura = 1;
      if (m.t >= M.T_SOSTEN) { m.fase = 'cerrando'; m.t = 0; }
    } else if (m.fase === 'cerrando') {
      m.apertura = 1 - Util.suavizar(m.t / M.T_CERRAR);
      if (m.t >= M.T_CERRAR) { m.fase = 'cerrada'; m.t = 0; m.apertura = 0; }
    } else if (this.estado === 'golpeado' || this.estado === 'muerto') {
      m.apertura = M.APERTURA_DANO;   // mandibula desencajada
    } else {
      // Mascullar: la mandibula tirita un poco al caminar. Puro gesto comico.
      var objetivo = this.direccion !== 0 ? (Math.sin(this.balanceo * 14) * 0.5 + 0.5) * (M.MASCULLEO / M.APERTURA_MAX) : 0;
      m.apertura = Util.interpolar(m.apertura, objetivo, Math.min(1, dt * 12));
    }
  };

  Jugador.prototype.actualizar = function (dt, entrada) {
    this.tiempoEstado += dt;
    if (this.enfriamiento > 0) { this.enfriamiento -= dt; }
    if (this.invulnerable > 0) { this.invulnerable -= dt; }

    if (this.estado === 'normal') {
      this.direccion = 0;
      if (entrada.izquierda) { this.direccion -= 1; }
      if (entrada.derecha) { this.direccion += 1; }
      this.x += this.direccion * J.VELOCIDAD * dt;
      var mitad = ANCHO_CABEZA / 2;
      this.x = Util.limitar(this.x, J.MARGEN_LATERAL + mitad, CONFIG.ANCHO - J.MARGEN_LATERAL - mitad);
      this.balanceo += dt;
    } else {
      this.direccion = 0;
    }

    this.actualizarMandibula(dt);

    if (this.estado === 'golpeado' && this.tiempoEstado >= J.ESPERA_MUERTE) {
      this.estado = 'normal';
      this.tiempoEstado = 0;
      this.mandibula.fase = 'cerrando';
      this.mandibula.t = 0;
    }
  };

  /* Devuelve el punto de salida del proyectil, o null si todavia no puede. */
  Jugador.prototype.intentarDisparar = function () {
    if (this.estado !== 'normal' || this.enfriamiento > 0) { return null; }
    this.enfriamiento = J.CADENCIA_DISPARO;
    this.mandibula.fase = 'abriendo';
    this.mandibula.t = 0;
    // El proyectil nace en la boca ya abierta: respuesta inmediata al boton.
    return { x: this.x, y: this.corteY() + M.APERTURA_MAX * 0.5 };
  };

  Jugador.prototype.esVulnerable = function () {
    return this.estado === 'normal' && this.invulnerable <= 0;
  };

  Jugador.prototype.recibirImpacto = function (esUltimaVida) {
    this.estado = esUltimaVida ? 'muerto' : 'golpeado';
    this.tiempoEstado = 0;
    this.invulnerable = J.INVULNERABILIDAD;
    this.mandibula.fase = 'cerrada';
    this.mandibula.t = 0;
    this.mandibula.apertura = M.APERTURA_DANO;
  };

  global.TRI = global.TRI || {};
  global.TRI.Jugador = Jugador;
})(window);

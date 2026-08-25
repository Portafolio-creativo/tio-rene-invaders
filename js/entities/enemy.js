/* La formacion invasora.
 *
 * Se mueve como en los arcade clasicos: a pasos discretos, no de forma
 * continua. Cada paso desplaza toda la formacion; al tocar un borde, baja y
 * cambia de sentido. Cuantos menos enemigos quedan, mas rapido es el paso.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var Util = global.TRI.Util;
  var E = CONFIG.ENEMIGOS;

  function GestorEnemigos() {
    this.enemigos = [];
    this.total = 0;
    this.vivos = 0;
    this.direccion = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.temporizadorPaso = 0;
    this.indicePaso = 0;
    this.temporizadorDisparo = 0;
    this.params = CONFIG.nivelParams(1);
  }

  GestorEnemigos.prototype.preparar = function (nivel) {
    this.params = CONFIG.nivelParams(nivel);
    this.enemigos.length = 0;
    var anchoFormacion = (E.COLUMNAS - 1) * E.SEPARACION_X + E.ANCHO;
    this.offsetX = Math.round((CONFIG.ANCHO - anchoFormacion) / 2);
    this.offsetY = this.params.yInicial;
    this.direccion = 1;
    this.temporizadorPaso = 0;
    this.indicePaso = 0;
    this.temporizadorDisparo = this.params.intervaloDisparo * 0.6;

    for (var f = 0; f < E.FILAS; f++) {
      var tipo = E.TIPOS[Math.min(f, E.TIPOS.length - 1)];
      for (var c = 0; c < E.COLUMNAS; c++) {
        this.enemigos.push({
          fila: f, columna: c,
          sprite: tipo.sprite,
          puntos: tipo.puntos,
          vida: tipo.resistencia,
          vivo: true,
          w: E.ANCHO, h: E.ALTO,
          x: 0, y: 0
        });
      }
    }
    this.total = this.enemigos.length;
    this.vivos = this.total;
    this.recolocar();
  };

  GestorEnemigos.prototype.recolocar = function () {
    for (var i = 0; i < this.enemigos.length; i++) {
      var e = this.enemigos[i];
      e.x = this.offsetX + e.columna * E.SEPARACION_X;
      e.y = this.offsetY + e.fila * E.SEPARACION_Y;
    }
  };

  GestorEnemigos.prototype.limites = function (offsetX) {
    var ox = (typeof offsetX === 'number') ? offsetX : this.offsetX;
    var min = Infinity, max = -Infinity;
    for (var i = 0; i < this.enemigos.length; i++) {
      var e = this.enemigos[i];
      if (!e.vivo) { continue; }
      var x = ox + e.columna * E.SEPARACION_X;
      if (x < min) { min = x; }
      if (x + e.w > max) { max = x + e.w; }
    }
    return { min: min, max: max };
  };

  GestorEnemigos.prototype.intervaloPaso = function () {
    if (this.total === 0) { return this.params.intervaloPaso; }
    var proporcion = Math.max(this.vivos, 1) / this.total;
    var factor = Math.pow(proporcion, E.FACTOR_ACELERACION);
    return Math.max(E.INTERVALO_PASO_MIN, this.params.intervaloPaso * factor);
  };

  /* Devuelve un evento describiendo lo que paso en este ciclo. */
  GestorEnemigos.prototype.actualizar = function (dt) {
    var evento = { paso: false, descendio: false, indice: this.indicePaso, disparo: null };
    if (this.vivos === 0) { return evento; }

    this.temporizadorPaso += dt;
    if (this.temporizadorPaso >= this.intervaloPaso()) {
      this.temporizadorPaso = 0;
      evento.paso = true;
      var siguiente = this.offsetX + this.direccion * E.PASO_X;
      var lim = this.limites(siguiente);
      if (lim.min < E.MARGEN_LATERAL || lim.max > CONFIG.ANCHO - E.MARGEN_LATERAL) {
        this.direccion *= -1;
        this.offsetY += this.params.descenso;
        evento.descendio = true;
      } else {
        this.offsetX = siguiente;
      }
      this.indicePaso++;
      evento.indice = this.indicePaso;
      this.recolocar();
    }

    this.temporizadorDisparo -= dt;
    if (this.temporizadorDisparo <= 0) {
      this.temporizadorDisparo = this.params.intervaloDisparo * Util.azar(0.65, 1.35);
      evento.disparo = this.elegirTirador();
    }
    return evento;
  };

  /* Dispara el enemigo de mas abajo de una columna elegida al azar. */
  GestorEnemigos.prototype.elegirTirador = function () {
    var porColumna = {};
    for (var i = 0; i < this.enemigos.length; i++) {
      var e = this.enemigos[i];
      if (!e.vivo) { continue; }
      var actual = porColumna[e.columna];
      if (!actual || e.fila > actual.fila) { porColumna[e.columna] = e; }
    }
    var candidatos = Object.keys(porColumna).map(function (k) { return porColumna[k]; });
    if (candidatos.length === 0) { return null; }
    return Util.elegir(candidatos);
  };

  GestorEnemigos.prototype.matar = function (enemigo) {
    if (!enemigo.vivo) { return false; }
    enemigo.vida -= 1;
    if (enemigo.vida > 0) { return false; }
    enemigo.vivo = false;
    this.vivos--;
    return true;
  };

  GestorEnemigos.prototype.vivosLista = function () {
    var r = [];
    for (var i = 0; i < this.enemigos.length; i++) {
      if (this.enemigos[i].vivo) { r.push(this.enemigos[i]); }
    }
    return r;
  };

  GestorEnemigos.prototype.filaMasBaja = function () {
    var max = 0;
    for (var i = 0; i < this.enemigos.length; i++) {
      var e = this.enemigos[i];
      if (e.vivo && e.y + e.h > max) { max = e.y + e.h; }
    }
    return max;
  };

  GestorEnemigos.prototype.hanInvadido = function () {
    return this.vivos > 0 && this.filaMasBaja() >= E.LINEA_INVASION;
  };

  GestorEnemigos.prototype.frameAlterno = function () {
    return this.indicePaso % 2 === 1;
  };

  global.TRI = global.TRI || {};
  global.TRI.GestorEnemigos = GestorEnemigos;
})(window);

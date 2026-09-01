/* Puntuacion, vidas y record. */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var Storage = global.TRI.Storage;

  function SistemaPuntuacion() {
    this.record = Storage.leerRecord();
    this.reiniciar();
  }

  SistemaPuntuacion.prototype.reiniciar = function () {
    this.puntos = 0;
    this.vidas = CONFIG.JUGADOR.VIDAS_INICIALES;
    this.siguienteVidaExtra = CONFIG.PUNTUACION.VIDA_EXTRA_CADA;
  };

  /* Devuelve true si esta suma dio una vida extra. */
  /* Suma una vida si no esta en el tope. Devuelve true si la sumo. */
  SistemaPuntuacion.prototype.ganarVida = function () {
    if (this.vidas >= CONFIG.PUNTUACION.MAX_VIDAS) { return false; }
    this.vidas++;
    return true;
  };

  SistemaPuntuacion.prototype.sumar = function (n) {
    this.puntos += Math.max(0, Math.floor(n));
    if (this.puntos > this.record) {
      this.record = this.puntos;
      Storage.guardarRecord(this.record);
    }
    if (this.puntos >= this.siguienteVidaExtra && this.vidas < CONFIG.PUNTUACION.MAX_VIDAS) {
      this.siguienteVidaExtra += CONFIG.PUNTUACION.VIDA_EXTRA_CADA;
      this.vidas++;
      return true;
    }
    if (this.puntos >= this.siguienteVidaExtra) {
      this.siguienteVidaExtra += CONFIG.PUNTUACION.VIDA_EXTRA_CADA;
    }
    return false;
  };

  SistemaPuntuacion.prototype.perderVida = function () {
    this.vidas = Math.max(0, this.vidas - 1);
    return this.vidas;
  };

  SistemaPuntuacion.prototype.sinVidas = function () {
    return this.vidas <= 0;
  };

  global.TRI = global.TRI || {};
  global.TRI.SistemaPuntuacion = SistemaPuntuacion;
})(window);

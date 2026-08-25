/* El Platillo Completo: el enemigo especial que cruza por arriba de vez en
 * cuando y vale puntos extra. Diseno propio (un completo volador).
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var Util = global.TRI.Util;
  var O = CONFIG.OVNI;

  function Ovni() {
    this.activo = false;
    this.x = 0;
    this.y = O.Y;
    this.w = O.ANCHO;
    this.h = O.ALTO;
    this.direccion = 1;
    this.espera = Util.azar(O.ESPERA_MIN, O.ESPERA_MAX);
    this.bamboleo = 0;
  }

  Ovni.prototype.reiniciar = function () {
    this.activo = false;
    this.espera = Util.azar(O.ESPERA_MIN, O.ESPERA_MAX);
    this.bamboleo = 0;
  };

  Ovni.prototype.aparecer = function () {
    this.direccion = Math.random() < 0.5 ? 1 : -1;
    this.x = this.direccion === 1 ? -this.w : CONFIG.ANCHO;
    this.y = O.Y;
    this.activo = true;
    this.bamboleo = 0;
  };

  /* Devuelve 'aparece' | 'sale' | null para que el juego maneje el sonido. */
  Ovni.prototype.actualizar = function (dt, puedeAparecer) {
    if (!this.activo) {
      if (!puedeAparecer) { return null; }
      this.espera -= dt;
      if (this.espera <= 0) {
        this.espera = Util.azar(O.ESPERA_MIN, O.ESPERA_MAX);
        this.aparecer();
        return 'aparece';
      }
      return null;
    }
    this.x += this.direccion * O.VELOCIDAD * dt;
    this.bamboleo += dt;
    this.y = O.Y + Math.sin(this.bamboleo * 4) * 4;
    if (this.x > CONFIG.ANCHO + 4 || this.x + this.w < -4) {
      this.activo = false;
      return 'sale';
    }
    return null;
  };

  Ovni.prototype.hitbox = function () {
    return { x: this.x + 4, y: this.y + 4, w: this.w - 8, h: this.h - 6 };
  };

  Ovni.prototype.puntos = function () {
    return Util.elegir(O.PUNTOS);
  };

  global.TRI = global.TRI || {};
  global.TRI.Ovni = Ovni;
})(window);

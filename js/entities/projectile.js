/* Proyectiles del jugador y de los enemigos.
 * Se guardan en una sola lista y se reutilizan los huecos para no crear basura
 * en cada disparo.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;

  function GestorProyectiles() {
    this.lista = [];
  }

  GestorProyectiles.prototype.lanzar = function (x, y, deJugador, velocidad) {
    var cfg = deJugador ? CONFIG.PROYECTIL_JUGADOR : CONFIG.PROYECTIL_ENEMIGO;
    var p = null;
    for (var i = 0; i < this.lista.length; i++) {
      if (!this.lista[i].vivo) { p = this.lista[i]; break; }
    }
    if (!p) { p = {}; this.lista.push(p); }
    p.w = cfg.ANCHO;
    p.h = cfg.ALTO;
    p.x = x - p.w / 2;
    p.y = deJugador ? y - p.h : y;
    p.vy = deJugador ? -CONFIG.PROYECTIL_JUGADOR.VELOCIDAD : (velocidad || CONFIG.PROYECTIL_ENEMIGO.VELOCIDAD_BASE);
    p.deJugador = !!deJugador;
    p.vivo = true;
    p.tiempo = 0;
    return p;
  };

  GestorProyectiles.prototype.actualizar = function (dt) {
    for (var i = 0; i < this.lista.length; i++) {
      var p = this.lista[i];
      if (!p.vivo) { continue; }
      p.y += p.vy * dt;
      p.tiempo += dt;
      if (p.y + p.h < CONFIG.HUD_ALTO || p.y > CONFIG.ALTO) { p.vivo = false; }
    }
  };

  GestorProyectiles.prototype.contar = function (deJugador) {
    var n = 0;
    for (var i = 0; i < this.lista.length; i++) {
      if (this.lista[i].vivo && this.lista[i].deJugador === deJugador) { n++; }
    }
    return n;
  };

  GestorProyectiles.prototype.limpiar = function () {
    for (var i = 0; i < this.lista.length; i++) { this.lista[i].vivo = false; }
  };

  GestorProyectiles.prototype.limpiarDe = function (deJugador) {
    for (var i = 0; i < this.lista.length; i++) {
      if (this.lista[i].deJugador === deJugador) { this.lista[i].vivo = false; }
    }
  };

  global.TRI = global.TRI || {};
  global.TRI.GestorProyectiles = GestorProyectiles;
})(window);

/* Efectos: chispas, destellos de explosion y numeros de puntos flotantes.
 * Todo con un tope duro de elementos para que el rendimiento no se desplome
 * cuando la pantalla se llena.
 */
(function (global) {
  'use strict';

  var Util = global.TRI.Util;
  /* Tope de particulas vivas. Subido para la muerte del jefe: con 220 el
     incendio llegaba al tope enseguida y los ultimos estallidos no
     pintaban nada. Se reutilizan del monton, no se crean sin freno. */
  var MAX = 460;

  function GestorEfectos() {
    this.lista = [];
  }

  GestorEfectos.prototype.obtenerLibre = function () {
    for (var i = 0; i < this.lista.length; i++) {
      if (!this.lista[i].vivo) { return this.lista[i]; }
    }
    if (this.lista.length >= MAX) { return null; }
    var nuevo = { vivo: false };
    this.lista.push(nuevo);
    return nuevo;
  };

  GestorEfectos.prototype.chispas = function (x, y, cantidad, color) {
    for (var i = 0; i < cantidad; i++) {
      var p = this.obtenerLibre();
      if (!p) { return; }
      var ang = Util.azar(0, Math.PI * 2);
      var vel = Util.azar(50, 210);
      p.tipo = 'chispa';
      p.x = x; p.y = y;
      p.vx = Math.cos(ang) * vel;
      p.vy = Math.sin(ang) * vel;
      p.vida = Util.azar(0.25, 0.6);
      p.maxVida = p.vida;
      p.tam = Util.azar(2, 4.5);
      p.color = color || '#ffe36b';
      p.vivo = true;
    }
  };

  /* Fuego: brasas que SUBEN y se apagan pasando de blanco a rojo. Al reves
     que las chispas, que caen por su peso. */
  GestorEfectos.prototype.fuego = function (x, y, cantidad) {
    for (var i = 0; i < cantidad; i++) {
      var p = this.obtenerLibre();
      if (!p) { return; }
      p.tipo = 'fuego';
      p.x = x + Util.azar(-14, 14);
      p.y = y + Util.azar(-14, 14);
      p.vx = Util.azar(-42, 42);
      p.vy = Util.azar(-150, -55);
      p.vida = Util.azar(0.5, 1.25);
      p.maxVida = p.vida;
      p.tam = Util.azar(5, 15);
      p.vivo = true;
    }
  };

  GestorEfectos.prototype.destello = function (x, y, tam) {
    var p = this.obtenerLibre();
    if (!p) { return; }
    p.tipo = 'destello';
    p.x = x; p.y = y;
    p.tam = tam || 40;
    p.vida = 0.32;
    p.maxVida = p.vida;
    p.vivo = true;
  };

  GestorEfectos.prototype.texto = function (x, y, texto, color) {
    var p = this.obtenerLibre();
    if (!p) { return; }
    p.tipo = 'texto';
    p.x = x; p.y = y;
    p.texto = String(texto);
    p.color = color || '#ffe36b';
    p.vida = 1.0;
    p.maxVida = p.vida;
    p.vivo = true;
  };

  GestorEfectos.prototype.actualizar = function (dt) {
    for (var i = 0; i < this.lista.length; i++) {
      var p = this.lista[i];
      if (!p.vivo) { continue; }
      p.vida -= dt;
      if (p.vida <= 0) { p.vivo = false; continue; }
      if (p.tipo === 'chispa') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 320 * dt;          // gravedad
      } else if (p.tipo === 'texto') {
        p.y -= 34 * dt;
      } else if (p.tipo === 'fuego') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 60 * dt;           // el calor tira hacia arriba
        p.vx *= (1 - dt * 1.2);
      }
    }
  };

  GestorEfectos.prototype.limpiar = function () {
    for (var i = 0; i < this.lista.length; i++) { this.lista[i].vivo = false; }
  };

  global.TRI = global.TRI || {};
  global.TRI.GestorEfectos = GestorEfectos;
})(window);

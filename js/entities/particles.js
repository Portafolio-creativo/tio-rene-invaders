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

  /* Un hueco del monton, desalojando si hace falta la particula a la que
     menos vida le queda. 'prioridad' fuerza el desalojo: lo usan los escombros
     del jefe, que no pueden quedarse sin salir por culpa del fuego. */
  GestorEfectos.prototype.obtenerLibrePrioritario = function () {
    var libre = this.obtenerLibre();
    if (libre) { return libre; }
    var peor = null;
    for (var i = 0; i < this.lista.length; i++) {
      var p = this.lista[i];
      if (p.tipo === 'escombro') { continue; }   // no se comen entre ellos
      if (!peor || p.vida < peor.vida) { peor = p; }
    }
    return peor;
  };

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

  /* Escombros: pedazos DE LA PROPIA CARA del jefe que salen despedidos al
     reventar. Cada trozo es un recorte del lienzo del jefe que vuela girando
     y cae. Es lo que hace que se vea que estallo en pedazos, no que se apago. */
  GestorEfectos.prototype.escombros = function (lienzo, caja, cantidad) {
    var lado = lienzo.width;
    for (var i = 0; i < cantidad; i++) {
      var p = this.obtenerLibrePrioritario();
      if (!p) { return; }
      var trozo = lado * Util.azar(0.16, 0.30);
      p.tipo = 'escombro';
      p.lienzo = lienzo;
      p.sx = Util.azar(0, lado - trozo);
      p.sy = Util.azar(0, lado - trozo);
      p.sw = trozo; p.sh = trozo;
      p.escala = caja.w / lado;
      // sale desde donde estaba ese trozo dentro de la cara
      p.x = caja.x + (p.sx + trozo / 2) * p.escala;
      p.y = caja.y + (p.sy + trozo / 2) * p.escala;
      var ang = Util.azar(0, Math.PI * 2);
      var vel = Util.azar(140, 380);
      p.vx = Math.cos(ang) * vel;
      p.vy = Math.sin(ang) * vel - 120;   // empujon hacia arriba
      p.rot = Util.azar(0, Math.PI * 2);
      p.vrot = Util.azar(-9, 9);
      p.vida = Util.azar(0.9, 1.7);
      p.maxVida = p.vida;
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
      } else if (p.tipo === 'escombro') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 520 * dt;          // pesa: cae
        p.rot += p.vrot * dt;
      }
    }
  };

  GestorEfectos.prototype.limpiar = function () {
    for (var i = 0; i < this.lista.length; i++) { this.lista[i].vivo = false; }
  };

  global.TRI = global.TRI || {};
  global.TRI.GestorEfectos = GestorEfectos;
})(window);

/* Barreras defensivas.
 *
 * Cada barrera es una rejilla de celdas. Un impacto no borra la barrera
 * entera: destruye un pequeno radio de celdas, asi que la barrera se va
 * comiendo poco a poco y se nota en pantalla.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var B = CONFIG.BARRERAS;

  /* Perfil de la barrera: 1 = celda solida, 0 = hueco.
     El arco de abajo es el clasico refugio donde se mete el jugador. */
  function plantilla(col, fila) {
    var cols = B.COLUMNAS, filas = B.FILAS;
    // esquinas superiores redondeadas
    if (fila === 0 && (col < 2 || col >= cols - 2)) { return 0; }
    if (fila === 1 && (col < 1 || col >= cols - 1)) { return 0; }
    // arco inferior
    var centro = (cols - 1) / 2;
    var distancia = Math.abs(col - centro);
    var profundidad = filas - fila;          // 1 en la ultima fila
    if (profundidad <= 3 && distancia < (3.5 - profundidad)) { return 0; }
    return 1;
  }

  function Barrera(x, y) {
    this.x = x;
    this.y = y;
    this.w = B.COLUMNAS * B.CELDA;
    this.h = B.FILAS * B.CELDA;
    this.celdas = [];
    this.reiniciar();
  }

  Barrera.prototype.reiniciar = function () {
    this.celdas.length = 0;
    for (var f = 0; f < B.FILAS; f++) {
      var fila = [];
      for (var c = 0; c < B.COLUMNAS; c++) {
        fila.push(plantilla(c, f));
      }
      this.celdas.push(fila);
    }
    this.vivas = this.contarVivas();
  };

  Barrera.prototype.contarVivas = function () {
    var n = 0;
    for (var f = 0; f < B.FILAS; f++) {
      for (var c = 0; c < B.COLUMNAS; c++) { n += this.celdas[f][c]; }
    }
    return n;
  };

  Barrera.prototype.hitbox = function () {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  };

  /* Devuelve true si el punto cae sobre una celda solida. */
  Barrera.prototype.celdaEn = function (px, py) {
    var c = Math.floor((px - this.x) / B.CELDA);
    var f = Math.floor((py - this.y) / B.CELDA);
    if (f < 0 || f >= B.FILAS || c < 0 || c >= B.COLUMNAS) { return null; }
    return this.celdas[f][c] ? { c: c, f: f } : null;
  };

  /* Rompe un radio de celdas alrededor del impacto. Devuelve cuantas rompio. */
  Barrera.prototype.impactar = function (px, py, radio) {
    var centro = this.celdaEn(px, py);
    if (!centro) { return 0; }
    var r = radio || B.RADIO_IMPACTO;
    var rotas = 0;
    for (var f = centro.f - r; f <= centro.f + r; f++) {
      for (var c = centro.c - r; c <= centro.c + r; c++) {
        if (f < 0 || f >= B.FILAS || c < 0 || c >= B.COLUMNAS) { continue; }
        var dist = Math.sqrt((f - centro.f) * (f - centro.f) + (c - centro.c) * (c - centro.c));
        if (dist > r + 0.35) { continue; }
        if (this.celdas[f][c]) { this.celdas[f][c] = 0; rotas++; }
      }
    }
    this.vivas -= rotas;
    return rotas;
  };

  /* Un enemigo que pasa por encima arrasa la barrera. */
  Barrera.prototype.arrasarHasta = function (yLimite) {
    var rotas = 0;
    for (var f = 0; f < B.FILAS; f++) {
      if (this.y + f * B.CELDA + B.CELDA <= yLimite) {
        for (var c = 0; c < B.COLUMNAS; c++) {
          if (this.celdas[f][c]) { this.celdas[f][c] = 0; rotas++; }
        }
      }
    }
    this.vivas -= rotas;
    return rotas;
  };

  function crearBarreras() {
    var lista = [];
    var ancho = B.COLUMNAS * B.CELDA;
    for (var i = 0; i < B.CANTIDAD; i++) {
      var centro = CONFIG.ANCHO * (i + 0.5) / B.CANTIDAD;
      lista.push(new Barrera(Math.round(centro - ancho / 2), B.Y));
    }
    return lista;
  }

  global.TRI = global.TRI || {};
  global.TRI.Barrera = Barrera;
  global.TRI.crearBarreras = crearBarreras;
})(window);

/* Utilidades geometricas y numericas compartidas. */
(function (global) {
  'use strict';

  var Util = {
    limitar: function (v, min, max) {
      return v < min ? min : (v > max ? max : v);
    },
    azar: function (min, max) {
      return min + Math.random() * (max - min);
    },
    azarEntero: function (min, max) {
      return Math.floor(min + Math.random() * (max - min + 1));
    },
    elegir: function (lista) {
      return lista[Math.floor(Math.random() * lista.length)];
    },
    /* Colision rectangulo contra rectangulo (AABB) */
    solapan: function (a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },
    interpolar: function (a, b, t) {
      return a + (b - a) * t;
    },
    /* Suaviza el arranque y el final de una animacion (0..1 -> 0..1) */
    suavizar: function (t) {
      t = Util.limitar(t, 0, 1);
      return t * t * (3 - 2 * t);
    },
    formatearPuntos: function (n) {
      var s = String(Math.max(0, Math.floor(n)));
      while (s.length < 5) { s = '0' + s; }
      return s;
    }
  };

  global.TRI = global.TRI || {};
  global.TRI.Util = Util;
})(window);

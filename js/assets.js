/* Gestor de imagenes.
 *
 * Cada sprite es un archivo suelto dentro de assets/ con un nombre claro.
 * Para cambiar el dibujo del Tio Rene basta con reemplazar el archivo; el
 * juego no necesita ni una linea de codigo nueva.
 *
 * Orden de busqueda de cada sprite: las extensiones de CONFIG.ASSETS.EXTENSIONES
 * (por defecto solo 'svg'). Si ninguna carga, se genera arte de emergencia por
 * codigo (fallback-art.js) para que el juego siga siendo jugable.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var FallbackArt = global.TRI.FallbackArt;

  /* nombre -> tamano nominal en px logicos (documentado en el README) */
  var SPRITES = {
    /* Las tres piezas del Tio Rene salen de una foto: primero se busca el
       .png y, si no esta, el .svg dibujado que queda como respaldo. */
    'player-head': { w: 360, h: 249, carpeta: 'sprites', ext: ['png', 'svg'] },
    'player-head-shoot': { w: 360, h: 249, carpeta: 'sprites', ext: ['png', 'svg'], soloConExpresiones: true },
    'player-head-hit': { w: 360, h: 249, carpeta: 'sprites', ext: ['png', 'svg'], soloConExpresiones: true },
    'player-head-dead': { w: 360, h: 249, carpeta: 'sprites', ext: ['png', 'svg'], soloConExpresiones: true },
    'player-jaw': { w: 360, h: 147, carpeta: 'sprites', ext: ['png', 'svg'] },
    'player-mouth': { w: 360, h: 2, carpeta: 'sprites', ext: ['png', 'svg'] },
    'player-body': { w: 56, h: 34, carpeta: 'sprites' },
    'enemy-01-a': { w: 36, h: 30, carpeta: 'sprites' },
    'enemy-01-b': { w: 36, h: 30, carpeta: 'sprites' },
    'enemy-02-a': { w: 36, h: 30, carpeta: 'sprites' },
    'enemy-02-b': { w: 36, h: 30, carpeta: 'sprites' },
    'enemy-03-a': { w: 36, h: 30, carpeta: 'sprites' },
    'enemy-03-b': { w: 36, h: 30, carpeta: 'sprites' },
    'enemy-special': { w: 64, h: 28, carpeta: 'sprites' },
    'projectile-player': { w: 12, h: 22, carpeta: 'sprites' },
    'projectile-enemy': { w: 12, h: 22, carpeta: 'sprites' },
    'barrier-block': { w: 8, h: 8, carpeta: 'sprites' },
    'explosion': { w: 32, h: 32, carpeta: 'sprites' },
    'logo': { w: 320, h: 320, carpeta: 'ui', ext: ['png', 'svg'] }
  };

  var imagenes = {};      // nombre -> HTMLImageElement | HTMLCanvasElement
  var fallidos = [];      // nombres que acabaron usando arte de emergencia

  function ruta(nombre, ext) {
    var meta = SPRITES[nombre];
    var base = meta.carpeta === 'ui' ? CONFIG.ASSETS.RUTA_UI : CONFIG.ASSETS.RUTA_SPRITES;
    return base + nombre + '.' + ext;
  }

  /* Intenta las extensiones en orden; resuelve siempre (nunca rechaza). */
  function cargarUno(nombre) {
    var exts = (SPRITES[nombre].ext || CONFIG.ASSETS.EXTENSIONES).slice();
    return new Promise(function (resolver) {
      function intentar(i) {
        if (i >= exts.length) {
          fallidos.push(nombre);
          imagenes[nombre] = FallbackArt.generar(nombre);
          resolver(false);
          return;
        }
        var img = new Image();
        img.onload = function () { imagenes[nombre] = img; resolver(true); };
        img.onerror = function () { intentar(i + 1); };
        img.decoding = 'async';
        img.src = ruta(nombre, exts[i]);
      }
      intentar(0);
    });
  }

  var Assets = {
    /* alProgreso(cargados, total) se llama tras cada imagen */
    cargarTodo: function (alProgreso) {
      var nombres = Object.keys(SPRITES).filter(function (n) {
        return !SPRITES[n].soloConExpresiones || CONFIG.JUGADOR.EXPRESIONES_SEPARADAS;
      });
      var total = nombres.length;
      var hechos = 0;
      return Promise.all(nombres.map(function (n) {
        return cargarUno(n).then(function () {
          hechos++;
          if (typeof alProgreso === 'function') { alProgreso(hechos, total); }
        });
      })).then(function () {
        return { total: total, fallidos: fallidos.slice() };
      });
    },
    obtener: function (nombre) {
      return imagenes[nombre] || null;
    }
  };

  global.TRI.Assets = Assets;
})(window);

/* Jefe: una cabezota que hay que deshacer a tiros.
 *
 * Se destruye por CELDAS, igual que las barreras: cada impacto se lleva un
 * pequeno radio, asi que la cara se va comiendo de a poco y se nota en
 * pantalla. Las celdas solidas se sacan de la propia imagen leyendo su
 * transparencia, de modo que la destruccion sigue la silueta de la cabeza y no
 * un rectangulo.
 *
 * La cara se pinta en un lienzo aparte y solo se vuelve a pintar cuando le
 * quitan un trozo: dibujar 324 celdas en cada fotograma seria un derroche.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var Assets = global.TRI.Assets;
  var Util = global.TRI.Util;
  var J = CONFIG.JEFES;

  function Jefe() {
    this.activo = false;
    this.celdas = [];
    this.lienzo = document.createElement('canvas');
    this.lienzo.width = J.ANCHO;
    this.lienzo.height = J.ALTO;
    this.ctx = this.lienzo.getContext('2d');
  }

  Jefe.prototype.anchoCelda = function () { return J.ANCHO / J.COLUMNAS; };
  Jefe.prototype.altoCelda = function () { return J.ALTO / J.FILAS; };

  /* Marca como solidas solo las celdas donde la imagen tiene algo pintado. Si
     no hay imagen (o el navegador no deja leerla), se toma la cabeza entera. */
  Jefe.prototype.calcularCeldas = function (img) {
    this.celdas.length = 0;
    var datos = null;
    if (img) {
      try {
        var muestra = document.createElement('canvas');
        muestra.width = J.COLUMNAS;
        muestra.height = J.FILAS;
        var mctx = muestra.getContext('2d');
        mctx.drawImage(img, 0, 0, J.COLUMNAS, J.FILAS);
        datos = mctx.getImageData(0, 0, J.COLUMNAS, J.FILAS).data;
      } catch (e) {
        datos = null;          // lienzo "manchado": se sigue sin la muestra
      }
    }
    for (var f = 0; f < J.FILAS; f++) {
      var fila = [];
      for (var c = 0; c < J.COLUMNAS; c++) {
        var solida = 1;
        if (datos) {
          var alfa = datos[(f * J.COLUMNAS + c) * 4 + 3];
          solida = alfa > 40 ? 1 : 0;
        }
        fila.push(solida);
      }
      this.celdas.push(fila);
    }
    this.total = this.contarVivas();
    this.vivas = this.total;
  };

  Jefe.prototype.contarVivas = function () {
    var n = 0;
    for (var f = 0; f < this.celdas.length; f++) {
      for (var c = 0; c < this.celdas[f].length; c++) { n += this.celdas[f][c]; }
    }
    return n;
  };

  /* nivel decide cual de los cinco jefes toca y lo rapido que se mueve. */
  Jefe.prototype.preparar = function (nivel) {
    var indice = Math.floor((nivel - 1) / J.CADA) % J.LISTA.length;
    this.datos = J.LISTA[indice];
    this.sprite = this.datos.sprite;
    this.nombre = this.datos.nombre;
    this.activo = true;
    this.x = (CONFIG.ANCHO - J.ANCHO) / 2;
    this.y = J.Y_INICIAL;
    this.direccion = 1;
    this.velocidad = J.VELOCIDAD_BASE + 6 * Math.floor((nivel - 1) / J.CADA);
    this.intervaloDisparo = Math.max(
      J.INTERVALO_DISPARO_MIN,
      J.INTERVALO_DISPARO_BASE - 0.16 * Math.floor((nivel - 1) / J.CADA));
    this.temporizadorDisparo = this.intervaloDisparo;
    this.destello = 0;
    this.calcularCeldas(Assets.obtener(this.sprite));
    this.repintar();
  };

  Jefe.prototype.reiniciar = function () {
    this.activo = false;
  };

  /* Vuelve a pintar la cara con los agujeros que tenga ahora. */
  Jefe.prototype.repintar = function () {
    var ctx = this.ctx;
    var img = Assets.obtener(this.sprite);
    ctx.clearRect(0, 0, J.ANCHO, J.ALTO);
    if (!img) { return; }
    var aw = this.anchoCelda(), ah = this.altoCelda();
    var sx = img.width / J.COLUMNAS, sy = img.height / J.FILAS;
    for (var f = 0; f < J.FILAS; f++) {
      for (var c = 0; c < J.COLUMNAS; c++) {
        if (!this.celdas[f][c]) { continue; }
        // +1 al recortar: evita las costuras claras entre celda y celda.
        ctx.drawImage(img, c * sx, f * sy, sx, sy,
                      c * aw, f * ah, aw + 1, ah + 1);
      }
    }
  };

  Jefe.prototype.hitbox = function () {
    return { x: this.x, y: this.y, w: J.ANCHO, h: J.ALTO };
  };

  /* Devuelve true si el impacto le quito algo (para no gastar el disparo en
     un hueco ya abierto). */
  Jefe.prototype.impactar = function (px, py) {
    var col = Math.floor((px - this.x) / this.anchoCelda());
    var fil = Math.floor((py - this.y) / this.altoCelda());
    var quitadas = 0;
    var r = J.RADIO_IMPACTO;
    for (var f = fil - r; f <= fil + r; f++) {
      for (var c = col - r; c <= col + r; c++) {
        if (f < 0 || f >= J.FILAS || c < 0 || c >= J.COLUMNAS) { continue; }
        // Circulo, no cuadrado: el mordisco queda mas natural.
        if ((f - fil) * (f - fil) + (c - col) * (c - col) > r * r + 1) { continue; }
        if (this.celdas[f][c]) { this.celdas[f][c] = 0; quitadas++; }
      }
    }
    if (!quitadas) { return false; }
    this.vivas -= quitadas;
    this.destello = 0.12;
    this.repintar();
    return true;
  };

  Jefe.prototype.derrotado = function () {
    return this.vivas <= this.total * J.RESTO_PARA_MORIR;
  };

  /* Punto por donde escupe: la boca, mas o menos al centro y abajo. */
  Jefe.prototype.bocaDeFuego = function () {
    return { x: this.x + J.ANCHO / 2, y: this.y + J.ALTO * 0.78 };
  };

  Jefe.prototype.actualizar = function (dt) {
    if (!this.activo) { return false; }
    if (this.destello > 0) { this.destello -= dt; }

    this.x += this.direccion * this.velocidad * dt;
    var minX = J.ANCHO * 0.06;
    var maxX = CONFIG.ANCHO - J.ANCHO - J.ANCHO * 0.06;
    if (this.x <= minX || this.x >= maxX) {
      this.x = Util.limitar(this.x, minX, maxX);
      this.direccion *= -1;
      this.y += J.DESCENSO;
    }

    this.temporizadorDisparo -= dt;
    if (this.temporizadorDisparo <= 0) {
      this.temporizadorDisparo = this.intervaloDisparo;
      return true;              // toca disparar
    }
    return false;
  };

  global.TRI = global.TRI || {};
  global.TRI.Jefe = Jefe;
})(window);

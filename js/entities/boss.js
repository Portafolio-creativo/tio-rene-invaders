/* Jefe: una cabezota que se va deteriorando a tiros.
 *
 * La cara NO se borra a pedazos: se mantiene entera y reconocible hasta el
 * final, que es lo que la hace temible. Lo que cambia es su estado: se llena
 * de magulladuras y quemaduras donde recibe los impactos, pierde color y se
 * va oscureciendo. Al completar los golpes necesarios, estalla.
 *
 * Se mueve por puntos al azar con trayectorias curvas y ademas se acerca y se
 * aleja (zoom), asi que no basta con seguirlo de lado a lado: hay que
 * anticiparlo.
 *
 * La cara se pinta en un lienzo aparte y solo se repinta cuando recibe un
 * golpe nuevo; el movimiento no obliga a redibujarla.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var Assets = global.TRI.Assets;
  var Util = global.TRI.Util;
  var J = CONFIG.JEFES;

  var MASCARA = 40;          // resolucion de la silueta para los impactos

  function Jefe() {
    this.activo = false;
    this.marcas = [];
    this.mascara = null;
    this.lienzo = document.createElement('canvas');
    this.lienzo.width = J.ANCHO;
    this.lienzo.height = J.ALTO;
    this.ctx = this.lienzo.getContext('2d');
  }

  /* nivel decide cual de los cinco jefes toca y lo agresivo que se mueve. */
  Jefe.prototype.preparar = function (nivel) {
    var vuelta = Math.floor((nivel - 1) / J.CADA);
    this.datos = J.LISTA[vuelta % J.LISTA.length];
    this.sprite = this.datos.sprite;
    this.nombre = this.datos.nombre;
    this.voces = this.datos.voces || {};
    this.activo = true;

    this.cx = CONFIG.ANCHO / 2;
    this.cy = J.Y_INICIAL + J.ALTO / 2;
    this.escala = 1;
    this.escalaObjetivo = 1;
    this.velocidad = J.VELOCIDAD_BASE + 14 * vuelta;
    this.intervaloDisparo = Math.max(
      J.INTERVALO_DISPARO_MIN,
      J.INTERVALO_DISPARO_BASE - 0.16 * vuelta);
    this.temporizadorDisparo = this.intervaloDisparo;
    this.quedanEnSalva = 0;
    this.temporizadorZoom = 0;
    this.destello = 0;
    this.impactos = 0;
    this.marcas.length = 0;
    this.calcularMascara(Assets.obtener(this.sprite));
    this.nuevoDestino();
    this.repintar();
  };

  /* Silueta de la cara, leida de la transparencia del PNG. Sin esto los
     disparos chocaban contra la caja cuadrada y reventaban en el aire, en las
     esquinas donde no hay mas que fondo transparente. */
  Jefe.prototype.calcularMascara = function (img) {
    this.mascara = null;
    if (!img) { return; }
    try {
      var c = document.createElement('canvas');
      c.width = MASCARA;
      c.height = MASCARA;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, MASCARA, MASCARA);
      var datos = ctx.getImageData(0, 0, MASCARA, MASCARA).data;
      var m = new Uint8Array(MASCARA * MASCARA);
      for (var i = 0; i < m.length; i++) { m[i] = datos[i * 4 + 3] > 40 ? 1 : 0; }
      this.mascara = m;
    } catch (e) {
      this.mascara = null;    // lienzo "manchado": se cae a la caja entera
    }
  };

  /* True si ese punto cae sobre la cara de verdad, no sobre el aire de las
     esquinas. Si no hay mascara, vale toda la caja. */
  Jefe.prototype.tocado = function (px, py) {
    if (!this.mascara) { return true; }
    var c = this.hitbox();
    var u = (px - c.x) / c.w, v = (py - c.y) / c.h;
    if (u < 0 || u >= 1 || v < 0 || v >= 1) { return false; }
    var col = Math.floor(u * MASCARA), fil = Math.floor(v * MASCARA);
    return this.mascara[fil * MASCARA + col] === 1;
  };

  Jefe.prototype.reiniciar = function () {
    this.activo = false;
  };

  /* ---- Movimiento ---- */

  Jefe.prototype.limites = function () {
    var mitadX = (J.ANCHO * this.escala) / 2;
    var mitadY = (J.ALTO * this.escala) / 2;
    return {
      minX: mitadX + 8,
      maxX: CONFIG.ANCHO - mitadX - 8,
      minY: J.MIN_Y + mitadY,
      maxY: J.MAX_Y - mitadY
    };
  };

  /* Un punto cualquiera de la zona por la que puede rondar. Se busca en la
     mitad contraria a donde esta, para que no se quede tiritando en una
     esquina y de verdad cruce la pantalla. */
  Jefe.prototype.nuevoDestino = function () {
    var l = this.limites();
    var vaALaIzquierda = this.cx > CONFIG.ANCHO / 2;
    var a = vaALaIzquierda ? l.minX : CONFIG.ANCHO / 2;
    var b = vaALaIzquierda ? CONFIG.ANCHO / 2 : l.maxX;
    this.destino = {
      x: Util.limitar(a + Math.random() * (b - a), l.minX, l.maxX),
      y: Util.limitar(l.minY + Math.random() * (l.maxY - l.minY), l.minY, l.maxY)
    };
  };

  Jefe.prototype.actualizar = function (dt) {
    if (!this.activo) { return false; }
    if (this.destello > 0) { this.destello -= dt; }

    /* Avance hacia el destino. Como se cambia de destino antes de llegar del
       todo y el eje vertical va mas lento, la trayectoria sale curva en vez
       de en linea recta de un lado a otro. */
    var dx = this.destino.x - this.cx;
    var dy = this.destino.y - this.cy;
    var distancia = Math.sqrt(dx * dx + dy * dy);
    if (distancia < 14) {
      this.nuevoDestino();
    } else {
      var paso = Math.min(distancia, this.velocidad * dt);
      this.cx += (dx / distancia) * paso;
      this.cy += (dy / distancia) * paso * 0.7;
    }

    /* Zoom: cada cierto rato decide acercarse o alejarse. De cerca es un
       blanco mas facil pero tapa media pantalla; de lejos cuesta acertarle. */
    this.temporizadorZoom -= dt;
    if (this.temporizadorZoom <= 0) {
      this.temporizadorZoom = J.ZOOM_CADA_MIN +
        Math.random() * (J.ZOOM_CADA_MAX - J.ZOOM_CADA_MIN);
      this.escalaObjetivo = J.ESCALA_MIN + Math.random() * (J.ESCALA_MAX - J.ESCALA_MIN);
    }
    this.escala += (this.escalaObjetivo - this.escala) * Math.min(1, dt * 1.6);

    // Que el zoom no lo deje medio fuera de la pantalla.
    var l = this.limites();
    this.cx = Util.limitar(this.cx, l.minX, l.maxX);
    this.cy = Util.limitar(this.cy, l.minY, l.maxY);

    /* Disparo en salvas: suelta varios seguidos y luego descansa. Uno a uno
       era demasiado manso para un jefe. */
    this.temporizadorDisparo -= dt;
    if (this.temporizadorDisparo <= 0) {
      if (this.quedanEnSalva > 0) {
        this.quedanEnSalva--;
        this.temporizadorDisparo = J.SALVA_SEPARACION;
      } else {
        this.quedanEnSalva = J.SALVA_TIROS - 1;
        this.temporizadorDisparo = this.intervaloDisparo;
      }
      return true;
    }
    return false;
  };

  /* ---- Geometria ---- */

  Jefe.prototype.hitbox = function () {
    var w = J.ANCHO * this.escala, h = J.ALTO * this.escala;
    return { x: this.cx - w / 2, y: this.cy - h / 2, w: w, h: h };
  };

  Jefe.prototype.bocaDeFuego = function () {
    var c = this.hitbox();
    return { x: c.x + c.w / 2, y: c.y + c.h * 0.78 };
  };

  /* ---- Dano ---- */

  /* La marca se guarda en coordenadas de 0 a 1 dentro de la cara, para que
     siga en su sitio aunque el jefe cambie de tamano. */
  Jefe.prototype.impactar = function (px, py) {
    var c = this.hitbox();
    this.marcas.push({
      u: Util.limitar((px - c.x) / c.w, 0.06, 0.94),
      v: Util.limitar((py - c.y) / c.h, 0.06, 0.94),
      semilla: Math.random()
    });
    this.impactos++;
    this.destello = 0.12;
    this.repintar();
    return true;
  };

  Jefe.prototype.derrotado = function () {
    return this.impactos >= J.IMPACTOS_OBJETIVO;
  };

  /* Lo que le queda, de 1 a 0. Es lo que pinta la barra. */
  Jefe.prototype.resto = function () {
    return Math.max(0, 1 - this.impactos / J.IMPACTOS_OBJETIVO);
  };

  /* ---- Pintado ---- */

  Jefe.prototype.repintar = function () {
    var ctx = this.ctx;
    var img = Assets.obtener(this.sprite);
    ctx.clearRect(0, 0, J.ANCHO, J.ALTO);
    if (!img) { return; }
    ctx.drawImage(img, 0, 0, J.ANCHO, J.ALTO);

    var dano = Math.min(1, this.impactos / J.IMPACTOS_OBJETIVO);
    ctx.save();
    // Todo el deterioro se recorta contra la cara: nada mancha el vacio.
    ctx.globalCompositeOperation = 'source-atop';
    this.pintarHeridas();

    /* Pierde color y se apaga segun va cayendo: al final esta magullado y
       tiznado, pero sigue siendo su cara.
       OJO: nada de globalCompositeOperation 'saturation' aqui. Ese modo pinta
       el lienzo ENTERO, tambien donde no hay cara, y dejaba un cuadrado rojo
       de fondo. 'source-atop' es el unico que respeta la silueta. */
    if (dano > 0) {
      ctx.globalCompositeOperation = 'source-atop';
      // Lavado gris: le quita viveza al color sin apagar los rasgos.
      ctx.fillStyle = 'rgba(126, 118, 112, ' + (0.30 * dano).toFixed(3) + ')';
      ctx.fillRect(0, 0, J.ANCHO, J.ALTO);
      // Tizne: sombra sucia, cargada hacia el marron quemado.
      ctx.fillStyle = 'rgba(48, 22, 12, ' + (0.26 * dano).toFixed(3) + ')';
      ctx.fillRect(0, 0, J.ANCHO, J.ALTO);
    }
    ctx.restore();
  };

  /* Cada impacto deja un moraton irregular con el centro quemado y unas
     grietas cortas. Se redibujan todos en cada repintado, asi que el dano se
     acumula a la vista, golpe a golpe. */
  Jefe.prototype.pintarHeridas = function () {
    var ctx = this.ctx;
    for (var i = 0; i < this.marcas.length; i++) {
      var m = this.marcas[i];
      var x = m.u * J.ANCHO, y = m.v * J.ALTO;
      var radio = J.ANCHO * (0.085 + 0.045 * m.semilla);

      // Moraton: manchon morado difuminado.
      var moraton = ctx.createRadialGradient(x, y, radio * 0.15, x, y, radio);
      moraton.addColorStop(0, 'rgba(96, 26, 18, 0.62)');
      moraton.addColorStop(0.55, 'rgba(72, 32, 28, 0.30)');
      moraton.addColorStop(1, 'rgba(60, 34, 30, 0)');
      ctx.fillStyle = moraton;
      ctx.beginPath();
      ctx.arc(x, y, radio, 0, Math.PI * 2);
      ctx.fill();

      // Quemadura del centro, con el borde irregular.
      ctx.fillStyle = 'rgba(32, 16, 10, 0.62)';
      ctx.beginPath();
      for (var k = 0; k <= 10; k++) {
        var ang = (k / 10) * Math.PI * 2;
        var rr = radio * (0.30 + 0.12 * Math.sin(k * 2.3 + m.semilla * 9));
        var px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr;
        if (k === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
      }
      ctx.closePath();
      ctx.fill();

      // Grietas cortas saliendo de la herida.
      ctx.strokeStyle = 'rgba(30, 14, 10, 0.42)';
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      for (k = 0; k < 3; k++) {
        var a = m.semilla * 6.28 + k * 2.1;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * radio * 0.3, y + Math.sin(a) * radio * 0.3);
        ctx.lineTo(x + Math.cos(a + 0.3) * radio * 0.95,
                   y + Math.sin(a + 0.3) * radio * 0.95);
        ctx.stroke();
      }
    }
  };

  global.TRI = global.TRI || {};
  global.TRI.Jefe = Jefe;
})(window);

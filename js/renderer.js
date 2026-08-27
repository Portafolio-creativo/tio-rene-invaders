/* Renderer: TODO lo que se pinta en el canvas.
 * Las entidades no saben dibujarse; aqui se leen sus datos y se pintan.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var Assets = global.TRI.Assets;
  var Util = global.TRI.Util;
  var C = CONFIG.COLORES;
  var TIPO_LETRA = '"Courier New", "DejaVu Sans Mono", monospace';

  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.escala = 1;
    // Los filtros de canvas no existen en navegadores viejos: si no estan, el
    // juego se ve igual, solo sin el tinte de dano.
    this.soportaFiltro = (typeof this.ctx.filter === 'string');
    this.estrellas = [];
    this.sacudidaT = 0;         // segundos que queda de sacudida
    this.sacudidaTotal = 1;
    this.sacudidaFuerza = 0;
    // Lienzo auxiliar para tintar la cara del jefe respetando su silueta.
    this.aux = document.createElement('canvas');
    this.auxCtx = this.aux.getContext('2d');
    this.crearEstrellas(70);
  }

  Renderer.prototype.crearEstrellas = function (n) {
    this.estrellas.length = 0;
    for (var i = 0; i < n; i++) {
      this.estrellas.push({
        x: Util.azar(0, CONFIG.ANCHO),
        y: Util.azar(CONFIG.HUD_ALTO, CONFIG.ALTO),
        r: Util.azar(0.6, 1.8),
        v: Util.azar(4, 16)
      });
    }
  };

  /* anchoCSS/altoCSS ya vienen con la proporcion 600x800 respetada. */
  Renderer.prototype.ajustar = function (anchoCSS, altoCSS) {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(anchoCSS * dpr);
    this.canvas.height = Math.round(altoCSS * dpr);
    this.canvas.style.width = anchoCSS + 'px';
    this.canvas.style.height = altoCSS + 'px';
    this.escala = (anchoCSS / CONFIG.ANCHO) * dpr;
    this.ctx.setTransform(this.escala, 0, 0, this.escala, 0, 0);
  };

  Renderer.prototype.actualizarFondo = function (dt) {
    for (var i = 0; i < this.estrellas.length; i++) {
      var e = this.estrellas[i];
      e.y += e.v * dt;
      if (e.y > CONFIG.ALTO) { e.y = CONFIG.HUD_ALTO; e.x = Util.azar(0, CONFIG.ANCHO); }
    }
  };

  /* Sacudida de pantalla. La pide el juego cuando algo revienta fuerte; se
     aplica a TODO el cuadro, asi que se abre aqui y se cierra en cerrar(). */
  Renderer.prototype.sacudir = function (segundos, fuerza) {
    this.sacudidaT = segundos;
    this.sacudidaTotal = segundos;
    this.sacudidaFuerza = fuerza;
  };

  Renderer.prototype.avanzarSacudida = function (dt) {
    if (this.sacudidaT > 0) { this.sacudidaT -= dt; }
  };

  Renderer.prototype.limpiar = function () {
    var ctx = this.ctx;
    ctx.save();
    if (this.sacudidaT > 0) {
      // Se va apagando: al principio zarandea fuerte y termina suave.
      var q = this.sacudidaT / this.sacudidaTotal;
      var f = this.sacudidaFuerza * q * q;
      ctx.translate((Math.random() - 0.5) * f, (Math.random() - 0.5) * f);
    }
    ctx.fillStyle = C.FONDO;
    ctx.fillRect(0, 0, CONFIG.ANCHO, CONFIG.ALTO);
    ctx.fillStyle = C.ESTRELLA;
    for (var i = 0; i < this.estrellas.length; i++) {
      var e = this.estrellas[i];
      ctx.globalAlpha = 0.25 + (e.r / 2.4) * 0.5;
      ctx.fillRect(e.x, e.y, e.r, e.r);
    }
    ctx.globalAlpha = 1;
  };

  /* Cierra la transformacion que abrio limpiar(). Se llama al final de cada
     cuadro; si no, las traslaciones se irian acumulando. */
  Renderer.prototype.cerrar = function () {
    this.ctx.restore();
  };

  function dibujarSprite(ctx, nombre, x, y, w, h) {
    var img = Assets.obtener(nombre);
    if (!img) { return; }
    ctx.drawImage(img, x, y, w, h);
  }

  Renderer.prototype.dibujarJugador = function (jugador) {
    var ctx = this.ctx;
    // Parpadeo mientras es invulnerable, sin ocultarlo del todo.
    var alfa = 1;
    if (jugador.invulnerable > 0 && jugador.estado === 'normal') {
      alfa = (Math.floor(jugador.invulnerable * 12) % 2 === 0) ? 0.35 : 1;
    }
    ctx.globalAlpha = alfa;

    var p = jugador.piezas();
    // Con una sola foto de cara, el dano y la muerte se distinguen por color.
    if (this.soportaFiltro && !CONFIG.JUGADOR.EXPRESIONES_SEPARADAS) {
      if (jugador.estado === 'golpeado') {
        ctx.filter = 'saturate(2.4) hue-rotate(-16deg) brightness(1.08)';
      } else if (jugador.estado === 'muerto') {
        ctx.filter = 'grayscale(1) brightness(0.8)';
      }
    }
    var sacudida = 0;
    if (jugador.estado === 'golpeado' || jugador.estado === 'muerto') {
      sacudida = Math.sin(jugador.tiempoEstado * 40) * 4;
    }
    ctx.save();
    ctx.translate(sacudida, 0);

    dibujarSprite(ctx, 'player-body', p.cuerpo.x, p.cuerpo.y, p.cuerpo.w, p.cuerpo.h);
    // Relleno del corte: una tira sacada de la propia foto, estirada. Asi al
    // abrirse la mandibula se ve boca oscura al centro y piel a los lados.
    if (jugador.aperturaPx() > 0.4) {
      dibujarSprite(ctx, 'player-mouth', p.boca.x, p.boca.y, p.boca.w, p.boca.h);
    }
    dibujarSprite(ctx, jugador.spriteCabeza(), p.cabeza.x, p.cabeza.y, p.cabeza.w, p.cabeza.h);
    dibujarSprite(ctx, 'player-jaw', p.mandibula.x, p.mandibula.y, p.mandibula.w, p.mandibula.h);

    ctx.restore();
    ctx.globalAlpha = 1;
    if (this.soportaFiltro) { ctx.filter = 'none'; }
  };

  Renderer.prototype.dibujarEnemigos = function (gestor) {
    var ctx = this.ctx;
    var alterno = gestor.frameAlterno() ? '-b' : '-a';
    var lista = gestor.enemigos;
    for (var i = 0; i < lista.length; i++) {
      var e = lista[i];
      if (!e.vivo) { continue; }
      dibujarSprite(ctx, e.sprite + alterno, e.x, e.y, e.w, e.h);
    }
  };

  Renderer.prototype.dibujarOvni = function (ovni) {
    if (!ovni.activo) { return; }
    dibujarSprite(this.ctx, 'enemy-special', ovni.x, ovni.y, ovni.w, ovni.h);
  };

  /* El jefe se pinta desde su propio lienzo, que ya trae el deterioro. Se
     escala segun lo cerca que este; el destello es el fogonazo del impacto. */
  Renderer.prototype.dibujarJefe = function (jefe) {
    if (!jefe.activo) { return; }
    var ctx = this.ctx;
    var c = jefe.hitbox();
    var x = Math.round(c.x), y = Math.round(c.y), w = Math.round(c.w), h = Math.round(c.h);

    if (jefe.enAgonia()) {
      /* Agonizando: la cara se sacude en el sitio y se pone al rojo vivo,
         latiendo cada vez mas rapido, hasta reventar. */
      var q = jefe.progresoMuerte();               // 0 -> 1
      var tiembla = 2 + q * 11;
      var pulso = 0.5 + 0.5 * Math.abs(Math.sin(q * 42));
      // La cara al rojo vivo se compone en el lienzo auxiliar, para que el
      // tinte solo toque la cara y no deje un rectangulo sobre el fondo.
      var lado = jefe.lienzo.width;
      this.aux.width = lado; this.aux.height = lado;
      var a = this.auxCtx;
      a.clearRect(0, 0, lado, lado);
      a.globalCompositeOperation = 'source-over';
      a.globalAlpha = 1;
      a.drawImage(jefe.lienzo, 0, 0);
      a.globalCompositeOperation = 'source-atop';   // solo pinta sobre la cara
      a.globalAlpha = pulso * (0.4 + 0.55 * q);
      a.fillStyle = q > 0.7 ? '#fff2c0' : '#ff5a2a';
      a.fillRect(0, 0, lado, lado);
      a.globalAlpha = 1;

      ctx.save();
      ctx.translate((Math.random() - 0.5) * tiembla, (Math.random() - 0.5) * tiembla);
      ctx.drawImage(this.aux, x, y, w, h);
      ctx.restore();
      return;                                      // sin barra de vida: ya murio
    }

    ctx.drawImage(jefe.lienzo, x, y, w, h);
    if (jefe.destello > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.5, jefe.destello * 4);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(jefe.lienzo, x, y, w, h);
      ctx.restore();
    }
    // Barra de vida, siempre del mismo ancho y arriba del todo: si siguiera al
    // jefe se saldria de la pantalla cuando se acerca.
    var ancho = CONFIG.ANCHO - 120;
    var resto = jefe.resto();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(60, CONFIG.HUD_ALTO + 6, ancho, 9);
    ctx.fillStyle = resto > 0.4 ? '#46d16a' : '#ff7a6b';
    ctx.fillRect(60, CONFIG.HUD_ALTO + 6, ancho * resto, 9);
  };

  Renderer.prototype.dibujarProyectiles = function (gestor) {
    var ctx = this.ctx;
    var lista = gestor.lista;
    for (var i = 0; i < lista.length; i++) {
      var p = lista[i];
      if (!p.vivo) { continue; }
      dibujarSprite(ctx, p.deJugador ? 'projectile-player' : 'projectile-enemy', p.x, p.y, p.w, p.h);
    }
  };

  Renderer.prototype.dibujarBarreras = function (barreras) {
    var ctx = this.ctx;
    var celda = CONFIG.BARRERAS.CELDA;
    var img = Assets.obtener('barrier-block');
    for (var b = 0; b < barreras.length; b++) {
      var barrera = barreras[b];
      for (var f = 0; f < barrera.celdas.length; f++) {
        var fila = barrera.celdas[f];
        for (var c = 0; c < fila.length; c++) {
          if (!fila[c]) { continue; }
          var x = barrera.x + c * celda;
          var y = barrera.y + f * celda;
          if (img) { ctx.drawImage(img, x, y, celda, celda); }
          else { ctx.fillStyle = C.BARRERA; ctx.fillRect(x, y, celda, celda); }
        }
      }
    }
  };

  Renderer.prototype.dibujarEfectos = function (gestor) {
    var ctx = this.ctx;
    var lista = gestor.lista;
    for (var i = 0; i < lista.length; i++) {
      var p = lista[i];
      if (!p.vivo) { continue; }
      var t = p.vida / p.maxVida;
      if (p.tipo === 'chispa') {
        ctx.globalAlpha = Math.max(0, t);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.tam, p.tam);
      } else if (p.tipo === 'destello') {
        ctx.globalAlpha = Math.max(0, t);
        var tam = p.tam * (1.4 - t * 0.5);
        dibujarSprite(ctx, 'explosion', p.x - tam / 2, p.y - tam / 2, tam, tam);
      } else if (p.tipo === 'escombro') {
        var qe = p.vida / p.maxVida;
        ctx.save();
        ctx.globalAlpha = Math.min(1, qe * 1.6);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        var d = p.sw * p.escala;
        ctx.drawImage(p.lienzo, p.sx, p.sy, p.sw, p.sh, -d/2, -d/2, d, d);
        ctx.restore();
      } else if (p.tipo === 'fuego') {
        /* La llama pasa de blanca a roja segun se apaga, y se
           dibuja en modo 'lighter' para que al superponerse las
           brasas den el nucleo brillante del incendio. */
        var q = p.vida / p.maxVida;
        var rojo = 255;
        var verde = Math.round(60 + 195 * q);
        var azul = Math.round(30 * q * q);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, q * 1.4) * 0.85;
        ctx.fillStyle = 'rgb(' + rojo + ',' + verde + ',' + azul + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.tam * (0.35 + q * 0.65), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.tipo === 'texto') {
        ctx.globalAlpha = Math.max(0, t);
        ctx.fillStyle = p.color;
        ctx.font = 'bold 18px ' + TIPO_LETRA;
        ctx.textAlign = 'center';
        ctx.fillText(p.texto, p.x, p.y);
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  };

  Renderer.prototype.dibujarSuelo = function () {
    var ctx = this.ctx;
    ctx.fillStyle = C.SUELO;
    ctx.fillRect(0, CONFIG.ALTO - 10, CONFIG.ANCHO, 3);
  };

  Renderer.prototype.dibujarHUD = function (datos) {
    var ctx = this.ctx;
    ctx.fillStyle = 'rgba(7,10,20,0.92)';
    ctx.fillRect(0, 0, CONFIG.ANCHO, CONFIG.HUD_ALTO);
    ctx.fillStyle = 'rgba(70,209,106,0.35)';
    ctx.fillRect(0, CONFIG.HUD_ALTO - 2, CONFIG.ANCHO, 2);

    ctx.font = 'bold 13px ' + TIPO_LETRA;
    ctx.textAlign = 'left';
    ctx.fillStyle = C.TEXTO_TENUE;
    ctx.fillText('PUNTOS', 14, 20);
    ctx.fillText('RECORD', 168, 20);
    ctx.fillText('NIVEL', 322, 20);

    ctx.font = 'bold 20px ' + TIPO_LETRA;
    ctx.fillStyle = C.TEXTO;
    ctx.fillText(Util.formatearPuntos(datos.puntos), 14, 42);
    ctx.fillStyle = datos.puntos >= datos.record && datos.puntos > 0 ? C.ACENTO : C.TEXTO;
    ctx.fillText(Util.formatearPuntos(datos.record), 168, 42);
    ctx.fillStyle = C.TEXTO;
    ctx.fillText(String(datos.nivel), 322, 42);

    // Vidas: cabecitas del Tio Rene (nunca solo un numero, se lee de un vistazo)
    ctx.font = 'bold 13px ' + TIPO_LETRA;
    ctx.fillStyle = C.TEXTO_TENUE;
    ctx.textAlign = 'right';
    ctx.fillText('VIDAS', CONFIG.ANCHO - 14, 20);
    ctx.textAlign = 'left';
    var ancho = 26, alto = 17;
    for (var i = 0; i < datos.vidas; i++) {
      var x = CONFIG.ANCHO - 14 - (i + 1) * (ancho + 5);
      dibujarSprite(ctx, 'player-head', x, 27, ancho, alto);
    }
    if (datos.vidas === 0) {
      ctx.fillStyle = C.PELIGRO;
      ctx.textAlign = 'right';
      ctx.fillText('SIN VIDAS', CONFIG.ANCHO - 14, 42);
      ctx.textAlign = 'left';
    }
  };

  /* Cartel grande centrado (NIVEL N, PAUSA...). */
  Renderer.prototype.dibujarCartel = function (titulo, subtitulo) {
    var ctx = this.ctx;
    ctx.fillStyle = 'rgba(7,10,20,0.72)';
    ctx.fillRect(0, CONFIG.ALTO / 2 - 70, CONFIG.ANCHO, 140);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.ACENTO;
    ctx.font = 'bold 40px ' + TIPO_LETRA;
    ctx.fillText(titulo, CONFIG.ANCHO / 2, CONFIG.ALTO / 2 + 4);
    if (subtitulo) {
      ctx.fillStyle = C.TEXTO;
      ctx.font = 'bold 17px ' + TIPO_LETRA;
      ctx.fillText(subtitulo, CONFIG.ANCHO / 2, CONFIG.ALTO / 2 + 38);
    }
    ctx.textAlign = 'left';
  };

  Renderer.prototype.dibujarDepuracion = function (info) {
    var ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = C.DEBUG;
    ctx.lineWidth = 1;

    var caja = info.jugador.hitbox();
    ctx.strokeRect(caja.x, caja.y, caja.w, caja.h);

    var enemigos = info.enemigos.enemigos;
    for (var i = 0; i < enemigos.length; i++) {
      var e = enemigos[i];
      if (e.vivo) { ctx.strokeRect(e.x, e.y, e.w, e.h); }
    }
    var proyectiles = info.proyectiles.lista;
    for (var j = 0; j < proyectiles.length; j++) {
      var p = proyectiles[j];
      if (p.vivo) { ctx.strokeRect(p.x, p.y, p.w, p.h); }
    }
    if (info.ovni.activo) {
      var o = info.ovni.hitbox();
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    }
    // Linea de invasion
    ctx.strokeStyle = C.PELIGRO;
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.ENEMIGOS.LINEA_INVASION);
    ctx.lineTo(CONFIG.ANCHO, CONFIG.ENEMIGOS.LINEA_INVASION);
    ctx.stroke();

    ctx.fillStyle = C.DEBUG;
    ctx.font = 'bold 12px ' + TIPO_LETRA;
    var lineas = [
      'FPS ' + info.fps,
      'estado ' + info.estado,
      'enemigos ' + info.enemigos.vivos + '/' + info.enemigos.total,
      'paso ' + info.enemigos.intervaloPaso().toFixed(3) + 's',
      'proyectiles ' + info.proyectiles.contar(true) + ' / ' + info.proyectiles.contar(false),
      'jugador x ' + info.jugador.x.toFixed(1) + ' mandibula ' + info.jugador.mandibula.apertura.toFixed(2),
      'nivel ' + info.nivel,
      'assets fallidos ' + info.assetsFallidos
    ];
    for (var k = 0; k < lineas.length; k++) {
      ctx.fillText(lineas[k], 12, CONFIG.HUD_ALTO + 18 + k * 15);
    }
    ctx.restore();
  };

  global.TRI = global.TRI || {};
  global.TRI.Renderer = Renderer;
})(window);

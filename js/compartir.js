/* Compartir el resultado: dibuja una tarjeta con el puntaje y la reparte.
 *
 * La tarjeta se pinta en un canvas aparte (1080x1080, cuadrado, que es lo que
 * mejor entra en WhatsApp) y se manda como archivo por la API de compartir del
 * sistema, junto al enlace del juego. Asi el jugador presume su puntaje y de
 * paso reparte el juego.
 *
 * Si el navegador no sabe compartir archivos se prueba solo con el enlace, y si
 * tampoco, se descarga la imagen y se copia el enlace: siempre queda una salida.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var Util = global.TRI.Util;

  var LADO = 1080;
  var RUTA_CABEZA = 'assets/sprites/player-head.png';
  var RUTA_MANDIBULA = 'assets/sprites/player-jaw.png';

  var caras = null;        // las dos imagenes, cargadas una sola vez

  function cargarImagen(ruta) {
    return new Promise(function (resolver) {
      var img = new Image();
      img.onload = function () { resolver(img); };
      // Si falta el dibujo la tarjeta se hace igual, solo que sin cara.
      img.onerror = function () { resolver(null); };
      img.src = ruta;
    });
  }

  function cargarCaras() {
    if (caras) { return Promise.resolve(caras); }
    return Promise.all([cargarImagen(RUTA_CABEZA), cargarImagen(RUTA_MANDIBULA)])
      .then(function (par) { caras = par; return caras; });
  }

  /* Texto centrado, encogiendo la letra hasta que quepa. La 'y' es el CENTRO
     de la linea (textBaseline middle): asi las alturas se pueden repartir sin
     tener que adivinar donde cae la base de cada tamano de letra. */
  function centrado(ctx, texto, y, tam, color, anchoMax) {
    var t = tam;
    do {
      ctx.font = 'bold ' + t + 'px "Trebuchet MS", Verdana, sans-serif';
      t -= 4;
    } while (ctx.measureText(texto).width > anchoMax && t > 12);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, LADO / 2, y);
  }

  /* La cara, encajada dentro de una caja. Cabeza y mandibula van PEGADAS: con
     una separacion se veia una barra oscura cruzando la boca, como si la cara
     estuviese partida. El corte natural entre las dos piezas ya se nota. */
  function dibujarCara(ctx, par, arriba, maxAncho, maxAlto) {
    var cabeza = par[0], mandibula = par[1];
    if (!cabeza) { return arriba; }
    var altoNatural = cabeza.height + (mandibula ? mandibula.height : 0);
    var escala = Math.min(maxAncho / cabeza.width, maxAlto / altoNatural);
    var ancho = cabeza.width * escala;
    var x = LADO / 2 - ancho / 2;
    var altoCabeza = cabeza.height * escala;
    ctx.drawImage(cabeza, x, arriba, ancho, altoCabeza);
    if (mandibula) {
      ctx.drawImage(mandibula, x, arriba + altoCabeza, ancho, mandibula.height * escala);
    }
    return arriba + altoNatural * escala;
  }

  function pintarTarjeta(datos) {
    return cargarCaras().then(function (par) {
      var lienzo = document.createElement('canvas');
      lienzo.width = LADO;
      lienzo.height = LADO;
      var ctx = lienzo.getContext('2d');

      var fondo = ctx.createRadialGradient(LADO / 2, LADO * 0.36, 40, LADO / 2, LADO / 2, LADO * 0.78);
      fondo.addColorStop(0, '#123a22');
      fondo.addColorStop(1, '#070a14');
      ctx.fillStyle = fondo;
      ctx.fillRect(0, 0, LADO, LADO);

      ctx.strokeStyle = '#46d16a';
      ctx.lineWidth = 10;
      ctx.strokeRect(26, 26, LADO - 52, LADO - 52);

      centrado(ctx, 'TÍO RENÉ INVADERS', 112, 62, '#ffe36b', LADO - 160);
      dibujarCara(ctx, par, 175, 330, 345);
      centrado(ctx, 'PUNTAJE', 578, 40, '#8b98bd', LADO - 200);
      centrado(ctx, Util.formatearPuntos(datos.puntos), 706, 140, '#46d16a', LADO - 180);

      var linea = 'RÉCORD ' + Util.formatearPuntos(datos.record);
      if (datos.nivel) { linea += '   ·   NIVEL ' + datos.nivel; }
      centrado(ctx, linea, 818, 40, '#e8f1ff', LADO - 200);

      centrado(ctx, datos.remate || '¿Le ganai al Tío René?', 912, 46, '#ffe36b', LADO - 150);
      centrado(ctx, CONFIG.ENLACE.replace(/^https:\/\//, ''), 992, 30, '#8b98bd', LADO - 140);

      return lienzo;
    });
  }

  /* JPEG y no PNG: la tarjeta es un degradado con fotos, y en PNG se iba a mas
     de 1 MB, un peso absurdo para mandar por WhatsApp. En JPEG ronda los 100 KB
     sin diferencia visible. El fondo es opaco, asi que no se pierde nada. */
  function aBlob(lienzo) {
    return new Promise(function (resolver, rechazar) {
      if (!lienzo.toBlob) { rechazar(new Error('sin toBlob')); return; }
      lienzo.toBlob(function (b) {
        if (b) { resolver(b); } else { rechazar(new Error('sin blob')); }
      }, 'image/jpeg', 0.88);
    });
  }

  /* Ultimo recurso: deja la imagen descargada y el enlace en el portapapeles. */
  function salidaDeEmergencia(blob, texto) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mi-puntaje-tio-rene.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    global.setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
      return global.navigator.clipboard.writeText(texto)
        .then(function () { return 'Imagen descargada y enlace copiado'; },
              function () { return 'Imagen descargada'; });
    }
    return Promise.resolve('Imagen descargada');
  }

  var Compartir = {
    /* datos: { puntos, record, nivel, remate }
       Devuelve una promesa con un mensaje corto para enseñar al jugador, o
       null si el propio jugador cancelo (ahi no hay nada que decir). */
    resultado: function (datos) {
      var texto = 'Hice ' + Util.formatearPuntos(datos.puntos)
        + ' puntos en Tío René Invaders. ¿Le ganai?';
      var nav = global.navigator;

      return pintarTarjeta(datos).then(aBlob).then(function (blob) {
        var archivo = null;
        try {
          archivo = new File([blob], 'mi-puntaje-tio-rene.jpg', { type: 'image/jpeg' });
        } catch (e) { archivo = null; }

        var conArchivo = archivo && nav.canShare && nav.canShare({ files: [archivo] });
        if (conArchivo) {
          return nav.share({ files: [archivo], text: texto, title: 'TÍO RENÉ INVADERS' })
            .then(function () { return 'Compartido'; });
        }
        if (nav.share) {
          return nav.share({ title: 'TÍO RENÉ INVADERS', text: texto, url: CONFIG.ENLACE })
            .then(function () { return 'Compartido'; });
        }
        return salidaDeEmergencia(blob, texto + ' ' + CONFIG.ENLACE);
      })['catch'](function (e) {
        // Cancelar no es un fallo: el jugador cerro la hoja de compartir.
        if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) { return null; }
        return 'No se pudo compartir';
      });
    }
  };

  global.TRI = global.TRI || {};
  global.TRI.Compartir = Compartir;
})(window);

/* Arte de emergencia dibujado por codigo.
 * Solo se usa si un archivo de assets/ no carga (borrado, renombrado, ruta
 * equivocada, bloqueo del navegador). Asi el juego NUNCA se queda en negro.
 * Mantiene la misma silueta: cabezota, corte horizontal y mandibula aparte.
 */
(function (global) {
  'use strict';

  function lienzo(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function redondeado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* Ultimo recurso: solo si no cargan ni el .png ni el .svg de la cabeza.
     No pretende parecerse a nadie: solo mantiene el juego jugable, con la
     cabezota, el corte horizontal y la mandibula aparte. */
  function cabeza() {
    var c = lienzo(96, 60), ctx = c.getContext('2d');
    ctx.fillStyle = '#e8a882';
    ctx.strokeStyle = '#21140d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(13, 60); ctx.lineTo(11, 30);
    ctx.quadraticCurveTo(11, 6, 48, 6);
    ctx.quadraticCurveTo(85, 6, 85, 30);
    ctx.lineTo(83, 60); ctx.closePath();
    ctx.fill(); ctx.stroke();

    // ojos entornados
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(23, 36); ctx.quadraticCurveTo(31, 31, 40, 35);
    ctx.moveTo(73, 36); ctx.quadraticCurveTo(65, 31, 56, 35);
    ctx.stroke();

    // cejas gruesas
    ctx.fillStyle = '#3a332b';
    ctx.beginPath();
    ctx.moveTo(18, 23); ctx.quadraticCurveTo(30, 18, 44, 27);
    ctx.lineTo(44, 33); ctx.quadraticCurveTo(30, 25, 18, 30);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(78, 23); ctx.quadraticCurveTo(66, 18, 52, 27);
    ctx.lineTo(52, 33); ctx.quadraticCurveTo(66, 25, 78, 30);
    ctx.closePath(); ctx.fill();

    // nariz ancha
    ctx.beginPath(); ctx.ellipse(48, 46, 12, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e08a6e'; ctx.fill();
    ctx.strokeStyle = '#21140d'; ctx.lineWidth = 2.4; ctx.stroke();

    // barba de tres dias
    ctx.fillStyle = 'rgba(93,95,114,0.34)';
    ctx.fillRect(14, 52, 68, 8);

    // CORTE HORIZONTAL: dientes de arriba colgando del borde
    ctx.fillStyle = '#b8695e'; ctx.fillRect(28, 52, 40, 2);
    ctx.fillStyle = '#3a1c1a'; ctx.fillRect(13, 54, 70, 6);
    ctx.fillStyle = '#ede4d0';
    for (var i = 0; i < 6; i++) { ctx.fillRect(29 + i * 6.6, 54, 6, 6); }
    return c;
  }

  function mandibula() {
    var c = lienzo(76, 30), ctx = c.getContext('2d');
    ctx.fillStyle = '#f4c99f'; ctx.strokeStyle = '#21140d'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2, 2); ctx.lineTo(74, 2); ctx.lineTo(74, 12);
    ctx.quadraticCurveTo(74, 28, 38, 28);
    ctx.quadraticCurveTo(2, 28, 2, 12); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fffdf7';
    [24, 34, 44].forEach(function (x) { ctx.fillRect(x, 2, 8, 7); });
    ctx.fillStyle = '#c96a6a';
    ctx.beginPath(); ctx.ellipse(38, 12, 16, 4, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#21140d'; ctx.fillRect(2, 0, 72, 3);
    return c;
  }

  function boca() {
    var c = lienzo(64, 30), ctx = c.getContext('2d');
    ctx.fillStyle = '#3a0f14'; ctx.fillRect(0, 0, 64, 30);
    ctx.fillStyle = '#1a0508'; ctx.fillRect(0, 0, 64, 4);
    ctx.fillStyle = '#d8506a';
    ctx.beginPath(); ctx.ellipse(32, 26, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
    return c;
  }

  function cuerpo() {
    var c = lienzo(56, 34), ctx = c.getContext('2d');
    ctx.strokeStyle = '#21140d'; ctx.lineWidth = 2.5;
    ctx.fillStyle = '#e8b489'; ctx.fillRect(24, 0, 8, 6); ctx.strokeRect(24, 0, 8, 6);
    ctx.fillStyle = '#2e6fb7';
    ctx.beginPath(); ctx.moveTo(14, 6); ctx.lineTo(42, 6); ctx.lineTo(44, 26); ctx.lineTo(12, 26);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    redondeado(ctx, 4, 8, 9, 16, 4); ctx.fill(); ctx.stroke();
    redondeado(ctx, 43, 8, 9, 16, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2a1e';
    redondeado(ctx, 14, 26, 12, 8, 3); ctx.fill(); ctx.stroke();
    redondeado(ctx, 30, 26, 12, 8, 3); ctx.fill(); ctx.stroke();
    return c;
  }

  var PALETA_ENEMIGOS = {
    'enemy-01': { cuerpo: '#6ee07a', borde: '#0d3b16', ojo: '#fffdf7', pupila: '#12202a' },
    'enemy-02': { cuerpo: '#b980ff', borde: '#3d1a63', ojo: '#ffe36b', pupila: '#2a0f47' },
    'enemy-03': { cuerpo: '#ff7b5e', borde: '#6b1f14', ojo: '#fffdf7', pupila: '#1b2b3d' }
  };

  function enemigo(tipo, alterno) {
    var p = PALETA_ENEMIGOS[tipo] || PALETA_ENEMIGOS['enemy-01'];
    var c = lienzo(36, 30), ctx = c.getContext('2d');
    var d = alterno ? 2 : -2;
    ctx.fillStyle = p.cuerpo; ctx.strokeStyle = p.borde; ctx.lineWidth = 2;
    redondeado(ctx, 4, 5, 28, 18, 8); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(9, 22); ctx.lineTo(7, 29 - d);
    ctx.moveTo(18, 22); ctx.lineTo(18, 29 + d);
    ctx.moveTo(27, 22); ctx.lineTo(29, 29 - d);
    ctx.moveTo(10, 5); ctx.lineTo(6 - d, 0);
    ctx.moveTo(26, 5); ctx.lineTo(30 + d, 0);
    ctx.stroke();
    if (tipo === 'enemy-03') {
      ctx.fillStyle = p.ojo;
      ctx.beginPath(); ctx.ellipse(18, 14, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = p.pupila;
      ctx.beginPath(); ctx.arc(18 + d, 14, 3.2, 0, Math.PI * 2); ctx.fill();
    } else {
      [12, 24].forEach(function (cx) {
        ctx.fillStyle = p.ojo;
        ctx.beginPath(); ctx.ellipse(cx, 14, 4.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = p.pupila;
        ctx.beginPath(); ctx.arc(cx + d * 0.5, 14, 2, 0, Math.PI * 2); ctx.fill();
      });
    }
    return c;
  }

  function ovni() {
    var c = lienzo(64, 28), ctx = c.getContext('2d');
    ctx.strokeStyle = '#5c3a12'; ctx.lineWidth = 2;
    ctx.fillStyle = '#e8b36a';
    ctx.beginPath(); ctx.ellipse(32, 19, 30, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f0c684';
    ctx.beginPath(); ctx.moveTo(6, 15); ctx.quadraticCurveTo(32, -2, 58, 15);
    ctx.quadraticCurveTo(32, 22, 6, 15); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d1543f'; redondeado(ctx, 12, 11, 40, 7, 3.5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#7bbf5a'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(13, 11);
    ctx.quadraticCurveTo(24, 6, 32, 12); ctx.quadraticCurveTo(42, 17, 52, 11); ctx.stroke();
    ctx.fillStyle = '#9fe8ff'; ctx.strokeStyle = '#5c3a12'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(32, 6, 7, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    return c;
  }

  function proyectil(esJugador) {
    var c = lienzo(12, 22), ctx = c.getContext('2d');
    if (esJugador) {
      ctx.fillStyle = 'rgba(255,227,107,0.35)';
      ctx.beginPath(); ctx.ellipse(6, 11, 5.5, 10.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fffdf2'; ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(2, 5); ctx.quadraticCurveTo(6, 0, 10, 5);
      ctx.lineTo(10, 13); ctx.lineTo(8, 20); ctx.lineTo(6, 15); ctx.lineTo(4, 20); ctx.lineTo(2, 13);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,91,208,0.28)';
      ctx.beginPath(); ctx.ellipse(6, 11, 5, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8ae0'; ctx.strokeStyle = '#7a1f66'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(7, 1); ctx.lineTo(3, 9); ctx.lineTo(6, 9); ctx.lineTo(2, 21);
      ctx.lineTo(10, 10); ctx.lineTo(6.5, 10); ctx.lineTo(10, 1);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    return c;
  }

  function bloqueBarrera() {
    var c = lienzo(8, 8), ctx = c.getContext('2d');
    ctx.fillStyle = '#46d16a'; ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = '#7cf29a'; ctx.fillRect(0, 0, 8, 2);
    ctx.fillStyle = '#238a44'; ctx.fillRect(0, 6, 8, 2);
    return c;
  }

  function explosion() {
    var c = lienzo(32, 32), ctx = c.getContext('2d');
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    for (var i = 0; i < 12; i++) {
      var ang = (Math.PI * 2 * i) / 12;
      var r = i % 2 === 0 ? 16 : 8;
      var x = 16 + Math.cos(ang) * r, y = 16 + Math.sin(ang) * r;
      if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff6d0';
    ctx.beginPath(); ctx.arc(16, 16, 7, 0, Math.PI * 2); ctx.fill();
    return c;
  }

  function logo() {
    var c = lienzo(160, 160), ctx = c.getContext('2d');
    ctx.fillStyle = '#141c33'; ctx.strokeStyle = '#46d16a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(80, 80, 52, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.drawImage(cabeza(), 54, 44, 53, 33);
    ctx.drawImage(mandibula(), 60, 78, 42, 17);
    return c;
  }

  /* Cabeza de jefe generada. Es un MARCADOR DE SITIO a proposito: sirve para
     que el jefe se pueda jugar aunque todavia no exista assets/sprites/
     boss-N.png. En cuanto se ponga ese archivo, manda la imagen de verdad.
     Cada jefe tiene su color y su gesto para distinguirlos de un vistazo. */
  function cabezaJefe(indice) {
    var paleta = [
      { piel: '#f0b48a', pelo: '#2b1d16', detalle: '#ffd166' },
      { piel: '#d99a6c', pelo: '#101010', detalle: '#7cc6ff' },
      { piel: '#bfe3a8', pelo: '#1f5c2e', detalle: '#46d16a' },
      { piel: '#eab08c', pelo: '#5a3212', detalle: '#ff9f5a' },
      { piel: '#f6e3b0', pelo: '#c99a20', detalle: '#ffe36b' }
    ][indice % 5];

    var c = lienzo(250, 250), ctx = c.getContext('2d');
    ctx.strokeStyle = '#1a0f08';
    ctx.lineWidth = 6;

    // craneo
    ctx.fillStyle = paleta.piel;
    ctx.beginPath();
    ctx.ellipse(125, 132, 92, 108, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // pelo
    ctx.fillStyle = paleta.pelo;
    ctx.beginPath();
    ctx.ellipse(125, 66, 94, 52, 0, Math.PI, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // ojos
    ctx.fillStyle = '#fff';
    [90, 160].forEach(function (x) {
      ctx.beginPath(); ctx.ellipse(x, 122, 24, 18, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    });
    ctx.fillStyle = '#1a0f08';
    [95, 155].forEach(function (x) {
      ctx.beginPath(); ctx.arc(x, 124, 9, 0, Math.PI * 2); ctx.fill();
    });

    // boca abierta: por ahi escupe
    ctx.fillStyle = '#3d1414';
    ctx.beginPath();
    ctx.ellipse(125, 190, 46, 28, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(96, 168, 58, 10);

    // banda de color, para diferenciarlos aunque falten las fotos
    ctx.fillStyle = paleta.detalle;
    ctx.fillRect(33, 88, 184, 12);

    // el numero del jefe, para no perderse mientras son marcadores
    ctx.fillStyle = '#1a0f08';
    ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('#' + (indice + 1), 125, 99);
    return c;
  }

  /* Familias de nave: mismas 3 filas (color por tipo) pero SILUETA distinta,
     para que cada nivel se vea diferente y no solo cambie de color. El color
     del nivel se aplica encima (lo hace el renderer). alterno = 2do fotograma
     de la marcha (mueve patas/antenas). */
  function construirNave(familia, tipo, alterno) {
    var p = PALETA_ENEMIGOS[tipo] || PALETA_ENEMIGOS['enemy-01'];
    var c = lienzo(36, 30), ctx = c.getContext('2d');
    var d = alterno ? 2 : -2;
    ctx.lineWidth = 2; ctx.strokeStyle = p.borde; ctx.fillStyle = p.cuerpo;
    ctx.lineJoin = 'round';

    function ojos(cxs, ry) {
      cxs.forEach(function (cx) {
        ctx.fillStyle = p.ojo; ctx.beginPath();
        ctx.ellipse(cx, ry, 4, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = p.pupila; ctx.beginPath();
        ctx.arc(cx + d * 0.5, ry, 1.9, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = p.cuerpo;
    }

    if (familia === 'platillo') {
      // Disco con cupula y luces abajo.
      ctx.beginPath(); ctx.ellipse(18, 17, 15, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(18, 13, 8, Math.PI, 0); ctx.fill(); ctx.stroke();
      ojos([13, 23], 11);
      ctx.fillStyle = p.pupila;
      [8, 14, 22, 28].forEach(function (lx, i) {
        var on = (i % 2 === 0) === !!alterno;
        ctx.globalAlpha = on ? 1 : 0.35;
        ctx.beginPath(); ctx.arc(lx, 21, 1.6, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    } else if (familia === 'insecto') {
      // Rombo con antenas y pinzas.
      ctx.beginPath();
      ctx.moveTo(18, 3); ctx.lineTo(31, 15); ctx.lineTo(18, 27); ctx.lineTo(5, 15);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, 6); ctx.lineTo(7 - d, 0);
      ctx.moveTo(24, 6); ctx.lineTo(29 + d, 0);
      ctx.moveTo(6, 15); ctx.lineTo(1, 15 + d);
      ctx.moveTo(30, 15); ctx.lineTo(35, 15 - d);
      ctx.stroke();
      ojos([14, 22], 14);
    } else if (familia === 'robot') {
      // Cuerpo cuadrado con antena y ojos rectangulares.
      redondeado(ctx, 6, 7, 24, 18, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, 7); ctx.lineTo(18, 1); ctx.stroke();
      ctx.beginPath(); ctx.arc(18, 1, 1.6, 0, Math.PI * 2); ctx.fillStyle = p.ojo; ctx.fill();
      ctx.fillStyle = p.ojo;
      [11, 25].forEach(function (cx) {
        ctx.fillRect(cx - 3, 12, 6, 5); ctx.strokeRect(cx - 3, 12, 6, 5);
        ctx.fillStyle = p.pupila; ctx.fillRect(cx - 1 + d * 0.5, 13, 2, 3); ctx.fillStyle = p.ojo;
      });
      ctx.fillStyle = p.pupila;
      [10, 18, 26].forEach(function (lx) { ctx.fillRect(lx - 1, 25, 2, 3 + (alterno ? 1 : 0)); });
    } else if (familia === 'medusa') {
      // Campana con tentaculos colgando.
      ctx.beginPath(); ctx.arc(18, 15, 12, Math.PI, 0); ctx.lineTo(30, 16); ctx.lineTo(6, 16);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      [9, 15, 21, 27].forEach(function (tx, i) {
        var largo = (i % 2 === 0) === !!alterno ? 28 : 24;
        ctx.moveTo(tx, 16); ctx.quadraticCurveTo(tx + d, 22, tx, largo);
      });
      ctx.stroke();
      ojos([14, 22], 12);
    } else {
      // 'clasico': el cangrejo de siempre.
      return enemigo(tipo, alterno);
    }
    return c;
  }

  var GENERADORES = {
    'player-head': cabeza,
    'player-jaw': mandibula,
    'player-mouth': boca,
    'player-body': cuerpo,
    'enemy-01-a': function () { return enemigo('enemy-01', false); },
    'enemy-01-b': function () { return enemigo('enemy-01', true); },
    'enemy-02-a': function () { return enemigo('enemy-02', false); },
    'enemy-02-b': function () { return enemigo('enemy-02', true); },
    'enemy-03-a': function () { return enemigo('enemy-03', false); },
    'enemy-03-b': function () { return enemigo('enemy-03', true); },
    'enemy-special': ovni,
    'projectile-player': function () { return proyectil(true); },
    'projectile-enemy': function () { return proyectil(false); },
    'barrier-block': bloqueBarrera,
    'explosion': explosion,
    'logo': logo,
    'boss-1': function () { return cabezaJefe(0); },
    'boss-2': function () { return cabezaJefe(1); },
    'boss-3': function () { return cabezaJefe(2); },
    'boss-4': function () { return cabezaJefe(3); },
    'boss-5': function () { return cabezaJefe(4); }
  };

  global.TRI = global.TRI || {};
  global.TRI.FallbackArt = {
    generar: function (nombre) {
      var gen = GENERADORES[nombre];
      return gen ? gen() : lienzo(8, 8);
    },
    /* Nave de una familia concreta (para variar la forma por nivel). */
    nave: function (familia, tipo, alterno) {
      return construirNave(familia, tipo, alterno);
    }
  };
})(window);

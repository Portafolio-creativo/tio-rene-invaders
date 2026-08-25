/* AudioManager.
 *
 * Todos los sonidos son ORIGINALES y se generan con la Web Audio API: no hay
 * ningun archivo de audio ajeno en el proyecto.
 *
 * Si algun dia quieres poner voces reales del Tio Rene, deja los .wav en
 * assets/audio/ con los nombres de CONFIG.AUDIO.ARCHIVOS y pon
 * CONFIG.AUDIO.USAR_ARCHIVOS = true. La logica del juego no cambia: sigue
 * llamando a Audio.reproducir('disparo').
 *
 * Si el navegador no soporta Web Audio, o el usuario silencia, todo se
 * degrada en silencio sin romper nada.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var Storage = global.TRI.Storage;
  var Util = global.TRI.Util;

  var ctx = null;
  var masterGain = null;
  var soportado = typeof (global.AudioContext || global.webkitAudioContext) === 'function';
  var activo = Storage.leerAudioActivo();
  var volumen = Storage.leerVolumen();
  var buffers = {};          // sonidos cargados desde archivo (opcionales)
  var vocesActivas = 0;
  var MAX_VOCES = 14;
  var sirena = null;         // referencia al zumbido del ovni

  function crearContexto() {
    if (ctx || !soportado) { return; }
    var Ctor = global.AudioContext || global.webkitAudioContext;
    try {
      ctx = new Ctor();
      masterGain = ctx.createGain();
      masterGain.gain.value = activo ? volumen : 0;
      masterGain.connect(ctx.destination);
    } catch (e) {
      soportado = false;
      ctx = null;
    }
  }

  function ahora() { return ctx ? ctx.currentTime : 0; }

  function envolvente(destino, pico, ataque, duracion) {
    var g = ctx.createGain();
    var t = ahora();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, pico), t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    g.connect(destino || masterGain);
    return g;
  }

  function tono(opts) {
    if (!ctx || vocesActivas >= MAX_VOCES) { return; }
    var dur = opts.dur || 0.15;
    var osc = ctx.createOscillator();
    var g = envolvente(null, opts.vol || 0.25, opts.ataque || 0.005, dur);
    osc.type = opts.tipo || 'square';
    var t = ahora() + (opts.retraso || 0);
    osc.frequency.setValueAtTime(opts.desde, t);
    if (typeof opts.hasta === 'number') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.hasta), t + dur);
    }
    osc.connect(g);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    vocesActivas++;
    osc.onended = function () { vocesActivas--; g.disconnect(); };
  }

  function ruido(dur, vol, corte) {
    if (!ctx || vocesActivas >= MAX_VOCES) { return; }
    var muestras = Math.floor(ctx.sampleRate * dur);
    var buffer = ctx.createBuffer(1, muestras, ctx.sampleRate);
    var datos = buffer.getChannelData(0);
    for (var i = 0; i < muestras; i++) {
      datos[i] = (Math.random() * 2 - 1) * (1 - i / muestras);
    }
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = corte || 1800;
    var g = envolvente(null, vol || 0.25, 0.005, dur);
    src.connect(filtro); filtro.connect(g);
    src.start(ahora());
    vocesActivas++;
    src.onended = function () { vocesActivas--; g.disconnect(); };
  }

  /* Voces sintetizadas. Cambia estos numeros y cambia el caracter del juego. */
  var VOCES = {
    disparo: function () {
      tono({ tipo: 'sawtooth', desde: 900, hasta: 170, dur: 0.13, vol: 0.22 });
      tono({ tipo: 'square', desde: 420, hasta: 120, dur: 0.09, vol: 0.12 });
      ruido(0.06, 0.10, 2400);
    },
    enemigoMuere: function () {
      ruido(0.22, 0.24, 1400);
      tono({ tipo: 'square', desde: 340, hasta: 70, dur: 0.20, vol: 0.16 });
    },
    jugadorGolpe: function () {
      tono({ tipo: 'sawtooth', desde: 260, hasta: 55, dur: 0.42, vol: 0.30 });
      ruido(0.35, 0.24, 900);
    },
    jugadorMuere: function () {
      tono({ tipo: 'square', desde: 300, hasta: 40, dur: 0.9, vol: 0.26 });
      tono({ tipo: 'triangle', desde: 180, hasta: 30, dur: 1.0, vol: 0.20, retraso: 0.08 });
      ruido(0.5, 0.18, 700);
    },
    barrera: function () {
      ruido(0.08, 0.14, 3200);
    },
    descenso: function () {
      tono({ tipo: 'triangle', desde: 150, hasta: 62, dur: 0.22, vol: 0.20 });
    },
    ovniMuere: function () {
      [520, 700, 940, 1240].forEach(function (f, i) {
        tono({ tipo: 'square', desde: f, dur: 0.10, vol: 0.20, retraso: i * 0.06 });
      });
    },
    nivel: function () {
      [392, 523, 659].forEach(function (f, i) {
        tono({ tipo: 'triangle', desde: f, dur: 0.18, vol: 0.24, retraso: i * 0.12 });
      });
    },
    nivelCompleto: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        tono({ tipo: 'square', desde: f, dur: 0.16, vol: 0.20, retraso: i * 0.09 });
      });
    },
    gameOver: function () {
      [392, 349, 294, 196].forEach(function (f, i) {
        tono({ tipo: 'sawtooth', desde: f, hasta: f * 0.92, dur: 0.34, vol: 0.24, retraso: i * 0.26 });
      });
    },
    victoria: function () {
      [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) {
        tono({ tipo: 'triangle', desde: f, dur: 0.20, vol: 0.24, retraso: i * 0.14 });
      });
    },
    menu: function () {
      tono({ tipo: 'square', desde: 880, hasta: 1320, dur: 0.07, vol: 0.16 });
    },
    vidaExtra: function () {
      [784, 1047, 1319].forEach(function (f, i) {
        tono({ tipo: 'triangle', desde: f, dur: 0.14, vol: 0.24, retraso: i * 0.08 });
      });
    }
  };

  /* Los cuatro tonos de la marcha enemiga, como en los arcade clasicos. */
  var NOTAS_MARCHA = [116, 104, 92, 82];

  function reproducirBuffer(nombre) {
    if (!ctx || !buffers[nombre]) { return false; }
    var src = ctx.createBufferSource();
    src.buffer = buffers[nombre];
    src.connect(masterGain);
    src.start(ahora());
    return true;
  }

  function cargarArchivos() {
    if (!CONFIG.AUDIO.USAR_ARCHIVOS || !ctx || typeof global.fetch !== 'function') {
      return Promise.resolve();
    }
    var claves = Object.keys(CONFIG.AUDIO.ARCHIVOS);
    return Promise.all(claves.map(function (clave) {
      var url = CONFIG.AUDIO.RUTA + CONFIG.AUDIO.ARCHIVOS[clave];
      return global.fetch(url).then(function (res) {
        if (!res.ok) { return null; }
        return res.arrayBuffer();
      }).then(function (datos) {
        if (!datos) { return null; }
        return ctx.decodeAudioData(datos);
      }).then(function (buffer) {
        if (buffer) { buffers[clave] = buffer; }
      })['catch'](function () { /* sin archivo: se usa la voz sintetizada */ });
    }));
  }

  var Audio = {
    /* Debe llamarse desde un gesto del usuario (click o tecla): los
       navegadores no dejan sonar antes. */
    desbloquear: function () {
      crearContexto();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume()['catch'](function () { /* ignorado */ });
      }
      if (ctx && !Audio._archivosPedidos) {
        Audio._archivosPedidos = true;
        cargarArchivos();
      }
    },

    reproducir: function (nombre) {
      if (!activo || !soportado) { return; }
      crearContexto();
      if (!ctx) { return; }
      if (reproducirBuffer(nombre)) { return; }
      var voz = VOCES[nombre];
      if (voz) { voz(); }
    },

    marcha: function (paso) {
      if (!activo || !soportado) { return; }
      crearContexto();
      if (!ctx) { return; }
      tono({ tipo: 'square', desde: NOTAS_MARCHA[paso % NOTAS_MARCHA.length], dur: 0.10, vol: 0.20 });
    },

    /* Zumbido continuo del ovni mientras cruza la pantalla. */
    iniciarSirena: function () {
      if (!activo || !soportado || sirena) { return; }
      crearContexto();
      if (!ctx) { return; }
      var osc = ctx.createOscillator();
      var lfo = ctx.createOscillator();
      var lfoGain = ctx.createGain();
      var g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 420;
      lfo.frequency.value = 9;
      lfoGain.gain.value = 90;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      g.gain.value = 0.10;
      osc.connect(g); g.connect(masterGain);
      osc.start(); lfo.start();
      sirena = { osc: osc, lfo: lfo, g: g };
    },
    detenerSirena: function () {
      if (!sirena) { return; }
      try {
        sirena.osc.stop(); sirena.lfo.stop();
        sirena.g.disconnect();
      } catch (e) { /* ya detenido */ }
      sirena = null;
    },

    estaActivo: function () { return activo; },
    alternarActivo: function () {
      activo = !activo;
      Storage.guardarAudioActivo(activo);
      if (!activo) { Audio.detenerSirena(); }
      if (masterGain) { masterGain.gain.value = activo ? volumen : 0; }
      return activo;
    },
    obtenerVolumen: function () { return volumen; },
    ajustarVolumen: function (v) {
      volumen = Util.limitar(Number(v) || 0, 0, 1);
      Storage.guardarVolumen(volumen);
      if (masterGain) { masterGain.gain.value = activo ? volumen : 0; }
    },
    /* Al pausar o perder el foco se corta cualquier sonido sostenido. */
    silenciarSostenidos: function () { Audio.detenerSirena(); }
  };

  global.TRI.Audio = Audio;
})(window);

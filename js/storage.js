/* Persistencia local (record y preferencias de audio).
 * Todo pasa por try/catch: si el navegador bloquea localStorage (modo privado,
 * cookies de terceros, politicas de empresa) el juego sigue funcionando, solo
 * que sin guardar entre sesiones.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var memoria = {};        // respaldo en RAM si no hay localStorage
  var disponible = (function () {
    try {
      var k = '__tri_test__';
      global.localStorage.setItem(k, '1');
      global.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  })();

  function leerCrudo(clave) {
    if (!disponible) { return Object.prototype.hasOwnProperty.call(memoria, clave) ? memoria[clave] : null; }
    try { return global.localStorage.getItem(clave); } catch (e) { return null; }
  }

  function escribirCrudo(clave, valor) {
    memoria[clave] = valor;
    if (!disponible) { return; }
    try { global.localStorage.setItem(clave, valor); } catch (e) { /* cuota llena o bloqueado */ }
  }

  var Storage = {
    hayPersistencia: function () { return disponible; },

    /* NUNCA confiar en lo guardado: puede haberlo editado cualquiera. */
    leerRecord: function () {
      var crudo = leerCrudo(CONFIG.ALMACENAMIENTO.CLAVE_RECORD);
      var n = parseInt(crudo, 10);
      if (!isFinite(n) || isNaN(n) || n < 0) { return 0; }
      return Math.min(n, CONFIG.ALMACENAMIENTO.RECORD_MAX);
    },
    guardarRecord: function (valor) {
      var n = Math.floor(Number(valor));
      if (!isFinite(n) || n < 0) { return; }
      escribirCrudo(CONFIG.ALMACENAMIENTO.CLAVE_RECORD, String(Math.min(n, CONFIG.ALMACENAMIENTO.RECORD_MAX)));
    },

    leerAudioActivo: function () {
      var crudo = leerCrudo(CONFIG.ALMACENAMIENTO.CLAVE_AUDIO);
      if (crudo === '0') { return false; }
      return true;   // por defecto con sonido
    },
    guardarAudioActivo: function (activo) {
      escribirCrudo(CONFIG.ALMACENAMIENTO.CLAVE_AUDIO, activo ? '1' : '0');
    },

    leerVolumen: function () {
      var v = parseFloat(leerCrudo(CONFIG.ALMACENAMIENTO.CLAVE_VOLUMEN));
      if (!isFinite(v) || isNaN(v) || v < 0 || v > 1) { return CONFIG.AUDIO.VOLUMEN_INICIAL; }
      return v;
    },
    guardarVolumen: function (v) {
      var n = Number(v);
      if (!isFinite(n) || n < 0 || n > 1) { return; }
      escribirCrudo(CONFIG.ALMACENAMIENTO.CLAVE_VOLUMEN, String(n));
    }
  };

  global.TRI.Storage = Storage;
})(window);

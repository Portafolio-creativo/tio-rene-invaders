/* Sistema de niveles.
 * La curva de dificultad esta en CONFIG.nivelParams(): aqui solo se lleva la
 * cuenta del nivel y se decide cuando toca la pantalla de victoria.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;

  function SistemaNiveles() {
    this.reiniciar();
  }

  SistemaNiveles.prototype.reiniciar = function () {
    this.nivel = 1;
    this.modoInfinito = false;   // se activa al elegir "seguir" tras la victoria
  };

  SistemaNiveles.prototype.params = function () {
    return CONFIG.nivelParams(this.nivel);
  };

  /* Tras limpiar la formacion: true si toca pantalla de VICTORIA. */
  SistemaNiveles.prototype.esFinalDelJuego = function () {
    return !this.modoInfinito && this.nivel >= CONFIG.NIVELES.TOTAL;
  };

  SistemaNiveles.prototype.avanzar = function () {
    this.nivel++;
    return this.nivel;
  };

  SistemaNiveles.prototype.activarInfinito = function () {
    this.modoInfinito = true;
  };

  SistemaNiveles.prototype.etiqueta = function () {
    if (this.modoInfinito) { return 'NIVEL ' + this.nivel + ' (SIN FIN)'; }
    return 'NIVEL ' + this.nivel + ' / ' + CONFIG.NIVELES.TOTAL;
  };

  global.TRI = global.TRI || {};
  global.TRI.SistemaNiveles = SistemaNiveles;
})(window);

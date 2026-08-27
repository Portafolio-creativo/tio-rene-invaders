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

  /* Cada N niveles toca jefe en vez de formacion. */
  SistemaNiveles.prototype.esNivelDeJefe = function () {
    return this.nivel % CONFIG.JEFES.CADA === 0;
  };

  /* Nombre del jefe de este nivel, para el cartel. */
  SistemaNiveles.prototype.nombreDelJefe = function () {
    var lista = CONFIG.JEFES.LISTA;
    return lista[Math.floor((this.nivel - 1) / CONFIG.JEFES.CADA) % lista.length].nombre;
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
    if (this.esNivelDeJefe()) { return 'JEFE: ' + this.nombreDelJefe(); }
    if (this.modoInfinito) { return 'NIVEL ' + this.nivel + ' (SIN FIN)'; }
    return 'NIVEL ' + this.nivel + ' / ' + CONFIG.NIVELES.TOTAL;
  };

  global.TRI = global.TRI || {};
  global.TRI.SistemaNiveles = SistemaNiveles;
})(window);

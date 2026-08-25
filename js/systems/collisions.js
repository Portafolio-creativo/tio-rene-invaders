/* Sistema de colisiones.
 *
 * Todo es AABB (rectangulo contra rectangulo) porque basta y sobra para un
 * arcade de este tipo. Se evita trabajo inutil: los proyectiles muertos se
 * saltan, y contra los enemigos se descarta primero por la caja de la fila.
 */
(function (global) {
  'use strict';

  var Util = global.TRI.Util;
  var CONFIG = global.TRI.CONFIG;

  function cajaProyectil(p) {
    return { x: p.x, y: p.y, w: p.w, h: p.h };
  }

  var Colisiones = {
    /* Disparos del jugador contra la formacion. cb(enemigo, proyectil) */
    jugadorContraEnemigos: function (proyectiles, gestorEnemigos, cb) {
      var lista = proyectiles.lista;
      for (var i = 0; i < lista.length; i++) {
        var p = lista[i];
        if (!p.vivo || !p.deJugador) { continue; }
        var caja = cajaProyectil(p);
        var enemigos = gestorEnemigos.enemigos;
        for (var j = 0; j < enemigos.length; j++) {
          var e = enemigos[j];
          if (!e.vivo) { continue; }
          if (caja.y > e.y + e.h || caja.y + caja.h < e.y) { continue; }
          if (Util.solapan(caja, e)) {
            p.vivo = false;
            cb(e, p);
            break;
          }
        }
      }
    },

    /* Disparos enemigos contra el Tio Rene. cb(proyectil) */
    enemigosContraJugador: function (proyectiles, jugador, cb) {
      if (!jugador.esVulnerable()) { return; }
      var caja = jugador.hitbox();
      var lista = proyectiles.lista;
      for (var i = 0; i < lista.length; i++) {
        var p = lista[i];
        if (!p.vivo || p.deJugador) { continue; }
        if (Util.solapan(cajaProyectil(p), caja)) {
          p.vivo = false;
          cb(p);
          return;
        }
      }
    },

    /* Cualquier proyectil contra las barreras. cb(barrera, proyectil, x, y) */
    proyectilesContraBarreras: function (proyectiles, barreras, cb) {
      var lista = proyectiles.lista;
      for (var i = 0; i < lista.length; i++) {
        var p = lista[i];
        if (!p.vivo) { continue; }
        var caja = cajaProyectil(p);
        for (var b = 0; b < barreras.length; b++) {
          var barrera = barreras[b];
          if (barrera.vivas <= 0) { continue; }
          if (!Util.solapan(caja, barrera.hitbox())) { continue; }
          // Punta del proyectil segun su sentido de avance
          var px = p.x + p.w / 2;
          var py = p.vy < 0 ? p.y : p.y + p.h;
          if (barrera.celdaEn(px, py)) {
            p.vivo = false;
            cb(barrera, p, px, py);
            break;
          }
        }
      }
    },

    /* Los invasores arrasan las barreras que alcanzan. cb(barrera, celdas) */
    enemigosContraBarreras: function (gestorEnemigos, barreras, cb) {
      var limite = gestorEnemigos.filaMasBaja();
      if (limite <= 0) { return; }
      for (var b = 0; b < barreras.length; b++) {
        var barrera = barreras[b];
        if (barrera.vivas <= 0) { continue; }
        if (limite <= barrera.y) { continue; }
        var rotas = barrera.arrasarHasta(limite);
        if (rotas > 0) { cb(barrera, rotas); }
      }
    },

    /* Disparo del jugador contra el ovni. cb(ovni, proyectil) */
    jugadorContraOvni: function (proyectiles, ovni, cb) {
      if (!ovni.activo) { return; }
      var caja = ovni.hitbox();
      var lista = proyectiles.lista;
      for (var i = 0; i < lista.length; i++) {
        var p = lista[i];
        if (!p.vivo || !p.deJugador) { continue; }
        if (Util.solapan(cajaProyectil(p), caja)) {
          p.vivo = false;
          cb(ovni, p);
          return;
        }
      }
    },

    /* Un disparo del jugador puede anular uno enemigo. cb(x, y) */
    proyectilContraProyectil: function (proyectiles, cb) {
      var lista = proyectiles.lista;
      for (var i = 0; i < lista.length; i++) {
        var a = lista[i];
        if (!a.vivo || !a.deJugador) { continue; }
        for (var j = 0; j < lista.length; j++) {
          var b = lista[j];
          if (!b.vivo || b.deJugador) { continue; }
          if (Util.solapan(cajaProyectil(a), cajaProyectil(b))) {
            a.vivo = false;
            b.vivo = false;
            cb(a.x + a.w / 2, a.y);
            break;
          }
        }
      }
    },

    /* Un enemigo que llega abajo del todo mata al jugador por contacto. */
    enemigoContraJugador: function (gestorEnemigos, jugador) {
      if (!jugador.esVulnerable()) { return false; }
      var caja = jugador.hitbox();
      var enemigos = gestorEnemigos.enemigos;
      for (var i = 0; i < enemigos.length; i++) {
        var e = enemigos[i];
        if (!e.vivo) { continue; }
        if (e.y + e.h < caja.y) { continue; }
        if (Util.solapan(caja, e)) { return true; }
      }
      return false;
    },

    /* El jugador nunca sale del area de juego. */
    limitarJugador: function (jugador) {
      var mitad = CONFIG.JUGADOR.ANCHO / 2;
      var min = CONFIG.JUGADOR.MARGEN_LATERAL + mitad;
      var max = CONFIG.ANCHO - CONFIG.JUGADOR.MARGEN_LATERAL - mitad;
      jugador.x = Util.limitar(jugador.x, min, max);
    }
  };

  global.TRI = global.TRI || {};
  global.TRI.Colisiones = Colisiones;
})(window);

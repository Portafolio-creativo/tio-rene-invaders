/* La formacion invasora.
 *
 * Se mueve como en los arcade clasicos: a pasos discretos, no de forma
 * continua. Cada paso desplaza toda la formacion; al tocar un borde, baja y
 * cambia de sentido. Cuantos menos enemigos quedan, mas rapido es el paso.
 */
(function (global) {
  'use strict';

  var CONFIG = global.TRI.CONFIG;
  var Util = global.TRI.Util;
  var E = CONFIG.ENEMIGOS;

  function GestorEnemigos() {
    this.enemigos = [];
    this.total = 0;
    this.vivos = 0;
    this.direccion = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.temporizadorPaso = 0;
    this.indicePaso = 0;
    this.temporizadorDisparo = 0;
    this.params = CONFIG.nivelParams(1);
  }

  /* Deja la formacion vacia: los niveles de jefe no llevan naves. */
  GestorEnemigos.prototype.vaciar = function (nivel) {
    this.params = CONFIG.nivelParams(nivel || 1);
    this.enemigos.length = 0;
    this.total = 0;
    this.vivos = 0;
  };

  /* Que celdas de la rejilla llevan nave, segun la forma del nivel. Asi la
     silueta del enjambre cambia de nivel en nivel y no es siempre un bloque.
     Devuelve true si en (fila f, columna c) hay nave. */
  function enForma(forma, f, c, filas, columnas) {
    var cf = (filas - 1) / 2, cc = (columnas - 1) / 2;
    if (forma === 'rombo') {
      var dist = Math.abs(f - cf) / (cf || 1) + Math.abs(c - cc) / (cc || 1);
      return dist <= 1.05;
    }
    if (forma === 'flancos') {              // dos alas, hueco al medio
      return Math.abs(c - cc) >= columnas * 0.22;
    }
    if (forma === 'aspa') {                 // una X
      var t1 = c / (columnas - 1), t2 = f / (filas - 1);
      return Math.abs(t1 - t2) < 0.22 || Math.abs(t1 - (1 - t2)) < 0.22;
    }
    if (forma === 'panal') {                // celosia: huecos alternados
      return (f + c) % 2 === 0;
    }
    return true;                            // bloque
  }

  GestorEnemigos.prototype.preparar = function (nivel) {
    this.params = CONFIG.nivelParams(nivel);
    this.enemigos.length = 0;
    var filas = this.params.filas, columnas = this.params.columnas;
    var anchoFormacion = (columnas - 1) * E.SEPARACION_X + E.ANCHO;
    this.offsetX = Math.round((CONFIG.ANCHO - anchoFormacion) / 2);
    this.offsetY = this.params.yInicial;
    this.direccion = 1;
    this.temporizadorPaso = 0;
    this.indicePaso = 0;
    this.temporizadorDisparo = this.params.intervaloDisparo * 0.6;
    this.temporizadorPicada = CONFIG.ENEMIGOS.PICADA_CADA_BASE;
    this.temporizadorKamikaze = CONFIG.ENEMIGOS.KAMIKAZE_CADA_BASE;
    this.hayKamikaze = false;
    this.nivelActual = nivel;

    var forma = CONFIG.FORMAS[(nivel - 1) % CONFIG.FORMAS.length];
    this.comp = CONFIG.COMPORTAMIENTOS[(nivel - 1) % CONFIG.COMPORTAMIENTOS.length];
    this.vaivenT = 0;
    this.balanceoY = 0;
    for (var f = 0; f < filas; f++) {
      var tipo = E.TIPOS[Math.min(f, E.TIPOS.length - 1)];
      for (var c = 0; c < columnas; c++) {
        if (!enForma(forma, f, c, filas, columnas)) { continue; }
        this.enemigos.push({
          fila: f, columna: c,
          sprite: tipo.sprite,
          puntos: tipo.puntos,
          vida: tipo.resistencia,
          vivo: true,
          estado: 'formacion',   // formacion | picando
          w: E.ANCHO, h: E.ALTO,
          x: 0, y: 0
        });
      }
    }
    this.total = this.enemigos.length;
    this.vivos = this.total;
    this.recolocar();
  };

  /* Mueve a los que estan atacando y, cada cierto tiempo, manda a uno nuevo.
     Los disparos que sueltan al caer se juntan en evento.picadas. */
  GestorEnemigos.prototype.actualizarPicadas = function (dt, objetivoX, evento) {
    var E = CONFIG.ENEMIGOS;
    var destino = (typeof objetivoX === 'number') ? objetivoX : CONFIG.ANCHO / 2;

    this.hayKamikaze = false;
    for (var i = 0; i < this.enemigos.length; i++) {
      var e = this.enemigos[i];
      // Kamikaze: cae rapido, va DIRECTO al jugador (persigue fuerte, sin
      // zigzag) y cuenta como tal para el zumbido.
      if (e.vivo && e.estado === 'kamikaze') {
        this.hayKamikaze = true;
        var haciaK = destino - (e.x + e.w / 2);
        e.x += Math.sign(haciaK) * Math.min(Math.abs(haciaK), E.KAMIKAZE_PERSECUCION * 60 * dt);
        e.y += E.KAMIKAZE_VELOCIDAD * dt;
        e.x = Util.limitar(e.x, 0, CONFIG.ANCHO - e.w);
        e.disparoPicadaT -= dt;
        if (e.disparoPicadaT <= 0) { e.disparoPicadaT = Util.azar(0.4, 0.8); evento.picadas.push({ x: e.x + e.w / 2, y: e.y + e.h }); }
        if (e.y > CONFIG.ALTO) {
          e.estado = 'formacion';
          e.x = this.offsetX + e.columna * E.SEPARACION_X;
          e.y = this.offsetY + e.fila * E.SEPARACION_Y;
        }
        continue;
      }
      if (!e.vivo || e.estado !== 'picando') { continue; }
      e.picadaT += dt;
      // Cae persiguiendo al jugador, con un zigzag para que no sea un misil.
      var hacia = destino - (e.x + e.w / 2);
      e.x += Math.sign(hacia) * Math.min(Math.abs(hacia), E.PICADA_PERSECUCION * 60 * dt)
             + Math.sin(e.picadaT * 6) * E.PICADA_BAMBOLEO * dt;
      e.y += E.PICADA_VELOCIDAD * dt;
      e.x = Util.limitar(e.x, 0, CONFIG.ANCHO - e.w);
      // Dispara al caer, de vez en cuando.
      e.disparoPicadaT -= dt;
      if (e.disparoPicadaT <= 0) {
        e.disparoPicadaT = Util.azar(0.5, 1.1);
        if (Math.random() < E.PICADA_DISPARA) {
          evento.picadas.push({ x: e.x + e.w / 2, y: e.y + e.h });
        }
      }
      // Si sale por abajo, vuelve a su sitio en la formacion.
      if (e.y > CONFIG.ALTO) {
        e.estado = 'formacion';
        e.x = this.offsetX + e.columna * E.SEPARACION_X;
        e.y = this.offsetY + e.fila * E.SEPARACION_Y;
      }
    }

    // Lanzar una nueva picada si toca (desde cierto nivel).
    if (this.nivelActual < E.PICADA_DESDE_NIVEL) { return; }
    this.temporizadorPicada -= dt;
    if (this.temporizadorPicada <= 0) {
      var cada = Math.max(E.PICADA_CADA_MIN,
        E.PICADA_CADA_BASE - (this.nivelActual - E.PICADA_DESDE_NIVEL) * 0.5);
      this.temporizadorPicada = cada * Util.azar(0.7, 1.3);
      this.lanzarPicada();
    }

    // Kamikaze, mas espaciada y desde un nivel mas alto.
    if (this.nivelActual < E.KAMIKAZE_DESDE_NIVEL) { return; }
    this.temporizadorKamikaze -= dt;
    if (this.temporizadorKamikaze <= 0) {
      var cadaK = Math.max(E.KAMIKAZE_CADA_MIN,
        E.KAMIKAZE_CADA_BASE - (this.nivelActual - E.KAMIKAZE_DESDE_NIVEL) * 0.7);
      this.temporizadorKamikaze = cadaK * Util.azar(0.8, 1.2);
      this.lanzarKamikaze();
    }
  };

  /* Manda una kamikaze: un enemigo cualquiera se sale y va directo al jugador. */
  GestorEnemigos.prototype.lanzarKamikaze = function () {
    var candidatos = [];
    for (var i = 0; i < this.enemigos.length; i++) {
      var e = this.enemigos[i];
      if (e.vivo && e.estado === 'formacion') { candidatos.push(e); }
    }
    if (!candidatos.length) { return; }
    var el = Util.elegir(candidatos);
    el.estado = 'kamikaze';
    el.picadaT = 0;
    el.disparoPicadaT = Util.azar(0.3, 0.6);
  };

  /* Saca de la formacion a un enemigo (de los de abajo, que estan mas sueltos)
     y lo manda en picada. */
  GestorEnemigos.prototype.lanzarPicada = function () {
    var candidatos = [];
    for (var i = 0; i < this.enemigos.length; i++) {
      var e = this.enemigos[i];
      if (e.vivo && e.estado === 'formacion') { candidatos.push(e); }
    }
    if (!candidatos.length) { return; }
    // Preferir los de la fila mas baja (los de arriba dejarian un hueco raro).
    var filaMax = candidatos.reduce(function (m, e) { return Math.max(m, e.fila); }, 0);
    var abajo = candidatos.filter(function (e) { return e.fila >= filaMax - 1; });
    var el = Util.elegir(abajo.length ? abajo : candidatos);
    el.estado = 'picando';
    el.picadaT = 0;
    el.disparoPicadaT = Util.azar(0.2, 0.6);
  };

  GestorEnemigos.prototype.recolocar = function () {
    for (var i = 0; i < this.enemigos.length; i++) {
      var e = this.enemigos[i];
      if (e.estado === 'picando' || e.estado === 'kamikaze') { continue; }   // los que atacan van por libre
      e.x = this.offsetX + e.columna * E.SEPARACION_X;
      e.y = this.offsetY + e.fila * E.SEPARACION_Y + this.balanceoY;
    }
  };

  GestorEnemigos.prototype.limites = function (offsetX) {
    var ox = (typeof offsetX === 'number') ? offsetX : this.offsetX;
    var min = Infinity, max = -Infinity;
    for (var i = 0; i < this.enemigos.length; i++) {
      var e = this.enemigos[i];
      if (!e.vivo) { continue; }
      var x = ox + e.columna * E.SEPARACION_X;
      if (x < min) { min = x; }
      if (x + e.w > max) { max = x + e.w; }
    }
    return { min: min, max: max };
  };

  GestorEnemigos.prototype.intervaloPaso = function () {
    if (this.total === 0) { return this.params.intervaloPaso; }
    var proporcion = Math.max(this.vivos, 1) / this.total;
    var factor = Math.pow(proporcion, E.FACTOR_ACELERACION);
    return Math.max(E.INTERVALO_PASO_MIN, this.params.intervaloPaso * factor * this.comp.pasoMult);
  };

  /* Devuelve un evento describiendo lo que paso en este ciclo. */
  GestorEnemigos.prototype.actualizar = function (dt, objetivoX) {
    var evento = { paso: false, descendio: false, indice: this.indicePaso, disparo: null, picadas: [] };
    if (this.vivos === 0) { return evento; }

    this.actualizarPicadas(dt, objetivoX, evento);

    // Vaiven vertical del enjambre (segun el comportamiento del nivel).
    if (this.comp.vaivenY > 0) {
      this.vaivenT += dt;
      this.balanceoY = Math.sin(this.vaivenT * this.comp.vaivenVel) * this.comp.vaivenY;
      this.recolocar();
    }

    this.temporizadorPaso += dt;
    if (this.temporizadorPaso >= this.intervaloPaso()) {
      this.temporizadorPaso = 0;
      evento.paso = true;
      var siguiente = this.offsetX + this.direccion * E.PASO_X;
      var lim = this.limites(siguiente);
      if (lim.min < E.MARGEN_LATERAL || lim.max > CONFIG.ANCHO - E.MARGEN_LATERAL) {
        this.direccion *= -1;
        this.offsetY += this.params.descenso * this.comp.descensoMult;
        evento.descendio = true;
      } else {
        this.offsetX = siguiente;
      }
      this.indicePaso++;
      evento.indice = this.indicePaso;
      this.recolocar();
    }

    this.temporizadorDisparo -= dt;
    if (this.temporizadorDisparo <= 0) {
      this.temporizadorDisparo = this.params.intervaloDisparo * Util.azar(0.65, 1.35);
      evento.disparo = this.elegirTirador();
    }
    return evento;
  };

  /* Dispara el enemigo de mas abajo de una columna elegida al azar. */
  GestorEnemigos.prototype.elegirTirador = function () {
    var porColumna = {};
    for (var i = 0; i < this.enemigos.length; i++) {
      var e = this.enemigos[i];
      if (!e.vivo) { continue; }
      var actual = porColumna[e.columna];
      if (!actual || e.fila > actual.fila) { porColumna[e.columna] = e; }
    }
    var candidatos = Object.keys(porColumna).map(function (k) { return porColumna[k]; });
    if (candidatos.length === 0) { return null; }
    return Util.elegir(candidatos);
  };

  GestorEnemigos.prototype.matar = function (enemigo) {
    if (!enemigo.vivo) { return false; }
    enemigo.vida -= 1;
    if (enemigo.vida > 0) { return false; }
    enemigo.vivo = false;
    this.vivos--;
    return true;
  };

  GestorEnemigos.prototype.vivosLista = function () {
    var r = [];
    for (var i = 0; i < this.enemigos.length; i++) {
      if (this.enemigos[i].vivo) { r.push(this.enemigos[i]); }
    }
    return r;
  };

  GestorEnemigos.prototype.filaMasBaja = function () {
    var max = 0;
    for (var i = 0; i < this.enemigos.length; i++) {
      var e = this.enemigos[i];
      if (e.vivo && e.estado !== 'picando' && e.estado !== 'kamikaze' && e.y + e.h > max) { max = e.y + e.h; }
    }
    return max;
  };

  GestorEnemigos.prototype.hanInvadido = function () {
    return this.vivos > 0 && this.filaMasBaja() >= E.LINEA_INVASION;
  };

  GestorEnemigos.prototype.frameAlterno = function () {
    return this.indicePaso % 2 === 1;
  };

  global.TRI = global.TRI || {};
  global.TRI.GestorEnemigos = GestorEnemigos;
})(window);

/* Revisor de las frases de fondo.
 *
 * Suena una a la vez, deja marcar las que estan mal cortadas y guarda las
 * marcas en el propio navegador para poder revisar en varias tandas. Sin
 * innerHTML y sin dependencias, igual que el juego.
 */
(function (global) {
  'use strict';

  var LLAVE = 'tri-frases-malas';
  var RUTA = '../assets/audio/';

  var lista = document.getElementById('lista');
  var salida = document.getElementById('marcadas');
  var contador = document.getElementById('contador');
  var btnTodas = document.getElementById('btn-todas');
  var btnParar = document.getElementById('btn-parar');
  var btnCopiar = document.getElementById('btn-copiar');
  var btnLimpiar = document.getElementById('btn-limpiar');

  var sonando = null;      // el <audio> en curso
  var filaActiva = null;
  var enCadena = false;    // "oir todas"
  var malas = leerMarcas();

  /* Lo guardado puede venir manipulado o de una version vieja: se valida
     antes de usarlo, para no acabar con basura en la lista. */
  function leerMarcas() {
    try {
      var crudo = global.localStorage.getItem(LLAVE);
      if (!crudo) { return []; }
      var v = JSON.parse(crudo);
      if (!Array.isArray(v)) { return []; }
      return v.filter(function (n) {
        return typeof n === 'number' && n >= 1 && n <= FRASES.length;
      });
    } catch (e) {
      return [];        // sin permiso para guardar, o dato corrupto
    }
  }

  function guardarMarcas() {
    try {
      global.localStorage.setItem(LLAVE, JSON.stringify(malas));
    } catch (e) { /* en ventana privada no se puede: no es grave */ }
  }

  function parar() {
    if (sonando) {
      sonando.pause();
      sonando = null;
    }
    if (filaActiva) {
      filaActiva.classList.remove('sonando');
      filaActiva = null;
    }
    enCadena = false;
    btnParar.disabled = true;
    contador.textContent = '';
  }

  function reproducir(n, seguir) {
    parar();
    enCadena = !!seguir;
    var fila = document.getElementById('fila-' + n);
    var audio = new Audio(RUTA + 'amb-' + (n < 10 ? '0' + n : n) + '.mp3');
    sonando = audio;
    filaActiva = fila;
    if (fila) { fila.classList.add('sonando'); }
    btnParar.disabled = false;
    contador.textContent = 'sonando ' + n + ' de ' + FRASES.length;
    if (fila && fila.scrollIntoView) {
      fila.scrollIntoView({ block: 'nearest' });
    }
    audio.onended = function () {
      var seguirCon = enCadena && n < FRASES.length ? n + 1 : 0;
      parar();
      if (seguirCon) { reproducir(seguirCon, true); }
    };
    audio.onerror = function () {
      contador.textContent = 'no se pudo cargar amb-' + n;
      parar();
    };
    audio.play()['catch'](function () {
      contador.textContent = 'el navegador no dejó sonar; toca otra vez';
      parar();
    });
  }

  function alternarMarca(n, fila) {
    var i = malas.indexOf(n);
    if (i >= 0) { malas.splice(i, 1); } else { malas.push(n); }
    fila.classList.toggle('mala', i < 0);
    guardarMarcas();
    pintarMarcadas();
  }

  function pintarMarcadas() {
    var ordenadas = malas.slice().sort(function (a, b) { return a - b; });
    salida.textContent = ordenadas.length
      ? ordenadas.join(', ')
      : 'Ninguna todavía.';
    btnCopiar.disabled = ordenadas.length === 0;
  }

  function crearFila(dato) {
    var n = dato[0], origen = dato[1], dur = dato[2];

    var li = document.createElement('li');
    li.className = 'fila';
    li.id = 'fila-' + n;
    if (malas.indexOf(n) >= 0) { li.classList.add('mala'); }

    var num = document.createElement('span');
    num.className = 'num';
    num.textContent = n;

    var oir = document.createElement('button');
    oir.type = 'button';
    oir.className = 'oir';
    oir.setAttribute('aria-label', 'Oír la frase ' + n);
    var titulo = document.createElement('span');
    titulo.textContent = '▶ Frase ' + n;
    var sub = document.createElement('span');
    sub.className = 'origen';
    sub.textContent = 'de ' + origen;
    oir.appendChild(titulo);
    oir.appendChild(sub);
    oir.addEventListener('click', function () { reproducir(n, false); });

    var d = document.createElement('span');
    d.className = 'dur';
    d.textContent = dur.toFixed(2) + ' s';

    var marcar = document.createElement('button');
    marcar.type = 'button';
    marcar.className = 'marcar';
    marcar.textContent = '✕';
    marcar.setAttribute('aria-label', 'Marcar la frase ' + n + ' como mal cortada');
    marcar.addEventListener('click', function () { alternarMarca(n, li); });

    li.appendChild(num);
    li.appendChild(oir);
    li.appendChild(d);
    li.appendChild(marcar);
    return li;
  }

  FRASES.forEach(function (dato) { lista.appendChild(crearFila(dato)); });
  pintarMarcadas();

  btnTodas.addEventListener('click', function () { reproducir(1, true); });
  btnParar.addEventListener('click', parar);

  btnLimpiar.addEventListener('click', function () {
    malas = [];
    guardarMarcas();
    Array.prototype.forEach.call(lista.querySelectorAll('.mala'), function (el) {
      el.classList.remove('mala');
    });
    pintarMarcadas();
  });

  btnCopiar.addEventListener('click', function () {
    var texto = 'Frases mal cortadas: '
      + malas.slice().sort(function (a, b) { return a - b; }).join(', ');
    function avisar(ok) {
      btnCopiar.textContent = ok ? '¡Copiado!' : 'Selecciónala y cópiala';
      global.setTimeout(function () { btnCopiar.textContent = 'Copiar la lista'; }, 1800);
    }
    if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
      global.navigator.clipboard.writeText(texto).then(function () { avisar(true); },
                                                       function () { avisar(false); });
    } else {
      avisar(false);
    }
  });
})(window);

/* TIO RENE INVADERS - Configuracion central
 * Todos los numeros que definen la dificultad y el aspecto viven AQUI.
 * Si quieres que el juego sea mas facil o mas dificil, toca solo este archivo.
 */
(function (global) {
  'use strict';

  var CONFIG = {
    /* ---- Lienzo logico. Todo el juego se dibuja en estas coordenadas y luego
       se escala al tamano real de la pantalla, asi nada se deforma. ---- */
    ANCHO: 600,
    ALTO: 800,

    /* Franja superior reservada para el marcador */
    HUD_ALTO: 52,

    /* Modo depuracion: cajas de colision, FPS, contadores.
       false para produccion. En el juego se alterna con Ctrl+Shift+D. */
    DEBUG: false,

    ASSETS: {
      RUTA_SPRITES: 'assets/sprites/',
      RUTA_UI: 'assets/ui/',
      /* Extensiones por defecto, en orden de preferencia. Cada sprite puede
         llevar la suya (ver assets.js): las piezas del Tio Rene son .png
         porque salen de una foto, y el resto son .svg. */
      EXTENSIONES: ['svg']
    },

    JUGADOR: {
      ANCHO: 88,          // ancho de la cabeza dibujada
      ALTO_TOTAL: 115,    // cabeza + mandibula + cuerpo
      VELOCIDAD: 300,     // px logicos por segundo
      MARGEN_LATERAL: 14,
      VIDAS_INICIALES: 3,
      INVULNERABILIDAD: 2.0,   // segundos tras recibir un impacto
      ESPERA_MUERTE: 1.6,      // segundos de animacion antes de reaparecer
      CADENCIA_DISPARO: 0.30,  // segundos entre disparos
      MAX_PROYECTILES: 2,      // proyectiles propios simultaneos
      /* Caja de colision (mas pequena que el dibujo: se siente mas justo) */
      HITBOX: { dx: -30, dy: 10, w: 60, h: 86 },
      /* Con la foto hay UNA sola cabeza y el dano se tine en tiempo real.
         Ponlo en true si prefieres cuatro imagenes de cara distintas
         (player-head-shoot / -hit / -dead). */
      EXPRESIONES_SEPARADAS: false,
      /* Animacion de la MANDIBULA (pieza independiente) */
      MANDIBULA: {
        APERTURA_MAX: 20,   // px que baja la mandibula al abrirse del todo
        T_ABRIR: 0.05,      // segundos en abrirse
        T_SOSTEN: 0.05,     // segundos abierta
        T_CERRAR: 0.16,     // segundos en cerrarse
        MASCULLEO: 3.5,     // px de vaiven al caminar (gesto comico)
        APERTURA_DANO: 1.0  // mandibula desencajada al recibir dano
      }
    },

    PROYECTIL_JUGADOR: { ANCHO: 12, ALTO: 22, VELOCIDAD: 620 },
    PROYECTIL_ENEMIGO: { ANCHO: 12, ALTO: 22, VELOCIDAD_BASE: 240 },

    ENEMIGOS: {
      FILAS: 5,
      COLUMNAS: 9,
      ANCHO: 36,
      ALTO: 30,
      SEPARACION_X: 46,
      SEPARACION_Y: 38,
      Y_INICIAL: 104,          // altura de la primera fila en el nivel 1
      Y_INICIAL_POR_NIVEL: 14, // cuanto mas abajo empieza cada nivel
      Y_INICIAL_MAX_NIVELES: 4,
      PASO_X: 8,               // px que avanza la formacion en cada paso
      MARGEN_LATERAL: 16,
      /* Ritmo de la marcha: intervalo entre pasos, en segundos.
         Se acelera al morir enemigos (como en los arcade clasicos). */
      INTERVALO_PASO_BASE: 0.62,
      INTERVALO_PASO_MIN: 0.055,
      FACTOR_ACELERACION: 0.92, // exponente sobre (vivos / total)
      DESCENSO_BASE: 14,        // px que baja al tocar un borde
      DESCENSO_MAX: 26,
      /* Fila -> tipo de enemigo y puntos */
      TIPOS: [
        { sprite: 'enemy-03', puntos: 30, resistencia: 1 },
        { sprite: 'enemy-02', puntos: 20, resistencia: 1 },
        { sprite: 'enemy-02', puntos: 20, resistencia: 1 },
        { sprite: 'enemy-01', puntos: 10, resistencia: 1 },
        { sprite: 'enemy-01', puntos: 10, resistencia: 1 }
      ],
      /* Disparo enemigo */
      INTERVALO_DISPARO_BASE: 1.55,
      INTERVALO_DISPARO_MIN: 0.40,
      MAX_PROYECTILES_BASE: 2,
      MAX_PROYECTILES_TOPE: 5,
      /* Si un enemigo baja de esta linea, la invasion gana */
      LINEA_INVASION: 658
    },

    OVNI: {
      ANCHO: 64,
      ALTO: 28,
      Y: 68,
      VELOCIDAD: 115,
      ESPERA_MIN: 14,   // segundos entre apariciones
      ESPERA_MAX: 26,
      PUNTOS: [50, 100, 150, 200, 300]
    },

    BARRERAS: {
      CANTIDAD: 4,
      COLUMNAS: 12,
      FILAS: 8,
      CELDA: 6,
      Y: 606,
      RADIO_IMPACTO: 1,      // celdas destruidas alrededor del impacto
      RADIO_IMPACTO_ENEMIGO: 2
    },

    PUNTUACION: {
      VIDA_EXTRA_CADA: 5000,
      MAX_VIDAS: 6
    },

    NIVELES: {
      TOTAL: 5,                 // al superar este nivel: VICTORIA
      ESPERA_ENTRE_NIVELES: 2.4 // segundos del cartel "NIVEL N"
    },

    AUDIO: {
      VOLUMEN_INICIAL: 0.7,
      /* Voces del Tio Rene. Ponlo en false y todo vuelve a sonar
         sintetizado (Web Audio API), sin depender de ningun archivo.
         OJO: con file:// el navegador bloquea la carga de archivos, asi
         que abriendo con doble clic se oye la version sintetizada. Para
         escuchar las voces hace falta un servidor (ver README §1). */
      USAR_ARCHIVOS: true,
      RUTA: 'assets/audio/',
      /* Solo se listan los archivos que EXISTEN: cada linea se pide al
         servidor, asi que apuntar a uno que falta ensucia la consola.
         Para anadir un sonido: dejalo en assets/audio/ y agrega su linea.
         Lo que no este aqui suena sintetizado (js/audio.js), y eso es
         deliberado en los sonidos muy repetitivos: el disparo suena cada
         0,3 s y la marcha cada 0,5 s, asi que una voz ahi cansa enseguida. */
      ARCHIVOS: {
        intro: 'tio-rene-intro.mp3',          // al cargar el juego
        jugadorGolpe: 'tio-rene-hit.mp3',     // le pegan
        jugadorMuere: 'tio-rene-death.mp3',   // ultima vida
        gameOver: 'game-over.mp3',
        victoria: 'victory.mp3',
        nivel: 'level-start.mp3',
        nivelCompleto: 'level-complete.mp3',
        vidaExtra: 'extra-life.mp3',
        /* Al derribar la nave grande: la frase "te paso por" partida en dos,
           que se van alternando (primer ovni la primera mitad, segundo la
           segunda). */
        ovniMuere1: 'ufo-hit-1.mp3',
        ovniMuere2: 'ufo-hit-2.mp3',
        /* Frases de AMBIENTE: suenan solas cada cierto rato mientras juegas,
           bajito, para que el Tio Rene nunca se calle del todo. */
        ambiente1: 'tio-rene-amb-1.mp3',
        ambiente2: 'tio-rene-amb-2.mp3',
        ambiente3: 'tio-rene-amb-3.mp3',
        ambiente4: 'tio-rene-amb-4.mp3',
        ambiente5: 'tio-rene-amb-5.mp3',
        ambiente6: 'tio-rene-amb-6.mp3',
        /* Frases de RACHA: cada 5 naves derribadas. */
        racha1: 'tio-rene-racha-1.mp3',
        racha2: 'tio-rene-racha-2.mp3',
        racha3: 'tio-rene-racha-3.mp3'
        /* Sintetizados a proposito (muy repetitivos):
           disparo, marcha1..4, enemigoMuere, barrera, descenso, menu, ovni */
      },

      /* Charla de fondo durante la partida. */
      AMBIENTE: {
        ACTIVO: true,
        VOLUMEN: 0.34,     // proporcion del volumen general (0 a 1)
        ESPERA_MIN: 11,    // segundos entre frase y frase
        ESPERA_MAX: 24,
        PRIMERA_ESPERA: 6, // cuanto tarda la primera al empezar el nivel
        CLIPS: ['ambiente1', 'ambiente2', 'ambiente3', 'ambiente4', 'ambiente5', 'ambiente6']
      },

      /* Frases al derribar la nave grande, en orden. */
      OVNI_CLIPS: ['ovniMuere1', 'ovniMuere2'],

      /* Celebracion por racha de bajas. Las frases se van turnando: la 1a a
         las 5 naves, la 2a a las 10, la 3a a las 15, y vuelta a empezar. */
      RACHA: {
        ACTIVO: true,
        CADA: 5,           // naves derribadas entre felicitacion y felicitacion
        CLIPS: ['racha1', 'racha2', 'racha3']
      }
    },

    COLORES: {
      FONDO: '#070a14',
      SUELO: '#46d16a',
      TEXTO: '#e8f1ff',
      TEXTO_TENUE: '#7e8bb0',
      ACENTO: '#ffe36b',
      PELIGRO: '#ff6b6b',
      ESTRELLA: '#b9c6e8',
      BARRERA: '#46d16a',
      DEBUG: '#00e5ff'
    },

    ALMACENAMIENTO: {
      CLAVE_RECORD: 'tioRene.record',
      CLAVE_AUDIO: 'tioRene.audio',
      CLAVE_VOLUMEN: 'tioRene.volumen',
      RECORD_MAX: 99999999
    }
  };

  /* Parametros que cambian con el nivel. Centralizado a proposito:
     tocar esta funcion es tocar toda la curva de dificultad. */
  CONFIG.nivelParams = function (nivel) {
    var e = CONFIG.ENEMIGOS;
    var n = Math.max(1, nivel);
    var extraY = Math.min(n - 1, e.Y_INICIAL_MAX_NIVELES) * e.Y_INICIAL_POR_NIVEL;
    return {
      intervaloPaso: Math.max(e.INTERVALO_PASO_MIN, e.INTERVALO_PASO_BASE * Math.pow(0.87, n - 1)),
      descenso: Math.min(e.DESCENSO_MAX, e.DESCENSO_BASE + 2 * (n - 1)),
      yInicial: e.Y_INICIAL + extraY,
      intervaloDisparo: Math.max(e.INTERVALO_DISPARO_MIN, e.INTERVALO_DISPARO_BASE * Math.pow(0.86, n - 1)),
      velocidadDisparo: Math.min(430, CONFIG.PROYECTIL_ENEMIGO.VELOCIDAD_BASE + 24 * (n - 1)),
      maxProyectiles: Math.min(e.MAX_PROYECTILES_TOPE, e.MAX_PROYECTILES_BASE + Math.floor((n - 1) / 2))
    };
  };

  global.TRI = global.TRI || {};
  global.TRI.CONFIG = CONFIG;
})(window);

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
      ESPERA_ENTRE_NIVELES: 3.2 // segundos del cartel "NIVEL N"
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
        jugadorGolpe: 'tio-rene-hit.mp3',     // le pegan (impacto)
        jugadorMuere: 'tio-rene-death.mp3',   // ultima vida
        /* "Se murio": suena CADA vez que pierde una vida, turnandose. */
        muerte1: 'muerte-1.mp3',
        muerte2: 'muerte-2.mp3',
        muerte3: 'muerte-3.mp3',
        gameOver: 'game-over.mp3',
        victoria: 'victoria-me-rio.mp3',   // "me rio toa la noche", entera
        ovniAparece: 'ovni-miau.mp3',      // el "miau" cuando cruza la nave
        nivel: 'level-start.mp3',
        nivelCompleto: 'nivel-completo-me-rio.mp3',   // "me rio toa la noche"
        vidaExtra: 'extra-life.mp3',
        /* Al derribar la nave grande: la frase "te paso por" partida en dos,
           que se van alternando (primer ovni la primera mitad, segundo la
           segunda). */
        ovniMuere1: 'ufo-hit-1.mp3',
        ovniMuere2: 'ufo-hit-2.mp3',
        /* Frases de AMBIENTE: el monton del que se va sacando la charla de
           fondo. Se barajan para que no se repitan hasta agotarlas todas. */
        ambiente1: 'amb-01.mp3',
        ambiente2: 'amb-02.mp3',
        ambiente3: 'amb-03.mp3',
        ambiente4: 'amb-04.mp3',
        ambiente5: 'amb-05.mp3',
        ambiente6: 'amb-06.mp3',
        ambiente7: 'amb-07.mp3',
        ambiente8: 'amb-08.mp3',
        ambiente9: 'amb-09.mp3',
        ambiente10: 'amb-10.mp3',
        ambiente11: 'amb-11.mp3',
        ambiente12: 'amb-12.mp3',
        ambiente13: 'amb-13.mp3',
        ambiente14: 'amb-14.mp3',
        ambiente15: 'amb-15.mp3',
        ambiente16: 'amb-16.mp3',
        ambiente17: 'amb-17.mp3',
        ambiente18: 'amb-18.mp3',
        ambiente19: 'amb-19.mp3',
        ambiente20: 'amb-20.mp3',
        ambiente21: 'amb-21.mp3',
        ambiente22: 'amb-22.mp3',
        ambiente23: 'amb-23.mp3',
        ambiente24: 'amb-24.mp3',
        ambiente25: 'amb-25.mp3',
        ambiente26: 'amb-26.mp3',
        ambiente27: 'amb-27.mp3',
        ambiente28: 'amb-28.mp3',
        ambiente29: 'amb-29.mp3',
        ambiente30: 'amb-30.mp3',
        ambiente31: 'amb-31.mp3',
        ambiente32: 'amb-32.mp3',
        ambiente33: 'amb-33.mp3',
        ambiente34: 'amb-34.mp3',
        ambiente35: 'amb-35.mp3',
        /* Frases de RACHA: cada 5 naves derribadas. */
        racha1: 'racha-queri-too.mp3',     // "queri too", cada 8 bajas
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
        CLIPS: [
          'ambiente1', 'ambiente2', 'ambiente3', 'ambiente4', 'ambiente5', 'ambiente6', 'ambiente7', 'ambiente8', 'ambiente9', 'ambiente10', 'ambiente11', 'ambiente12', 'ambiente13', 'ambiente14', 'ambiente15', 'ambiente16', 'ambiente17', 'ambiente18', 'ambiente19', 'ambiente20', 'ambiente21', 'ambiente22', 'ambiente23', 'ambiente24', 'ambiente25', 'ambiente26', 'ambiente27', 'ambiente28', 'ambiente29', 'ambiente30', 'ambiente31', 'ambiente32', 'ambiente33', 'ambiente34', 'ambiente35'
        ]
      },

      /* Frases al derribar la nave grande, en orden. */
      OVNI_CLIPS: ['ovniMuere1', 'ovniMuere2'],

      /* Frases de "se murio", una por cada vida perdida. */
      MUERTE_CLIPS: ['muerte1', 'muerte2', 'muerte3'],

      /* Cada 8 naves derribadas suena "queri too". */
      RACHA: {
        ACTIVO: true,
        CADA: 8,
        CLIPS: ['racha1']
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
      CLAVE_AUTODISPARO: 'tioRene.autoDisparo',
      CLAVE_PALANCA: 'tioRene.palanca',
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

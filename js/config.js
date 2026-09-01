/* TIO RENE INVADERS - Configuracion central
 * Todos los numeros que definen la dificultad y el aspecto viven AQUI.
 * Si quieres que el juego sea mas facil o mas dificil, toca solo este archivo.
 */
(function (global) {
  'use strict';

  var CONFIG = {
    /* Frases del Tio Rene para encabezar el mensaje al compartir el puntaje.
       Salen de los titulos de sus propios clips en myinstants (los mismos que
       suenan en el juego) y de correcciones del propio Eduardo, que conoce al
       personaje: van escritas como el las escribio.
       DECISION: yo habia dejado fuera los garabatos, por ir el mensaje a gente
       que no eligio recibirlo; Eduardo pidio incluirlos y mandan sus reglas.
       El repertorio es el del personaje tal cual. */
    FRASES_COMPARTIR: [
      'Ya llegamos ya',
      'Me río toa la noche',
      'Querí too',
      '¿Qué pasa, primo?',
      'Está bien un rato',
      'Ando curao',
      'No me hablí ma',
      'Toi de campeón',
      '¿Pa qué tomai tanto?',
      'K pasa, hermano mío',
      'Soy otro, loco',
      'Se hace el interesante',
      'Te estay picando a vío',
      'Me disculpai, amorcito',
      'Miau',
      'Zapa Mariteh',
      'Señor dioh mío',
      '¿Por qué cierran?',
      'No tení permiso pa salil',
      'Cállate, René Puente',
      'Te tengo pura mala',
      'Chaaa… Tío René',
      'Coxino ctm',
      'Perro chuchetumare',
      'Te paso por el pendejo',
      'Querí weárme',
      'Hácete caca',
      'Te gusta esa weá, primo'
    ],

    /* Donde vive el juego. Se usa al compartir el resultado; si algun dia
       cambia de direccion, se cambia AQUI y en las etiquetas og: del HTML. */
    ENLACE: 'https://portafolio-creativo.github.io/tio-rene-invaders/',

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
      FILAS: 4,
      FILAS_MAX: 6,
      COLUMNAS: 8,
      COLUMNAS_MAX: 11,
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
      LINEA_INVASION: 658,
      /* Naves que se SALEN de la formacion a atacar en picada. Empiezan en el
         nivel 2 y se vuelven mas frecuentes y numerosas al subir de nivel. */
      PICADA_DESDE_NIVEL: 2,
      PICADA_CADA_BASE: 6.5,    // segundos entre picadas en el nivel 2
      PICADA_CADA_MIN: 1.8,     // tope: no mas seguido que esto
      PICADA_VELOCIDAD: 190,    // px/s de caida
      PICADA_PERSECUCION: 1.6,  // cuanto persigue al jugador (0 = recto)
      PICADA_BAMBOLEO: 90,      // amplitud del zigzag al caer
      PICADA_DISPARA: 0.9,      // prob. de que dispare durante la picada
      /* La KAMIKAZE: mas rara, se sale muy notoria y va DIRECTO al jugador con
         un zumbido raro constante. Empieza mas adelante y castiga quedarse
         quieto. */
      KAMIKAZE_DESDE_NIVEL: 3,
      KAMIKAZE_CADA_BASE: 11,   // segundos entre kamikazes (nivel 3)
      KAMIKAZE_CADA_MIN: 4.5,
      KAMIKAZE_VELOCIDAD: 240,  // px/s de caida (mas rapida que la picada normal)
      KAMIKAZE_PERSECUCION: 3.4 // persigue fuerte al jugador en horizontal
    },

    OVNI: {
      ANCHO: 64,
      ALTO: 28,
      Y: 68,
      VELOCIDAD: 135,
      ESPERA_MIN: 9,    // segundos entre apariciones
      ESPERA_MAX: 18,
      /* No cruza y se va: hace varias PASADAS de ida y vuelta antes de irse,
         asi da tiempo de derribarlo en vez de perderse de una. */
      PASADAS: 3,
      VIDA_CADA: 6,             // cada N ovnis, uno da VIDA EXTRA al derribarlo
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
      TOTAL: 15,                // al superar este nivel: VICTORIA
      ESPERA_ENTRE_NIVELES: 3.2 // segundos del cartel "NIVEL N"
    },

    /* Jefes: cada tres niveles, en vez de la formacion aparece una cabezota
       que hay que ir deshaciendo a tiros. Se destruye por celdas, igual que
       las barreras, asi que se le van comiendo pedazos de verdad.

       El dibujo de cada uno es assets/sprites/boss-N.png, con el mismo formato
       que player-head.png (cabeza recortada, fondo transparente). Si el
       archivo no esta, se dibuja una cabeza generada para que el jefe funcione
       igual: asi se puede reemplazar uno por uno sin tocar codigo. */
    JEFES: {
      CADA: 3,                  // nivel de jefe cada N niveles
      ANCHO: 250,
      ALTO: 250,
      Y_INICIAL: 96,
      /* Zona por la que ronda. No baja de MAX_Y para que al jugador le quede
         siempre sitio para maniobrar. */
      MIN_Y: 70,
      MAX_Y: 430,
      VELOCIDAD_BASE: 96,       // px/s hacia su punto de destino
      /* Se acerca y se aleja: de cerca tapa media pantalla, de lejos cuesta
         acertarle. Cambia de tamano cada pocos segundos, al azar. */
      ESCALA_MIN: 0.62,
      ESCALA_MAX: 1.30,
      ZOOM_CADA_MIN: 1.6,
      ZOOM_CADA_MAX: 3.4,
      /* Cuantos impactos cuesta tumbarlo. La cara no se borra a pedazos: se
         va deteriorando, y al llegar a esta cuenta estalla. */
      IMPACTOS_OBJETIVO: 34,
      MAX_PROYECTILES: 6,       // cuantos disparos suyos caben a la vez
      /* Tic de "mirar al costado" (solo los jefes con mira:true). */
      MIRADA_CADA_MIN: 1.4,     // cada cuanto se distrae
      MIRADA_CADA_MAX: 3.2,
      MIRADA_ANGULO: 0.22,      // cuanto gira la cabeza (radianes)
      MIRADA_DESVIO: 22,        // y cuanto se corre de lado (px)
      MIRADA_SOSTEN: 0.6,       // cuanto se queda mirando antes de volver
      /* Balanceo continuo (Huevito): amplitud del vaiven de lado a lado. */
      BALANCEO_ANGULO: 0.16,
      BALANCEO_DESVIO: 16,
      PUNTOS: 750,
      /* Al caer revienta por partes: una tanda de estallidos encadenados
         mientras la pantalla tiembla. */
      /* Muerte en dos actos: primero ARDE en el sitio, temblando y al rojo
         vivo (MUERTE_DURACION segundos), y al final REVIENTA en pedazos. */
      MUERTE_DURACION: 1.25,
      ESTALLIDOS: 26,
      ESTALLIDO_CADA: 0.045,
      LLAMARADAS: 90,           // chorros de fuego de la muerte
      TROZOS: 14,               // en cuantos pedazos salta la cara al final
      /* Dispara en salvas: varios seguidos y luego descansa. */
      SALVA_TIROS: 3,
      SALVA_SEPARACION: 0.16,
      INTERVALO_DISPARO_BASE: 0.95,
      INTERVALO_DISPARO_MIN: 0.34,
      /* Cada cuantos impactos suelta una frase, para que no sea un loro. */
      VOZ_CADA: 5,
      /* En el orden que pidio Eduardo. Cada uno puede traer sus propias voces
         (de myinstants, igual que las del Tio Rene). Los que aun no tienen
         sonidos propios se quedan sin voz: mejor callado que con la voz de
         otro. */
      LISTA: [
        {
          sprite: 'boss-1', nombre: 'PAPI MICKY',
          voces: { aparece: 'mickyAparece', golpe: 'mickyGolpe', muere: 'mickyMuere' }
        },
        {
          sprite: 'boss-2', nombre: 'JB THE VOICE',
          voces: {
            aparece: 'jbAparece', muere: 'jbMuere',
            golpe: ['jbGolpe1', 'jbGolpe2', 'jbGolpe3', 'jbGolpe4', 'jbGolpe5']
          }
        },
        {
          sprite: 'boss-3', nombre: 'CARLITOS RUN',
          voces: {
            aparece: 'carlitosAparece', muere: 'carlitosMuere',
            golpe: ['carlitosGolpe1', 'carlitosGolpe2', 'carlitosGolpe3', 'carlitosGolpe4']
          }
        },
        {
          sprite: 'boss-4', nombre: 'WASON KING',
          /* Su sello: se distrae y mira para el lado cada tanto, como cuando lo
             entrevistan. Lo hace la cabeza entera (se va de lado y vuelve),
             porque la foto es fija y no se le pueden mover solo los ojos. */
          mira: true,
          voces: {
            aparece: 'wasonAparece', muere: 'wasonMuere',
            golpe: ['wasonGolpe1', 'wasonGolpe2', 'wasonGolpe3', 'wasonGolpe4', 'wasonGolpe5']
          }
        },
        {
          sprite: 'boss-5', nombre: 'HUEVITO REY',
          /* Como es un personaje boleto, en vez de estar chueco y quieto va
             balanceando la cabeza de un lado al otro, sin parar. */
          balanceo: true,
          voces: {
            aparece: 'huevitoAparece', muere: 'huevitoMuere',
            golpe: ['huevitoGolpe1', 'huevitoGolpe2', 'huevitoGolpe3',
                    'huevitoGolpe4', 'huevitoGolpe5', 'huevitoGolpe6']
          }
        }
      ]
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
        /* Fin de etapa: se turnan, para no oir siempre la misma. */
        nivelCompleto1: 'nivel-completo-me-rio.mp3',   // "me rio toa la noche"
        nivelCompleto2: 'nivel-completo-tio-rene.mp3',
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
        ambiente36: 'amb-36.mp3',
        ambiente37: 'amb-37.mp3',
        ambiente38: 'amb-38.mp3',
        ambiente39: 'amb-39.mp3',
        ambiente40: 'amb-40.mp3',
        ambiente41: 'amb-41.mp3',
        ambiente42: 'amb-42.mp3',
        ambiente43: 'amb-43.mp3',
        ambiente44: 'amb-44.mp3',
        ambiente45: 'amb-45.mp3',
        ambiente46: 'amb-46.mp3',
        ambiente47: 'amb-47.mp3',
        ambiente48: 'amb-48.mp3',
        ambiente49: 'amb-49.mp3',
        ambiente50: 'amb-50.mp3',
        ambiente51: 'amb-51.mp3',
        ambiente52: 'amb-52.mp3',
        ambiente53: 'amb-53.mp3',
        ambiente54: 'amb-54.mp3',
        /* Racha: tres frases que se turnan, asi cada una vuelve a salir
           mucho mas espaciada. */
        /* Voces de los jefes. Papi Micky, de myinstants. */
        mickyAparece: 'micky-aparece.mp3',
        mickyGolpe: 'micky-golpe.mp3',
        mickyMuere: 'micky-muere.mp3',
        /* JB The Voice: un unico clip suyo de myinstants, partido en tres. */
        jbAparece: 'jb-aparece.mp3',
        jbGolpe1: 'jb-golpe1.mp3',
        jbGolpe2: 'jb-golpe2.mp3',
        jbGolpe3: 'jb-golpe3.mp3',
        jbGolpe4: 'jb-golpe4.mp3',
        jbGolpe5: 'jb-golpe5.mp3',
        jbMuere: 'jb-muere.mp3',
        /* Wason King: un unico clip suyo de myinstants, partido en tres. */
        wasonAparece: 'wason-aparece.mp3',
        wasonGolpe1: 'wason-golpe1.mp3',
        wasonGolpe2: 'wason-golpe2.mp3',
        wasonGolpe3: 'wason-golpe3.mp3',
        wasonGolpe4: 'wason-golpe4.mp3',
        wasonGolpe5: 'wason-golpe5.mp3',
        wasonMuere: 'wason-muere.mp3',
        /* Carlitos Run: varios clips suyos de myinstants. */
        carlitosAparece: 'carlitos-aparece.mp3',
        carlitosGolpe1: 'carlitos-golpe1.mp3',
        carlitosGolpe2: 'carlitos-golpe2.mp3',
        carlitosGolpe3: 'carlitos-golpe3.mp3',
        carlitosGolpe4: 'carlitos-golpe4.mp3',
        carlitosMuere: 'carlitos-muere.mp3',
        /* Huevito Rey: varios clips suyos de myinstants. */
        huevitoAparece: 'huevito-aparece.mp3',
        huevitoGolpe1: 'huevito-golpe1.mp3',
        huevitoGolpe2: 'huevito-golpe2.mp3',
        huevitoGolpe3: 'huevito-golpe3.mp3',
        huevitoGolpe4: 'huevito-golpe4.mp3',
        huevitoGolpe5: 'huevito-golpe5.mp3',
        huevitoGolpe6: 'huevito-golpe6.mp3',
        huevitoMuere: 'huevito-muere.mp3',
        racha1: 'racha-queri-too.mp3',     // "queri too"
        racha2: 'racha-tio-rene.mp3',
        racha3: 'racha-miau.mp3',          // el "nau" cortito
        /* Sintetizados a proposito (muy repetitivos):
           disparo, marcha1..4, enemigoMuere, barrera, descenso, menu, ovni */
      },

      /* Charla de fondo durante la partida. */
      AMBIENTE: {
        ACTIVO: true,
        VOLUMEN: 0.55,     // proporcion del volumen general (0 a 1)
        ATENUACION: 0.35,  // cuanto se agacha mientras habla el Tio Rene
        ESPERA_MIN: 2,     // segundos de silencio entre frase y frase
        ESPERA_MAX: 6,
        PRIMERA_ESPERA: 3, // cuanto tarda la primera al empezar el nivel
        CLIPS: [
          'ambiente1', 'ambiente2', 'ambiente3', 'ambiente4', 'ambiente5', 'ambiente6', 'ambiente7',
          'ambiente8', 'ambiente9', 'ambiente10', 'ambiente11', 'ambiente12', 'ambiente13', 'ambiente14',
          'ambiente15', 'ambiente16', 'ambiente17', 'ambiente18', 'ambiente19', 'ambiente20', 'ambiente21',
          'ambiente22', 'ambiente23', 'ambiente24', 'ambiente25', 'ambiente26', 'ambiente27', 'ambiente28',
          'ambiente29', 'ambiente30', 'ambiente31', 'ambiente32', 'ambiente33', 'ambiente34', 'ambiente35',
          'ambiente36', 'ambiente37', 'ambiente38', 'ambiente39', 'ambiente40', 'ambiente41', 'ambiente42',
          'ambiente43', 'ambiente44', 'ambiente45', 'ambiente46', 'ambiente47', 'ambiente48', 'ambiente49',
          'ambiente50', 'ambiente51', 'ambiente52', 'ambiente53', 'ambiente54'
        ]
      },

      /* Frases al derribar la nave grande, en orden. */
      OVNI_CLIPS: ['ovniMuere1', 'ovniMuere2'],

      /* Frases de "se murio", una por cada vida perdida. */
      MUERTE_CLIPS: ['muerte1', 'muerte2', 'muerte3'],

      /* Cada 8 naves derribadas suena una felicitacion, turnandose entre las
         tres: asi cada frase concreta vuelve cada 24 bajas y no cansa. */
      RACHA: {
        ACTIVO: true,
        CADA: 8,
        CLIPS: ['racha1', 'racha2', 'racha3']
      },

      /* Frases de fin de etapa, en orden. */
      NIVEL_CLIPS: ['nivelCompleto1', 'nivelCompleto2']
    },

    /* El fondo es SIEMPRE negro (asi le gusta). Lo que cambia por nivel es el
       TINTE de las naves y el color de las estrellas, para que cada nivel se
       vea distinto sin ensuciar el cielo. tinte:null = colores originales. */
    TEMAS: [
      { estrella: '#b9c6e8', tinte: null },
      { estrella: '#e6c9ff', tinte: '#8a3cff' },
      { estrella: '#a9f0e4', tinte: '#12d6c0' },
      { estrella: '#ffc9e6', tinte: '#ff3c9d' },
      { estrella: '#d8ffb0', tinte: '#7ee03a' },
      { estrella: '#ffd9a0', tinte: '#ff8a2a' }
    ],
    /* En los niveles de jefe no hay formacion que tintar; las estrellas van
       en un tono tenso. El fondo sigue negro. */
    TEMA_JEFE: { estrella: '#ffb0a0', tinte: null },

    /* Formaciones distintas por nivel: cada patron decide que huecos deja la
       rejilla, para que la silueta del enjambre no sea siempre un bloque.
       Se eligen por (fila, columna, filas, columnas); true = hay nave. */
    FORMAS: ['bloque', 'rombo', 'flancos', 'aspa', 'panal'],

    /* Familia de nave por nivel: cambia la SILUETA (no solo el color). Se
       turnan, asi cada nivel tiene bichos de otra forma. */
    FAMILIAS_NAVE: ['clasico', 'platillo', 'insecto', 'robot', 'medusa'],

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
      intervaloPaso: Math.max(e.INTERVALO_PASO_MIN, e.INTERVALO_PASO_BASE * Math.pow(0.93, n - 1)),
      descenso: Math.min(e.DESCENSO_MAX, e.DESCENSO_BASE + 2 * (n - 1)),
      yInicial: e.Y_INICIAL + extraY,
      intervaloDisparo: Math.max(e.INTERVALO_DISPARO_MIN, e.INTERVALO_DISPARO_BASE * Math.pow(0.93, n - 1)),
      velocidadDisparo: Math.min(430, CONFIG.PROYECTIL_ENEMIGO.VELOCIDAD_BASE + 11 * (n - 1)),
      maxProyectiles: Math.min(e.MAX_PROYECTILES_TOPE, e.MAX_PROYECTILES_BASE + Math.floor((n - 1) / 2)),
      /* La formacion tambien crece: con solo acelerar, todos los niveles se
         sentian iguales. Ahora ademas hay mas naves y ocupan mas ancho. */
      filas: Math.min(e.FILAS_MAX, e.FILAS + Math.floor((n - 1) / 4)),
      columnas: Math.min(e.COLUMNAS_MAX, e.COLUMNAS + Math.floor((n - 1) / 3))
    };
  };

  global.TRI = global.TRI || {};
  global.TRI.CONFIG = CONFIG;
})(window);

# TÍO RENÉ INVADERS

Arcade chileno para navegador. El Tío René, con su cabezota y su **mandíbula
articulada**, defiende el barrio de una invasión disparando **desde la boca**.

Inspirado en las mecánicas de los marcianitos clásicos (formación que baja,
barreras, ovni de bonus). El código, los enemigos y los efectos de sonido son
originales de este proyecto: no hay ni un sprite, ni un sonido, ni una línea de
código copiada de ningún juego existente. La **cara** del protagonista es una
foto aportada por el autor del proyecto, y sus **frases** son recortes de clips
publicados en myinstants.com (ver §15).

- HTML5 + CSS + JavaScript. **Cero dependencias, cero CDN, cero red.**
- Funciona con doble clic en `index.html` (`file://`) y publicado en cualquier
  hosting estático, también dentro de una subcarpeta.
- PC y móvil: teclado o botones táctiles.

---

## 1. Ejecutar

**Opción A — doble clic.** Abre `index.html`. El juego funciona completo:
gráficos, récord, todo. Ojo: con `file://` el navegador bloquea la lectura de
archivos, así que **las voces del Tío René no suenan** y se oye la versión
sintetizada.

**Opción B — servidor local.** Necesario para escuchar las voces. Con Node
instalado:

```bash
node tools/servidor-local.mjs
```

Luego abre `http://localhost:8080/`. También sirve `python -m http.server 8080`.

## 2. Publicar

Es un sitio estático: se sube la carpeta `tio-rene-invaders/` tal cual.

- **GitHub Pages / GitLab Pages:** copia la carpeta al repositorio y activa
  Pages. Queda en `https://usuario.github.io/repo/tio-rene-invaders/`.
- **Netlify / Cloudflare Pages:** arrastra la carpeta. El archivo `_headers`
  incluido aplica solo las cabeceras de seguridad; no hace falta configurar nada.
- **Cualquier otro hosting:** subir por FTP y listo.

Todas las rutas son **relativas** (`assets/...`, `js/...`), así que funciona
igual en la raíz del dominio o en una subcarpeta de tres niveles. Está probado
sirviendo el juego desde `/proyectos/tio-rene-invaders/`.

## 3. Controles

| Acción | Teclado | Táctil |
|---|---|---|
| Mover | `←` `→` (o `A` `D`) | botones ◀ ▶ |
| Disparar | `ESPACIO` (o `↑`) | botón DISPARO |
| Pausa | `P` o `ESC` | botón ❚❚ (barra de arriba) |
| Empezar / continuar | `ENTER` | botones en pantalla |
| Silenciar | `M` | botón SONIDO |
| Modo depuración | `Ctrl` + `Shift` + `D` | — |

En el teléfono los botones aparecen solos:

- **En vertical**, en dos filas bajo el tablero: arriba **izquierda y derecha**
  pegados (mitad y mitad), y abajo **DISPARO** a todo el ancho. La **pausa** va
  en la barra de arriba (el botón ❚❚).
- **En horizontal**, flotan a los lados sobre el margen que sobra junto al
  tablero (izquierda/derecha abajo a la izquierda, disparo abajo a la derecha),
  para no comerle altura al juego.

En ninguna orientación un botón tapa la zona de juego. El reparto de los botones
está en `css/style.css`: la rejilla de dos filas en `#botonera` (vertical) y el
bloque `@media (orientation: landscape)` (horizontal).

## 4. Estructura

```
tio-rene-invaders/
├── index.html              Página única del juego
├── manifest.webmanifest    Para instalarlo como app (§6)
├── _headers                Cabeceras de seguridad (Netlify/Cloudflare)
├── css/style.css           Marco, menús y botones táctiles
├── js/
│   ├── config.js           ⭐ TODA la dificultad y los parámetros
│   ├── util.js             Matemáticas y colisión AABB
│   ├── storage.js          Récord y preferencias (localStorage seguro)
│   ├── fallback-art.js     Dibujos de reserva si falta un archivo
│   ├── assets.js           Carga de imágenes
│   ├── audio.js            AudioManager (voces + síntesis Web Audio)
│   ├── input.js            Teclado + botones táctiles
│   ├── entities/           player, enemy, projectile, barrier, ufo, particles
│   ├── systems/            collisions, score, levels
│   ├── renderer.js         Todo el dibujo en canvas
│   ├── game.js             Máquina de estados y reglas
│   ├── ui.js               Menús HTML
│   └── main.js             Arranque y bucle principal
├── assets/
│   ├── sprites/            piezas del Tío René (.png) + enemigos y efectos (.svg)
│   ├── ui/                 logo, favicon, iconos de app y miniatura
│   └── audio/              9 frases del Tío René (.mp3); el resto se sintetiza
└── tools/
    ├── servidor-local.mjs  servidor estático para pruebas
    ├── cortar-cara.py      corta una foto en cabeza + mandíbula + relleno
    └── hacer-miniatura.py  genera la miniatura para compartir el enlace
```

## 5. Intro

Al abrir el juego aparece una **pantalla de entrada con la cara del Tío René a
tamaño grande**, el título y el crédito ("creado por Eduardo Pérez"), mientras
se cargan los recursos. La mandíbula bosteza sola, para que se vea la mecánica
antes de jugar.

Dura un mínimo de **3 s** —lo que tarda la frase de bienvenida— aunque los
archivos carguen al instante, y se puede **saltar tocando la pantalla o con
cualquier tecla**. Luego funde al menú.

### Por qué a veces pide un toque

Ningún navegador deja sonar audio antes de que el usuario interactúe con la
página; es una política de Chrome, Firefox y Safari contra las webs que
arrancan solas con ruido. **No hay forma legítima de saltársela.** Lo que hace
el juego es aprovechar las tres vías que sí existen:

1. **Lo intenta sin pedir nada.** Al cargar prueba a arrancar el audio
   (`Audio.intentarArranque`). Chrome lo autoriza por su cuenta cuando ya
   visitaste el sitio antes, así que **a partir de la segunda visita suele
   sonar solo**, sin cartel.
2. **Si no puede, cualquier contacto sirve.** Hay un detector en toda la página
   (fase de captura): el primer toque, clic o tecla —caiga donde caiga— revela
   la cara y lanza la voz a la vez. No hay que acertarle al cartel.
3. **Instalado como app, suena siempre al abrir.** Una app añadida a la
   pantalla de inicio arranca con el audio ya autorizado. Ver §6.

Y si quieres forzarlo en tu propio navegador: en Chrome, candado de la barra de
direcciones → Configuración del sitio → Sonido → Permitir.

- Duración: `INTRO_MINIMA` en `js/main.js`.
- Tamaño de la cara: `#intro-cara` en `css/style.css`.
- Cuánto abre la boca: los `@keyframes bostezo` del mismo archivo.
- Con "movimiento reducido" activado en el sistema, el bostezo se queda quieto
  (la cara se ve igual de grande).

## 6. Instalar como app (y que suene al abrir)

El juego trae un `manifest.webmanifest`, así que se puede **instalar en la
pantalla de inicio**. Vale la pena por dos motivos: se abre a pantalla completa
sin la barra del navegador, y —lo importante— **una app instalada arranca con
el audio ya autorizado**, así que el "ya llegamos ya" suena solo al abrirla, sin
tocar nada.

- **Android (Chrome):** menú ⋮ → "Añadir a pantalla de inicio" / "Instalar app".
- **iPhone (Safari):** botón compartir → "Añadir a pantalla de inicio".
- **PC (Chrome/Edge):** icono de instalar en la barra de direcciones.

El icono sale de la cara del Tío René (`assets/ui/icono-192.png` y `-512.png`,
generados con `tools/hacer-miniatura.py` a partir de la misma foto).

Nota para la CSP: el manifiesto necesita `manifest-src 'self'`. Con
`default-src 'none'` y sin esa directiva, el navegador lo bloquea en silencio.

## 7. Arquitectura

- **Bucle:** `requestAnimationFrame` con **paso fijo** de 1/120 s y acumulador.
  La simulación es idéntica a 30, 60 o 144 Hz; solo cambia cuántos fotogramas
  se dibujan. `update` y `render` están separados.
- **Máquina de estados:** `CARGANDO → MENU → JUGANDO ⇄ PAUSA`,
  `JUGANDO → ENTRE_NIVELES → JUGANDO`, `JUGANDO → GAME_OVER | VICTORIA`.
  No hay banderas booleanas sueltas gobernando el flujo.
- **Las entidades no se dibujan a sí mismas:** guardan estado y geometría;
  `renderer.js` las pinta. Los menús son HTML real (botones accesibles con
  teclado), no dibujos en el canvas.
- **Formación enemiga a pasos discretos**, como los arcade originales: cada
  cierto intervalo toda la formación salta 8 px; al tocar un borde baja y
  cambia de sentido. El intervalo se acorta según quedan menos enemigos, así
  que la partida acelera sola.
- **Escalado:** el juego se dibuja siempre en un lienzo lógico de 600×800 y se
  escala conservando la proporción, con `devicePixelRatio` (tope ×2). Nada se
  deforma en ninguna pantalla.

## 8. Cambiar al Tío René (cabeza, mandíbula, cuerpo)

Cada pieza es **un archivo suelto** en `assets/sprites/`. Reemplaza el archivo y
el juego cambia: no hay que tocar código.

| Archivo | Tamaño | Qué es |
|---|---|---|
| `player-head.png` | 360 × 249 | Cara desde la coronilla hasta el corte. **Su borde inferior es el corte horizontal** e incluye los dientes de arriba |
| `player-jaw.png` | 360 × 147 | **Mandíbula inferior, pieza independiente.** Dientes de abajo, labio, mentón y cuello |
| `player-mouth.png` | 360 × 2 | Tira que rellena el hueco al abrirse (se estira). Piel a los lados, boca oscura al centro |
| `player-body.svg` | 56 × 34 | Cuerpo pequeño |
| `enemy-01-a/b.svg` | 36 × 30 | Enemigo verde, dos fotogramas |
| `enemy-02-a/b.svg` | 36 × 30 | Enemigo morado, dos fotogramas |
| `enemy-03-a/b.svg` | 36 × 30 | Enemigo cíclope, dos fotogramas |
| `enemy-special.svg` | 64 × 28 | El Platillo Completo (bonus) |
| `projectile-player.svg` | 12 × 22 | La muela láser |
| `projectile-enemy.svg` | 12 × 22 | Rayo enemigo |
| `barrier-block.svg` | 8 × 8 | Un ladrillo de barrera |
| `explosion.svg` | 32 × 32 | Destello |
| `ui/logo.png` | 320 × 320 | Emblema del menú |
| `ui/favicon.png` | 64 × 64 | Icono de la pestaña |

Las tres piezas del Tío René son **recortes de una foto**. Cada una se busca
primero como `.png`; si no está, se usa el `.svg` del mismo nombre como
respaldo, y si tampoco, un dibujo generado por código.

**El corte de la cabeza** funciona así (medidas en px lógicos, `y` = borde
superior de la cabeza):

```
 y        ┌────────────────────┐
          │   player-head      │   se dibuja a 88 × 61
 y+61     ══ CORTE HORIZONTAL ══   ← aquí encaja la mandíbula
          │   player-jaw       │   88 × 36, baja hasta 20 px al abrirse
 y+88     │   player-body      │
 y+115    └────────────────────┘
```

La cabeza y la mandíbula salen **del mismo recorte**, así que comparten ancho y
encajan al píxel. Al disparar: la mandíbula baja, el hueco se rellena con
`player-mouth.png` estirado (boca oscura al centro, piel a los lados), sale la
muela y la mandíbula vuelve a subir.

### Cambiar la cara por otra foto

Hay una herramienta que hace el corte por ti:

```bash
python tools/cortar-cara.py mi-foto.png
```

Acepta un PNG con el fondo ya recortado (transparente). Busca solo el hueco
oscuro entre las dos filas de dientes, corta las tres piezas, las deja en
`assets/sprites/` y te imprime las medidas que hay que pegar en
`js/entities/player.js` y `js/config.js` si cambian las proporciones.

Si el corte automático no te convence:

```bash
python tools/cortar-cara.py mi-foto.png --regla   # genera regla.png numerada
python tools/cortar-cara.py mi-foto.png 825       # corta en la fila que elijas
```

La fila buena es la del **hueco entre los dientes de arriba y los de abajo**:
así los de arriba se quedan con la cabeza y los de abajo bajan con la mandíbula.
En la foto actual esa fila es la 825 de 1312.

### Expresiones de la cara

Con una foto hay una sola cara, así que el daño y la muerte se distinguen
**tiñendo la imagen en tiempo real** (rojo al recibir un golpe, gris al morir),
y el disparo se nota porque la mandíbula se abre. Si prefieres cuatro imágenes
distintas, pon en `js/config.js`:

```js
JUGADOR.EXPRESIONES_SEPARADAS: true
```

y añade `player-head-shoot`, `player-head-hit` y `player-head-dead` (`.png` o
`.svg`) en `assets/sprites/`. Si faltan, se dibujan por código y el juego sigue.

## 9. Sonidos

El juego suena de dos maneras a la vez:

**Con la voz del Tío René** (archivos en `assets/audio/`), en los momentos:

| Archivo | Cuándo suena |
|---|---|
| `tio-rene-intro.mp3` | al cargar el juego ("ya llegamos ya") |
| `tio-rene-hit.mp3` | le pegan, pierde una vida |
| `tio-rene-death.mp3` | última vida |
| `game-over.mp3` | fin de la partida |
| `victory.mp3` | victoria final |
| `level-start.mp3` | empieza un nivel |
| `level-complete.mp3` | nivel superado |
| `extra-life.mp3` | vida extra (cada 5000 puntos) |
| `ufo-hit-1.mp3` / `ufo-hit-2.mp3` | cae el Platillo Completo (dos mitades que se alternan) |
| `tio-rene-amb-1..6.mp3` | frases de fondo durante la partida |
| `tio-rene-racha-1..3.mp3` | cada 5 naves derribadas |

**Sintetizado** (Web Audio API, sin archivos): `disparo`, `marcha1..4`,
`enemigoMuere`, `barrera`, `descenso`, `menu` y el zumbido del ovni.

Además, mientras juegas suenan solas **frases de fondo** cada 11–24 s
(`AMBIENTE` en `js/config.js`), a un tercio del volumen, y cada **5 naves
derribadas** una frase de celebración que se va turnando (`RACHA`). Al derribar
la nave grande suena "te paso por" partida en dos mitades que se alternan.

Todo eso se apaga con `ACTIVO: false` en su bloque de `CONFIG.AUDIO`.

Que el disparo y la marcha vayan sintetizados es **a propósito**: son los
sonidos muy repetitivos. El disparo
suena cada 0,3 s y la marcha enemiga cada 0,5 s; una voz humana ahí cansa en
menos de un minuto y tapa todo lo demás. Sintetizado es corto y seco, que es
lo que pide un arcade.

### Cambiar o agregar un sonido

1. Deja el archivo en `assets/audio/` (`.mp3`, `.wav` u `.ogg`).
2. Agrega o cambia su línea en `CONFIG.AUDIO.ARCHIVOS` (`js/config.js`). Solo
   se listan los que **existen**: apuntar a uno que falta llena la consola de
   errores 404.
3. Pruébalo con servidor (§1, opción B). Con `file://` el navegador bloquea la
   carga de archivos y se oye la versión sintetizada.

Para apagar todas las voces de golpe: `USAR_ARCHIVOS: false`.

### Dos detalles del sistema

- **Un solo canal de voz:** al empezar una frase se corta la anterior. Sin eso
  se pisan entre sí (por ejemplo "nivel superado" con el "empieza nivel" que
  llega dos segundos después) y no se entiende ninguna.
- **La frase de bienvenida espera permiso:** los navegadores no dejan sonar
  nada hasta que el usuario toca la pantalla. Si al abrir todavía no hay
  permiso, la frase queda en espera y suena sola en cuanto se toca. En el
  celular casi siempre pasa eso.

## 10. Ajustar la dificultad

Todo está en **`js/config.js`**. Los más útiles:

| Parámetro | Efecto |
|---|---|
| `JUGADOR.VELOCIDAD` | Lo rápido que se mueve el Tío René (300 px/s) |
| `JUGADOR.CADENCIA_DISPARO` | Segundos entre disparos (0.30) |
| `JUGADOR.MAX_PROYECTILES` | Muelas simultáneas en pantalla (2) |
| `JUGADOR.VIDAS_INICIALES` | Vidas al empezar (3) |
| `JUGADOR.INVULNERABILIDAD` | Segundos de gracia tras un golpe (2) |
| `JUGADOR.MANDIBULA.*` | Cuánto y cuán rápido se abre la mandíbula |
| `ENEMIGOS.FILAS` / `COLUMNAS` | Tamaño de la formación (5 × 9) |
| `ENEMIGOS.INTERVALO_PASO_BASE` | Ritmo inicial de la marcha (0.62 s) |
| `ENEMIGOS.FACTOR_ACELERACION` | Cuánto acelera al morir enemigos |
| `ENEMIGOS.DESCENSO_BASE` | Px que baja la formación en cada borde |
| `ENEMIGOS.TIPOS` | Sprite, puntos y resistencia de cada fila |
| `ENEMIGOS.LINEA_INVASION` | Altura a la que la invasión gana |
| `OVNI.*` | Cada cuánto aparece el Platillo Completo y cuánto vale |
| `BARRERAS.*` | Número, tamaño y cuánto se come cada impacto |
| `PUNTUACION.VIDA_EXTRA_CADA` | Puntos para ganar una vida (5000) |
| `NIVELES.TOTAL` | Niveles hasta la pantalla de victoria (5) |

**La curva de dificultad completa** está en una sola función al final de
`config.js`: `CONFIG.nivelParams(nivel)`. Ahí se decide, por nivel, el ritmo de
la marcha, cuánto bajan, cada cuánto disparan, la velocidad de sus disparos y
cuántos proyectiles enemigos caben en pantalla. Cambiar esa función cambia todo
el juego.

Tras superar el nivel 5 sale la pantalla de **VICTORIA**; desde ahí se puede
seguir en modo sin fin, con los niveles subiendo indefinidamente.

## 11. Modo depuración

`Ctrl` + `Shift` + `D` durante la partida muestra cajas de colisión, FPS,
estado, número de enemigos vivos, ritmo de la marcha, proyectiles, apertura de
la mandíbula y la línea de invasión. Está apagado por defecto
(`CONFIG.DEBUG = false`) y no aparece nunca solo.

Desde la consola del navegador también tienes las piezas vivas en
`TRI.instancia` (`juego`, `ui`, `renderer`). Por ejemplo, para saltar al nivel 4:

```js
TRI.instancia.juego.niveles.nivel = 4;
TRI.instancia.juego.prepararNivel();
```

## 12. Pruebas hechas

Probado con Chrome sobre `http://`, sobre `file://` y servido desde una
subcarpeta (`/proyectos/tio-rene-invaders/`):

arranque y carga de los 19 assets · menú · movimiento y límites laterales ·
disparo y apertura de mandíbula · colisiones (disparo↔enemigo, disparo↔jugador,
disparo↔barrera, disparo↔disparo, enemigo↔jugador, disparo↔ovni) · erosión de
barreras · puntuación y vida extra · pérdida de vidas · game over · invasión ·
fin de nivel · victoria y modo sin fin · pausa (congela de verdad: la partida no
avanza) · reinicio · récord persistente · silencio y volumen · **carga de las 9 voces (200, sin 404)** · **archivo vs.
sintetizado según corresponde** · **el canal de voz corta la frase anterior** ·
**`file://` con las voces activadas no rompe nada** (cae a sintetizado) ·
teclado ·
botones táctiles · atajo de depuración · redimensionado (móvil 375×812 vertical
y 812×375 horizontal, ambos sin desbordes ni scroll y con los botones fuera del
tablero; escritorio) · **localStorage bloqueado** (sigue jugándose, avisa) ·
**localStorage con datos corruptos** (se descartan) · **archivos de sprite
ausentes** (dibujo de reserva y aviso) · consola sin errores propios.

## 13. Miniatura al compartir (WhatsApp y redes)

Cuando se comparte el enlace, WhatsApp, Telegram, Facebook o X muestran una
**miniatura con la cara del Tío René y el título**. Eso lo dan las etiquetas
Open Graph del `<head>` de `index.html` y la imagen `assets/ui/og-cover.jpg`
(1200×630, ~93 KB).

**Importante:** `og:image` y `og:url` son URLs **absolutas** que apuntan a
`https://cotizadora.github.io/tio-rene-invaders/`. Si mueves el juego a otro
dominio o carpeta, hay que actualizar esas líneas en `index.html`, o la
miniatura no cargará.

Para regenerar la imagen (por ejemplo si cambias la foto):

```bash
python tools/hacer-miniatura.py mi-foto.png
```

**Si WhatsApp no muestra la miniatura al probar:** guarda el preview en caché
por varios días. Si ya compartiste el enlace *antes* de que existiera la
imagen, WhatsApp recuerda que no había ninguna. Trucos para forzar el refresco:

- Comparte el enlace con un parámetro extra que no cambia el juego:
  `…/tio-rene-invaders/?v=2` (cada número nuevo cuenta como enlace distinto).
- O pega el enlace en el depurador de Facebook
  (`developers.facebook.com/tools/debug`) y pulsa "Scrape Again": eso vacía el
  caché que también usa WhatsApp.

## 14. Seguridad y privacidad

- **Sin `eval`, sin `new Function`, sin `innerHTML`.** Todo el texto se escribe
  con `textContent`, así que no hay superficie de inyección de HTML.
- **Sin red:** ni analítica, ni rastreadores, ni publicidad, ni fuentes
  remotas, ni CDN, ni `fetch` (salvo el opcional de audio local, apagado).
- **Sin datos personales.** El único dato guardado es el récord y las
  preferencias de sonido, en `localStorage`, en tu propio navegador.
- **Nunca se confía en lo guardado:** el récord se valida (número finito, no
  negativo, con tope) antes de usarlo. El volumen se valida en 0–1.
- **CSP estricta** declarada en `index.html` y en `_headers`:
  `default-src 'none'` y solo recursos propios. Se incluye el esquema `file:`
  en las listas para que el juego también funcione abriéndolo con doble clic;
  en un servidor esa parte no habilita nada externo.
- `frame-ancestors` y `X-Frame-Options` no se pueden aplicar desde una etiqueta
  `<meta>`: por eso van en `_headers`, para el hosting que lo soporte.
- El único enlace externo es el botón de apoyo del pie, con
  `rel="noopener noreferrer"`.

## 15. Dependencias y licencias

**Ninguna dependencia.** Ni librerías, ni frameworks, ni fuentes descargadas
(se usa la pila monoespaciada del sistema).

Todo el material es original de este proyecto:

| Recurso | Origen |
|---|---|
| Código | Escrito para este proyecto |
| Enemigos, proyectiles, barreras, efectos, logo de fondo | Dibujados en SVG para este proyecto |
| Arte de reserva | Generado por código con Canvas 2D |
| Efectos del juego | Sintetizados en tiempo real con Web Audio API |
| **Frases del Tío René** | **Recortes de clips de myinstants.com** (búsqueda "tio rene"), cortados y normalizados con ffmpeg |
| Fuente | Monoespaciada del sistema |
| **Cara del protagonista** | **Fotografía aportada por el autor del proyecto**, recortada en piezas con `tools/cortar-cara.py` |

No se usaron sprites, sonidos, ROMs, código ni recursos extraídos de Space
Invaders ni de ningún otro juego. La inspiración es **mecánica**, no gráfica.

**Sobre las voces:** los `.mp3` de `assets/audio/` son recortes de clips
publicados en myinstants.com. No son material propio de este proyecto:
pertenecen a quien grabó los videos originales. Para quitarlos basta con
borrar los archivos o poner `USAR_ARCHIVOS: false`, y el juego vuelve a sonar
100 % sintetizado sin tocar nada más.

**Sobre la fotografía:** las piezas `player-head.png`, `player-jaw.png`,
`player-mouth.png`, `ui/logo.png` y `ui/favicon.png` salen de una foto que no
generó este proyecto. Antes de publicar el juego conviene asegurarse de tener
los derechos de esa imagen (quién la tomó) y el consentimiento de la persona
que aparece, sobre todo si el sitio va a ser público. Si algún día hay que
cambiarla, se sustituye con `tools/cortar-cara.py` y no hay que tocar código.

## 16. Créditos

Un juego de **Eduardo Pérez**.
Si te gusta: [💛 Apoya mi trabajo](https://maladifusion.github.io/apoyo/)

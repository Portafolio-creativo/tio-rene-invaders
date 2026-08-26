# TÍO RENÉ INVADERS

Arcade chileno para navegador. El Tío René, con su cabezota y su **mandíbula
articulada**, defiende el barrio de una invasión disparando **desde la boca**.

Inspirado en las mecánicas de los marcianitos clásicos (formación que baja,
barreras, ovni de bonus). El código, los enemigos, los efectos y los sonidos son
originales de este proyecto: no hay ni un sprite, ni un sonido, ni una línea de
código copiada de ningún juego existente. La cara del protagonista es una **foto
aportada por el autor del proyecto** (ver §13).

- HTML5 + CSS + JavaScript. **Cero dependencias, cero CDN, cero red.**
- Funciona con doble clic en `index.html` (`file://`) y publicado en cualquier
  hosting estático, también dentro de una subcarpeta.
- PC y móvil: teclado o botones táctiles.

---

## 1. Ejecutar

**Opción A — doble clic.** Abre `index.html`. El juego funciona completo:
gráficos, sonido (sintetizado), récord, todo.

**Opción B — servidor local.** Solo hace falta si quieres cargar tus propios
archivos de audio: con `file://` el navegador bloquea la lectura de archivos por
`fetch`. Con Node instalado:

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
| Pausa | `P` o `ESC` | botón II |
| Empezar / continuar | `ENTER` | botones en pantalla |
| Silenciar | `M` | botón SONIDO |
| Modo depuración | `Ctrl` + `Shift` + `D` | — |

En el teléfono **en vertical** los botones van en una barra bajo el tablero. **En
horizontal** se colocan solos a los lados (izquierda/derecha abajo a la
izquierda, disparo abajo a la derecha, pausa arriba), sobre el margen que sobra
a los costados del tablero: así el juego no se queda en una franja. En ninguna
orientación un botón tapa la zona de juego.

## 4. Estructura

```
tio-rene-invaders/
├── index.html              Página única del juego
├── _headers                Cabeceras de seguridad (Netlify/Cloudflare)
├── css/style.css           Marco, menús y botones táctiles
├── js/
│   ├── config.js           ⭐ TODA la dificultad y los parámetros
│   ├── util.js             Matemáticas y colisión AABB
│   ├── storage.js          Récord y preferencias (localStorage seguro)
│   ├── fallback-art.js     Dibujos de reserva si falta un archivo
│   ├── assets.js           Carga de imágenes
│   ├── audio.js            AudioManager (síntesis Web Audio)
│   ├── input.js            Teclado + botones táctiles
│   ├── entities/           player, enemy, projectile, barrier, ufo, particles
│   ├── systems/            collisions, score, levels
│   ├── renderer.js         Todo el dibujo en canvas
│   ├── game.js             Máquina de estados y reglas
│   ├── ui.js               Menús HTML
│   └── main.js             Arranque y bucle principal
├── assets/
│   ├── sprites/            piezas del Tío René (.png) + enemigos y efectos (.svg)
│   ├── ui/                 logo y favicon
│   └── audio/              vacío: los sonidos se sintetizan (ver §8)
└── tools/
    ├── servidor-local.mjs  servidor estático para pruebas
    └── cortar-cara.py      corta una foto en cabeza + mandíbula + relleno
```

## 5. Intro

Al abrir el juego aparece una **pantalla de entrada con la cara del Tío René a
tamaño grande**, el título y el crédito ("creado por Eduardo Pérez"), mientras
se cargan los recursos. La mandíbula bosteza sola, para que se vea la mecánica
antes de jugar.

Dura un mínimo de **2,6 s** aunque los archivos carguen al instante (si no,
pasaría de largo en un parpadeo) y se puede **saltar tocando la pantalla o con
cualquier tecla**. Luego funde al menú.

- Duración: `INTRO_MINIMA` en `js/main.js`.
- Tamaño de la cara: `#intro-cara` en `css/style.css`.
- Cuánto abre la boca: los `@keyframes bostezo` del mismo archivo.
- Con "movimiento reducido" activado en el sistema, el bostezo se queda quieto
  (la cara se ve igual de grande).

## 6. Arquitectura

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

## 7. Cambiar al Tío René (cabeza, mandíbula, cuerpo)

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

## 8. Cambiar los sonidos

Ahora mismo **no hay archivos de audio**: todos los efectos se generan en
tiempo real con la Web Audio API (`js/audio.js`), así que el juego pesa poquísimo
y no depende de nada externo.

Para poner voces reales del Tío René:

1. Deja tus archivos en `assets/audio/` con estos nombres exactos:

| Archivo | Cuándo suena | Duración sugerida |
|---|---|---|
| `tio-rene-shoot.wav` | Cada disparo | 0,2–0,4 s (suena muchísimo) |
| `tio-rene-hit.wav` | Le pegan, pierde una vida | ~1 s |
| `tio-rene-death.wav` | Última vida | 1–2 s |
| `extra-life.wav` | Gana una vida (cada 5000 pts) | ~1 s |
| `march-1..4.wav` | Marcha enemiga (4 se alternan paso a paso) | 0,1–0,2 s |
| `enemy-hit.wav` | Muere un enemigo | ~0,3 s |
| `enemy-drop.wav` | La formación baja un escalón | ~0,3 s |
| `ufo.wav` | Zumbido del Platillo Completo, **en bucle** | 1–2 s que empalmen |
| `ufo-hit.wav` | Cae el Platillo Completo | ~0,5 s |
| `barrier-hit.wav` | Impacto en una barrera | ~0,2 s |
| `level-start.wav` | Empieza un nivel | ~1 s |
| `level-complete.wav` | Nivel superado | 1–2 s |
| `game-over.wav` | Fin de la partida | 1–3 s |
| `victory.wav` | Victoria final | 2–4 s |
| `menu-select.wav` | Pulsar un botón | ~0,15 s |

   **No hace falta ponerlos todos.** Los que falten siguen sonando
   sintetizados, así que puedes ir reemplazándolos de a poco.

2. En `js/config.js` pon `USAR_ARCHIVOS: true`.

3. Ábrelo con el servidor local (§1, opción B): `file://` bloquea la carga.

La lógica del juego no cambia: sigue llamando a `Audio.reproducir('disparo')`.
Si quieres otros formatos (`.mp3`, `.ogg`) basta con cambiar el nombre en
`CONFIG.AUDIO.ARCHIVOS`.

> Nota: no se incluyen frases ni sonidos atribuidos a ninguna persona real. Si
> vas a usar voces o clips de alguien, necesitas tener los derechos para
> publicarlos, sobre todo con el juego en abierto.

## 9. Ajustar la dificultad

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

## 10. Modo depuración

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

## 11. Pruebas hechas

Probado con Chrome sobre `http://`, sobre `file://` y servido desde una
subcarpeta (`/proyectos/tio-rene-invaders/`):

arranque y carga de los 19 assets · menú · movimiento y límites laterales ·
disparo y apertura de mandíbula · colisiones (disparo↔enemigo, disparo↔jugador,
disparo↔barrera, disparo↔disparo, enemigo↔jugador, disparo↔ovni) · erosión de
barreras · puntuación y vida extra · pérdida de vidas · game over · invasión ·
fin de nivel · victoria y modo sin fin · pausa (congela de verdad: la partida no
avanza) · reinicio · récord persistente · silencio y volumen · teclado ·
botones táctiles · atajo de depuración · redimensionado (móvil 375×812 vertical
y 812×375 horizontal, ambos sin desbordes ni scroll y con los botones fuera del
tablero; escritorio) · **localStorage bloqueado** (sigue jugándose, avisa) ·
**localStorage con datos corruptos** (se descartan) · **archivos de sprite
ausentes** (dibujo de reserva y aviso) · consola sin errores propios.

## 12. Seguridad y privacidad

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

## 13. Dependencias y licencias

**Ninguna dependencia.** Ni librerías, ni frameworks, ni fuentes descargadas
(se usa la pila monoespaciada del sistema).

Todo el material es original de este proyecto:

| Recurso | Origen |
|---|---|
| Código | Escrito para este proyecto |
| Enemigos, proyectiles, barreras, efectos, logo de fondo | Dibujados en SVG para este proyecto |
| Arte de reserva | Generado por código con Canvas 2D |
| Sonidos | Sintetizados en tiempo real con Web Audio API |
| Fuente | Monoespaciada del sistema |
| **Cara del protagonista** | **Fotografía aportada por el autor del proyecto**, recortada en piezas con `tools/cortar-cara.py` |

No se usaron sprites, sonidos, ROMs, código ni recursos extraídos de Space
Invaders ni de ningún otro juego. La inspiración es **mecánica**, no gráfica.

**Sobre la fotografía:** las piezas `player-head.png`, `player-jaw.png`,
`player-mouth.png`, `ui/logo.png` y `ui/favicon.png` salen de una foto que no
generó este proyecto. Antes de publicar el juego conviene asegurarse de tener
los derechos de esa imagen (quién la tomó) y el consentimiento de la persona
que aparece, sobre todo si el sitio va a ser público. Si algún día hay que
cambiarla, se sustituye con `tools/cortar-cara.py` y no hay que tocar código.

## 14. Créditos

Un juego de **Eduardo Pérez**.
Si te gusta: [💛 Apoya mi trabajo](https://maladifusion.github.io/apoyo/)

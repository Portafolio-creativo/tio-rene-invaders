#!/usr/bin/env python3
"""Prepara la foto de un jefe para el juego.

    python tools/cortar-jefe.py FOTO.png NUMERO

NUMERO es 1..5 y decide el archivo de salida (assets/sprites/boss-N.png).

Que hace:
  1. Recorta el margen transparente que sobra alrededor de la cabeza.
  2. La encaja centrada en un cuadrado, sin deformarla.
  3. La exporta al tamano que usa el juego.

Lo que NO hace: quitar el fondo. La foto tiene que llegar YA recortada, en PNG
con transparencia, igual que llego la de Rene. Si tiene fondo, el juego
dibujaria un cuadrado en vez de una cabeza, porque las celdas destruibles se
calculan leyendo la transparencia.

Requiere Pillow:  pip install pillow
"""
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow. Instalalo con:  pip install pillow")

LADO = 250          # tiene que coincidir con CONFIG.JEFES.ANCHO / ALTO
MARGEN = 0.04       # aire alrededor de la cabeza, en proporcion al lado
DESTINO = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       "..", "assets", "sprites")


def preparar(origen, numero):
    im = Image.open(origen).convert("RGBA")

    caja = im.getbbox()          # descarta el borde totalmente transparente
    if caja:
        im = im.crop(caja)

    # Aviso util: si casi todo es opaco, la foto trae fondo y saldra cuadrada.
    alfa = im.getchannel("A")
    opacos = sum(alfa.histogram()[250:])
    if opacos > 0.97 * im.width * im.height:
        print("  AVISO: la foto no parece tener fondo transparente.")
        print("         El jefe se vera como un cuadrado. Recortala antes.")

    util = int(LADO * (1 - 2 * MARGEN))
    escala = min(util / im.width, util / im.height)
    nuevo = im.resize((max(1, round(im.width * escala)),
                       max(1, round(im.height * escala))), Image.LANCZOS)

    lienzo = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 0))
    lienzo.paste(nuevo, ((LADO - nuevo.width) // 2, (LADO - nuevo.height) // 2), nuevo)

    salida = os.path.join(DESTINO, "boss-%d.png" % numero)
    lienzo.save(salida)
    solidas = sum(lienzo.getchannel("A").histogram()[40:])
    print("  %s  %dx%d  %.0f%% de la caja es cara" %
          (os.path.basename(salida), LADO, LADO, 100.0 * solidas / (LADO * LADO)))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    preparar(sys.argv[1], int(sys.argv[2]))

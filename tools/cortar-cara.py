#!/usr/bin/env python3
"""Corta una foto de cara en las tres piezas que usa el juego.

    python tools/cortar-cara.py FOTO.png [FILA_DEL_CORTE]

Genera en assets/sprites/:
    player-head.png    de la coronilla hasta el corte (incluye dientes de arriba)
    player-jaw.png     del corte hacia abajo (dientes de abajo, menton, cuello)
    player-mouth.png   tira de 2 px que rellena el hueco cuando la boca se abre

La FILA_DEL_CORTE va en pixeles de la imagen YA recortada (sin el margen
transparente). Si no la indicas, el script propone el punto mas oscuro de la
zona de la boca, que suele ser justo el hueco entre las dos filas de dientes.

Para elegirla a ojo:  python tools/cortar-cara.py FOTO.png --regla
crea regla.png con lineas numeradas para que veas donde cortar.

Requiere Pillow:  pip install pillow
"""
import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Falta Pillow. Instalalo con:  pip install pillow")

ANCHO_SALIDA = 360          # px de exportacion de cada pieza
DESTINO = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       "..", "assets", "sprites")


def luz(p):
    return (p[0] + p[1] + p[2]) / 3


def abrir(ruta):
    im = Image.open(ruta).convert("RGBA")
    caja = im.getbbox()          # quita el margen transparente
    return im.crop(caja) if caja else im


def regla(im, salida):
    """Guarda una copia con lineas horizontales numeradas."""
    prev = im.copy()
    d = ImageDraw.Draw(prev)
    for y in range(0, prev.height, 25):
        d.line([(0, y), (prev.width, y)], fill=(255, 0, 0, 255), width=2)
        d.text((6, y + 2), str(y), fill=(255, 0, 0, 255))
    fondo = Image.new("RGBA", prev.size, (255, 255, 255, 255))
    fondo.alpha_composite(prev)
    fondo.convert("RGB").save(salida)
    print("regla guardada en", salida)


def proponer_corte(im):
    """Fila mas oscura del tercio inferior de la cara: la boca abierta."""
    px = im.load()
    mejor, mejor_luz = int(im.height * 0.62), 999
    for y in range(int(im.height * 0.52), int(im.height * 0.78)):
        fila = [px[x, y] for x in range(int(im.width * 0.35), int(im.width * 0.65))
                if px[x, y][3] > 20]
        if not fila:
            continue
        media = sum(luz(p) for p in fila) / len(fila)
        if media < mejor_luz:
            mejor_luz, mejor = media, y
    return mejor


def guardar(img, nombre):
    escala = ANCHO_SALIDA / img.width
    alto = max(1, round(img.height * escala))
    ruta = os.path.normpath(os.path.join(DESTINO, nombre))
    img.resize((ANCHO_SALIDA, alto), Image.LANCZOS).save(ruta, "PNG", optimize=True)
    print(f"  {nombre:18s} {ANCHO_SALIDA:4d} x {alto:4d}   {os.path.getsize(ruta)/1024:6.1f} KB")
    return alto


def tira_del_hueco(im, corte):
    """Relleno del corte. Dentro de la boca toma el pixel mas oscuro de la
    franja (asi no se cuela ningun diente al estirar); fuera, piel."""
    w, h = im.size
    px = im.load()
    oscuras = [x for x in range(w) if px[x, corte][3] > 20 and luz(px[x, corte]) < 100]
    if not oscuras:
        sys.exit("No se encontro boca oscura en esa fila: prueba otra FILA_DEL_CORTE.")
    x0, x1 = min(oscuras), max(oscuras)

    tira = Image.new("RGBA", (w, 2))
    tp = tira.load()
    for x in range(w):
        if x0 <= x <= x1:
            franja = [px[x, y] for y in range(max(0, corte - 14), min(h, corte + 15))
                      if px[x, y][3] > 20]
            p = min(franja, key=luz) if franja else (44, 14, 16, 255)
            if luz(p) > 85:                      # techo: nunca un diente
                f = 85 / luz(p)
                p = (int(p[0] * f), int(p[1] * f), int(p[2] * f), 255)
            tp[x, 0] = tp[x, 1] = p
        else:
            tp[x, 0] = px[x, max(0, corte - 8)]
            tp[x, 1] = px[x, min(h - 1, corte + 8)]
    return tira


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    origen = sys.argv[1]
    im = abrir(origen)
    print(f"foto: {origen}  ->  {im.width} x {im.height} (ya recortada)")

    if "--regla" in sys.argv:
        regla(im, os.path.join(os.path.dirname(origen), "regla.png"))
        return

    corte = int(sys.argv[2]) if len(sys.argv) > 2 else proponer_corte(im)
    print(f"corte en la fila y={corte}")

    w, h = im.size
    guardar(im.crop((0, 0, w, corte)), "player-head.png")
    guardar(im.crop((0, corte, w, h)), "player-jaw.png")
    tira = tira_del_hueco(im, corte)
    tira.resize((ANCHO_SALIDA, 2), Image.LANCZOS).save(
        os.path.normpath(os.path.join(DESTINO, "player-mouth.png")), "PNG", optimize=True)
    print("  player-mouth.png     360 x    2")

    ancho_logico = 88
    print()
    print("Pega estas medidas en js/entities/player.js si cambian:")
    print(f"  var ANCHO_CABEZA = {ancho_logico}, ALTO_CABEZA = {round(ancho_logico * corte / w)};")
    print(f"  var ANCHO_MANDIBULA = {ancho_logico}, ALTO_MANDIBULA = {round(ancho_logico * (h - corte) / w)};")
    print(f"y en js/config.js:  ALTO_TOTAL = {round(ancho_logico * h / w) + 18}")


if __name__ == "__main__":
    main()

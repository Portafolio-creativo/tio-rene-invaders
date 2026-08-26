#!/usr/bin/env python3
"""Genera la miniatura para compartir el enlace (Open Graph / WhatsApp).

    python tools/hacer-miniatura.py [FOTO.png]

Crea assets/ui/og-cover.jpg a 1200x630 (el tamano estandar): la cara del
Tio Rene a la izquierda y el titulo a la derecha, sobre fondo oscuro con
estrellas. Si no pasas una foto, usa assets/sprites/player-head.png.

Requiere Pillow:  pip install pillow
"""
import os
import random
import sys

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    sys.exit("Falta Pillow. Instalalo con:  pip install pillow")

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, ".."))
DESTINO = os.path.join(RAIZ, "assets", "ui", "og-cover.jpg")
FUENTE = r"C:\Windows\Fonts\arialbd.ttf"       # negrita del sistema

W, H = 1200, 630
FONDO = (7, 10, 20)
AMARILLO = (255, 227, 107)
VERDE = (70, 209, 106)
TENUE = (150, 165, 200)
BLANCO = (232, 241, 255)


def cargar_cara(ruta):
    im = Image.open(ruta).convert("RGBA")
    caja = im.getbbox()
    return im.crop(caja) if caja else im


def fuente(px):
    try:
        return ImageFont.truetype(FUENTE, px)
    except OSError:
        return ImageFont.load_default()


def texto_centrado_v(draw, x, y, texto, fnt, color):
    draw.text((x, y), texto, font=fnt, fill=color)
    izq, arriba, der, abajo = draw.textbbox((x, y), texto, font=fnt)
    return abajo - arriba


def main():
    origen = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, "assets", "sprites", "player-head.png")
    if not os.path.exists(origen):
        sys.exit("No encuentro la foto: " + origen)

    lienzo = Image.new("RGB", (W, H), FONDO)
    dib = ImageDraw.Draw(lienzo)

    # Estrellas de fondo
    random.seed(7)
    for _ in range(90):
        x, y = random.randint(0, W), random.randint(0, H)
        r = random.choice([1, 1, 1, 2])
        tono = random.randint(90, 190)
        dib.ellipse((x, y, x + r, y + r), fill=(tono, tono + 10, tono + 30))

    # Suelo verde, guino al juego
    dib.rectangle((0, H - 8, W, H - 5), fill=VERDE)

    # Cara a la izquierda, grande, con sombra
    cara = cargar_cara(origen)
    alto_cara = 540
    escala = alto_cara / cara.height
    cara = cara.resize((round(cara.width * escala), alto_cara), Image.LANCZOS)
    cx, cy = 70, (H - cara.height) // 2 - 6

    sombra = Image.new("RGBA", lienzo.size, (0, 0, 0, 0))
    masc = cara.split()[3].point(lambda a: 150 if a > 40 else 0)
    negro = Image.new("RGBA", cara.size, (0, 0, 0, 255))
    sombra.paste(negro, (cx + 12, cy + 16), masc)
    sombra = sombra.filter(ImageFilter.GaussianBlur(14))
    lienzo.paste(Image.alpha_composite(lienzo.convert("RGBA"), sombra).convert("RGB"), (0, 0))
    lienzo.paste(cara, (cx, cy), cara)

    # Texto a la derecha
    tx = cx + cara.width + 60
    f_titulo = fuente(96)
    f_sub = fuente(30)
    f_credito = fuente(26)

    y = 150
    dib.text((tx, y), "TÍO RENÉ", font=f_titulo, fill=AMARILLO)
    y += 104
    dib.text((tx, y), "INVADERS", font=f_titulo, fill=VERDE)
    y += 128

    dib.rectangle((tx, y, tx + 300, y + 4), fill=(40, 60, 100))
    y += 26
    dib.text((tx, y), "Defiende el barrio disparando", font=f_sub, fill=BLANCO)
    y += 40
    dib.text((tx, y), "desde la boca. Arcade chileno.", font=f_sub, fill=BLANCO)
    y += 64
    dib.text((tx, y), "creado por Eduardo Pérez", font=f_credito, fill=TENUE)

    lienzo.save(DESTINO, "JPEG", quality=86, optimize=True)
    kb = os.path.getsize(DESTINO) / 1024
    print("og-cover.jpg  %d x %d  %.1f KB" % (W, H, kb))
    if kb > 300:
        print("  (aviso: >300 KB; WhatsApp puede no mostrar la miniatura. Baja la calidad.)")


if __name__ == "__main__":
    main()

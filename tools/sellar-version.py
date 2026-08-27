"""Sella una version en los enlaces a js y css de index.html.

GitHub Pages sirve los archivos con Cache-Control: max-age=600, asi que durante
diez minutos el navegador sigue usando la copia vieja aunque ya se haya
publicado una nueva. Eso hace que un arreglo recien subido "no exista" para
quien acaba de abrir el juego.

Anadiendo ?v=<sello> a cada enlace, la direccion cambia en cada despliegue y el
navegador se ve obligado a pedir el archivo otra vez. Es idempotente: si ya
habia un sello, lo reemplaza en vez de encadenarlos.

Uso: python tools/sellar-version.py [sello]
Sin argumento usa la fecha y hora UTC (AAAAMMDDhhmm).
"""
import io
import os
import re
import sys
from datetime import datetime, timezone

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGINAS = ['index.html']

# Solo archivos propios: nada de direcciones absolutas ni de otros dominios.
PATRON = re.compile(r'(?P<attr>src|href)="(?P<ruta>(?:js|css)/[^"?]+\.(?:js|css))(?:\?v=[^"]*)?"')


def sellar(sello):
    total = 0
    for pagina in PAGINAS:
        ruta = os.path.join(RAIZ, pagina)
        if not os.path.exists(ruta):
            continue
        texto = io.open(ruta, encoding='utf-8').read()
        nuevo, n = PATRON.subn(
            lambda m: '%s="%s?v=%s"' % (m.group('attr'), m.group('ruta'), sello),
            texto)
        if n:
            io.open(ruta, 'w', encoding='utf-8', newline='\n').write(nuevo)
        print('  %-12s %d enlaces sellados' % (pagina, n))
        total += n
    return total


if __name__ == '__main__':
    marca = sys.argv[1] if len(sys.argv) > 1 else datetime.now(timezone.utc).strftime('%Y%m%d%H%M')
    print('sello:', marca)
    sellar(marca)

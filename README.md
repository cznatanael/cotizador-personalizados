# Cotizador — Personalizados

Calculadora de precios para taller de productos personalizados: **sublimación, vinil textil, corte láser e impresión 3D**.
Parte de tus costos reales (material, luz, desgaste de máquina, tu tiempo) y llega al precio de venta con la utilidad que tú decidas.

## Ábrelo aquí

**https://cznatanael.github.io/cotizador-personalizados/**

Funciona en celular, tablet y computadora. Es una sola página: **una vez que la abres la primera vez, sigue funcionando sin internet** — incluso si la cierras y la vuelves a abrir desde el ícono, sin señal.

### Para tenerlo como app en el celular

- **Android (Chrome):** menú ⋮ → *Agregar a la pantalla principal*.
- **iPhone (Safari):** botón Compartir → *Agregar a inicio*.

Queda con su ícono y abre a pantalla completa, sin barra de navegador.

### Si no carga

1. **Ábrelo con `?nuevo=1` al final.** Así:
   `https://cznatanael.github.io/cotizador-personalizados/?nuevo=1`
   Eso obliga al navegador a bajar la versión nueva en vez de la que tenía guardada.
   Sirve igual en celular que en computadora, y con hacerlo **una sola vez** basta:
   ahí queda instalado el modo sin internet y de ahí en adelante ya entras normal.
2. **Si ya tenías el ícono en la pantalla principal, bórralo y vuelve a agregarlo**
   después de hacer lo anterior. El ícono viejo sigue apuntando a la versión vieja.
3. **Si no quieres hacer nada, espera 10 minutos.** La copia guardada se vence sola
   y el navegador jala la nueva.
4. **Revisa la dirección: va todo en minúsculas.**
   `cznatanael.github.io/Cotizador-Personalizados` da error 404.
5. **Revisa que el atajo apunte a la web.** Si empieza con `file:///C:/...` estás
   abriendo una copia local, no el sitio.

## Qué hace

- **Precio en vivo:** cambias un dato y el precio unitario y el total se actualizan al instante.
- **Descuento por volumen:** botones de 1 / 6 / 12 / 24 / 50 / 100 piezas con la tabla de mayoreo.
- **Varios colores o capas:** en vinil, láser e impresión 3D puedes agregar hasta 8 colores/capas, cada uno con su medida y su precio, y el cotizador suma el material y el tiempo extra de cada uno.
- **Varias técnicas sobre la misma pieza:** una playera con 3 viniles + sublimación + grabado láser se cotiza como **un solo producto**. Se suman materiales, máquina y tiempo de cada proceso, y **el blanco se cobra una sola vez**.
- **Desglose completo:** de dónde sale cada peso, del costo al precio.
- **Cotización en PDF** para mandarle al cliente, con folio y vigencia — sin enseñar tus costos ni tu margen.
- **Historial** de lo que has cotizado, con opción de duplicar.
- **Tus productos:** puedes dar de alta los que no vienen en el catálogo.
- **Ajustes** de sueldo por hora, tarifa de luz, mermas, utilidad y precios de insumos.
- **Respaldo:** exporta e importa tu configuración para pasarla a otro dispositivo.

Todo se guarda **en tu propio navegador** (`localStorage`). No hay servidor, no hay cuenta, no se sube nada a ninguna parte.

## Cómo usar los colores / capas

1. Elige la técnica (vinil, láser o 3D) y el producto.
2. En el bloque **Colores / Capas**, escribe el nombre del primer color (por ejemplo *Negro*) y su medida.
3. Toca **Agregar color** para el siguiente. Puedes ponerle un precio distinto si ese material te cuesta más (por ejemplo un vinil glitter).
4. El cotizador suma el material de todos los colores y agrega el tiempo extra de cada color adicional (lo defines en *minutos por color extra*).

> Sublimación no lleva capas: imprime a todo color en un solo transfer. Si el diseño ocupa más área, ajusta las **hojas**.

## Cómo cotizar una pieza con varias técnicas

Si la misma playera lleva vinil, sublimación y grabado láser, no son tres cotizaciones: es una.

1. Cotiza normal el proceso principal (el que define el producto y su blanco).
2. Baja a **Otros procesos sobre la misma pieza** y toca la técnica que se le agrega.
3. Llena sus materiales, sus capas y sus tiempos en el panel que aparece. Hasta 4 procesos extra.

**El blanco se cobra una sola vez.** Los procesos extra ni siquiera preguntan el costo de la prenda. Lo que sí se suma es el material de cada proceso (cada uno con su propia merma), cada máquina que interviene y todos los minutos de producción y diseño.

El desglose lista lo que cuesta cada proceso por separado. El PDF del cliente sólo nombra las técnicas — nunca los costos.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La aplicación completa. Un solo archivo, sin dependencias. |
| `cotizador.html` | Reenvío al anterior, para accesos directos viejos. |
| `404.html` | Regresa al cotizador si escribes mal la dirección. |
| `sw.js` | Service worker: hace que abra aunque no haya internet. |
| `manifest.webmanifest` | Datos para instalarlo como app (nombre, ícono, colores). |
| `icon.svg` | Ícono de la app. |
| `.nojekyll` | Evita que GitHub Pages procese el sitio y altere el código. |
| `MODELO_COSTEO.md` | El modelo de costos con los números canónicos y ejemplos resueltos. |
| `GUIA_USO.md` | Manual de uso paso a paso. |
| `DATOS_MERCADO_MX.md` | Referencias de precios de mercado en México. |
| `PENDIENTES.md` | Bitácora de decisiones, bugs resueltos e ideas. |
| `test-calc.mjs` | Pruebas del motor de cálculo. |
| `verify-all-combos.mjs` | Pruebas de la interfaz completa. |
| `verify-persistencia.mjs` | Pruebas de guardado y recarga. |
| `publicar.ps1` | Publica el sitio en GitHub Pages con un solo comando. |

## Desarrollo

Requiere Node.js. Sólo para correr las pruebas (la app no necesita nada):

```bash
npm install jsdom      # sólo la primera vez
node test-calc.mjs
node verify-all-combos.mjs
node verify-persistencia.mjs
```

Las tres suites leen `index.html` directamente, así que **nunca pueden desincronizarse** de la app.

## Publicar cambios

Un solo comando (corre las pruebas, sube y actualiza el sitio):

```powershell
.\publicar.ps1
```

La primera vez abre el navegador para que autorices tu cuenta de GitHub; después ya no vuelve a pedirlo.
Si prefieres hacerlo a mano:

```bash
git add -A
git commit -m "lo que cambiaste"
git push
```

GitHub Pages tarda ~1 minuto en reflejarlo.

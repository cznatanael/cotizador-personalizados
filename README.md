# Cotizador — Personalizados

Calculadora de precios para taller de productos personalizados: **sublimación, vinil textil, corte láser e impresión 3D**.
Parte de tus costos reales (material, luz, desgaste de máquina, tu tiempo) y llega al precio de venta con la utilidad que tú decidas.

## Ábrelo aquí

**https://cznatanael.github.io/cotizador-personalizados/**

Funciona en celular, tablet y computadora. Es una sola página: **una vez que carga, sigue funcionando sin internet**.

### Para tenerlo como app en el celular

- **Android (Chrome):** menú ⋮ → *Agregar a la pantalla principal*.
- **iPhone (Safari):** botón Compartir → *Agregar a inicio*.

Queda con su ícono y abre a pantalla completa, sin barra de navegador.

## Qué hace

- **Precio en vivo:** cambias un dato y el precio unitario y el total se actualizan al instante.
- **Descuento por volumen:** botones de 1 / 6 / 12 / 24 / 50 / 100 piezas con la tabla de mayoreo.
- **Varios colores o capas:** en vinil, láser e impresión 3D puedes agregar hasta 8 colores/capas, cada uno con su medida y su precio, y el cotizador suma el material y el tiempo extra de cada uno.
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

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La aplicación completa. Un solo archivo, sin dependencias. |
| `cotizador.html` | Reenvío al anterior, para accesos directos viejos. |
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

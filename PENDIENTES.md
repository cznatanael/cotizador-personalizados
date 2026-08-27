# Pendientes — Cotizador

## RESUELTO · 25-ago-2026 (noche) — La app dejó de imponerte su modelo

Tres quejas del usuario, todas el **mismo problema de fondo**: la app asumía cosas en lugar de preguntar.

### 1. "Te estás cerrando a MDF; y si quiero grabar un lápiz, o un vaso"

El catálogo de productos estaba **quemado en el código**. Ahora:

- Chip **"Otro producto"** en las 4 técnicas → creas el tuyo con nombre, cómo compras el material y el costo del blanco.
- Se guardan en su propia llave de localStorage (`cotizador_productos`), **no** en `config`. Razón: Ajustes trabaja sobre un borrador (`state.configDraft`); si los productos vivieran ahí, guardar un borrador viejo borraría el producto recién creado.
- Se listan en Ajustes → **Mis productos**, con botón para eliminar.
- Viajan en el respaldo de Exportar/Importar.
- El motor dejó de asumir: `maquinaRequerida()` lanza un error claro en vez de reventar con `config.maquinas[undefined]` al llegarle un producto desconocido.

### 2. "El filamento lo compro por kilo, y está por gramos"

Se separó **unidad de compra** de **unidad de cálculo**. El valor siempre se guarda en la unidad base que espera el motor; sólo *se muestra* en la unidad en que tú compras.

| Técnica | Ahora puedes capturar |
|---|---|
| Sublimación | por hoja **o** por paquete (precio + cuántas hojas trae) |
| Vinil | por metro **o** por rollo (precio + cuántos metros trae) |
| Impresión 3D | **por kilo** (default) o por gramo |
| Láser | por hoja (÷ piezas) **o por pieza** — para lápices, vasos, termos |

Dos mecanismos, según el caso:
- **Factor fijo** (kg→g): un solo input, se convierte al vuelo con `data-factor`.
- **Divisor variable** (paquete/rollo/hoja): dos inputs, porque si cambias cuántas piezas trae, debe cambiar el costo unitario, no el precio del paquete.

La comparación contra tu configuración se muestra **en la misma unidad** (ej. "Config: $320.00 /kg"), para que no tengas que hacer cuentas mentales.

### 3. "Quiero poder descargar el PDF"

Botón **PDF** en la cotización y en cada renglón del historial.

- Usa `window.print()` + `@media print`. **Sin librerías** — la app tiene que seguir siendo un solo archivo que funciona sin internet.
- **Decisión de producto: el PDF es para el CLIENTE.** No lleva costos, ni margen, ni desglose interno. Sólo membrete, folio, concepto, cantidad, precio, total y vigencia.
- Los datos del membrete se ponen en Ajustes → **Datos para la cotización** (nombre, teléfono, días de vigencia).

#### Corrección: el PDF salía cortado por la derecha

El margen se confiaba **sólo** a `@page{margin:16mm}`. Si el diálogo de impresión tiene *Márgenes: Ninguno* —una preferencia que el navegador recuerda entre impresiones— ese margen se ignora, el contenido se pega al filo y la columna *Importe* se corta.

Fix: el margen ahora vive **dentro** del documento y no depende del diálogo.

```css
@page{size:letter; margin:0}
#printDoc{box-sizing:border-box; width:100%; padding:16mm 15mm}
```

De paso: `table-layout:fixed` con `<colgroup>` para que un importe de 7 dígitos no empuje la tabla fuera del papel, y `overflow-wrap:anywhere` en nombre de negocio y producto.

**Cómo se verificó:** se renderizó la hoja a 816×1056 px (Letter a 96 dpi) con `@page margin:0`, o sea el peor caso, y se midió la caja de **cada** elemento contra el ancho del papel. Margen real 57 px por lado, cero desbordes. Prueba de estrés con nombre de negocio de 56 caracteres, producto de 62 y total de $435,000.00: sigue sin desbordar.

**Lección:** el primer render de prueba usó `page.pdf()` de Playwright, que **ignora `@page` y usa margen 0** salvo que se le pase `margin`. El defecto ya era visible ahí y se descartó como "es que la captura sale al ancho del viewport". Si algo se ve pegado al borde, hay que medirlo, no explicarlo.

### Verificación

- 3 suites en verde: motor (38 asserts), UI (82 asserts), persistencia.
- Los números canónicos del modelo **no se movieron**: taza 1 pza $110.00 · taza 24 pzas $73.00 y $1,752.00 el pedido · playera vinil $375.00.
- Probado en navegador real (Chromium): filamento $450/kg → $0.45/g, láser por pieza, alta de producto propio de punta a punta, y PDF renderizado a archivo.
- El assert de "el PDF no filtra costos" se **validó metiendo una fuga a propósito** → la suite se puso en rojo. No es un assert vacío.

---

## CRÍTICO · RESUELTO · 25-ago-2026 (tarde)

**Síntoma:** al abrir el cotizador, toda la pantalla salía gris y borrosa, con una tarjeta blanca vacía asomando abajo. **Nada respondía a los clics.**

**Causa:** el overlay del bottom sheet (`#sheetWrap`) tenía el atributo `hidden`, pero la regla de autor `.sheet-wrap{display:flex}` le gana a la del navegador `[hidden]{display:none}` (los estilos de autor siempre vencen a los del user-agent). Resultado: un overlay `position:fixed; inset:0` **siempre visible**. Se comprobó con `elementFromPoint` que los 5 puntos de prueba —técnicas, inputs, Guardar y la barra inferior— golpeaban el `sheet-scrim`: la app estaba 100% inservible.

**Fix:** una línea en el reset del CSS (`cotizador.html:32`):
```css
[hidden]{display:none !important}
```

**Por qué no lo cacharon las pruebas:** JSDOM no reproduce esa cascada — `getComputedStyle(sheetWrap).display` devolvía `none` con y sin el bug, así que un chequeo de estilo computado ahí es **vacío** (se verificó explícitamente). El guardián nuevo en `verify-all-combos.mjs` analiza el CSS: busca reglas de autor que apliquen `display` a elementos que llevan `hidden` en el HTML y exige que exista la regla que las neutraliza. Se validó reintroduciendo el bug a propósito → la prueba falla en rojo.

---

## RESUELTO · 25-ago-2026

**Reportado el 24-ago:** el usuario no podía ajustar el costo de material (filamento, vinil, hoja de sublimación) al momento de cotizar. Además, la UI/UX del wizard de 4 pasos quedó mal.

### Lo que se hizo

**1. Override de costo de material — resuelto**

Se agregó `numOverride(valor, fallback)` en el motor: si el usuario escribe un valor válido lo usa, si no cae al valor de configuración. El `0` cuenta como override válido (filamento regalado, objeto del cliente).

Campos nuevos editables al cotizar, precargados desde config:

| Técnica | Campo | Lee de |
|---|---|---|
| Sublimación | Costo por hoja | `catalogoInsumos.sublimacion.costoPorHojaSublimacion` |
| Vinil | Costo del vinil `$/m` | `costoPorMetroVinilTextil` / `...Adhesivo` según el producto |
| Impresión 3D | Costo del filamento `$/g` | `costoPorGramoPLA` / `costoPorGramoPETG` según el select |
| Láser | Costo de la hoja completa + Piezas que salen de la hoja | `costoHojaMdf3mmDefault` / `costoHojaAcrilicoDefault` |

Comportamiento: el campo muestra debajo `Config: $X`, se pinta en azul con la etiqueta **Solo esta cotización** cuando difiere, y aparece un botón **Restablecer**. **Nunca escribe en la configuración guardada** (verificado en `verify-all-combos.mjs`).

En láser, el campo *Piezas que salen de la hoja* reemplaza el viejo botón "÷ hoja" que abría un `prompt()` nativo; el material por pieza se muestra como valor derivado en vivo.

**2. Rediseño de UI/UX — hecho**

- Se eliminó el wizard de 4 pasos. Ahora es **una sola pantalla con el precio calculándose en vivo** mientras escribes, fijo en un dock inferior (precio por pieza + total del pedido).
- Estilo claro y minimalista (blanco, aire, tipografía grande). **Cero emojis**: todos los iconos son SVG inline.
- `prompt()` / `confirm()` / `alert()` nativos reemplazados por bottom sheets y confirmaciones propias.
- Cantidad con stepper y atajos 1 · 6 · 12 · 24 · 50 · 100, con la etiqueta del tramo de mayoreo en vivo.
- Utilidad con slider 0–150% y switch de comisión de venta en línea.
- Barra visual de comparación contra el mercado con marcador del precio propio.
- Historial con buscador y acción **Duplicar** (recarga la cotización completa en el formulario).
- Ajustes estilo Apple Settings, máquinas expandibles con su costo/hora en vivo, y barra sticky de *Guardar / Descartar* que solo aparece si hay cambios.
- Nuevo `localStorage.cotizador_ultimos`: recuerda los últimos valores por combinación técnica+producto.

**3. Bugs colaterales corregidos**

- `comisionVentaOnlinePct` y `aplicaComisionVentaOnline` existían en la configuración pero **el motor nunca los usaba**. Ahora se repercuten sobre el precio (`precio / (1 - comisión)`) como opt-in, apagado por defecto para no alterar los números del documento.
- `test-calc.mjs` ya no es una copia manual del motor: **lo extrae de `cotizador.html`**, así que no se puede volver a desincronizar.

### Verificación

```powershell
cd C:\Users\cznat\ProyectosCopilot\cotizador-personalizados
node test-calc.mjs          # 38 asserts del motor vs MODELO_COSTEO.md + overrides + comisión
node verify-all-combos.mjs  # 12 combinaciones técnica x producto en JSDOM + flujo completo de UI
node verify-persistencia.mjs
```

Todos los ejemplos numéricos de `MODELO_COSTEO.md` §3.2 y §3.3 siguen dando exactamente lo mismo (taza 1 pza = $110.00, taza 24 pzas = $73.00/pza, $1,752.00 el pedido; playera vinil = $375.00).

La versión anterior quedó respaldada en `_backup/`.

---

## Ideas para después

- Cotizar varias líneas de producto en un mismo pedido (hoy es una línea a la vez). El PDF ya está armado como tabla de conceptos, así que soportar varias líneas es sobre todo trabajo del formulario.
- Historial: filtrar por rango de fechas y ver el total vendido del mes.
- Logo del negocio en el membrete del PDF (habría que guardarlo como base64 en localStorage para no romper el "un solo archivo, sin internet").

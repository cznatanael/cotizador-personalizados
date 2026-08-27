# Guía de uso — Cotizador Personalizados

## Qué es

Tu calculadora de precios: **una sola página** que funciona **sin internet** en celular o compu. Calcula cuánto cobrar por pieza considerando material, merma, luz (CFE), desgaste de máquinas, tu sueldo, gastos indirectos y utilidad — con menudeo y mayoreo automáticos.

## Cómo abrirla en tu celular (una vez)

Está publicada en internet, así que no tienes que mandarte ningún archivo:

**https://cznatanael.github.io/cotizador-personalizados/**

1. Abre esa dirección en **Chrome** (Android) o **Safari** (iPhone).
2. Chrome: menú ⋮ → **Agregar a pantalla principal**. Safari: botón Compartir → **Agregar a inicio**.
3. Queda con su ícono y abre a pantalla completa, como una app.
4. **Una vez que cargó, ya no necesita internet.** Tus datos se guardan en ese mismo teléfono.

> Los datos (ajustes e historial) viven en el navegador de **ese** dispositivo. Si cotizas desde compu y celular, configura ambos o usa **Exportar / Importar** en Ajustes.
>
> También puedes seguir usando el archivo `index.html` de la carpeta, sin internet, exactamente igual que antes.

---

## Cómo cotizar (frente al cliente)

Es **una sola pantalla** y el precio se calcula **mientras escribes**. No hay pasos ni botón de "calcular".

1. Elige la **técnica** (Sublimación · Vinil · Láser · 3D) y luego el **producto**.
2. Captura los datos. Todo viene precargado, normalmente solo tocas 2 o 3 campos.
3. Si la pieza lleva **más de una técnica** (playera con vinil + sublimación + láser), agrégalas en **Otros procesos sobre la misma pieza**. El blanco se cobra una sola vez.
4. Abajo, fijo en pantalla, ves siempre **el precio por pieza** y **el total del pedido**.
5. Ajusta la **cantidad** con los botones `−` / `+` o los atajos **1 · 6 · 12 · 24 · 50 · 100**. El descuento por volumen se aplica solo y te dice en qué tramo estás.
6. La **barra de mercado** te muestra si tu precio quedó dentro, arriba o abajo del rango real que se cobra en México.
7. **Desglose** abre el detalle completo: material, luz, máquina, mano de obra, indirectos, utilidad → precio final.
8. **Guardar** → pide el nombre del cliente y lo manda al Historial.
9. Desde el Historial: **Enviar** (arma el mensaje de WhatsApp con vigencia de 15 días), **Duplicar** (recarga esa cotización completa para modificarla) o **Desglose**.

### Precio y utilidad

- El **slider de utilidad** deja subir o bajar el margen ahí mismo, sin entrar a Ajustes. Es solo para esa cotización.
- El **piso de rentabilidad (15% sobre costo)** nunca se rompe: la app no te deja venderte barato por error.
- El switch **Venta en línea** sube el precio lo necesario para absorber la comisión de la plataforma (Mercado Libre, Facebook, etc.) y que te quede tu utilidad limpia. Apagado por defecto.

---

## Cotiza lo que sea: agrega tus propios productos

Los productos que trae la app son sólo un punto de partida. En cualquier técnica, al final de la lista de productos, hay un chip **"+ Otro producto"**.

Le pones nombre (*Lápiz grabado*, *Vaso de vidrio*, *Termo*, *Llavero de acrílico*), dices **cómo compras el material** y cuánto te cuesta el blanco. Queda guardado y aparece siempre, junto a los demás.

Para borrarlos: **Ajustes → Mis productos**. Y viajan en el respaldo de **Exportar** / **Importar**, así que no los pierdes al cambiar de celular.

---

## Captura el material como TÚ lo compras

El filamento se compra por kilo, no por gramo. El vinil por rollo. El papel por paquete. La app ya no te obliga a sacar la cuenta: eliges la unidad y ella hace la conversión.

| Técnica | Puedes capturar |
|---|---|
| Sublimación | por **hoja** o por **paquete** (precio + cuántas hojas trae) |
| Vinil | por **metro** o por **rollo** (precio + cuántos metros trae) |
| Impresión 3D | por **kilo** (así viene de fábrica) o por gramo |
| Láser | por **hoja** (y cuántas piezas salen) o **por pieza** |

Abajo del campo siempre te dice a cuánto sale la unidad real: *"Sale el gramo en $0.4500"*, *"Sale el metro en $90.00"*.

**El modo "por pieza" del láser es para grabar cosas que compras enteras**: lápices, vasos, termos, tablas. Ahí no tiene sentido preguntarte cuántas piezas salen de la hoja, así que ese campo desaparece.

---

## Varios colores o capas (vinil, láser y 3D)

Un diseño rara vez lleva un solo material. Una playera puede ir en negro **y** rojo glitter; una figura 3D en dos filamentos; un llavero láser lleva base y frente encimados. Por eso el bloque **Colores / Capas** deja poner hasta **8**.

1. Escribe el nombre del primer color o capa: *Negro*, *Base MDF*, *Frente acrílico*. El nombre es sólo para ti y para el desglose — no cambia el precio.
2. Captura sus datos (los cm de manta, los gramos, las piezas por hoja… según la técnica).
3. Toca **+ Agregar color** para el siguiente.
4. Si ese material te cuesta distinto (el glitter siempre cuesta más), cámbiale el precio **sólo a ese renglón**. Se marca como ajustado y no toca tu configuración.
5. Para quitar uno, toca la **×** de su renglón. Siempre queda al menos uno.

**Cada color extra cuesta tiempo, no sólo material.** Cuando hay más de uno aparece un campo para decir cuánto:

| Técnica | Campo | Viene en |
|---|---|---|
| Vinil | *Minutos por color extra* (cortar, plotear, encimar y planchar otra vez) | 4 min |
| Impresión 3D | *Minutos por cambio de color* (pausar, cambiar filamento, purgar) | 3 min |
| Láser | cada capa trae sus propios **minutos de láser** | — |

El desglose y el PDF listan cada color por su nombre, así que el cliente ve *"Vinil textil · Rojo glitter"* y tú sabes exactamente de dónde salió cada peso.

> **Sublimación no lleva capas** y es a propósito: imprime a todo color de un solo golpe. Si el diseño ocupa más área, lo que sube es el número de **hojas**.
>
> **En vinil por rollo todos los colores salen al mismo precio**, porque así lo compraste. Si un color te cuesta distinto, cambia a *"por metro"* y ahí sí puedes darle su precio a cada uno.

---

## Varias técnicas sobre la MISMA pieza

Un color extra es una cosa. Otra muy distinta es que la misma playera lleve **3 viniles, impresión a 4 tintas, grabado láser y otro vinil**. Eso ya no es un color más: son **cuatro trabajos encimados sobre una sola prenda**.

Para eso está el bloque **Otros procesos sobre la misma pieza**, abajo de Tiempos.

1. Cotiza normal el proceso principal (el que define el producto: la playera, el blanco, sus viniles).
2. Baja a **Otros procesos sobre la misma pieza** y toca la técnica que se le agrega: *Sublimación*, *Láser*, *Vinil*, *Impresión 3D*.
3. Aparece un panel numerado con **sus propios materiales, sus propias capas y sus propios tiempos**. Llénalo igual que el principal.
4. Repite hasta 4 procesos extra.
5. Para quitar uno, toca el bote de basura de su panel.

**Lo importante: el blanco se cobra UNA sola vez.** El panel de un proceso extra ni siquiera te pregunta el costo de la prenda — ya lo cobraste arriba. Si no fuera así, una playera de $110 con tres técnicas te saldría en $330 de puro blanco y estarías cotizando de más.

Lo que sí se suma de cada proceso:

| Se suma | Cómo |
|---|---|
| Materiales | cada proceso con **su propia merma** (el vinil se desperdicia distinto que el papel) |
| Máquina | cada máquina que interviene, aunque sea la misma plancha dos veces (son dos operaciones reales) |
| Mano de obra | los minutos de producción se acumulan |
| Diseño | el diseño de todos los procesos se prorratea entre las piezas del pedido |

Después de sumar todo se aplican el overhead, tu utilidad, el descuento por volumen y el piso mínimo — igual que siempre.

**En el desglose** aparece un bloque nuevo hasta arriba, *Procesos sobre la misma pieza*, con lo que cuesta cada uno por separado, y los materiales quedan agrupados por proceso. **En el PDF** el cliente ve las técnicas juntas (*"Vinil textil + Sublimación + Corte y grabado láser"*), sin un solo número de costo.

> Al agregar **Láser** como proceso extra, el producto se pone en *"Objeto del cliente"*: la pieza ya existe, sólo la estás grabando, así que el material arranca en $0. Si además cortas material propio, agrégalo como capa dentro de ese proceso.

---

## Cambiar el costo del material solo para una cotización

Cada técnica trae el campo del material editable, precargado con lo que tienes en Ajustes:

| Técnica | Campo |
|---|---|
| Sublimación | Costo por hoja de papel (o precio del paquete) |
| Vinil | Costo del vinil `$/m` (o precio del rollo) |
| Láser | Costo de la hoja + **Piezas que salen** — o el costo de cada pieza |
| Impresión 3D | Precio del rollo de filamento `$/kg` |

Si te subió el filamento, si conseguiste el vinil más barato o si el cliente trae su propio material (pon `0`), lo cambias ahí mismo.

Cuando el valor es distinto al de Ajustes, el campo se pinta y aparece la etiqueta **Solo esta cotización** con un botón **Restablecer**. La comparación te la muestra en tu misma unidad (*"Config: $320.00 /kg"*). Ese cambio **nunca** modifica tu configuración guardada: es de una sola vez.

Si el precio te cambió de verdad y es permanente, actualízalo en **Ajustes** para que quede como nuevo default.

---

## Mandarle el PDF al cliente

Botón **PDF**, tanto en la cotización que tienes en pantalla como en cada renglón del **Historial**.

Te pregunta a nombre de quién va y abre el diálogo de impresión del celular o la compu: ahí eliges **"Guardar como PDF"**. De ahí lo mandas por WhatsApp.

**El PDF sólo muestra el precio.** Nunca salen tus costos, tu margen, tu sueldo por hora ni el desglose interno — eso es tuyo, no del cliente. Lleva: tu nombre y teléfono, folio, fecha, concepto, cantidad, precio unitario, total y la vigencia.

Antes de usarlo la primera vez llena **Ajustes → Datos para la cotización** (nombre del negocio, teléfono y cuántos días vale la cotización). Si no, sale sin membrete.

---

## Primer uso — checklist de 5 minutos (pestaña Ajustes)

| Revisa | Por qué |
|---|---|
| **Datos para la cotización** | Tu nombre y teléfono. Es lo que ve el cliente en el PDF |
| **Tarifa de luz** | Default $1.10/kWh (doméstica). Si tu recibo CFE dice **DAC**, usa el botón "Tarifa DAC" ($6.65) — cambia todo el costeo |
| **Sueldo por hora** | Default $75/h. Es TU sueldo: si no lo cobras, lo regalas |
| **Tus máquinas** | Precargadas con precios reales 2026 (Cricut $7,800, Falcon $10,500, Bambu $12,000…). Ábrelas y verás su **costo por hora** calculado en vivo. Si pagaste distinto, corrígelo |
| **Insumos** | Precios de MercadoLibre / ColorMake ago-2026. Pon lo que **tú** pagas (taza $30, vinil textil $230/m, PLA $320/kg…) |
| **Utilidad menudeo** | Default 60% de markup sobre el costo total. Súbela en productos únicos o difíciles |

Mientras editas aparece abajo una barra con **Guardar** / **Descartar**: nada se guarda hasta que tocas Guardar. Al terminar, usa **Exportar** para tener un respaldo del JSON (incluye tus productos propios).

---

## Detalles del modelo que te cuidan

- **Merma incluida**: cada técnica carga su % de error (sublimación 5%, vinil 8%, láser 6%, 3D 10%) — la taza que sale mal la paga el precio, no tú.
- **Diseño prorrateado**: 30 min de diseño en un pedido de 50 piezas son centavos por pieza; en 1 pieza se cobra completo. Por eso el mayoreo puede ser más barato sin perder.
- **3D**: la Bambu trabaja sola — solo se cobra tu tiempo de preparación y supervisión, no las horas de impresión (esas cobran luz + desgaste de máquina).
- **Tramos de mayoreo**: 6-11 −5% · 12-23 −10% · 24-49 −15% · 50-99 −20% · 100+ −25%.
- **Redondeo psicológico**: siempre hacia **arriba** a terminaciones limpias ($107.15 → $110).
- **Memoria**: la app recuerda los últimos valores que usaste en cada combinación técnica + producto, así no recapturas lo mismo cada vez.

---

## Datos que conviene afinar con el tiempo

1. **Watts reales de tus planchas** — un wattímetro cuesta ~$250 en ML y se paga solo.
2. **Tinta por hoja** — haz una prueba: imprime 50 hojas y mide cuánta tinta bajó.
3. **Merma real tuya** — si en 100 tazas fallas 2, baja la merma de 5% a 2% y gana competitividad.

Todos los números viven en **Ajustes**; el modelo completo está explicado en `MODELO_COSTEO.md`.

---

## Archivos de esta carpeta

| Archivo | Qué es |
|---|---|
| `index.html` | **LA APP** — es la que se publica y la que puedes copiar al celular |
| `cotizador.html` | Reenvío a `index.html`, para los accesos directos viejos |
| `README.md` | Presentación del proyecto y dirección web |
| `MODELO_COSTEO.md` | El modelo de costeo completo: fórmulas, parámetros, ejemplo paso a paso |
| `DATOS_MERCADO_MX.md` | Investigación de precios reales MX 2026 (fuentes y rangos) |
| `PENDIENTES.md` | Bitácora de qué se arregló y qué falta |
| `test-calc.mjs` | Regresión del motor: `node test-calc.mjs` (extrae las fórmulas del propio HTML) |
| `verify-all-combos.mjs` | Prueba la interfaz completa y las 12 combinaciones técnica × producto |
| `verify-persistencia.mjs` | Prueba que ajustes e historial sobrevivan al recargar |
| `_backup/` | Versiones anteriores por si algo se rompe |

### Si editas el HTML, corre esto antes de darlo por bueno

```powershell
cd C:\Users\cznat\ProyectosCopilot\cotizador-personalizados
node test-calc.mjs
node verify-all-combos.mjs
node verify-persistencia.mjs
```

Los tres deben terminar en verde. `test-calc.mjs` lee el motor directo de `index.html`, así que detecta cualquier fórmula que hayas movido.

### Para publicar el cambio en internet

```powershell
cd C:\Users\cznat\ProyectosCopilot\cotizador-personalizados
git add -A
git commit -m "lo que cambiaste"
git push
```

En ~1 minuto la dirección web ya trae la versión nueva.

# Modelo de Costeo — Cotizador de Productos Personalizados

**Versión:** 1.0
**Moneda:** MXN (pesos mexicanos)
**Alcance:** Vinil de corte, Sublimación, Láser (Creality Falcon A 10W), Impresión 3D FDM (Bambu Lab P1S)
**Perfil del negocio:** taller en casa, dueño solo o con 1 ayudante, venta menudeo y mayoreo.

> ✅ **Actualización con datos de mercado (24-ago-2026):** `tarifaKwh`, `sueldoHora`, la tabla de máquinas (sección 2: costo de compra, watts, vida útil) y el catálogo de insumos (sección 7) ya están calibrados con `DATOS_MERCADO_MX.md` (investigación real MercadoLibre/ColorMake/CONASAMI/CFE). **Siguen siendo estimaciones razonadas** (no de mercado): `overheadPct`, `mermaPct` por técnica, `utilidadMenudeoPct`/`utilidadMinimaPct`, la tabla de descuentos de mayoreo, las `fraccionesTiempo`, y el mantenimiento anual/horas de uso de cada máquina — ajustar con datos reales de operación propios cuando se tengan. Cada parámetro está **nombrado** para eso.
>
> **Convención de nombres:** en las fórmulas (sección 3) se usa `snake_case` (ej. `costo_materiales`) porque así es como se leen mejor las ecuaciones matemáticas. En el JSON de configuración (sección 7) se usa `camelCase` español (ej. `costoMateriales`) porque así se consume en JavaScript/HTML. Las tablas de las secciones 1 y 2 incluyen ambas referencias para que no se pierda la trazabilidad.

---

## 1. Parámetros de configuración global (se capturan UNA vez)

Estos valores viven en una sola pantalla de "Configuración" de la app y alimentan **todas** las cotizaciones. El usuario los revisa quizá una vez al año (o cuando suba la luz, cambie su meta de sueldo, etc.).

| Parámetro | Variable (JSON) | Unidad | Default sugerido | Explicación en lenguaje simple |
|---|---|---|---|---|
| Tarifa eléctrica CFE | `tarifaKwh` | MXN/kWh | **1.10** | Lo que cuesta cada kWh consumido. Dato real CFE 2026: tarifa 1C (doméstica, zona cálida, hasta 850 kWh/mes) ronda $1.10. Ajustar con el recibo real de CFE; revisar en verano vs invierno. **Si el recibo llega en tarifa DAC** (alto consumo, sin subsidio), el costo real sube a **~$6.65/kWh** — ver `tarifaKwhDAC` en el JSON, cambia todo el costeo. |
| Sueldo por hora deseado del dueño | `sueldoHora` | MXN/hora | **75** | Cuánto quiere ganar el dueño (o pagarle al ayudante) por cada hora de su tiempo — diseño, producción, acabado. Si no se cobra esto, el negocio "regala" el trabajo. Dato real de mercado: operador de taller de personalizados ronda $72.88/h (jooble MX); $75/h es el default conservador. |
| Sueldo mensual deseado *(auxiliar, opcional)* | `sueldoMensualDeseado` | MXN/mes | 15,000 | Ayuda a **derivar** `sueldoHora`: 15,000 ÷ 200 h = 75 MXN/h. Solo es una calculadora de apoyo, no se usa directo en las fórmulas de cotización. |
| Horas laborales al mes *(auxiliar, opcional)* | `horasLaboralesMes` | horas/mes | 200 | Base para el cálculo anterior (≈ 8 h/día × 25 días). |
| % de gastos indirectos / overhead | `overheadPct` | % | **15%** | Cubre lo que no se puede asignar a una pieza específica: internet, empaque básico (bolsas, cinta, cajas), gasolina/transporte para comprar insumos o entregar pedidos, desgaste de tijeras/espátulas/guantes, y la luz "ambiental" del taller (foco, ventilador — no la de las máquinas, esa ya se cuenta aparte). Se aplica como % sobre el costo directo de cada pieza. |
| % de merma/error — Vinil | `mermaPct.vinil` | % | **8%** | Vinil que se desperdicia al cortar, errores de deshierbe, mal alineado. |
| % de merma/error — Sublimación | `mermaPct.sublimacion` | % | **10%** | Hojas mal impresas, "ghosting", blancos defectuosos, prensados fallidos. Es la técnica con más variabilidad. |
| % de merma/error — Láser | `mermaPct.laser` | % | **5%** | Corte/grabado es preciso; el desperdicio es mínimo (algún quemado o mal enfoque ocasional). |
| % de merma/error — Impresión 3D | `mermaPct.impresion3d` | % | **7%** | Piezas falladas por warping, "spaghetti", mala adhesión a la cama. |
| % de utilidad objetivo menudeo | `utilidadMenudeoPct` | % (markup sobre costo) | **60%** | El precio de una pieza individual se calcula como costo × 1.60. **Ojo:** esto es *markup* (sobre costo), no margen (sobre precio). 60% de markup ≈ 37.5% de margen sobre el precio final. No confundir al reportar rentabilidad. |
| % de utilidad mínima (piso) | `utilidadMinimaPct` | % (markup sobre costo) | **15%** | El descuento de mayoreo JAMÁS puede bajar el precio de una pieza por debajo de costo × 1.15. Es la red de seguridad para no vender con pérdida al negociar. |
| Tabla de descuentos mayoreo por rango de cantidad | `tablaMayoreo` | tabla (ver sección 5) | ver sección 5 | Qué % de descuento se aplica automáticamente según cuántas piezas pide el cliente. |
| % comisión venta en línea *(opcional)* | `comisionVentaOnlinePct` | % | **5%** | Si el pedido se cobra por una plataforma que cobra comisión (Mercado Libre, pago con tarjeta en línea, etc.), se usa para "engrosar" el precio y que el negocio siga recibiendo el 100% del precio de lista. Se activa por pedido con el switch `aplicaComisionVentaOnline`. |
| Valor de rescate de las máquinas | `valorRescatePct` | % del costo de compra | **10%** | Al final de su vida útil, se asume que la máquina todavía se puede vender/reciclar por este % de lo que costó nueva. Reduce la base que se deprecia. |

---

## 2. Parámetros por máquina

### 2.1 Datos de entrada (se capturan una vez por máquina)

| Máquina | ID (JSON) | Costo compra (MXN) | Vida útil (horas) | Watts | Mantenimiento anual (MXN) | Horas de uso anual estimadas |
|---|---|---:|---:|---:|---:|---:|
| Cricut Maker (corte) | `cricutMaker` | 7,800 | 2,000 | 70 | 300 | 300 |
| Impresora sublimación (EcoTank adaptada) | `impresoraSublimacion` | 6,500 | 3,000 | 20 | 900 | 400 |
| Plancha plana 38×38 (playeras) | `planchaPlana` | 8,500 | 5,000 | 2,000 | 200 | 250 |
| Plancha para taza (11oz) | `planchaTaza` | 3,200 | 5,000 | 1,500 | 150 | 300 |
| Plancha para gorra | `planchaGorra` | 2,800 | 5,000 | 400 | 150 | 150 |
| Plancha para tumbler (20oz) | `planchaTumbler` | 3,500 | 5,000 | 600 | 180 | 150 |
| Plancha para tequilero | `planchaTequilero` | 2,400 | 5,000 | 300 | 150 | 100 |
| Láser Creality Falcon A 10W | `falconA10W` | 10,500 | 3,000 | 100 | 400 | 400 |
| Impresora 3D Bambu Lab P1S | `bambuP1S` | 12,000 | 5,000 | 300 | 500 | 900 |

> **Fuente:** costo de compra, watts y vida útil vienen de `DATOS_MERCADO_MX.md` (rangos reales de mercado MX, ago-2026). `mantenimientoAnualMxn` y `horasUsoAnual` siguen siendo estimaciones razonadas del negocio (no investigadas en campo).

> **Nota sobre watts:** para las planchas se usa la potencia **real en uso** reportada por el mercado (fichas técnicas/ML), que ya es más alta que una simple estimación nominal — es una cifra conservadora/segura porque el termostato de todas formas cicla on/off. Para el láser y la impresora 3D se usa la **potencia promedio real de operación**, no la de pico (ej. Bambu P1S trae fuente de hasta 1000W nominales, pero en operación normal de impresión consume mucho menos — se usa 300W como estimado promedio real). Ajustar con un medidor de consumo (tipo "Kill-A-Watt") si se quiere precisión total.

### 2.2 Fórmulas de costo por hora

```
depreciación_por_hora   = (costo_compra − costo_compra × valorRescatePct) / vida_util_horas
mantenimiento_por_hora  = mantenimiento_anual_mxn / horas_uso_anual
luz_por_hora            = (watts / 1000) × tarifaKwh
costo_maquina_por_hora  = depreciación_por_hora + mantenimiento_por_hora + luz_por_hora
```

### 2.3 Costo por hora ya calculado (con los defaults de arriba, `tarifaKwh=1.10`, `valorRescatePct=10%`)

| Máquina | Depreciación/h | Mantenimiento/h | Luz/h | **Costo máquina/h** |
|---|---:|---:|---:|---:|
| Cricut Maker | $3.51 | $1.00 | $0.08 | **$4.59** |
| Impresora sublimación | $1.95 | $2.25 | $0.02 | **$4.22** |
| Plancha plana 38×38 | $1.53 | $0.80 | $2.20 | **$4.53** |
| Plancha taza | $0.58 | $0.50 | $1.65 | **$2.73** |
| Plancha gorra | $0.50 | $1.00 | $0.44 | **$1.94** |
| Plancha tumbler | $0.63 | $1.20 | $0.66 | **$2.49** |
| Plancha tequilero | $0.43 | $1.50 | $0.33 | **$2.26** |
| Láser Falcon A 10W | $3.15 | $1.00 | $0.11 | **$4.26** |
| Impresora 3D Bambu P1S | $2.16 | $0.56 | $0.33 | **$3.05** |

*(Cifras redondeadas a 2 decimales para lectura; la app debe guardar y calcular con precisión completa, no con estos redondeos.)*

**Lectura rápida (actualizada con datos de mercado):** al bajar las vidas útiles reales (Cricut 2,000h, Falcon 3,000h) y subir los costos de compra, la **depreciación** ahora es el componente más pesado en Cricut, Falcon y Bambu — son máquinas que "se gastan" más rápido de lo que se asumía originalmente. La **luz** domina en la plancha plana y la plancha de taza (consumen 1,500–2,000W reales, más de lo asumido antes). El **mantenimiento** sigue pesando más en gorra/tumbler/tequilero, planchas de bajo uso anual. Conclusión práctica: el costo/hora de casi todas las máquinas subió frente al modelo con defaults genéricos — impacta más a técnicas de ciclos cortos (vinil, sublimación) que a impresión 3D de piezas grandes.

---

## 3. Fórmula maestra de costeo

### 3.1 Paso a paso

1. **`costo_materiales`** = Σ(insumo × cantidad) × (1 + merma_técnica)
   → Suma de todos los insumos usados en la pieza (blanco, vinil, filamento, hojas, etc.), multiplicada por el factor de merma de esa técnica.

2. **`costo_maquina`** = Σ(costo_maquina_por_hora × horas_uso_por_pieza)
   → Se suma el costo/hora de **cada** máquina que tocó la pieza (una pieza puede usar 2: ej. Cricut + plancha, o impresora de sublimación + plancha de taza).

3. **`costo_mano_obra`** = sueldo_hora × (tiempo_diseño_prorrateado + tiempo_producción + tiempo_acabado)
   → **OJO:** `tiempo_diseño_prorrateado` = tiempo_diseño_total_del_pedido ÷ cantidad_piezas_del_pedido. El diseño se cobra **una vez por pedido**, no una vez por pieza — si el pedido es de 20 piezas iguales, cada una absorbe 1/20 del tiempo de diseño, no el tiempo completo.
   → Excepción importante en 3D: ver sección 4.4 (`horas_máquina ≠ horas_persona`).

4. **`costo_directo`** = `costo_materiales` + `costo_maquina` + `costo_mano_obra`

5. **`costo_total`** = `costo_directo` × (1 + `overheadPct`)

6. **`precio_menudeo`** = `costo_total` × (1 + `utilidadMenudeoPct`) → aplicar **redondeo psicológico** (sección 6)

7. **`precio_mayoreo(qty)`** = `precio_menudeo` × (1 − `descuento_del_rango`(qty))
   **Regla de piso:** `precio_mayoreo(qty) = max( precio_mayoreo(qty), costo_total × (1 + utilidadMinimaPct) )`
   → Nunca se vende, ni con el descuento más agresivo, por debajo de `costo_total × 1.15` (default). Después de aplicar el piso, se vuelve a pasar por el redondeo psicológico (el redondeo siempre es hacia arriba, así que nunca puede tirar el precio de vuelta debajo del piso).

8. **(Opcional) Ajuste por comisión de venta en línea**, solo si `aplicaComisionVentaOnline = true` para ese pedido/canal:
   `precio_canal_online = precio_final / (1 − comisionVentaOnlinePct)`
   → Esto "engorda" el precio para que, después de que la plataforma cobre su comisión sobre el precio de venta, al negocio le siga quedando el precio de lista completo. No se mezcla con el paso 7; se aplica **después**, solo al precio que se muestra en ese canal específico.

### 3.2 Ejemplo numérico completo — Taza sublimada, pedido de 1 pieza (menudeo)

**Inputs capturados por el usuario:**

| Campo | Valor |
|---|---|
| Producto | Taza 11oz |
| Cantidad del pedido | 1 |
| Costo del blanco (taza sublimable) | $30.00 |
| Hojas de sublimación usadas | 1 |
| Minutos de planchado + impresión | 7 min |
| Minutos de diseño total del pedido | 10 min |

**Paso 1 — Materiales** *(usa `costoPorHojaSublimacion = $3.30` del catálogo, sección 7)*
```
materiales_base   = 30.00 (blanco) + 1 × 3.30 (hoja) = $33.30
costo_materiales  = 33.30 × (1 + 0.10 merma sublimación) = $36.63
```

**Paso 2 — Máquina** *(el bloque de "7 min planchado+impresión" se reparte 20% impresora / 80% plancha, ver sección 4.1)*
```
horas_impresora = (7 × 0.20) / 60 = 0.02333 h  →  0.02333 × $4.22/h = $0.098
horas_plancha   = (7 × 0.80) / 60 = 0.09333 h  →  0.09333 × $2.73/h = $0.255
costo_maquina   = $0.098 + $0.255 ≈ $0.35
```

**Paso 3 — Mano de obra** *(pedido de 1 pieza → todo el diseño lo carga esta pieza)*
```
tiempo_diseño_prorrateado = 10 min / 1 = 10 min
tiempo_mano_obra_total    = 10 min (diseño) + 7 min (producción, bloque completo) = 17 min = 0.2833 h
costo_mano_obra           = 75 × 0.2833 = $21.25
```

**Paso 4 — Costo directo**
```
costo_directo = 36.63 + 0.35 + 21.25 = $58.23
```

**Paso 5 — Costo total (+ overhead 15%)**
```
costo_total = 58.23 × 1.15 = $66.97
```

**Paso 6 — Precio menudeo (+ utilidad 60%, luego redondeo)**
```
precio_menudeo_bruto = 66.97 × 1.60 = $107.15
precio_menudeo_final = redondeo psicológico($107.15) = $110.00   ← múltiplo de $5 hacia arriba (rango $100-500)
```

**➡️ Precio de venta al público: $110.00 MXN por taza.** Margen sobre precio de venta ≈ 39% (utilidad de $43.03 sobre $110).

### 3.3 Continuación: el mismo diseño, pero pedido de 24 piezas (mayoreo)

Esto muestra por qué el diseño "se diluye" y cómo funciona la regla de piso.

```
tiempo_diseño_prorrateado = 10 min / 24 = 0.417 min  (casi cero)
tiempo_mano_obra_total    = 0.417 + 7 = 7.417 min = 0.1236 h
costo_mano_obra           = 75 × 0.1236 = $9.27   (vs. $21.25 cuando era 1 sola pieza)

costo_directo = 36.63 + 0.35 + 9.27 = $46.25
costo_total   = 46.25 × 1.15 = $53.19
precio_menudeo_referencia = 53.19 × 1.60 = $85.11 → redondeado = $85.50

descuento rango 24-49 pzas = 15% (sección 5)
precio_mayoreo_bruto = 85.50 × (1 − 0.15) = $72.68

piso = costo_total × 1.15 = 53.19 × 1.15 = $61.17
¿72.68 < 61.17?  No → el descuento NO viola el piso, se respeta.

precio_mayoreo_final (redondeado, < $100 → múltiplo de $0.5) = $73.00 por pieza
```

**➡️ Precio de venta por mayoreo: $73.00 MXN/pieza × 24 = $1,752.00 MXN el pedido**, con un margen todavía sano (>15% garantizado por el piso, en este caso el margen real resultante es de ~37% sobre costo). Si el dueño intentara dar, digamos, 40% de descuento sobre el precio de menudeo ($51.30/pieza), el sistema debe **rechazarlo o alertarlo** porque cae debajo del piso de $61.17 y forzar el precio al piso redondeado ($61.50).

---

## 4. Inputs por cotización según técnica

Regla de oro: **el usuario captura lo mínimo indispensable**; todo lo demás (tarifas, costos de máquina, fracciones de tiempo, mermas) sale de la configuración global. Los combos de tiempo (ej. "planchado+impresión") se capturan como **un solo número** para no cansar al usuario, y el modelo los reparte internamente entre máquina y mano de obra usando **fracciones de tiempo** configurables (sección 4.5).

### 4.1 Sublimación

| Campo a capturar | Tipo | Ejemplo |
|---|---|---|
| Producto | selector: taza / playera / gorra / tumbler / tequilero | taza |
| Cantidad del pedido | número entero | 12 |
| Costo del blanco | MXN (prellenado desde catálogo, editable) | 30.00 |
| Hojas de sublimación usadas | número (puede ser decimal, ej. 0.5) | 1 |
| Minutos de planchado + impresión | minutos | 7 |
| Minutos de diseño total del pedido | minutos (una sola vez, no por pieza) | 10 |

**Máquinas involucradas (automático según producto):** impresora de sublimación **siempre** + la plancha específica del producto (taza→`planchaTaza`, playera→`planchaPlana`, gorra→`planchaGorra`, tumbler→`planchaTumbler`, tequilero→`planchaTequilero`).

**Cómo se reparte el tiempo capturado:** de los minutos de "planchado+impresión", 20% se cuenta como tiempo de la impresora y 80% como tiempo de la plancha (la impresión es rápida, el prensado tarda más). El **100%** del bloque se cuenta como mano de obra (el operador está presente todo el tiempo, no puede dejar la plancha sola). No hay campo de "acabado" separado: retirar el papel y limpiar la pieza se consideran incluidos en ese mismo bloque de minutos.

### 4.2 Vinil de corte

| Campo a capturar | Tipo | Ejemplo |
|---|---|---|
| Producto/blanco | selector: playera / gorra / superficie rígida (adhesivo) | playera |
| Cantidad del pedido | número entero | 6 |
| Cm de vinil usados (o fracción de metro) | centímetros | 25 |
| Tipo de vinil | selector: textil / adhesivo | textil |
| Minutos de corte + deshierbe + planchado | minutos | 12 |
| Minutos de diseño total del pedido | minutos | 8 |

**Máquinas involucradas:** Cricut Maker **siempre** + `planchaPlana` (si es playera) o `planchaGorra` (si es gorra) **solo cuando el tipo de vinil es textil**. Si el vinil es adhesivo sobre superficie rígida, no hay plancha (se aplica a mano con espátula/rodillo).

**Cómo se reparte el tiempo capturado** (config `fraccionesTiempo.vinilTextil` / `vinilAdhesivo`):
- Vinil **textil**: 30% corte (Cricut) + 40% planchado (plancha) + 30% deshierbe (sin máquina, solo mano de obra).
- Vinil **adhesivo**: 30% corte (Cricut) + 40% aplicación manual (sin máquina) + 30% deshierbe (sin máquina).
- El **100%** del bloque cuenta como mano de obra en ambos casos.

Costo de vinil = `cm_usados / 100 × costoPorMetroVinil(textil o adhesivo, según selector)`.

### 4.3 Láser (Creality Falcon A 10W)

| Campo a capturar | Tipo | Ejemplo |
|---|---|---|
| Material | selector: MDF 3mm / acrílico / objeto del cliente | MDF 3mm |
| Costo de material por pieza (o fracción de hoja) | MXN (prellenado si es MDF/acrílico de catálogo; $0 si es objeto del cliente) | 12.00 |
| Minutos de láser por pieza | minutos | 6 |
| Minutos de armado/acabado | minutos | 4 |
| Minutos de diseño total del pedido | minutos | 15 |

**Máquinas involucradas:** solo `falconA10W`. Aquí **no** se necesita repartir fracciones: "minutos de láser" ya es 100% tiempo de máquina (y también 100% mano de obra, porque el láser requiere supervisión por seguridad — no se deja corriendo solo). "Minutos de armado/acabado" es 100% mano de obra, 0% máquina (lijar, pegar, quitar rebabas).

### 4.4 Impresión 3D (Bambu Lab P1S)

| Campo a capturar | Tipo | Ejemplo |
|---|---|---|
| Gramos de filamento | gramos | 42 |
| Tipo de filamento | selector: PLA / PETG | PLA |
| Horas de impresión | horas (puede ser decimal) | 3.5 |
| Minutos de post-proceso | minutos | 8 |
| Minutos de diseño/laminado del pedido | minutos | 10 |

**Máquinas involucradas:** solo `bambuP1S`.

**⚠️ Regla especial — `horas_máquina ≠ horas_persona`:** en 3D la máquina imprime sola durante horas; el operador **no** está pagado por sueldo/hora durante todo ese tiempo, solo lo está la máquina (que ya tiene su propio costo/hora de depreciación+mantenimiento+luz). La mano de obra real es mucho más corta:
```
costo_maquina  = horas_impresión × costo_maquina_por_hora(bambuP1S)     ← 100% del tiempo, sin excepción
tiempo_persona = tiempoSupervisionImpresion3DMin (config, default 10 min FIJOS por impresión,
                  no por hora) + minutos_post_proceso + tiempo_diseño_prorrateado
costo_mano_obra = sueldo_hora × (tiempo_persona / 60)
```
Los 10 minutos de supervisión (cargar filamento, iniciar impresión, retirar pieza) **también se prorratean** si en una sola impresión (una placa) caben varias piezas — igual que el tiempo de diseño. Ejemplo: si se imprimen 6 piezas iguales en la misma placa/impresión, cada pieza absorbe 10/6 ≈ 1.7 min de supervisión, no los 10 min completos.

Costo de material = `gramos × costoPorGramo(PLA o PETG, según selector) × (1 + mermaPct.impresion3d)`.

### 4.5 Resumen — parámetros de apoyo que viven en config (no se capturan cada vez)

| Parámetro | Variable (JSON) | Default |
|---|---|---|
| Fracción de tiempo → impresora (sublimación) | `fraccionesTiempo.sublimacion.impresora` | 0.20 |
| Fracción de tiempo → plancha (sublimación) | `fraccionesTiempo.sublimacion.plancha` | 0.80 |
| Fracción de tiempo → Cricut (vinil textil) | `fraccionesTiempo.vinilTextil.cricut` | 0.30 |
| Fracción de tiempo → plancha (vinil textil) | `fraccionesTiempo.vinilTextil.plancha` | 0.40 |
| Fracción de tiempo → deshierbe (vinil textil) | `fraccionesTiempo.vinilTextil.deshierbe` | 0.30 |
| Fracción de tiempo → Cricut (vinil adhesivo) | `fraccionesTiempo.vinilAdhesivo.cricut` | 0.30 |
| Fracción de tiempo → aplicación manual (vinil adhesivo) | `fraccionesTiempo.vinilAdhesivo.aplicacionManual` | 0.40 |
| Fracción de tiempo → deshierbe (vinil adhesivo) | `fraccionesTiempo.vinilAdhesivo.deshierbe` | 0.30 |
| Minutos fijos de supervisión por impresión 3D | `tiempoSupervisionImpresion3DMin` | 10 |

---

## 5. Escalones de mayoreo sugeridos

| Rango de cantidad | Etiqueta | % Descuento sugerido | Justificación |
|---|---|---:|---|
| 1 – 5 pzas | Menudeo | **0%** | Precio de lista completo. Cada pieza absorbe su parte proporcional de diseño/setup sin descuento; no hay economía de escala real. |
| 6 – 11 pzas | Mayoreo chico | **5%** | El tiempo de diseño y el setup de máquina empiezan a diluirse entre más piezas, aunque el operador casi siempre sigue atendiendo pieza por pieza. |
| 12 – 23 pzas | Mayoreo medio | **10%** | Ya se produce por lote (varias piezas prensándose/cortándose en la misma sesión). El diseño está prácticamente diluido a cero por pieza. |
| 24 – 49 pzas | Mayoreo grande | **15%** | Típico pedido escolar chico o de revendedor. El operador agarra ritmo/curva de aprendizaje: el tiempo real por pieza baja porque se repiten los mismos movimientos. |
| 50 – 99 pzas | Mayoreo mayor | **20%** | Pedido de volumen (escuela, evento, empresa). Suele justificar comprar el insumo en presentación más grande y más barata al proveedor (ajustar el costo del insumo manualmente si aplica). |
| 100+ pzas | Institucional | **25%** (tope sugerido) | Pedido grande. El mayor volumen justifica el descuento, pero **siempre** se debe validar contra `utilidadMinimaPct` antes de confirmar, y revisar la capacidad real de producción/tiempo de entrega antes de comprometerse. |

> Nota: estos % son el **default de arranque** de la tabla `tablaMayoreo` en config; el dueño puede editarlos, pero la **regla de piso** (sección 3, paso 7) siempre debe aplicarse encima, sin excepción, para que ningún descuento manual termine vendiendo con pérdida.

---

## 6. Redondeo psicológico y precio mínimo

### 6.1 Reglas de redondeo (siempre hacia ARRIBA, nunca hacia abajo)

| Rango de precio | Regla | Ejemplo |
|---|---|---|
| Menor a $100 | Redondear hacia arriba al siguiente múltiplo de **$0.50** | $47.32 → $47.50 |
| De $100 a $500 (inclusive) | Redondear hacia arriba al siguiente múltiplo de **$5** | $107.15 → $110.00 |
| Mayor a $500 | Redondear hacia arriba al siguiente múltiplo de **$10** | $842.10 → $850.00 |

**Pseudocódigo:**
```
función redondearPsicologico(precio):
  si precio < 100:        devolver ceil(precio / 0.5) × 0.5
  si no si precio <= 500:  devolver ceil(precio / 5)   × 5
  si no:                   devolver ceil(precio / 10)  × 10
```

El redondeo **nunca resta**, solo suma hasta el siguiente escalón — así jamás puede tirar un precio por debajo del piso de utilidad mínima calculado en el paso anterior.

*(Variante opcional, no incluida por default: "precio encanto" terminado en 9, ej. $139 en vez de $140 — se puede activar como un ajuste posterior si el negocio lo prefiere, pero complica la contabilidad mental del dueño y no es la regla base de este modelo.)*

### 6.2 Regla de piso (precio mínimo absoluto)

```
precio_final = max( precio_calculado_con_descuento , costo_total × (1 + utilidadMinimaPct) )
precio_final = redondearPsicologico(precio_final)
```

- Se aplica **siempre**, tanto en menudeo (raro que se active) como sobre todo en mayoreo y negociaciones especiales.
- `utilidadMinimaPct` default = **15%** — es un colchón, no la utilidad deseada; si el precio final "vive" en el piso muy seguido, es señal de que el descuento de ese rango está mal calibrado y hay que revisar la tabla de la sección 5.
- El orden de operaciones correcto es: (1) calcular precio con descuento → (2) compararlo contra el piso y quedarse con el mayor de los dos → (3) redondear psicológicamente el resultado. Redondear antes de comparar con el piso puede dar falsos positivos/negativos por unos centavos.

---

## 7. JSON Schema para la app

Objeto de configuración completo, con los defaults de este documento, listo para ser el `config.json` (o `const CONFIG = {...}`) que consume la app HTML. Todas las claves en camelCase español. Los valores de porcentaje se guardan como fracción decimal (0.15 = 15%).

```json
{
  "version": "1.1",
  "moneda": "MXN",
  "notasVigencia": "tarifaKwh, sueldoHora, maquinas y catalogoInsumos calibrados con DATOS_MERCADO_MX.md (mercado MX, ago-2026). overheadPct, mermaPct, utilidadMenudeoPct/utilidadMinimaPct, tablaMayoreo, fraccionesTiempo y mantenimiento/horasUsoAnual de maquinas siguen siendo estimaciones razonadas, no de mercado.",

  "configGlobal": {
    "tarifaKwh": 1.10,
    "tarifaKwhDAC": 6.65,
    "sueldoHora": 75,
    "sueldoMensualDeseado": 15000,
    "horasLaboralesMes": 200,
    "overheadPct": 0.15,
    "valorRescatePct": 0.10,
    "utilidadMenudeoPct": 0.60,
    "utilidadMinimaPct": 0.15,
    "comisionVentaOnlinePct": 0.05,
    "aplicaComisionVentaOnline": false,
    "mermaPct": {
      "vinil": 0.08,
      "sublimacion": 0.10,
      "laser": 0.05,
      "impresion3d": 0.07
    },
    "tiempoSupervisionImpresion3DMin": 10
  },

  "fraccionesTiempo": {
    "sublimacion": { "impresora": 0.20, "plancha": 0.80 },
    "vinilTextil": { "cricut": 0.30, "plancha": 0.40, "deshierbe": 0.30 },
    "vinilAdhesivo": { "cricut": 0.30, "aplicacionManual": 0.40, "deshierbe": 0.30 },
    "laser": { "laser": 1.0 }
  },

  "maquinas": {
    "cricutMaker": {
      "nombre": "Cricut Maker",
      "costoCompraMxn": 7800,
      "vidaUtilHoras": 2000,
      "watts": 70,
      "mantenimientoAnualMxn": 300,
      "horasUsoAnual": 300
    },
    "impresoraSublimacion": {
      "nombre": "Impresora sublimación (EcoTank adaptada)",
      "costoCompraMxn": 6500,
      "vidaUtilHoras": 3000,
      "watts": 20,
      "mantenimientoAnualMxn": 900,
      "horasUsoAnual": 400
    },
    "planchaPlana": {
      "nombre": "Plancha plana 38x38 (playeras)",
      "costoCompraMxn": 8500,
      "vidaUtilHoras": 5000,
      "watts": 2000,
      "mantenimientoAnualMxn": 200,
      "horasUsoAnual": 250
    },
    "planchaTaza": {
      "nombre": "Plancha para taza 11oz",
      "costoCompraMxn": 3200,
      "vidaUtilHoras": 5000,
      "watts": 1500,
      "mantenimientoAnualMxn": 150,
      "horasUsoAnual": 300
    },
    "planchaGorra": {
      "nombre": "Plancha para gorra",
      "costoCompraMxn": 2800,
      "vidaUtilHoras": 5000,
      "watts": 400,
      "mantenimientoAnualMxn": 150,
      "horasUsoAnual": 150
    },
    "planchaTumbler": {
      "nombre": "Plancha para tumbler 20oz",
      "costoCompraMxn": 3500,
      "vidaUtilHoras": 5000,
      "watts": 600,
      "mantenimientoAnualMxn": 180,
      "horasUsoAnual": 150
    },
    "planchaTequilero": {
      "nombre": "Plancha para tequilero",
      "costoCompraMxn": 2400,
      "vidaUtilHoras": 5000,
      "watts": 300,
      "mantenimientoAnualMxn": 150,
      "horasUsoAnual": 100
    },
    "falconA10W": {
      "nombre": "Laser Creality Falcon A 10W",
      "costoCompraMxn": 10500,
      "vidaUtilHoras": 3000,
      "watts": 100,
      "mantenimientoAnualMxn": 400,
      "horasUsoAnual": 400
    },
    "bambuP1S": {
      "nombre": "Impresora 3D Bambu Lab P1S",
      "costoCompraMxn": 12000,
      "vidaUtilHoras": 5000,
      "watts": 300,
      "mantenimientoAnualMxn": 500,
      "horasUsoAnual": 900
    }
  },

  "mapeoProductoMaquina": {
    "taza":            { "sublimacion": ["impresoraSublimacion", "planchaTaza"] },
    "playera":         { "sublimacion": ["impresoraSublimacion", "planchaPlana"], "vinilTextil": ["cricutMaker", "planchaPlana"] },
    "gorra":           { "sublimacion": ["impresoraSublimacion", "planchaGorra"], "vinilTextil": ["cricutMaker", "planchaGorra"] },
    "tumbler":         { "sublimacion": ["impresoraSublimacion", "planchaTumbler"] },
    "tequilero":       { "sublimacion": ["impresoraSublimacion", "planchaTequilero"] },
    "superficieRigida":{ "vinilAdhesivo": ["cricutMaker"] },
    "mdf":             { "laser": ["falconA10W"] },
    "acrilico":        { "laser": ["falconA10W"] },
    "objetoCliente":   { "laser": ["falconA10W"] },
    "objetoImpresion3d": { "impresion3d": ["bambuP1S"] }
  },

  "catalogoInsumos": {
    "sublimacion": {
      "costoPorHojaSublimacion": 3.30,
      "blancoTazaDefault": 30,
      "blancoPlayeraDefault": 100,
      "blancoGorraDefault": 48,
      "blancoTumblerDefault": 135,
      "blancoTequileroDefault": 25
    },
    "vinil": {
      "costoPorMetroVinilTextil": 230,
      "costoPorMetroVinilAdhesivo": 110,
      "blancoPlayeraDefault": 110,
      "blancoGorraDefault": 48
    },
    "laser": {
      "costoHojaMdf3mmDefault": 110,
      "medidasHojaMdfCm": "60x90",
      "costoHojaAcrilicoDefault": 95
    },
    "impresion3d": {
      "costoPorGramoPLA": 0.32,
      "costoPorGramoPETG": 0.38
    }
  },

  "tablaMayoreo": [
    { "rangoMin": 1,   "rangoMax": 5,    "descuentoPct": 0.00, "etiqueta": "Menudeo" },
    { "rangoMin": 6,   "rangoMax": 11,   "descuentoPct": 0.05, "etiqueta": "Mayoreo chico" },
    { "rangoMin": 12,  "rangoMax": 23,   "descuentoPct": 0.10, "etiqueta": "Mayoreo medio" },
    { "rangoMin": 24,  "rangoMax": 49,   "descuentoPct": 0.15, "etiqueta": "Mayoreo grande" },
    { "rangoMin": 50,  "rangoMax": 99,   "descuentoPct": 0.20, "etiqueta": "Mayoreo mayor" },
    { "rangoMin": 100, "rangoMax": null, "descuentoPct": 0.25, "etiqueta": "Institucional" }
  ],

  "reglasRedondeo": {
    "umbralBajo": 100,
    "multiploBajoUmbralBajo": 0.5,
    "umbralAlto": 500,
    "multiploEntreUmbrales": 5,
    "multiploSobreUmbralAlto": 10
  }
}
```

---

## Notas finales de uso y mantenimiento del modelo

- **Actualizar `catalogoInsumos` seguido**: es el bloque que más cambia (precios de blancos, filamento, vinil). Todo lo demás (máquinas, fracciones de tiempo) se puede revisar 1-2 veces al año.
- **Revisar `tarifaKwh` por temporada**: CFE cambia de tarifa en verano en varias zonas del país; si el taller empuja el consumo doméstico a tramos altos (DAC), el costo real de luz puede ser varias veces el default — vale la pena tener dos configuraciones (verano/invierno) si el impacto es grande.
- **`sueldoHora` es negociable con uno mismo, no con el cliente**: es fácil "bajarlo" mentalmente para ganar una cotización competida — el modelo está diseñado justo para exponer ese número y evitar que pase desapercibido.
- **La regla de piso protege, pero no reemplaza el criterio del dueño**: si un cliente de mayoreo pide más descuento del que el piso permite, la respuesta correcta del sistema es mostrar el precio piso, no forzarlo por debajo.
- **Los defaults de este documento son un punto de partida**, calibrado para ser internamente consistente (las fórmulas cuadran entre sí), no para ser el precio "correcto" del negocio real — ese ajuste es el siguiente paso fuera de este documento.

---

## Sanity check contra mercado

Comparación del precio que produce el modelo (con los defaults ya calibrados con `DATOS_MERCADO_MX.md`) contra los rangos de precio de venta reales reportados en ese mismo archivo (sección 6, "Precios de mercado — productos terminados").

| Producto | Precio del modelo (menudeo) | Rango de mercado (menudeo) | ¿Dentro del rango? |
|---|---|---|---|
| Taza sublimada (1 pza, ejemplo sección 3.2) | **$110.00** | $120 – $199 | ❌ **Por debajo** (~8% bajo el piso de mercado) |
| Playera vinil textil (1 pza, supuestos: blanco algodón $110, 20 cm vinil, 15 min producción, 12 min diseño) | **$375.00** | $180 – $280 | ❌ **Por arriba** (~34% sobre el techo de mercado) |

**Lectura:**
- **Taza:** el modelo queda ligeramente por debajo del piso de mercado. La causa más probable no es un error de cálculo sino que `utilidadMenudeoPct` (60%) y/o el tiempo de mano de obra asumido (17 min) son conservadores para esta técnica — hay espacio para subir el markup de sublimación sin salirse del mercado, o para revisar si el proceso real toma más minutos de los capturados.
- **Playera vinil:** el modelo queda por arriba del techo de mercado, y aquí el motivo es identificable: el blanco de playera de algodón (**$110**, precio de mayoreo del catálogo) por sí solo ya es una fracción grande del precio de venta de mercado; sumado a $46 de vinil (20 cm), la base de materiales ($168.48 con merma) deja poco margen para que 60% de markup + 15% de overhead no se dispare arriba del rango. Esto sugiere **recalibrar el diseño de ejemplo** (menos cm de vinil, o revisar si el blanco puede conseguirse más barato) y, si el modelo se sigue saliendo del rango con diseños típicos reales, considerar un `utilidadMenudeoPct` específico por técnica en vez de uno único global.
- **Conclusión general:** el modelo NO está sesgado sistemáticamente hacia arriba o hacia abajo (una técnica cae por debajo, la otra por arriba), lo cual sugiere que el problema no es la fórmula sino la calibración fina por técnica — exactamente el tipo de ajuste que se espera hacer con datos reales de operación una vez que la app esté en uso.

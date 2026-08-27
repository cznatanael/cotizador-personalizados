// test-calc.mjs — Verificación del motor de cálculo contra los ejemplos numéricos
// de las secciones 3.2 y 3.3 de MODELO_COSTEO.md.
//
// A diferencia de la v1, este archivo YA NO copia el motor a mano: lo extrae
// directamente de index.html, así que nunca se puede desincronizar.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(aqui, 'index.html'), 'utf8');
const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</' + 'script>'));
// Todo lo anterior a la sección 4 son datos + motor puro (sin DOM).
const corte = script.indexOf('/* ============ 4. ICONOS SVG');
if (corte < 0) throw new Error('No se encontró el corte del motor en index.html');
const motor = script.slice(0, corte);

const API = new Function(motor + `
  return { CONFIG_DEFAULT, MERCADO_MX, costoMaquinaHora, redondeoPsicologico, obtenerRangoMayoreo,
           numOverride, breakdownSublimacion, breakdownVinil, breakdownLaser, breakdown3D,
           calcularBreakdown, calcularCotizacion };
`)();
const { CONFIG_DEFAULT, costoMaquinaHora, numOverride, breakdownSublimacion,
        breakdownVinil, breakdownLaser, breakdown3D, calcularCotizacion } = API;

function check(label, obtenido, esperado, tol = 1) {
  const ok = Math.abs(obtenido - esperado) <= tol;
  console.log(`${ok ? '✅' : '❌'} ${label}: obtenido=${obtenido.toFixed(4)}  esperado=${esperado}  ${ok ? '' : '<<< NO COINCIDE'}`);
  return ok;
}
let todoOk = true;

console.log('--- Costo/hora de máquinas (sección 2.3) ---');
{
  const g = CONFIG_DEFAULT.configGlobal;
  todoOk &= check('Cricut Maker costo/h', costoMaquinaHora(CONFIG_DEFAULT.maquinas.cricutMaker, g.tarifaKwh, g.valorRescatePct).total, 4.59, 0.02);
  todoOk &= check('Impresora sublimación costo/h', costoMaquinaHora(CONFIG_DEFAULT.maquinas.impresoraSublimacion, g.tarifaKwh, g.valorRescatePct).total, 4.22, 0.02);
  todoOk &= check('Plancha taza costo/h', costoMaquinaHora(CONFIG_DEFAULT.maquinas.planchaTaza, g.tarifaKwh, g.valorRescatePct).total, 2.73, 0.02);
}

console.log('\n--- Sección 3.2: Taza sublimada, pedido de 1 pieza (menudeo) ---');
{
  const bd = breakdownSublimacion({ producto: 'taza', cantidad: 1, costoBlanco: 30.00, hojas: 1, minutosProduccion: 7, minutosDisenoPedido: 10 }, CONFIG_DEFAULT);
  todoOk &= check('costo_materiales', bd.materiales.total, 36.63);
  todoOk &= check('costo_maquina', bd.maquina.total, 0.35, 0.05);
  todoOk &= check('costo_mano_obra', bd.manoObra.total, 21.25);
  const r = calcularCotizacion({ breakdown: bd, cantidad: 1, config: CONFIG_DEFAULT });
  todoOk &= check('costo_directo', r.costoDirecto, 58.23);
  todoOk &= check('costo_total', r.costoTotal, 66.97);
  todoOk &= check('precio_menudeo_bruto', r.precioMenudeoBruto, 107.15);
  todoOk &= check('precio_menudeo_final (redondeado)', r.precioMenudeoFinal, 110.00);
  todoOk &= check('PRECIO FINAL VENTA (qty=1)', r.precioFinal, 110.00);
  console.log(`   Rango aplicado: ${r.rango.etiqueta} (${r.rango.rangoMin}-${r.rango.rangoMax ?? '+'}) -${(r.descuentoPct * 100).toFixed(0)}%`);
}

console.log('\n--- Sección 3.3: mismo diseño, pedido de 24 piezas (mayoreo) ---');
{
  const bd = breakdownSublimacion({ producto: 'taza', cantidad: 24, costoBlanco: 30.00, hojas: 1, minutosProduccion: 7, minutosDisenoPedido: 10 }, CONFIG_DEFAULT);
  todoOk &= check('costo_mano_obra (24 pzas)', bd.manoObra.total, 9.27);
  const r = calcularCotizacion({ breakdown: bd, cantidad: 24, config: CONFIG_DEFAULT });
  todoOk &= check('costo_directo', r.costoDirecto, 46.25);
  todoOk &= check('costo_total', r.costoTotal, 53.19);
  todoOk &= check('precio_menudeo_referencia (redondeado)', r.precioMenudeoFinal, 85.50);
  todoOk &= check('precio_mayoreo_bruto (con descuento 15%)', r.precioConDescuento, 72.68, 0.05);
  todoOk &= check('piso (costo_total*1.15)', r.piso, 61.17);
  todoOk &= check('PRECIO FINAL VENTA/pieza (qty=24)', r.precioFinal, 73.00);
  todoOk &= check('TOTAL PEDIDO (24 pzas)', r.totalPedido, 1752.00);
}

console.log('\n--- Sanity check final del documento: Playera vinil textil (1 pza) ---');
{
  const bd = breakdownVinil({ producto: 'playera', cantidad: 1, costoBlanco: 110, cmVinil: 20, minutosProduccion: 15, minutosDisenoPedido: 12 }, CONFIG_DEFAULT);
  todoOk &= check('costo_materiales (con merma 8%)', bd.materiales.total, 168.48);
  const r = calcularCotizacion({ breakdown: bd, cantidad: 1, config: CONFIG_DEFAULT });
  todoOk &= check('PRECIO FINAL (playera vinil, qty=1)', r.precioFinal, 375.00);
}

console.log('\n--- Smoke test Láser y 3D ---');
{
  const bdL = breakdownLaser({ costoMaterialPorPieza: 12, minutosLaser: 6, minutosAcabado: 4, minutosDisenoPedido: 15, cantidad: 1 }, CONFIG_DEFAULT);
  const rL = calcularCotizacion({ breakdown: bdL, cantidad: 1, config: CONFIG_DEFAULT });
  console.log(`   Láser MDF → precio final: ${rL.precioFinal.toFixed(2)}`);
  const bd3 = breakdown3D({ gramos: 42, tipoFilamento: 'PLA', horasImpresion: 3.5, minutosPostProceso: 8, minutosDisenoPedido: 10, cantidad: 1 }, CONFIG_DEFAULT);
  const r3 = calcularCotizacion({ breakdown: bd3, cantidad: 1, config: CONFIG_DEFAULT });
  console.log(`   3D PLA → precio final: ${r3.precioFinal.toFixed(2)}`);
}

console.log('\n--- numOverride (override de una sola vez) ---');
{
  todoOk &= check('undefined → fallback', numOverride(undefined, 7), 7, 0);
  todoOk &= check('null → fallback', numOverride(null, 7), 7, 0);
  todoOk &= check('cadena vacía → fallback', numOverride('', 7), 7, 0);
  todoOk &= check('texto inválido → fallback', numOverride('abc', 7), 7, 0);
  todoOk &= check('cero ES un override válido', numOverride(0, 7), 0, 0);
  todoOk &= check('string numérico se convierte', numOverride('3.5', 7), 3.5, 0);
}

console.log('\n--- Override de costo de material al cotizar (no toca la config) ---');
{
  // Sublimación: hoja a $10 en vez de $3.30 → materiales = (30 + 1*10) * 1.10
  const base = { producto: 'taza', cantidad: 1, costoBlanco: 30, hojas: 1, minutosProduccion: 7, minutosDisenoPedido: 10 };
  const bd = breakdownSublimacion({ ...base, costoHojaOverride: 10 }, CONFIG_DEFAULT);
  todoOk &= check('sublimación materiales con hoja a $10', bd.materiales.total, 44.00, 0.01);
  todoOk &= check('sin override vuelve al valor de config', breakdownSublimacion(base, CONFIG_DEFAULT).materiales.total, 36.63);
  todoOk &= check('config intacta tras override', CONFIG_DEFAULT.catalogoInsumos.sublimacion.costoPorHojaSublimacion, 3.30, 0);

  // Vinil: $300/m en vez de $230/m → (110 + 0.20*300) * 1.08
  const bdV = breakdownVinil({ producto: 'playera', cantidad: 1, costoBlanco: 110, cmVinil: 20, minutosProduccion: 15, minutosDisenoPedido: 12, costoPorMetroVinil: 300 }, CONFIG_DEFAULT);
  todoOk &= check('vinil materiales con $300/m', bdV.materiales.total, 183.60, 0.01);
  todoOk &= check('config vinil intacta', CONFIG_DEFAULT.catalogoInsumos.vinil.costoPorMetroVinilTextil, 230, 0);

  // 3D: $0.50/g en vez de $0.32/g → 42*0.50*1.07
  const bd3 = breakdown3D({ gramos: 42, tipoFilamento: 'PLA', horasImpresion: 3.5, minutosPostProceso: 8, minutosDisenoPedido: 10, cantidad: 1, costoPorGramo: 0.50 }, CONFIG_DEFAULT);
  todoOk &= check('3D materiales con $0.50/g', bd3.materiales.total, 22.47, 0.01);
  todoOk &= check('config filamento intacta', CONFIG_DEFAULT.catalogoInsumos.impresion3d.costoPorGramoPLA, 0.32, 0);

  // Filamento gratis (0) debe respetarse, no caer al default
  const bd3g = breakdown3D({ gramos: 42, tipoFilamento: 'PLA', horasImpresion: 1, minutosPostProceso: 0, minutosDisenoPedido: 0, cantidad: 1, costoPorGramo: 0 }, CONFIG_DEFAULT);
  todoOk &= check('3D con costo por gramo = 0', bd3g.materiales.total, 0, 0);
}

console.log('\n--- Líneas de desglose (datos estructurados, sin formateo) ---');
{
  const bd = breakdownSublimacion({ producto: 'taza', cantidad: 1, costoBlanco: 30, hojas: 2, minutosProduccion: 7, minutosDisenoPedido: 10, costoHojaOverride: 5 }, CONFIG_DEFAULT);
  const L = bd.materiales.lineas;
  const okL = Array.isArray(L) && L.length === 2 && L[1].override === true && L[1].valorConfig === 3.30 && Math.abs(L[1].total - 10) < 1e-9;
  console.log(`${okL ? '✅' : '❌'} líneas de materiales con flag de override y valor de config`);
  todoOk &= okL;
}

console.log('\n--- Comisión de venta en línea (opt-in, default apagada) ---');
{
  const bd = breakdownSublimacion({ producto: 'taza', cantidad: 1, costoBlanco: 30, hojas: 1, minutosProduccion: 7, minutosDisenoPedido: 10 }, CONFIG_DEFAULT);
  const off = calcularCotizacion({ breakdown: bd, cantidad: 1, config: CONFIG_DEFAULT });
  todoOk &= check('sin comisión (default) = precio del documento', off.precioFinal, 110.00);
  const on = calcularCotizacion({ breakdown: bd, cantidad: 1, config: CONFIG_DEFAULT, aplicaComisionOverride: true });
  // 110 (piso/descuento no aplican) → 105.42/(1-0.05) redondeado a múltiplo de 5
  const okCom = on.precioFinal > off.precioFinal && on.aplicaComision === true && on.montoComision > 0;
  console.log(`${okCom ? '✅' : '❌'} con comisión 5% el precio sube: ${off.precioFinal.toFixed(2)} → ${on.precioFinal.toFixed(2)}`);
  todoOk &= okCom;
}

console.log('\n--- Capas / colores (vinil, láser, 3D) ---');
{
  // Una sola capa debe dar EXACTAMENTE lo mismo que la ruta clásica sin capas.
  const legacy = breakdownVinil({ producto: 'playera', cantidad: 1, costoBlanco: 110, cmVinil: 20, minutosProduccion: 15, minutosDisenoPedido: 12 }, CONFIG_DEFAULT);
  const unaCapa = breakdownVinil({ producto: 'playera', cantidad: 1, costoBlanco: 110, minutosProduccion: 15, minutosDisenoPedido: 12, capas: [{ nombre: '', cm: 20 }] }, CONFIG_DEFAULT);
  todoOk &= check('vinil 1 capa == ruta clásica (materiales)', unaCapa.materiales.total, legacy.materiales.total, 1e-9);
  todoOk &= check('vinil 1 capa == ruta clásica (precio)',
    calcularCotizacion({ breakdown: unaCapa, cantidad: 1, config: CONFIG_DEFAULT }).precioFinal, 375.00, 0);
  const okEtiqueta = unaCapa.materiales.lineas[1].label === legacy.materiales.lineas[1].label;
  console.log(`${okEtiqueta ? '✅' : '❌'} vinil 1 capa sin nombre conserva la etiqueta "${legacy.materiales.lineas[1].label}"`);
  todoOk &= okEtiqueta;

  // Dos colores: (110 + 0.20*230 + 0.10*310) * 1.08 = 201.96
  const dos = breakdownVinil({
    producto: 'playera', cantidad: 1, costoBlanco: 110, minutosProduccion: 15, minutosDisenoPedido: 12,
    minutosPorCapaExtra: 4,
    capas: [{ nombre: 'Negro', cm: 20 }, { nombre: 'Rojo glitter', cm: 10, costoPorMetro: 310 }]
  }, CONFIG_DEFAULT);
  todoOk &= check('vinil 2 colores: materiales', dos.materiales.total, 201.96, 0.01);
  todoOk &= check('vinil 2 colores: 4 min extra de producción', dos.manoObra.produccionMin, 19, 0);
  todoOk &= check('vinil 2 colores: 3 líneas de desglose (blanco + 2)', dos.materiales.lineas.length, 3, 0);
  todoOk &= check('vinil 2 colores: material de las capas', dos.capas.materialTotal, 77, 0.01);
  const okOv = dos.materiales.lineas[1].override === false && dos.materiales.lineas[2].override === true;
  console.log(`${okOv ? '✅' : '❌'} vinil: sólo el color con precio distinto sale marcado como ajustado`);
  todoOk &= okOv;
  const okNom = dos.materiales.lineas[2].label.includes('Rojo glitter');
  console.log(`${okNom ? '✅' : '❌'} vinil: el nombre del color aparece en el desglose`);
  todoOk &= okNom;

  // Sin costo propio la capa hereda el costo global (caso "compro por rollo").
  const rollo = breakdownVinil({
    producto: 'playera', cantidad: 1, costoBlanco: 0, minutosProduccion: 0, minutosDisenoPedido: 0,
    costoPorMetroVinil: 100, capas: [{ cm: 50 }, { cm: 50 }]
  }, CONFIG_DEFAULT);
  todoOk &= check('vinil por rollo: ambas capas usan el precio del rollo', rollo.materiales.base, 100, 0.01);

  // El 0 sigue siendo un override válido dentro de una capa (retazo, sobrante).
  const gratis = breakdownVinil({
    producto: 'playera', cantidad: 1, costoBlanco: 0, minutosProduccion: 0, minutosDisenoPedido: 0,
    capas: [{ cm: 50, costoPorMetro: 0 }]
  }, CONFIG_DEFAULT);
  todoOk &= check('vinil: capa con costo 0 no cae al default', gratis.materiales.base, 0, 0);

  // Arreglo vacío = ruta clásica (no debe reventar ni ignorar cmVinil).
  const vacio = breakdownVinil({ producto: 'playera', cantidad: 1, costoBlanco: 110, cmVinil: 20, minutosProduccion: 15, minutosDisenoPedido: 12, capas: [] }, CONFIG_DEFAULT);
  todoOk &= check('vinil: capas=[] usa la ruta clásica', vacio.materiales.total, 168.48);

  // Impresión 3D multicolor: 30 g + 12 g @ $0.32 = mismo material que 42 g de un color.
  const c3 = breakdown3D({
    tipoFilamento: 'PLA', horasImpresion: 3.5, minutosPostProceso: 8, minutosDisenoPedido: 10, cantidad: 1,
    minutosPorCambioColor: 3, capas: [{ nombre: 'Blanco', gramos: 30 }, { nombre: 'Negro', gramos: 12 }]
  }, CONFIG_DEFAULT);
  todoOk &= check('3D 2 colores: materiales == 42 g de un color', c3.materiales.total, 14.3808, 0.0001);
  todoOk &= check('3D 2 colores: 3 min extra por el cambio', c3.manoObra.produccionMin, 10 + 8 + 3, 0);
  todoOk &= check('3D 2 colores: 2 líneas de desglose', c3.materiales.lineas.length, 2, 0);

  // Láser por capas: material y minutos se suman.
  const cL = breakdownLaser({
    minutosAcabado: 4, minutosDisenoPedido: 15, cantidad: 1,
    capas: [
      { nombre: 'Base MDF', costoPorPieza: 8, piezasPorHoja: 8, costoHoja: 64, minutosLaser: 5 },
      { nombre: 'Frente acrílico', costoPorPieza: 4, piezasPorHoja: 12, costoHoja: 48, minutosLaser: 3 }
    ]
  }, CONFIG_DEFAULT);
  todoOk &= check('láser 2 capas: material por pieza se suma', cL.materiales.base, 12, 0);
  todoOk &= check('láser 2 capas: minutos de láser se suman', cL.manoObra.produccionMin, 5 + 3 + 4, 0);
  todoOk &= check('láser 2 capas: 2 líneas de desglose', cL.materiales.lineas.length, 2, 0);

  // Una sola capa de láser conserva la etiqueta clásica.
  const l1 = breakdownLaser({ minutosAcabado: 4, minutosDisenoPedido: 15, cantidad: 1, capas: [{ costoPorPieza: 12, piezasPorHoja: 8, costoHoja: 96, minutosLaser: 6 }] }, CONFIG_DEFAULT);
  const lLeg = breakdownLaser({ costoMaterialPorPieza: 12, piezasPorHoja: 8, costoHojaMaterial: 96, minutosLaser: 6, minutosAcabado: 4, minutosDisenoPedido: 15, cantidad: 1 }, CONFIG_DEFAULT);
  const okLbl = l1.materiales.lineas[0].label === lLeg.materiales.lineas[0].label;
  console.log(`${okLbl ? '✅' : '❌'} láser 1 capa conserva la etiqueta "${lLeg.materiales.lineas[0].label}"`);
  todoOk &= okLbl;
  todoOk &= check('láser 1 capa == ruta clásica (precio)',
    calcularCotizacion({ breakdown: l1, cantidad: 1, config: CONFIG_DEFAULT }).precioFinal,
    calcularCotizacion({ breakdown: lLeg, cantidad: 1, config: CONFIG_DEFAULT }).precioFinal, 0);
}

console.log('\n' + (todoOk ? '✅✅✅ TODAS LAS PRUEBAS PASAN (tolerancia ±$1)' : '❌❌❌ HAY DISCREPANCIAS — revisar arriba'));
process.exit(todoOk ? 0 : 1);

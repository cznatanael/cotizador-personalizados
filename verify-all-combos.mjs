// verify-all-combos.mjs — Recorre las 12 combinaciones técnica × producto en el
// DOM real (JSDOM) de la pantalla única y valida que el precio en vivo aparezca,
// que los overrides de material funcionen y que el desglose se pueda abrir.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const aqui = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(aqui, 'index.html'), 'utf8');

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true });
const { window } = dom;
const doc = window.document;
const $ = s => doc.querySelector(s);
const $$ = s => Array.from(doc.querySelectorAll(s));
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const escribir = (el, v) => { el.value = String(v); el.dispatchEvent(new window.Event('input', { bubbles: true })); };
const elegir = (el, v) => { el.value = String(v); el.dispatchEvent(new window.Event('input', { bubbles: true })); };
const dinero = s => parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
// Los campos de capa no tienen id: se localizan por su par (clave, índice).
const capaF = (key, i = 0) => $(`[data-capa-field="${key}"][data-i="${i}"]`);
const capaWrap = (key, i = 0) => $(`[data-capawrap="${i}-${key}"]`);
const capaNombre = (i = 0) => $(`[data-capa-nombre="${i}"]`);
const nCapasDOM = () => $$('[data-capa]').length;

let ok = true;
const bien = (cond, msg) => { console.log(`${cond ? '✅' : '❌'} ${msg}`); if (!cond) ok = false; return cond; };

await new Promise(r => setTimeout(r, 300));

console.log('--- Arranque ---');
bien(!!$('#dockUnit'), 'la pantalla arranca con precio en vivo (sin wizard)');
bien($$('[data-action="elegir-tecnica"]').length === 4, 'las 4 técnicas están visibles de entrada');
bien(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(doc.body.textContent), 'no hay emojis en la interfaz');

console.log('\n--- Listo para publicarse en la web (GitHub Pages) ---');
{
  // La app se publica tal cual: si pidiera un archivo externo, en Pages cargaría
  // a medias y offline no funcionaría.
  const externos = [...html.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)]
    .map(m => m[1])
    .filter(u => /^(https?:)?\/\//i.test(u));
  bien(externos.length === 0, `no pide nada de internet: sigue siendo un solo archivo${externos.length ? ' — FUGA: ' + externos.join(', ') : ''}`);
  bien(/<meta\s+name="viewport"[^>]*width=device-width/.test(html), 'trae viewport: se ve bien en el celular');
  bien(/apple-mobile-web-app-capable/.test(html) && /mobile-web-app-capable/.test(html), 'se puede agregar a la pantalla de inicio del celular');
  bien(/<link\s+rel="icon"/.test(html), 'trae ícono propio (no el genérico del navegador)');
  const stub = readFileSync(join(aqui, 'cotizador.html'), 'utf8');
  bien(/location\.replace\('index\.html/.test(stub), 'el viejo cotizador.html reenvía a index.html (los accesos directos siguen sirviendo)');
  bien(!/meta\s+http-equiv="refresh"/i.test(stub), 'el reenvío no usa meta refresh (evita que el botón Atrás se cicle)');
}

// Regresión 25-ago: .sheet-wrap{display:flex} le ganaba al atributo hidden del UA,
// dejando un overlay a pantalla completa que bloqueaba TODOS los clics al cargar.
// JSDOM no reproduce esa cascada (getComputedStyle siempre devolvía none), así que
// el chequeo se hace sobre el CSS: se buscan reglas de autor que pinten un elemento
// que en el HTML lleva el atributo hidden.
const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1].replace(/\/\*[\s\S]*?\*\//g, '');
const fuerzaHidden = /\[hidden\]\s*{[^}]*display\s*:\s*none\s*!important/.test(css);
const reglasQuePintan = [];
for (const m of css.matchAll(/([^{}]+){([^}]*)}/g)) {
  const sel = m[1].trim(), decls = m[2];
  if (sel.startsWith('@') || sel.includes('%')) continue;
  const d = decls.match(/(?:^|;)\s*display\s*:\s*([^;!]+)/);
  if (d && d[1].trim() !== 'none') reglasQuePintan.push(sel);
}
for (const el of $$('[hidden]')) {
  const conflictos = reglasQuePintan.filter(sel => { try { return el.matches(sel); } catch { return false; } });
  const nombre = '#' + (el.id || el.className);
  bien(conflictos.length === 0 || fuerzaHidden,
    `${nombre} lleva hidden y ${conflictos.length} regla(s) le ponen display` +
    (conflictos.length ? ` (${conflictos.join(', ')})` : '') + ` → neutralizado: ${fuerzaHidden}`);
}

const COMBOS = {
  sublimacion: ['taza', 'playera', 'gorra', 'tumbler', 'tequilero'],
  vinil: ['playera', 'gorra', 'superficieRigida'],
  laser: ['mdf', 'acrilico', 'objetoCliente'],
  impresion3d: ['objetoImpresion3d']
};

console.log('\n--- 12 combinaciones técnica × producto ---');
let n = 0;
for (const [tec, prods] of Object.entries(COMBOS)) {
  click($(`[data-action="elegir-tecnica"][data-id="${tec}"]`));
  for (const p of prods) {
    const btn = $(`[data-action="elegir-producto"][data-id="${p}"]`);
    if (!bien(!!btn, `${tec}/${p}: el producto existe`)) continue;
    click(btn);
    const unit = dinero($('#dockUnit').textContent);
    const total = dinero($('#dockTotal').textContent);
    bien(unit > 0 && total > 0, `${tec}/${p}: precio ${unit.toFixed(2)} · total ${total.toFixed(2)}`);
    n++;
  }
}
bien(n === 12, `se recorrieron las 12 combinaciones (${n})`);

console.log('\n--- Cantidad y mayoreo ---');
click($('[data-action="elegir-tecnica"][data-id="sublimacion"]'));
click($('[data-action="elegir-producto"][data-id="taza"]'));
const p1 = dinero($('#dockUnit').textContent);
bien(Math.abs(p1 - 110) < 0.01, `taza 1 pza = $110 (documento) → ${p1}`);
click($('[data-action="cant-set"][data-n="24"]'));
const p24 = dinero($('#dockUnit').textContent);
const t24 = dinero($('#dockTotal').textContent);
bien(Math.abs(p24 - 73) < 0.01, `taza 24 pzas = $73 (documento) → ${p24}`);
bien(Math.abs(t24 - 1752) < 0.01, `total 24 pzas = $1752 → ${t24}`);
click($('[data-action="cant-set"][data-n="1"]'));

console.log('\n--- Override de costo de material (el pendiente) ---');
const campoHoja = $('#f-costoHojaOverride');
bien(!!campoHoja, 'sublimación: existe campo editable de costo por hoja');
if (campoHoja) {
  bien(Math.abs(parseFloat(campoHoja.value) - 3.3) < 1e-9, 'arranca con el valor de configuración ($3.30)');
  escribir(campoHoja, 10);
  const conOv = dinero($('#dockUnit').textContent);
  bien(conOv > p1, `subir la hoja a $10 sube el precio: ${p1} → ${conOv}`);
  bien(!!$('[data-fieldwrap="costoHojaOverride"]').classList.contains('is-overridden'), 'el campo se marca como ajustado');
  bien(!!$('[data-action="reset-campo"][data-id="costoHojaOverride"]'), 'aparece el botón Restablecer');
  const cfgGuardada = JSON.parse(window.localStorage.getItem('cotizador_config') || 'null');
  bien(cfgGuardada === null, 'el override NO escribió en la configuración guardada');
  click($('[data-action="reset-campo"][data-id="costoHojaOverride"]'));
  bien(Math.abs(dinero($('#dockUnit').textContent) - p1) < 0.01, 'Restablecer devuelve el precio original');
}

console.log('\n--- Unidades de compra (compro por kilo, no por gramo) ---');
click($('[data-action="elegir-tecnica"][data-id="impresion3d"]'));
bien(!!capaF('costoPorGramo'), '3D: existe campo editable de filamento en la capa');
bien($('#f-filamentoModo') && $('#f-filamentoModo').value === 'kilo', '3D: por defecto se captura por KILO (así lo compra el usuario)');
bien(parseFloat(capaF('costoPorGramo').value) > 100, `3D: muestra el precio del rollo, no el del gramo (${capaF('costoPorGramo').value})`);
bien(/\/kg/.test(capaWrap('costoPorGramo').textContent), '3D: el sufijo dice /kg');
escribir(capaF('costoPorGramo'), 450);
bien(/0\.45/.test($('#derivado').textContent), `3D: $450/kg deriva $0.45/g (${$('#derivado').textContent.trim()})`);
const g0 = parseFloat(capaF('costoPorGramo').value);
elegir($('#f-tipoFilamento'), 'PETG');
bien(parseFloat(capaF('costoPorGramo').value) !== g0, `cambiar a PETG actualiza el precio del rollo (${g0} → ${capaF('costoPorGramo').value})`);
elegir($('#f-tipoFilamento'), 'PLA');

console.log('\n--- Multicolor en impresión 3D ---');
{
  escribir(capaF('gramos'), 30);
  const unColor = dinero($('#dockUnit').textContent);
  click($('[data-action="capa-add"]'));
  bien(nCapasDOM() === 2, `se agrega un segundo color (${nCapasDOM()} renglones)`);
  escribir(capaNombre(0), 'Blanco');
  escribir(capaNombre(1), 'Negro');
  escribir(capaF('gramos', 1), 12);
  const dosColores = dinero($('#dockUnit').textContent);
  bien(dosColores > unColor, `42 g en 2 colores cuesta más que 30 g en 1 (${unColor} → ${dosColores})`);
  bien(!!$('#f-minutosPorCambioColor'), 'aparece el campo de minutos extra por cambio de color');
  click($('[data-action="ver-desglose"]'));
  const d = $('#sheetBody').textContent;
  bien(/Blanco/.test(d) && /Negro/.test(d), 'el desglose nombra cada color');
  click($('[data-action="cerrar-sheet"]'));
  click($('[data-capa="1"] [data-action="capa-del"]'));
  bien(nCapasDOM() === 1, 'se puede quitar un color');
  bien(!$('#f-minutosPorCambioColor'), 'con un solo color desaparece el campo de minutos extra');
  bien(Math.abs(dinero($('#dockUnit').textContent) - unColor) < 0.01, 'al quitarlo el precio vuelve a su valor');
}

console.log('\n--- Vinil ---');
click($('[data-action="elegir-tecnica"][data-id="vinil"]'));
bien(!!capaF('costoPorMetro'), 'vinil: existe campo editable de $/metro en la capa');

console.log('\n--- Vinil a varios colores (el pendiente nuevo) ---');
{
  click($('[data-action="elegir-producto"][data-id="playera"]'));
  escribir(capaF('cm'), 20);
  const unColor = dinero($('#dockUnit').textContent);
  bien(Math.abs(parseFloat(capaF('costoPorMetro').value) - 230) < 1e-9, 'la capa arranca con el $/m de configuración');

  click($('[data-action="capa-add"]'));
  bien(nCapasDOM() === 2, `se agrega un segundo color (${nCapasDOM()} renglones)`);
  escribir(capaNombre(0), 'Negro');
  escribir(capaNombre(1), 'Rojo glitter');
  escribir(capaF('cm', 1), 10);
  escribir(capaF('costoPorMetro', 1), 310);
  const dosColores = dinero($('#dockUnit').textContent);
  bien(dosColores > unColor, `el segundo color sube el precio (${unColor} → ${dosColores})`);
  bien(capaWrap('costoPorMetro', 1).classList.contains('is-overridden'), 'el color con precio distinto se marca como ajustado');
  bien(!capaWrap('costoPorMetro', 0).classList.contains('is-overridden'), 'el color al precio de config NO se marca');
  bien(!!$('#f-minutosPorCapaExtra'), 'aparece el campo de minutos extra por color adicional');
  bien(/Material de 2 colores/.test($('#derivado').textContent), `se muestra el material de los 2 colores (${$('#derivado').textContent.trim()})`);

  const antesMin = dinero($('#dockUnit').textContent);
  escribir($('#f-minutosPorCapaExtra'), 12);
  bien(dinero($('#dockUnit').textContent) > antesMin, 'subir los minutos por color extra sube el precio');
  escribir($('#f-minutosPorCapaExtra'), 4);

  click($('[data-action="ver-desglose"]'));
  const d = $('#sheetBody').textContent;
  bien(/Negro/.test(d) && /Rojo glitter/.test(d), 'el desglose lista cada color por su nombre');
  click($('[data-action="cerrar-sheet"]'));

  const cfgAntes = JSON.parse(window.localStorage.getItem('cotizador_config') || 'null');
  const vinilCfg = cfgAntes ? cfgAntes.catalogoInsumos.vinil.costoPorMetroVinilTextil : null;
  bien(cfgAntes === null || vinilCfg === 230, 'el precio por color NO escribió en la configuración guardada');

  // Las capas viajan en el snapshot: sin eso, "Duplicar" perdería los colores.
  click($('[data-action="guardar-cot"]'));
  escribir($('#f-cliente'), 'Pedido a 2 tintas');
  click($('[data-action="confirmar-guardar"]'));
  const h = JSON.parse(window.localStorage.getItem('cotizador_historial') || '[]');
  const snap = h.find(s => s.cliente === 'Pedido a 2 tintas');
  bien(!!snap && Array.isArray(snap.inputs.capas) && snap.inputs.capas.length === 2, 'el snapshot guarda las 2 capas');
  bien(!!snap && snap.inputs.capas[1].nombre === 'Rojo glitter', 'el snapshot conserva el nombre del color');

  click($('[data-action="tab"][data-id="historial"]'));
  const fila = $$('[data-action="hist-dup"]').find(b => b.dataset.id === snap.id);
  click(fila);
  bien(nCapasDOM() === 2, 'Duplicar recupera los 2 colores');
  bien(capaNombre(1) && capaNombre(1).value === 'Rojo glitter', 'Duplicar recupera el nombre del color');
  bien(Math.abs(dinero($('#dockUnit').textContent) - dosColores) < 0.01, 'Duplicar reproduce el mismo precio');

  click($('[data-capa="1"] [data-action="capa-del"]'));
  bien(nCapasDOM() === 1, 'se puede quitar un color');
  bien(!capaNombre(1), 'ya no queda el segundo renglón');
  bien(!$('[data-capa="0"] [data-action="capa-del"]'), 'la única capa no se puede borrar');
}

const vm = $('#f-vinilModo');
if (bien(!!vm, 'vinil: se puede elegir cómo lo compras')) {
  elegir(vm, 'rollo');
  bien(!!$('#f-costoRollo') && !!$('#f-metrosRollo'), 'vinil: modo rollo pide precio del rollo y metros que trae');
  bien(!capaF('costoPorMetro'), 'vinil por rollo: los colores comparten el precio del rollo');
  escribir($('#f-costoRollo'), 900);
  escribir($('#f-metrosRollo'), 10);
  bien(/90\.00/.test($('#derivado').textContent), `vinil: rollo de $900 / 10 m deriva $90/m (${$('#derivado').textContent.trim()})`);
  elegir(vm, 'metro');
}

console.log('\n--- Láser: piezas por hoja reemplaza el prompt() ---');
click($('[data-action="elegir-tecnica"][data-id="laser"]'));
bien(!!capaF('piezasPorHoja'), 'láser: existe campo Piezas por hoja en la capa');
bien(/Material por pieza/.test($('#derivado').textContent), 'láser: muestra el material por pieza derivado');
const antes = dinero($('#dockUnit').textContent);
escribir(capaF('piezasPorHoja'), 20);
bien(dinero($('#dockUnit').textContent) < antes, 'más piezas por hoja baja el precio');

console.log('\n--- Láser encimado (capas de material) ---');
{
  escribir(capaF('piezasPorHoja'), 8);
  const unaCapa = dinero($('#dockUnit').textContent);
  click($('[data-action="capa-add"]'));
  bien(nCapasDOM() === 2, `se agrega una segunda capa (${nCapasDOM()} renglones)`);
  escribir(capaNombre(0), 'Base MDF');
  escribir(capaNombre(1), 'Frente');
  escribir(capaF('minutosLaser', 1), 3);
  bien(dinero($('#dockUnit').textContent) > unaCapa, 'la capa extra suma material y minutos de láser');
  bien(/Material de 2 capas/.test($('#derivado').textContent), `se muestra el material de las 2 capas (${$('#derivado').textContent.trim()})`);
  click($('[data-capa="1"] [data-action="capa-del"]'));
  bien(Math.abs(dinero($('#dockUnit').textContent) - unaCapa) < 0.01, 'al quitarla el precio vuelve a su valor');
}

console.log('\n--- Láser por pieza (grabar un lápiz o un vaso) ---');
const modoMat = $('#f-materialModo');
if (bien(!!modoMat, 'láser: se puede elegir si el material se compra por hoja o por pieza')) {
  elegir(modoMat, 'pieza');
  bien(!!capaF('costoPieza'), 'láser por pieza: pide el costo de cada pieza');
  bien(!capaF('piezasPorHoja'), 'láser por pieza: ya NO pide piezas por hoja (no aplica a un lápiz)');
  escribir(capaF('costoPieza'), 12);
  bien(/12\.00/.test($('#derivado').textContent), 'láser por pieza: usa el costo capturado tal cual');
}

console.log('\n--- Catálogo abierto: crear mi propio producto ---');
if (bien(!!$('[data-action="nuevo-producto"]'), 'existe el chip para agregar un producto propio')) {
  click($('[data-action="nuevo-producto"]'));
  bien(!!$('#np-nombre'), 'abre el formulario de producto nuevo');
  escribir($('#np-nombre'), 'Vaso de vidrio');
  const npm = $('#np-modo'); if (npm) { npm.value = 'pieza'; npm.dispatchEvent(new window.Event('input', { bubbles: true })); }
  escribir($('#np-blanco'), 18);
  click($('[data-action="np-guardar"]'));
  const guardados = JSON.parse(window.localStorage.getItem('cotizador_productos') || '[]');
  bien(guardados.length === 1 && guardados[0].label === 'Vaso de vidrio', 'el producto propio se persiste en localStorage');
  const chips = $$('[data-action="elegir-producto"]').map(e => e.textContent.trim());
  bien(chips.includes('Vaso de vidrio'), `el producto propio aparece entre los chips (${chips.join(', ')})`);
  const activo = $$('[data-action="elegir-producto"]').find(e => e.getAttribute('aria-pressed') === 'true');
  bien(activo && activo.textContent.trim() === 'Vaso de vidrio', 'queda seleccionado al crearlo');
  bien(dinero($('#dockUnit').textContent) > 0, `cotiza el producto propio sin romperse (${$('#dockUnit').textContent.trim()})`);
}

console.log('\n--- Desglose y guardado ---');
click($('[data-action="elegir-tecnica"][data-id="sublimacion"]'));
bien(nCapasDOM() === 0, 'sublimación no muestra el bloque de capas (imprime a todo color)');
bien(!!$('#f-hojas'), 'sublimación sigue pidiendo las hojas de transfer');
click($('[data-action="ver-desglose"]'));
bien(!$('#sheetWrap').hidden, 'el desglose abre en bottom sheet (sin alert/prompt nativos)');
bien(/Del costo al precio/.test($('#sheetBody').textContent), 'el desglose muestra la cadena costo → precio');
click($('[data-action="cerrar-sheet"]'));
bien($('#sheetWrap').hidden, 'el sheet cierra');

click($('[data-action="guardar-cot"]'));
$('#f-cliente').value = 'Cliente de prueba';
click($('[data-action="confirmar-guardar"]'));
const hist = JSON.parse(window.localStorage.getItem('cotizador_historial') || '[]');
const guardada = hist.find(s => s.cliente === 'Cliente de prueba');
bien(!!guardada, 'la cotización se guarda en el historial');
bien(!!guardada && !!guardada.inputs && !!guardada.tecnica, 'el snapshot guarda los inputs (permite duplicar)');

click($('[data-action="tab"][data-id="historial"]'));
bien(/Cliente de prueba/.test($('#view').textContent), 'el historial muestra la cotización');
click($('[data-action="hist-dup"]'));
bien(state_tecnica(), 'Duplicar recarga la cotización en el formulario');
function state_tecnica() { return !!$('#dockUnit') && $('[data-action="tab"][data-id="cotizar"]').getAttribute('aria-selected') === 'true'; }

console.log('\n--- Ajustes ---');
click($('[data-action="tab"][data-id="config"]'));
bien(!!$('#c-configGlobal\\.sueldoHora'), 'ajustes muestra el sueldo por hora');
escribir($('#c-configGlobal\\.sueldoHora'), 120);
bien(!!$('[data-action="guardar-config"]'), 'aparece la barra de cambios sin guardar');
click($('[data-action="guardar-config"]'));
const cfg = JSON.parse(window.localStorage.getItem('cotizador_config'));
bien(cfg.configGlobal.sueldoHora === 120, 'los ajustes sí se persisten cuando se guardan');
bien(!$('[data-action="guardar-config"]'), 'la barra desaparece tras guardar');

console.log('\n--- PDF para el cliente ---');
click($('[data-action="tab"][data-id="cotizar"]'));
click($('[data-action="elegir-tecnica"][data-id="sublimacion"]'));
if (bien(!!$('[data-action="pdf-cot"]'), 'hay botón de PDF en la cotización')) {
  window.print = () => { window.__imprimio = (window.__imprimio || 0) + 1; };
  click($('[data-action="pdf-cot"]'));
  bien(!!$('#f-clientePdf'), 'el PDF pregunta a nombre de quién va');
  escribir($('#f-clientePdf'), 'Papelería Luna');
  click($('[data-action="confirmar-pdf"]'));
  const pd = $('#printDoc');
  const txt = pd.textContent.replace(/\s+/g, ' ');
  bien(/Papelería Luna/.test(txt), 'el PDF trae el nombre del cliente');
  bien(/COT-/.test(txt), 'el PDF trae folio');
  bien(/Vigencia/.test(txt), 'el PDF trae la vigencia');
  const fugas = ['costo', 'utilidad', 'margen', 'merma', 'mano de obra', 'overhead', 'depreciaci', 'sueldo', 'insumo', 'ganancia']
    .filter(k => txt.toLowerCase().includes(k));
  bien(fugas.length === 0, `el PDF NO filtra costos ni márgenes al cliente${fugas.length ? ' — FUGA: ' + fugas.join(', ') : ''}`);
  const cssPrint = (css.match(/@media\s+print\s*{([\s\S]*?)\n}/) || [, ''])[1];
  bien(/#app[^{]*{[^}]*display\s*:\s*none\s*!important/.test(cssPrint), 'al imprimir se oculta toda la interfaz de la app');
  bien(/#printDoc\s*{[^}]*display\s*:\s*block\s*!important/.test(cssPrint), 'al imprimir se muestra la hoja de cotización');
  // El margen NO puede depender sólo de @page: si el diálogo de impresión está en
  // "Márgenes: Ninguno", el texto se va al filo del papel y se corta.
  const reglaDoc = (cssPrint.match(/#printDoc\s*{([^}]*)}/) || [, ''])[1];
  bien(/padding\s*:\s*[^;}]*\d/.test(reglaDoc), 'la hoja lleva su propio margen interno (no depende de @page)');
  bien(/box-sizing\s*:\s*border-box/.test(reglaDoc), 'el margen interno no ensancha la hoja (box-sizing)');
  bien(/table-layout\s*:\s*fixed/.test(cssPrint), 'la tabla tiene ancho fijo: los importes largos no desbordan el papel');
}

console.log('\n--- Botón de PDF en el historial ---');
click($('[data-action="tab"][data-id="historial"]'));
bien(!!$('[data-action="pdf-hist"]'), 'cada cotización guardada tiene su botón de PDF');

console.log('\n' + (ok ? '✅✅✅ TODO EL FLUJO DE UI FUNCIONA' : '❌❌❌ HAY FALLAS — revisar arriba'));
process.exit(ok ? 0 : 1);

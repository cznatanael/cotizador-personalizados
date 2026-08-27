// verify-persistencia.mjs — Valida el round-trip de localStorage: que Ajustes,
// Historial y los "últimos valores usados" realmente se guardan y se releen bien
// tras recargar la app en una ventana nueva.
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
const errores = [];
let ok = true;
const bien = (cond, msg) => { console.log(`${cond ? '✅' : '❌'} ${msg}`); if (!cond) ok = false; return cond; };
const esperar = ms => new Promise(r => setTimeout(r, ms));

function abrir(storagePrevio) {
  // El localStorage se siembra en beforeParse: el <script> de la app lee storage
  // en cuanto se parsea, así que hacerlo después llegaría tarde.
  return new JSDOM(html, {
    url: 'http://localhost/index.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    storageQuota: 10000000,
    beforeParse(window) {
      window.scrollTo = () => { };
      window.addEventListener('error', e => errores.push(e.error ? e.error.stack : e.message));
      if (storagePrevio) {
        for (const [k, v] of Object.entries(storagePrevio)) {
          if (v != null) window.localStorage.setItem(k, v);
        }
      }
    }
  });
}

const CLAVES = ['cotizador_config', 'cotizador_historial', 'cotizador_ultimos'];

async function run() {
  // --- Sesión 1: el usuario cambia ajustes, cotiza y guarda -------------------
  let dom = abrir(null);
  let { window } = dom;
  await esperar(250);
  let doc = window.document;
  const $ = s => doc.querySelector(s);
  const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const escribir = (el, v) => { el.value = String(v); el.dispatchEvent(new window.Event('input', { bubbles: true })); };

  console.log('--- Sesión 1: guardar ajustes ---');
  click($('[data-action="tab"][data-id="config"]'));
  await esperar(40);
  escribir($('#c-configGlobal\\.tarifaKwh'), '2.75');
  escribir($('#c-configGlobal\\.utilidadMenudeoPct'), '80');
  bien(!!$('[data-action="guardar-config"]'), 'la barra de cambios sin guardar aparece al editar');
  bien(window.localStorage.getItem('cotizador_config') === null, 'antes de Guardar NO se escribió nada en localStorage');
  click($('[data-action="guardar-config"]'));
  await esperar(40);
  bien(!!window.localStorage.getItem('cotizador_config'), 'al Guardar sí se escribe en localStorage');

  console.log('\n--- Sesión 1: cotizar con override y guardar en historial ---');
  click($('[data-action="tab"][data-id="cotizar"]'));
  await esperar(40);
  click($('[data-action="elegir-tecnica"][data-id="laser"]'));
  await esperar(20);
  click($('[data-action="elegir-producto"][data-id="mdf"]'));
  await esperar(20);
  escribir($('[data-capa-field="piezasPorHoja"][data-i="0"]'), 8);
  escribir($('[data-capa-field="costoHoja"][data-i="0"]'), 150);
  // Segunda capa: valida que el multicolor/encimado también sobreviva al reload.
  click($('[data-action="capa-add"]'));
  await esperar(20);
  escribir($('[data-capa-nombre="1"]'), 'Frente acrílico');
  escribir($('[data-capa-field="costoHoja"][data-i="1"]'), 320);
  click($('[data-action="cant-set"][data-n="12"]'));
  await esperar(20);
  const precioSesion1 = $('#dockUnit').textContent;
  click($('[data-action="guardar-cot"]'));
  await esperar(30);
  $('#f-cliente').value = 'Papelería Luna';
  click($('[data-action="confirmar-guardar"]'));
  await esperar(40);

  const snapshotStorage = {};
  for (const k of CLAVES) snapshotStorage[k] = window.localStorage.getItem(k);
  bien(!!snapshotStorage.cotizador_historial, 'el historial quedó en localStorage');
  bien(!!snapshotStorage.cotizador_ultimos, 'los últimos valores usados quedaron en localStorage');
  window.close();

  // --- Sesión 2: se recarga la app desde cero --------------------------------
  console.log('\n--- Sesión 2: recargar la app y releer todo ---');
  dom = abrir(snapshotStorage);
  window = dom.window;
  await esperar(250);
  doc = window.document;
  const $2 = s => doc.querySelector(s);
  const click2 = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

  const cfg = window.cargarConfigStorage();
  bien(cfg.configGlobal.tarifaKwh === 2.75, `tarifaKwh releída = ${cfg.configGlobal.tarifaKwh} (esperado 2.75)`);
  bien(Math.abs(cfg.configGlobal.utilidadMenudeoPct - 0.80) < 1e-9, `utilidad releída = ${cfg.configGlobal.utilidadMenudeoPct} (esperado 0.8)`);
  bien(Object.keys(cfg.maquinas).length === 9, 'la estructura profunda sobrevive el merge (9 máquinas)');
  bien(Array.isArray(cfg.tablaMayoreo) && cfg.tablaMayoreo.length === 6, 'tablaMayoreo sigue siendo un array de 6 tramos');
  bien(cfg.catalogoInsumos.sublimacion.costoPorHojaSublimacion === 3.3, 'las claves no tocadas conservan su valor de fábrica');

  const hist = window.cargarHistorialStorage();
  bien(hist.length === 1, `el historial releído tiene ${hist.length} registro(s)`);
  bien(hist[0] && hist[0].cliente === 'Papelería Luna', 'el nombre del cliente sobrevivió');
  bien(hist[0] && typeof hist[0].resultado.precioFinal === 'number', `el snapshot trae precioFinal numérico (${hist[0] && hist[0].resultado.precioFinal})`);
  bien(hist[0] && hist[0].inputs && hist[0].inputs.capas[0].piezasPorHoja === 8, 'el snapshot conserva los inputs (necesarios para Duplicar)');
  bien(hist[0] && hist[0].inputs.capas.length === 2, `el snapshot conserva las 2 capas (${hist[0] && hist[0].inputs.capas.length})`);
  bien(hist[0] && hist[0].inputs.capas[1].nombre === 'Frente acrílico', 'el snapshot conserva el nombre de la capa');
  bien(hist[0] && hist[0].cantidad === 12, 'el snapshot conserva la cantidad del pedido');

  console.log('\n--- Sesión 2: los últimos valores se restauran al volver a la combinación ---');
  click2($2('[data-action="elegir-tecnica"][data-id="laser"]'));
  await esperar(20);
  click2($2('[data-action="elegir-producto"][data-id="mdf"]'));
  await esperar(20);
  bien($2('[data-capa-field="piezasPorHoja"][data-i="0"]').value === '8', `piezasPorHoja restaurado = ${$2('[data-capa-field="piezasPorHoja"][data-i="0"]').value}`);
  bien(parseFloat($2('[data-capa-field="costoHoja"][data-i="0"]').value) === 150, `costo de hoja restaurado = ${$2('[data-capa-field="costoHoja"][data-i="0"]').value}`);
  bien(doc.querySelectorAll('[data-capa]').length === 2, `las 2 capas se restauran (${doc.querySelectorAll('[data-capa]').length})`);
  bien($2('[data-capa-nombre="1"]') && $2('[data-capa-nombre="1"]').value === 'Frente acrílico', 'el nombre de la capa se restaura');

  console.log('\n--- Duplicar desde el historial ---');
  click2($2('[data-action="tab"][data-id="historial"]'));
  await esperar(40);
  click2($2('[data-action="hist-dup"]'));
  await esperar(40);
  bien($2('[data-action="tab"][data-id="cotizar"]').getAttribute('aria-selected') === 'true', 'Duplicar lleva de vuelta a Cotizar');
  bien($2('#f-cantidad').value === '12', `Duplicar restauró la cantidad (${$2('#f-cantidad').value})`);
  bien($2('#dockUnit').textContent === precioSesion1, `Duplicar reproduce el mismo precio (${$2('#dockUnit').textContent})`);

  console.log('\n--- Exportar configuración ---');
  click2($2('[data-action="tab"][data-id="config"]'));
  await esperar(40);
  // Se intercepta el Blob para leer lo que realmente se descarga.
  let exportado = null;
  const BlobOriginal = window.Blob;
  window.Blob = function (partes, opts) { try { exportado = String(partes[0]); } catch (e) { } return new BlobOriginal(partes, opts); };
  try { click2($2('[data-action="exportar"]')); await esperar(20); bien(true, 'Exportar no lanzó excepción'); }
  catch (e) { bien(false, 'Exportar lanzó: ' + e.message); }
  window.Blob = BlobOriginal;
  if (bien(!!exportado, 'el respaldo trae contenido')) {
    let datos = null;
    try { datos = JSON.parse(exportado); } catch (e) { }
    bien(!!datos, 'el respaldo es JSON válido');
    if (datos) {
      bien(!!datos.configGlobal, 'el respaldo incluye la configuración');
      bien(Array.isArray(datos.productosPropios), 'el respaldo incluye tus productos propios (no se pierden al cambiar de celular)');
    }
  }

  console.log('\nErrores de ventana capturados:', errores.length);
  errores.forEach(e => console.log(' -', e));
  if (errores.length) ok = false;
  console.log('\n' + (ok ? '✅✅✅ LA PERSISTENCIA FUNCIONA' : '❌❌❌ HAY FALLAS — revisar arriba'));
  process.exitCode = ok ? 0 : 1;
}
run().catch(e => { console.error('❌ EXCEPCIÓN:', e.stack); process.exitCode = 1; });

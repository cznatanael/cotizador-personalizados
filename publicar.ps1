# publicar.ps1 — Publica el cotizador en GitHub Pages con un solo comando.
#
#   cd C:\Users\cznat\ProyectosCopilot\cotizador-personalizados
#   .\publicar.ps1
#
# La primera vez abre el navegador para que autorices tu cuenta de GitHub.
# De ahí en adelante, cada vez que lo corras sube los cambios y actualiza el sitio.

param(
  [string]$Repo = 'cotizador-personalizados',
  [string]$Mensaje = ''
)

$ErrorActionPreference = 'Continue'   # los comandos nativos (git/gh/node) escriben
$ProgressPreference = 'SilentlyContinue'  # avisos en stderr sin que sea un error real:
Set-Location $PSScriptRoot            # el exito se juzga por $LASTEXITCODE, no por stderr.

function Paso($t) { Write-Host "`n>> $t" -ForegroundColor Cyan }
function Alto($t) { Write-Host "`nERROR: $t" -ForegroundColor Red; exit 1 }

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Alto "Falta GitHub CLI. Instalalo con:  winget install --id GitHub.cli"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Alto "Falta Node.js. Instalalo con:  winget install --id OpenJS.NodeJS.LTS"
}

# --- 1. Sesion de GitHub ------------------------------------------------------
gh auth status *>$null
if ($LASTEXITCODE -ne 0) {
  Paso 'Iniciando sesion en GitHub (se abre el navegador)'
  gh auth login --hostname github.com --git-protocol https --web --scopes repo
  if ($LASTEXITCODE -ne 0) { Alto 'No se pudo iniciar sesion en GitHub.' }
}
gh auth setup-git --hostname github.com *>$null
$owner = (gh api user --jq .login 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $owner) { Alto 'No se pudo leer tu usuario de GitHub.' }
Write-Host "Cuenta: $owner"

# --- 2. Pruebas: no se publica nada roto --------------------------------------
Paso 'Corriendo las pruebas antes de publicar'
foreach ($t in 'test-calc.mjs', 'verify-all-combos.mjs', 'verify-persistencia.mjs') {
  node $t *>$null
  if ($LASTEXITCODE -ne 0) { Alto "$t fallo. Corrigelo antes de publicar (corre: node $t)." }
  Write-Host "  OK  $t"
}

# --- 3. Repositorio local -----------------------------------------------------
if (-not (Test-Path '.git')) {
  Paso 'Inicializando el repositorio'
  git init -q -b main
  if ($LASTEXITCODE -ne 0) { Alto 'git init fallo.' }
}
git branch -M main *>$null

git add -A
if (@(git status --porcelain).Count -gt 0) {
  if (-not $Mensaje) { $Mensaje = "Actualizacion del cotizador $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
  Paso "Guardando cambios: $Mensaje"
  git commit -q -m $Mensaje
  if ($LASTEXITCODE -ne 0) { Alto 'git commit fallo (revisa tu user.name / user.email).' }
}
git rev-parse --verify HEAD *>$null
if ($LASTEXITCODE -ne 0) { Alto 'No hay ningun commit que publicar.' }

# --- 4. Repositorio remoto ----------------------------------------------------
gh repo view "$owner/$Repo" --json name *>$null
$existe = ($LASTEXITCODE -eq 0)

if (-not $existe) {
  Paso "Creando el repositorio publico $owner/$Repo"
  # Publico a proposito: GitHub Pages gratis no sirve en repos privados.
  gh repo create $Repo --public --description 'Cotizador para taller de personalizados: sublimacion, vinil, laser e impresion 3D. Una sola pagina, funciona sin internet.'
  if ($LASTEXITCODE -ne 0) { Alto 'No se pudo crear el repositorio.' }
}

git remote remove origin *>$null
git remote add origin "https://github.com/$owner/$Repo.git"

Paso 'Subiendo a GitHub'
git push -u origin main
if ($LASTEXITCODE -ne 0) { Alto 'No se pudo subir. Revisa el mensaje de arriba.' }

# --- 5. Encender GitHub Pages -------------------------------------------------
Paso 'Encendiendo GitHub Pages'
gh api "repos/$owner/$Repo/pages" *>$null
if ($LASTEXITCODE -ne 0) {
  gh api --method POST "repos/$owner/$Repo/pages" -f 'source[branch]=main' -f 'source[path]=/' *>$null
} else {
  gh api --method PUT "repos/$owner/$Repo/pages" -f 'source[branch]=main' -f 'source[path]=/' *>$null
}
if ($LASTEXITCODE -ne 0) {
  Write-Host 'AVISO: no se pudo encender Pages por API.' -ForegroundColor Yellow
  Write-Host "Enciendelo a mano en: https://github.com/$owner/$Repo/settings/pages (Branch: main / root)"
}

Start-Sleep -Seconds 5
$url = (gh api "repos/$owner/$Repo/pages" --jq .html_url 2>$null)
if (-not $url) { $url = "https://$owner.github.io/$Repo/" }

Write-Host ''
Write-Host '=========================================================='
Write-Host ' LISTO' -ForegroundColor Green
Write-Host "  Sitio : $url"
Write-Host "  Repo  : https://github.com/$owner/$Repo"
Write-Host '=========================================================='
Write-Host ' La primera publicacion tarda 1-2 minutos en aparecer.'
Write-Host ' En el celular: abre el sitio y usa "Agregar a pantalla principal".'

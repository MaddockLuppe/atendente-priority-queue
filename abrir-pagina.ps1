# Script PowerShell para abrir a página HTML diretamente no navegador padrão

$htmlFile = "$PSScriptRoot\create-admin-browser.html"

# Verificar se o arquivo existe
if (Test-Path $htmlFile) {
    # Abrir o arquivo no navegador padrão
    Write-Host "Abrindo $htmlFile no navegador padrão..."
    Start-Process $htmlFile
} else {
    Write-Host "Erro: O arquivo $htmlFile não foi encontrado."
}
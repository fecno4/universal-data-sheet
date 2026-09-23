# Script de Inicialização Rápida: Universal DataSheet Studio (Multimarcas)
# Executa o servidor nativo Node.js na porta 8098 e abre o navegador automaticamente

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando Universal DataSheet Studio (Multimarcas)" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $CurrentDir

# Verifica se o Node.js está instalado
try {
    $NodeVersion = node -v
    Write-Host "✔ Node.js detectado: $NodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: Node.js não foi encontrado no PATH do sistema." -ForegroundColor Red
    Write-Host "Por favor, instale o Node.js v20+ para executar o aplicativo." -ForegroundColor Yellow
    Exit 1
}

# Inicia o túnel SSH para o Ollama se necessário (Windows para 10.88.30.12 e 10.88.30.11)
$TunnelProcess = $null
$SshKey = "$env:USERPROFILE\.ssh\multi-migration-ed25519"
if (Test-Path $SshKey) {
    try {
        $TcpTest12 = Test-NetConnection -ComputerName 127.0.0.1 -Port 11434 -WarningAction SilentlyContinue
        $TcpTest11 = Test-NetConnection -ComputerName 127.0.0.1 -Port 11435 -WarningAction SilentlyContinue
        if (-not $TcpTest12.TcpTestSucceeded -or -not $TcpTest11.TcpTestSucceeded) {
            Write-Host "Iniciando túnel seguro para os servidores de IA (10.88.30.12 e 10.88.30.11)..." -ForegroundColor Yellow
            $TunnelProcess = Start-Process ssh -ArgumentList "-i", "`"$SshKey`"", "-o", "StrictHostKeyChecking=no", "-N", "-L", "11434:10.88.30.12:11434", "-L", "11435:10.88.30.11:11434", "root@10.88.30.60" -PassThru -WindowStyle Hidden
            Start-Sleep -Seconds 2
        }
    } catch {
        Write-Host "Aviso: Não foi possível testar ou iniciar o túnel automático." -ForegroundColor DarkGray
    }
}

# Inicia o servidor Node.js
Write-Host "Iniciando servidor local em http://localhost:8098 ..." -ForegroundColor Yellow
$Process = Start-Process node -ArgumentList "server.mjs" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

# Abre o navegador padrão na porta 8098
Start-Process "http://localhost:8098"

Write-Host "✔ Universal DataSheet Studio está ativo!" -ForegroundColor Green
Write-Host "Pressione CTRL+C para encerrar o servidor quando desejar." -ForegroundColor Gray

# Aguarda o processo
try {
    $Process.WaitForExit()
} catch {
    Stop-Process -Id $Process.Id -Force
} finally {
    if ($TunnelProcess -and -not $TunnelProcess.HasExited) {
        Stop-Process -Id $TunnelProcess.Id -Force
    }
}

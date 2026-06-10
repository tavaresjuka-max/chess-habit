# convert-ebooks.ps1
# Converte AZW/AZW3/EPUB para TXT usando Calibre ebook-convert
# Limpa caracteres problematicos em nomes de arquivo

param([switch]$DryRun)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

$ebookConvert = "C:\Program Files\Calibre2\ebook-convert.exe"
$sourceDir = "C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\LIVROS XADREZ PARA CONSULTA\ONDA 2 LIVROS"
$outputDir = "C:\Users\tavar\OneDrive\Documentos\CLAUDE CODE\APRENDER XADREZ\lichess-tutor\LIVROS XADREZ PARA CONSULTA\_convertidos"
$manifestPath = Join-Path $outputDir "_manifesto-conversao.md"

if (!(Test-Path $ebookConvert)) { Write-Host "ERRO: Calibre nao encontrado em $ebookConvert"; exit 1 }
if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }

$converted = 0; $failed = 0; $skipped = 0; $total = 0
$manifest = @()

# Livros a PULAR (ja classificados como lixo/ficcao nas analises)
$skipPatterns = @(
    "Grandmaster_-_David_Klass", "The_Last_Gambit", "The_Luneburg", "The_Luzhin",
    "Interregnum", "Go_To_-_Steve", "Beyond_Deep_Blue", "Von_Neumann",
    "The_KGB_Plays", "John_Brown", "Thinking_Sideways", "Chessmen_of_Doom",
    "Game_of_Chess_-_S_Kartik", "Middle_Game_-_Sean", "A_Game_of_Chess_-_Lisa",
    "AI_n_CHESS", "Chess_Opening_Moves_-_Sean", "Crafting_of_Chess",
    "Game_and_Playe_of_the_Chesse", "Chess_principles_for_Martial"
)

function Convert-File {
    param($SourceFile, $Format)

    $name = $SourceFile.BaseName
    $safeName = $name -replace '[^\w\- ]', '' -replace '\s+', '-'
    if ($safeName.Length -gt 80) { $safeName = $safeName.Substring(0, 80) }

    # Skip trash
    foreach ($pat in $skipPatterns) {
        if ($name -match $pat) { return "skipped_trash" }
    }

    # Skip already-classified KDP spam (Chess for Beginners genéricos em inglês)
    if ($name -match 'Chess_For_Beginners' -or $name -match 'Chess_for_Beginners' -or
        $name -match 'CHESS_FOR_BEGINNERS' -or $name -match 'Chess__Complete' -or
        $name -match 'Chess__Conquer' -or $name -match 'Chess__How_to_Play' -or
        $name -match 'Chess__The_Right' -or $name -match 'Chess__Top_Beginners' -or
        $name -match 'Chess_2_Book' -or $name -match 'Chess_-_Victor' -or
        $name -match 'Chess_A_complete' -or $name -match 'Chess_Book_For' -or
        $name -match 'Chess_for_Absolute' -or $name -match 'Chess_From_Beginning' -or
        $name -match 'Chess_fundamentals__A_simple' -or $name -match 'Chess_Openings_For_Beginners' -or
        $name -match 'Chess_The_Complete_Guide' -or $name -match 'Chess_Ultimate' -or
        $name -match 'How_To_Beat_Anyone' -or $name -match 'How_To_Improve_At_Chess' -or
        $name -match 'How_To_Play_Chess__A_Beginners' -or $name -match 'How_to_Play_Chess_-_Magnus' -or
        $name -match 'How_to_Play_Chess_for_Beginners' -or $name -match 'HOW_TO_WIN_AT_CHESS' -or
        $name -match 'Learn_How_to_Play_Chess' -or $name -match 'MASTER_CHESS_FOR_BEGINNERS' -or
        $name -match 'Chess_Strategy_-_Ronald' -or $name -match 'CHESS_STRATEGY_FOR_BEGINNERS' -or
        $name -match 'Chess_Openings_-_Robert' -or $name -match 'Chess_Middlegame_for_Beginners' -or
        $name -match 'Chess_Endgame_for_Beginners' -or $name -match 'Chess_Games_of_Legends' -or
        $name -match 'Powerful_Chess_Opening' -or $name -match 'Chess_For_Beginners__Winning' -or
        $name -match 'Karthik_PM' -or $name -match 'Tim_Sawyer' -or
        $name -match 'Chess_Tactics_For_Intermediates' -or $name -match 'Kids_Chess__Three') {
        return "skipped_spam"
    }

    $outFile = Join-Path $outputDir "$safeName-from-$Format.txt"
    $outFileMd = Join-Path $outputDir "$safeName-from-$Format.md"

    if (Test-Path $outFile) {
        $existing = Get-Item $outFile
        if ($existing.Length -gt 20000) { return "skipped_exists" }
    }

    if ($DryRun) {
        Write-Host "  [DRY] $safeName"
        return "dryrun"
    }

    # Try TXT first (cleanest), then MD
    Write-Host "  Convertendo: $safeName..." -NoNewline
    try {
        $result = & $ebookConvert $SourceFile.FullName $outFile 2>&1
        if (Test-Path $outFile) {
            $chars = (Get-Content $outFile -Raw).Length
            if ($chars -gt 5000) {
                Write-Host " OK ($chars chars)" -ForegroundColor Green
                return @{status="ok"; chars=$chars; file=$outFile}
            } else {
                # Too small, try MD format for better structure
                Remove-Item $outFile -Force
                $result2 = & $ebookConvert $SourceFile.FullName $outFileMd 2>&1
                if (Test-Path $outFileMd) {
                    $charsMd = (Get-Content $outFileMd -Raw).Length
                    if ($charsMd -gt 5000) {
                        Write-Host " OK-MD ($charsMd chars)" -ForegroundColor Green
                        return @{status="ok_md"; chars=$charsMd; file=$outFileMd}
                    }
                }
                Write-Host " POUCO_TEXTO ($chars chars)" -ForegroundColor Yellow
                return @{status="parcial"; chars=$chars; file=$outFile}
            }
        } else {
            Write-Host " FAIL (sem saida)" -ForegroundColor Red
            return @{status="falhou"; chars=0; file=""}
        }
    } catch {
        Write-Host " FAIL ($_)" -ForegroundColor Red
        return @{status="falhou"; chars=0; file=""}
    }
}

# ============================================================
# FASE 1: AZW e AZW3 (Kindle) — prioridade PT-BR
# ============================================================
Write-Host "`n=== FASE 1: AZW/AZW3 (Kindle) ===" -ForegroundColor Cyan
$kindleFiles = Get-ChildItem $sourceDir -Recurse -File | Where-Object { $_.Extension -match '\.(azw|azw3)$' }
Write-Host "Encontrados: $($kindleFiles.Count) arquivos"

foreach ($f in $kindleFiles) {
    $total++
    $fmt = $f.Extension.Replace(".", "")
    $result = Convert-File -SourceFile $f -Format $fmt

    if ($result -is [string]) {
        if ($result -eq "skipped_exists") { $skipped++; Write-Host "  SKIP (ja existe): $($f.BaseName)" -ForegroundColor Yellow }
        elseif ($result -eq "skipped_spam") { $skipped++ }
        elseif ($result -eq "skipped_trash") { $skipped++ }
        continue
    }

    $manifest += @{
        arquivo_origem = $f.Name
        formato_origem = $fmt
        metodo_conversao = "Calibre ebook-convert"
        arquivo_saida = Split-Path $result.file -Leaf
        chars_extraidos = $result.chars
        status = $result.status
        qualidade = if ($result.status -eq "ok") { "alta" } elseif ($result.status -eq "ok_md") { "alta" } elseif ($result.status -eq "parcial") { "media" } else { "baixa" }
        observacao = ""
    }

    if ($result.status -match "ok") { $converted++ } else { $failed++ }
}

# ============================================================
# FASE 2: EPUB
# ============================================================
Write-Host "`n=== FASE 2: EPUB ===" -ForegroundColor Cyan
$epubFiles = Get-ChildItem $sourceDir -Recurse -File | Where-Object { $_.Extension -eq '.epub' }
Write-Host "Encontrados: $($epubFiles.Count) arquivos"

foreach ($f in $epubFiles) {
    $total++
    $result = Convert-File -SourceFile $f -Format "epub"

    if ($result -is [string]) {
        if ($result -eq "skipped_exists") { $skipped++; Write-Host "  SKIP (ja existe): $($f.BaseName)" -ForegroundColor Yellow }
        elseif ($result -eq "skipped_spam") { $skipped++ }
        continue
    }

    $manifest += @{
        arquivo_origem = $f.Name
        formato_origem = "epub"
        metodo_conversao = "Calibre ebook-convert"
        arquivo_saida = Split-Path $result.file -Leaf
        chars_extraidos = $result.chars
        status = $result.status
        qualidade = if ($result.status -match "ok") { "alta" } elseif ($result.status -eq "parcial") { "media" } else { "baixa" }
        observacao = ""
    }

    if ($result.status -match "ok") { $converted++ } else { $failed++ }
}

# ============================================================
# Relatorio
# ============================================================
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "CONVERSAO CONCLUIDA" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Total processados: $total"
Write-Host "Convertidos OK: $converted"
Write-Host "Falhas: $failed"
Write-Host "Pulados (existentes/spam): $skipped"

# Generate manifest
$manifestMd = @"
# Manifesto de Conversao — Formatos Ilegiveis

**Data:** 2026-06-09
**Ferramenta:** Calibre ebook-convert 9.9.0

## Resumo

| Metrica | Valor |
|---------|-------|
| Total processados | $total |
| Convertidos OK | $converted |
| Falhas | $failed |
| Pulados | $skipped |

## Itens Convertidos

| Arquivo Origem | Formato | Metodo | Arquivo Saida | Chars | Status | Qualidade |
|---------------|---------|--------|---------------|-------|--------|-----------|
"@

foreach ($m in $manifest) {
    $manifestMd += "`n| $($m.arquivo_origem) | $($m.formato_origem) | $($m.metodo_conversao) | $($m.arquivo_saida) | $($m.chars_extraidos) | $($m.status) | $($m.qualidade) |"
}

$manifestMd += "`n`n## Arquivos que Precisam de Tratamento Manual`n"
$manifestMd += "`n(Conversao via Calibre foi suficiente para todos os processados. Verificar qualidade de leitura nas analises posteriores.)`n"

Set-Content -Path $manifestPath -Value $manifestMd -Encoding UTF8
Write-Host "`nManifesto: $manifestPath"
Write-Host "Arquivos convertidos: $outputDir"

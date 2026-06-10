# download-relevant.ps1
# Download seletivo para lichess-tutor: apenas pedagogia, fundamentos, taticas, finais 0-1200
# Fontes: Internet Archive (PD/CC) + DOAJ + Gutenberg

param([int]$MaxItems = 0, [switch]$DryRun)
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

$OutputDir = "output/chess-literature-library/files"
$ManifestPath = "docs/research/chess-literature/manifests/phase1-downloads.jsonl"
$downloaded = 0; $skipped = 0; $failed = 0; $irrelevant = 0

# Carrega manifesto existente
$manifest = @{}
if (Test-Path $ManifestPath) {
    Get-Content $ManifestPath | ForEach-Object {
        try { $e = $_ | ConvertFrom-Json; $manifest["$($e.source)/$($e.sourceId)"] = $true } catch {}
    }
}

# Funcoes
function Test-Done($k) { return $manifest.ContainsKey($k) }
function Add-Manifest($e) {
    $j = $e | ConvertTo-Json -Compress -Depth 3
    Add-Content -Path $ManifestPath -Value $j -Encoding UTF8
    $manifest["$($e.source)/$($e.sourceId)"] = $true
}
function Safe-DL($url, $path, $desc) {
    $d = Split-Path $path -Parent
    if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    if (Test-Path $path) { $script:skipped++; return $false }
    if ($DryRun) { Write-Host "  [DRY] $desc" -ForegroundColor Gray; return $true }
    try {
        Invoke-WebRequest -Uri $url -OutFile $path -UseBasicParsing -TimeoutSec 90
        return $true
    } catch { $script:failed++; Write-Host "  FAIL: $_" -ForegroundColor Red; return $false }
}

# Filtro de relevancia: titulo + identificador
function Is-Relevant($title, $id) {
    $t = "$title $id".ToLower()
    # EXCLUI
    if ($t -match 'sicilian|nimzo.indi|grunfeld|kings.indi|queens.gambit.*declined|slav.*defen') { return $false }
    if ($t -match 'tournament|congress|interzonal|candidates.*tournament|championship.*189|championship.*190|championship.*192') { return $false }
    if ($t -match 'poem|poetry|novel|fiction|romance|story.*tale|fairy.*chess') { return $false }
    if ($t -match 'alphazero|reinforcement.learning|neural.network|deep.learning|stockfish|comput.*chess.*engine') { return $false }
    if ($t -match 'variant|bongcloud|chess.960|bughouse|3d.chess|4d.chess|fairy.chess') { return $false }
    if ($t -match 'bibliography|encyclopedia|dictionary.*chess|index.*chess|catalog.*chess') { return $false }
    if ($t -match 'checkers.*draught|backgammon|domino|card.game|board.game.*not.chess') { return $false }
    if ($t -match 'astronomy|medical.*chess|CHESS.*score|CHESS.*study|cardiac|pulmonary|hepatology') { return $false }
    if ($t -match 'sociolog.*chess|politic.*chess|law.*chess|congressional|parliament') { return $false }
    if ($t -match 'magazine|periodical|journal.*chess|review.*chess|chronicle') { return $false }
    if ($t -match 'manuscript|illuminat|facsimile|codex.*chess|breviary') { return $false }
    # INCLUI (deve ter pelo menos um destes)
    if ($t -match 'teach|instruct|learn|begin|novice|fundamental|rudiment|elementar|basic|simple|easy') { return $true }
    if ($t -match 'tactic|combination|attack.*chess|chess.*attack|fork|pin|skewer|discovered|mate.*chess') { return $true }
    if ($t -match 'endgame|ending|end.spiel|final.*chess|chess.*final') { return $true }
    if ($t -match 'manual|guide|handbook|primer|introduction|course|method|workbook|lesson') { return $true }
    if ($t -match 'pedagog|educat|school|child|student|curriculum|didactic|teacher|instructor') { return $true }
    if ($t -match 'principle|strategy.*chess|chess.*strategy|winning.*chess|chess.*winning') { return $true }
    if ($t -match 'morphy|capablanca|lasker|nimzowitsch|staunton|philidor|tarrasch|steinitz|reti') { return $true }
    if ($t -match 'practice|practi|train|study.*chess|chess.*study|problem|puzzle|exercise') { return $true }
    if ($t -match 'ajedrez|ensino|xadrez|educacao|echecs|schach|schack|scacchi|shakki|shahmat') { return $true }
    if ($t -match 'middlegame|middle.game|openings.*principles|how.*to.*play|chess.*game|game.*chess') { return $true }
    if ($t -match 'chess.*player|player.*chess|amateur|club.*player|improve|development.*chess') { return $true }
    if ($t -match 'analysis.*chess|chess.*analysis|annotated|collection.*chess|chess.*collection') { return $true }
    return $false
}

# ============================================================
# FASE 1: Internet Archive — busca ampla + filtro relevancia
# ============================================================
Write-Host "`n=== INTERNET ARCHIVE (PD/CC, filtrado por relevancia 0-1200) ===" -ForegroundColor Cyan

$iaQueries = @(
    "subject:chess AND mediatype:texts AND licenseurl:(http*publicdomain* OR http*creativecommons*)"
)

foreach ($q in $iaQueries) {
    $page = 1
    while ($true) {
        if ($MaxItems -gt 0 -and $downloaded -ge $MaxItems) { break }
        $enc = [System.Web.HttpUtility]::UrlEncode($q)
        $url = "https://archive.org/advancedsearch.php?q=$enc&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&fl[]=licenseurl&fl[]=downloads&sort[]=downloads+desc&rows=50&page=$page&output=json"
        Write-Host "  Pagina $page..." -NoNewline
        try {
            $r = Invoke-RestMethod -Uri $url -TimeoutSec 45
            $docs = $r.response.docs
            Write-Host " $($docs.Count) itens"
            if ($docs.Count -eq 0) { break }

            foreach ($doc in $docs) {
                if ($MaxItems -gt 0 -and $downloaded -ge $MaxItems) { break }
                $k = "internet-archive/$($doc.identifier)"
                if (Test-Done $k) { $skipped++; continue }

                if (-not (Is-Relevant $doc.title $doc.identifier)) { $irrelevant++; continue }

                Start-Sleep -Seconds 1
                $mu = "https://archive.org/metadata/$($doc.identifier)"
                try {
                    $m = Invoke-RestMethod -Uri $mu -TimeoutSec 20
                    $bf = $null; $bs = 0
                    foreach ($f in $m.files) {
                        if ($f.name -match '\.pdf$' -and $f.size -gt $bs -and $f.name -notmatch '_text\.pdf$') { $bf = $f; $bs = $f.size }
                    }
                    if (!$bf) { foreach ($f in $m.files) { if ($f.name -match '\.epub$' -and $f.size -gt $bs) { $bf = $f; $bs = $f.size } } }
                    if (!$bf) { foreach ($f in $m.files) { if ($f.name -match '\.txt$' -and $f.size -gt $bs -and $f.name -notmatch '_djvu') { $bf = $f; $bs = $f.size } } }
                    if (!$bf) { foreach ($f in $m.files) { if ($f.name -match '\.djvu$' -and $f.size -gt $bs) { $bf = $f; $bs = $f.size } } }

                    if ($bf -and $bf.name -notmatch '\.(zip|tar|gz)$' -and $bf.name -notmatch '_meta\.') {
                        $sn = $doc.title -replace '[^\w\- ]', '' -replace '\s+', '-'
                        if ($sn.Length -gt 50) { $sn = $sn.Substring(0, 50) }
                        $ext = [IO.Path]::GetExtension($bf.name)
                        $fn = "$($doc.identifier)-$sn$ext"
                        $lp = Join-Path $OutputDir "internet-archive" $fn
                        $du = "https://archive.org/download/$($doc.identifier)/$($bf.name)"
                        $desc = $doc.title.Substring(0, [Math]::Min(60, $doc.title.Length))

                        if (Safe-DL -url $du -path $lp -desc $desc) {
                            if (-not $DryRun) {
                                $sha = (Get-FileHash -Path $lp -Algorithm SHA256).Hash.ToLower()
                                Add-Manifest @{
                                    source="internet-archive"; sourceId=$doc.identifier; title=$doc.title
                                    authors=if($doc.creator){@($doc.creator)}else{@()}
                                    year=if($doc.year){[int]$doc.year}else{$null}
                                    license=if($doc.licenseurl){$doc.licenseurl[0]}else{$null}
                                    landingPageUrl="https://archive.org/details/$($doc.identifier)"
                                    downloadUrl=$du; localPath=$lp; bytes=$bs; sha256=$sha
                                    format=$ext.ToUpper().Replace(".",""); status="downloaded"
                                    downloadedAt=(Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffffffK")
                                    reason="ia_relevant_pd_cc"
                                }
                            }
                            $downloaded++
                            Write-Host "  OK #$downloaded : $desc" -ForegroundColor Green
                        }
                    } else { $skipped++ }
                } catch { $failed++ }
            }
            if ($docs.Count -lt 50) { break }
            $page++
        } catch { Write-Host " ERRO" -ForegroundColor Red; break }
    }
}

# ============================================================
# FASE 2: DOAJ — Artigos de educacao de xadrez
# ============================================================
Write-Host "`n=== DOAJ: Artigos de educacao de xadrez ===" -ForegroundColor Cyan

$dp = 1
while ($dp -le 5) {
    if ($MaxItems -gt 0 -and $downloaded -ge $MaxItems) { break }
    $du = "https://doaj.org/api/search/articles/chess?pageSize=50&page=$dp"
    Write-Host "  Pagina $dp..." -NoNewline
    try {
        $r = Invoke-RestMethod -Uri $du -TimeoutSec 30
        Write-Host " $($r.results.Count) artigos"
        if (!$r.results -or $r.results.Count -eq 0) { break }
        foreach ($a in $r.results) {
            if ($MaxItems -gt 0 -and $downloaded -ge $MaxItems) { break }
            $b = $a.bibjson
            $t = $b.title.ToLower()
            if ($t -notmatch 'chess|ajedrez|echecs|schach|xadrez') { $irrelevant++; continue }
            if ($t -match 'cardiac|pulmonary|hepat|cirrhos|transplant|CHESS.*score|oncology|radiology') { $irrelevant++; continue }

            $k = "doaj/$($a.id)"
            if (Test-Done $k) { $skipped++; continue }

            $pu = $null
            foreach ($l in $b.link) { if ($l.type -eq "fulltext" -or ($l.url -and $l.url -match '\.pdf$')) { $pu = $l.url; break } }
            if (!$pu) { continue }

            Start-Sleep -Seconds 1
            $sn = $b.title -replace '[^\w\- ]', '' -replace '\s+', '-'
            if ($sn.Length -gt 50) { $sn = $sn.Substring(0, 50) }
            $fn = "DOAJ-$($a.id)-$sn.pdf"
            $lp = Join-Path $OutputDir "doaj" $fn
            $desc = $b.title.Substring(0, [Math]::Min(60, $b.title.Length))

            if (Safe-DL -url $pu -path $lp -desc $desc) {
                if (-not $DryRun) {
                    $sha = (Get-FileHash -Path $lp -Algorithm SHA256).Hash.ToLower()
                    $fi = Get-Item $lp
                    $au = @(); foreach ($x in $b.author) { if ($x.name) { $au += $x.name } }
                    $lu = $null; foreach ($l in $b.link) { if ($l.type -eq "fulltext") { $lu = $l.url; break } }
                    $li = $null; if ($b.license -and $b.license.Count -gt 0) { $li = $b.license[0].type }
                    Add-Manifest @{
                        source="doaj"; sourceId=$a.id; title=$b.title; authors=$au
                        year=$b.year; type="article"; language=($b.journal.language|Select -First 1)
                        license=$li; landingPageUrl=$lu; downloadUrl=$pu; localPath=$lp
                        bytes=$fi.Length; sha256=$sha; status="downloaded"
                        downloadedAt=(Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffffffK")
                        reason="doaj_chess_education_oa"
                    }
                }
                $downloaded++
                Write-Host "  OK #$downloaded : $desc" -ForegroundColor Green
            }
        }
        $dp++
    } catch { Write-Host " ERRO: $_" -ForegroundColor Red; break }
}

# ============================================================
# Relatorio
# ============================================================
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "BAIXADOS: $downloaded (novos nesta execucao)" -ForegroundColor Green
Write-Host "Pulados (ja existentes): $skipped"
Write-Host "Irrelevantes ignorados: $irrelevant" -ForegroundColor Yellow
Write-Host "Falhas: $failed" -ForegroundColor Red
Write-Host "Total acumulado no manifesto: $($manifest.Count)"
Write-Host "Manifesto: $ManifestPath"
Write-Host "Arquivos: $OutputDir"

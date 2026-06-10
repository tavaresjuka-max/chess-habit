# download-chess-library.ps1
# Pipeline de download legal da biblioteca de literatura de xadrez
# Fontes: Internet Archive (PD/CC), OpenAlex (OA+PDF), DOAJ
# Respeita rate limits, gera manifesto JSONL com SHA-256

param(
    [string]$OutputDir = "output/chess-literature-library/files",
    [string]$ManifestDir = "docs/research/chess-literature/manifests",
    [int]$DelaySeconds = 3,
    [int]$MaxItems = 0,
    [switch]$DryRun,
    [switch]$SkipIA,
    [switch]$SkipOpenAlex,
    [switch]$SkipDOAJ
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

$script:Downloaded = 0
$script:Skipped = 0
$script:Failed = 0
$script:StartTime = Get-Date
$script:ManifestPath = Join-Path $ManifestDir "phase1-downloads.jsonl"
$script:ManifestEntries = @{}

# Ensure directories exist
if (!(Test-Path $ManifestDir)) { New-Item -ItemType Directory -Path $ManifestDir -Force | Out-Null }
if (!(Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }

# Load existing manifest for skip
if (Test-Path $script:ManifestPath) {
    Get-Content $script:ManifestPath | ForEach-Object {
        try {
            $entry = $_ | ConvertFrom-Json
            $key = "$($entry.source)/$($entry.sourceId)"
            $script:ManifestEntries[$key] = $true
        } catch {}
    }
    Write-Host "Manifesto existente: $($script:ManifestEntries.Count) itens ja baixados"
}

function Write-ManifestEntry {
    param($Entry)
    $json = $Entry | ConvertTo-Json -Compress -Depth 3
    Add-Content -Path $script:ManifestPath -Value $json -Encoding UTF8
    $key = "$($Entry.source)/$($Entry.sourceId)"
    $script:ManifestEntries[$key] = $true
}

function Get-SHA256 {
    param($FilePath)
    try {
        $hash = (Get-FileHash -Path $FilePath -Algorithm SHA256).Hash.ToLower()
        return $hash
    } catch {
        return ""
    }
}

function Invoke-SafeDownload {
    param($Url, $LocalPath, $Description)

    try {
        $dir = Split-Path $LocalPath -Parent
        if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

        if ($DryRun) {
            Write-Host "  [DRY] $Description"
            return $true
        }

        Write-Host "  Baixando: $Description" -NoNewline
        Invoke-WebRequest -Uri $Url -OutFile $LocalPath -UseBasicParsing -TimeoutSec 120
        Write-Host " OK" -ForegroundColor Green
        $script:Downloaded++
        return $true
    } catch {
        Write-Host " FAIL: $_" -ForegroundColor Red
        $script:Failed++
        return $false
    }
}

function Should-Stop {
    return ($MaxItems -gt 0 -and $script:Downloaded -ge $MaxItems)
}

# ============================================================
# FASE 1: Internet Archive — Chess books with PD/CC license
# ============================================================
if (-not $SkipIA -and -not (Should-Stop)) {
    Write-Host "`n=== FASE 1: Internet Archive ===" -ForegroundColor Cyan

    $iaQueries = @(
        "subject:chess AND mediatype:texts AND licenseurl:(http*publicdomain* OR http*creativecommons*)"
    )

    $iaBaseUrl = "https://archive.org/advancedsearch.php"

    foreach ($query in $iaQueries) {
        if (Should-Stop) { break }

        $page = 1
        while ($true) {
            if (Should-Stop) { break }

            $encodedQuery = [System.Web.HttpUtility]::UrlEncode($query)
            $searchUrl = "$iaBaseUrl`?q=$encodedQuery&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&fl[]=licenseurl&fl[]=format&fl[]=language&fl[]=downloads&sort[]=downloads+desc&rows=100&page=$page&output=json"

            Write-Host "  IA: Pagina $page ..."
            try {
                $response = Invoke-RestMethod -Uri $searchUrl -TimeoutSec 60
                $docs = $response.response.docs
                $total = $response.response.numFound

                if ($docs.Count -eq 0) { break }

                Write-Host "  IA: $($docs.Count) itens na pagina $page (total: $total)"

                foreach ($doc in $docs) {
                    if (Should-Stop) { break }

                    $iaKey = "internet-archive/$($doc.identifier)"
                    if ($script:ManifestEntries.ContainsKey($iaKey)) {
                        $script:Skipped++
                        continue
                    }

                    Start-Sleep -Seconds $DelaySeconds

                    $metaUrl = "https://archive.org/metadata/$($doc.identifier)"
                    try {
                        $meta = Invoke-RestMethod -Uri $metaUrl -TimeoutSec 30
                        $bestFile = $null
                        $bestSize = 0

                        foreach ($file in $meta.files) {
                            $name = $file.name
                            if ($name -match '\.pdf$' -and $file.size -gt $bestSize) {
                                # Skip _text.pdf (OCR only)
                                if ($name -notmatch '_text\.pdf$') {
                                    $bestFile = $file
                                    $bestSize = $file.size
                                }
                            }
                        }
                        if (!$bestFile) {
                            foreach ($file in $meta.files) {
                                $name = $file.name
                                if ($name -match '\.epub$' -and $file.size -gt $bestSize) {
                                    $bestFile = $file
                                    $bestSize = $file.size
                                }
                            }
                        }
                        if (!$bestFile) {
                            foreach ($file in $meta.files) {
                                $name = $file.name
                                if ($name -match '\.txt$' -and $file.size -gt $bestSize -and $name -notmatch '_djvu\.txt$') {
                                    $bestFile = $file
                                    $bestSize = $file.size
                                }
                            }
                        }

                        if ($bestFile) {
                            $name = $bestFile.name
                            if ($name -match '\.zip$' -or $name -match '\.tar$' -or $name -match '_meta\.') {
                                $script:Skipped++
                                continue
                            }

                            $safeTitle = ($doc.title -replace '[^\w\- ]', '' -replace '\s+', '-').Trim('-')
                            if ($safeTitle.Length -gt 80) { $safeTitle = $safeTitle.Substring(0, 80) }
                            $ext = [System.IO.Path]::GetExtension($name)
                            $fileName = "$($doc.identifier)-$safeTitle$ext"
                            $localDir = Join-Path $OutputDir "internet-archive"
                            $localPath = Join-Path $localDir $fileName

                            # Skip if file already exists on disk
                            if (Test-Path $localPath) {
                                Write-Host "  SKIP (exists): $($doc.identifier)" -ForegroundColor Yellow
                                $script:Skipped++
                                continue
                            }

                            $downloadUrl = "https://archive.org/download/$($doc.identifier)/$($name)"

                            $desc = "$($doc.identifier): $($doc.title)"
                        if (Invoke-SafeDownload -Url $downloadUrl -LocalPath $localPath -Description $desc) {
                            if (-not $DryRun) {
                                $sha = Get-SHA256 -FilePath $localPath
                                $manifestEntry = @{
                                    source = "internet-archive"
                                    sourceId = $doc.identifier
                                    title = $doc.title
                                    authors = if ($doc.creator) { @($doc.creator) } else { @() }
                                    year = if ($doc.year) { [int]$doc.year } else { $null }
                                    license = if ($doc.licenseurl) { $doc.licenseurl[0] } else { $null }
                                    landingPageUrl = "https://archive.org/details/$($doc.identifier)"
                                    downloadUrl = $downloadUrl
                                    localPath = $localPath
                                    bytes = $bestSize
                                    sha256 = $sha
                                    format = $ext.ToUpper().Replace(".", "")
                                    status = "downloaded"
                                    downloadedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffffffK")
                                    reason = "internet_archive_publicdomain_or_cc"
                                }
                                Write-ManifestEntry -Entry $manifestEntry
                            }
                        }
                        } else {
                            $script:Skipped++
                        }
                    } catch {
                        Write-Host "  META ERROR: $($doc.identifier)" -ForegroundColor Red
                        $script:Failed++
                    }
                }

                if ($docs.Count -lt 100) { break }
                $page++
            } catch {
                Write-Host "  IA SEARCH ERROR pagina $page" -ForegroundColor Red
                break
            }
        }
    }
}

# ============================================================
# FASE 2: OpenAlex — Chess education papers with OA PDF
# ============================================================
if (-not $SkipOpenAlex -and -not (Should-Stop)) {
    Write-Host "`n=== FASE 2: OpenAlex ===" -ForegroundColor Cyan

    $oaQueries = @(
        "chess+education",
        "chess+teaching",
        "chess+training",
        "chess+cognition"
    )

    foreach ($query in $oaQueries) {
        if (Should-Stop) { break }

        $cursor = "*"
        $page = 1

        while ($cursor -and $page -le 15) {
            if (Should-Stop) { break }

            $searchUrl = "https://api.openalex.org/works?search=$query&filter=open_access.is_oa:true,has_pdf_url:true&per_page=50&sort=cited_by_count:desc&cursor=$cursor"

            Write-Host "  OA: '$query' pagina $page..."
            try {
                $response = Invoke-RestMethod -Uri $searchUrl -TimeoutSec 60

                foreach ($work in $response.results) {
                    if (Should-Stop) { break }

                    $oaId = $work.id -replace 'https://openalex.org/', ''
                    $oaKey = "openalex/$oaId"

                    if ($script:ManifestEntries.ContainsKey($oaKey)) {
                        $script:Skipped++
                        continue
                    }

                    $title = $work.title.ToString().ToLower()
                    if ($title -notmatch 'chess|ajedrez|echecs|schach|xadrez') {
                        continue
                    }

                    $pdfUrl = $null
                    if ($work.best_oa_location -and $work.best_oa_location.pdf_url) {
                        $pdfUrl = $work.best_oa_location.pdf_url
                    } elseif ($work.primary_location -and $work.primary_location.pdf_url) {
                        $pdfUrl = $work.primary_location.pdf_url
                    }

                    if ($pdfUrl) {
                        $safeTitle = ($work.title -replace '[^\w\- ]', '' -replace '\s+', '-').Trim('-')
                        if ($safeTitle.Length -gt 80) { $safeTitle = $safeTitle.Substring(0, 80) }
                        $fileName = "W$oaId-$safeTitle.pdf"
                        $localDir = Join-Path $OutputDir "openalex"
                        $localPath = Join-Path $localDir $fileName

                        if (Test-Path $localPath) {
                            $script:Skipped++
                            continue
                        }

                        Start-Sleep -Seconds $DelaySeconds

                        $authors = @()
                        foreach ($auth in $work.authorships) {
                            if ($auth.author -and $auth.author.display_name) {
                                $authors += $auth.author.display_name
                            }
                        }

                    if (Invoke-SafeDownload -Url $pdfUrl -LocalPath $localPath -Description "$oaId`: $($work.title)") {
                        if (-not $DryRun) {
                            $sha = Get-SHA256 -FilePath $localPath
                            $fileInfo = Get-Item $localPath -ErrorAction SilentlyContinue
                            $bytes = if ($fileInfo) { $fileInfo.Length } else { 0 }

                            $license = $null
                            if ($work.best_oa_location -and $work.best_oa_location.license) {
                                $license = $work.best_oa_location.license
                            }

                            $manifestEntry = @{
                                source = "openalex"
                                sourceId = $work.id
                                title = $work.title
                                authors = $authors
                                year = $work.publication_year
                                type = $work.type
                                language = $work.language
                                license = $license
                                landingPageUrl = if ($work.doi) { "https://doi.org/$($work.doi)" } else { "" }
                                downloadUrl = $pdfUrl
                                localPath = $localPath
                                bytes = $bytes
                                sha256 = $sha
                                status = "downloaded"
                                downloadedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffffffK")
                                reason = "openalex_open_access"
                            }
                            Write-ManifestEntry -Entry $manifestEntry
                        }
                    }
                    }
                }

                $cursor = $response.meta.next_cursor
                $page++
            } catch {
                Write-Host "  OA SEARCH ERROR: $_" -ForegroundColor Red
                break
            }
        }
    }
}

# ============================================================
# FASE 3: DOAJ — Open access chess articles
# ============================================================
if (-not $SkipDOAJ -and -not (Should-Stop)) {
    Write-Host "`n=== FASE 3: DOAJ ===" -ForegroundColor Cyan

    $doajQuery = "chess"
    $doajPage = 1

    while ($doajPage -le 10) {
        if (Should-Stop) { break }

        $doajUrl = "https://doaj.org/api/search/articles/$doajQuery`?pageSize=50&page=$doajPage"

        Write-Host "  DOAJ: '$doajQuery' pagina $doajPage..."
        try {
            $response = Invoke-RestMethod -Uri $doajUrl -TimeoutSec 30
            if (!$response.results -or $response.results.Count -eq 0) { break }

            foreach ($article in $response.results) {
                if (Should-Stop) { break }

                $bib = $article.bibjson
                $title = $bib.title.ToLower()

                if ($title -notmatch 'chess|ajedrez|echecs|schach|xadrez') { continue }

                $doajId = $article.id
                $doajKey = "doaj/$doajId"
                if ($script:ManifestEntries.ContainsKey($doajKey)) {
                    $script:Skipped++
                    continue
                }

                $pdfUrl = $null
                foreach ($link in $bib.link) {
                    if ($link.type -eq "fulltext" -or ($link.url -and $link.url -match '\.pdf$')) {
                        $pdfUrl = $link.url
                        break
                    }
                }

                if ($pdfUrl) {
                    $safeTitle = ($bib.title -replace '[^\w\- ]', '' -replace '\s+', '-').Trim('-')
                    if ($safeTitle.Length -gt 80) { $safeTitle = $safeTitle.Substring(0, 80) }
                    $fileName = "DOAJ-$doajId-$safeTitle.pdf"
                    $localDir = Join-Path $OutputDir "doaj"
                    $localPath = Join-Path $localDir $fileName

                    if (Test-Path $localPath) {
                        $script:Skipped++
                        continue
                    }

                    Start-Sleep -Seconds $DelaySeconds

                    $authors = @()
                    foreach ($auth in $bib.author) {
                        if ($auth.name) { $authors += $auth.name }
                    }

                    $landingUrl = $null
                    foreach ($link in $bib.link) {
                        if ($link.type -eq "fulltext") { $landingUrl = $link.url; break }
                    }

                    $bibLicense = $null
                    if ($bib.license -and $bib.license.Count -gt 0) {
                        $bibLicense = $bib.license[0].type
                    }

                if (Invoke-SafeDownload -Url $pdfUrl -LocalPath $localPath -Description "DOAJ $doajId`: $($bib.title)") {
                    if (-not $DryRun) {
                        $sha = Get-SHA256 -FilePath $localPath
                        $fileInfo = Get-Item $localPath -ErrorAction SilentlyContinue
                        $bytes = if ($fileInfo) { $fileInfo.Length } else { 0 }

                        $manifestEntry = @{
                            source = "doaj"
                            sourceId = $doajId
                            title = $bib.title
                            authors = $authors
                            year = $bib.year
                            type = "article"
                            language = ($bib.journal.language | Select-Object -First 1)
                            license = $bibLicense
                            landingPageUrl = $landingUrl
                            downloadUrl = $pdfUrl
                            localPath = $localPath
                            bytes = $bytes
                            sha256 = $sha
                            status = "downloaded"
                            downloadedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffffffK")
                            reason = "doaj_open_access"
                        }
                        Write-ManifestEntry -Entry $manifestEntry
                    }
                }
                }
            }

            $doajPage++
        } catch {
            Write-Host "  DOAJ ERROR: $_" -ForegroundColor Red
            break
        }
    }
}

# ============================================================
# Relatorio final
# ============================================================
$elapsed = [Math]::Round(((Get-Date) - $script:StartTime).TotalMinutes, 1)
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "DOWNLOAD CONCLUIDO" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Tempo: $elapsed min"
Write-Host "Baixados: $($script:Downloaded)"
Write-Host "Pulados (ja existentes): $($script:Skipped)"
Write-Host "Falhas: $($script:Failed)"
Write-Host "Total no manifesto: $($script:ManifestEntries.Count)"
Write-Host "Manifesto: $script:ManifestPath"
Write-Host "Arquivos: $OutputDir"

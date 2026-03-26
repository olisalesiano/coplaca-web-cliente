param(
  [string]$BaseUrl = "http://localhost:8080"
)

$base = $BaseUrl.TrimEnd('/')

$adminAndLogisticsEndpoints = @(
  @{ Method = "GET"; Path = "/api/v1/admin/users" },
  @{ Method = "DELETE"; Path = "/api/v1/admin/users/1" },
  @{ Method = "POST"; Path = "/api/v1/admin/users/1/reactivate" },
  @{ Method = "GET"; Path = "/api/v1/admin/stats/top-products" },
  @{ Method = "GET"; Path = "/api/v1/orders/warehouse/1/pending" },
  @{ Method = "GET"; Path = "/api/v1/warehouses/1/delivery-agents" },
  @{ Method = "PUT"; Path = "/api/v1/orders/1/assign/1" },
  @{ Method = "PATCH"; Path = "/api/v1/products/1/stock?delta=2" },
  @{ Method = "GET"; Path = "/api/v1/offers" },
  @{ Method = "POST"; Path = "/api/v1/offers" }
)

$swaggerCandidates = @(
  "/v3/api-docs",
  "/swagger-ui/index.html",
  "/swagger-ui.html",
  "/api-docs"
)

function Invoke-EndpointCheck {
  param(
    [string]$Method,
    [string]$Path
  )

  $uri = "$base$Path"

  try {
    $headers = @{}
    $body = $null

    if ($Method -eq 'PATCH') {
      $body = '{}'
      $headers['Content-Type'] = 'application/json'
    }

    if ($Method -eq 'PUT') {
      $body = '{}'
      $headers['Content-Type'] = 'application/json'
    }

    if ($Method -eq 'POST' -and $Path -eq '/api/v1/offers') {
      $body = '{"product":{"id":1},"discountPercentage":10,"reason":"abundancia","startDate":"2026-03-26T00:00:00Z","endDate":"2026-04-02T00:00:00Z","active":true}'
      $headers['Content-Type'] = 'application/json'
    }
    elseif ($Method -eq 'POST') {
      $body = '{}'
      $headers['Content-Type'] = 'application/json'
    }

    $response = Invoke-WebRequest -Uri $uri -Method $Method -Headers $headers -Body $body -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
    [PSCustomObject]@{
      Method = $Method
      Path = $Path
      Status = $response.StatusCode
      Reachable = $true
      Note = 'OK'
    }
  }
  catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    $note = if ($statusCode) { "HTTP $statusCode" } else { $_.Exception.Message }

    [PSCustomObject]@{
      Method = $Method
      Path = $Path
      Status = if ($statusCode) { $statusCode } else { '-' }
      Reachable = $false
      Note = $note
    }
  }
}

Write-Output "=== Coplaca endpoint checker ==="
Write-Output "Base URL: $base"
Write-Output ""

Write-Output "--- API Docs discovery ---"
foreach ($docPath in $swaggerCandidates) {
  $docResult = Invoke-EndpointCheck -Method "GET" -Path $docPath
  $mark = if ($docResult.Reachable) { "OK" } else { "FAIL" }
  Write-Output ("[{0}] {1} {2} -> {3}" -f $mark, $docResult.Method, $docResult.Path, $docResult.Note)
}

Write-Output ""
Write-Output "--- Admin/Logistics endpoint probes ---"
$results = @()
foreach ($item in $adminAndLogisticsEndpoints) {
  $result = Invoke-EndpointCheck -Method $item.Method -Path $item.Path
  $results += $result
  $mark = if ($result.Reachable) { "OK" } else { "FAIL" }
  Write-Output ("[{0}] {1} {2} -> {3}" -f $mark, $result.Method, $result.Path, $result.Note)
}

Write-Output ""
Write-Output "--- Summary ---"
$okCount = ($results | Where-Object { $_.Reachable }).Count
$failCount = ($results | Where-Object { -not $_.Reachable }).Count
Write-Output ("Reachable: {0} | Not reachable: {1}" -f $okCount, $failCount)

if ($failCount -gt 0) {
  Write-Output "Some endpoints are not reachable with current base URL or require auth/valid IDs."
  Write-Output "If docs endpoint is reachable, compare against src/app/core/api.service.ts and patch paths."
}

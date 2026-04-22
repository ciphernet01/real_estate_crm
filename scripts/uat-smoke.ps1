param(
  [string]$ApiBase = "http://localhost:4000/api",
  [string]$Email = "admin@crm.local",
  [string]$Password = "Admin@123"
)

$ErrorActionPreference = "Stop"

function Assert-Ok($label, $condition) {
  if (-not $condition) {
    throw "FAILED: $label"
  }
  Write-Host "PASS: $label" -ForegroundColor Green
}

Write-Host "Running CRM UAT smoke checks against $ApiBase" -ForegroundColor Cyan

$health = Invoke-RestMethod -Method Get -Uri "$ApiBase/health"
Assert-Ok "Health endpoint" ($health.ok -eq $true)

$deep = Invoke-RestMethod -Method Get -Uri "$ApiBase/health/deep"
Assert-Ok "Deep health endpoint" ($deep.ok -eq $true)

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$ApiBase/auth/login" -ContentType "application/json" -Body $loginBody
Assert-Ok "Login token" (![string]::IsNullOrWhiteSpace($login.token))

$headers = @{ Authorization = "Bearer $($login.token)" }

$reports = Invoke-RestMethod -Method Get -Uri "$ApiBase/reports/overview" -Headers $headers
Assert-Ok "Reports overview" ($null -ne $reports.data)

$integration = Invoke-RestMethod -Method Get -Uri "$ApiBase/integrations/status" -Headers $headers
Assert-Ok "Integration status" ($null -ne $integration.data)

$leads = Invoke-RestMethod -Method Get -Uri "$ApiBase/leads" -Headers $headers
Assert-Ok "Leads list" ($null -ne $leads.data)

$properties = Invoke-RestMethod -Method Get -Uri "$ApiBase/properties" -Headers $headers
Assert-Ok "Properties list" ($null -ne $properties.data)

$clients = Invoke-RestMethod -Method Get -Uri "$ApiBase/clients" -Headers $headers
Assert-Ok "Clients list" ($null -ne $clients.data)

$deals = Invoke-RestMethod -Method Get -Uri "$ApiBase/deals" -Headers $headers
Assert-Ok "Deals list" ($null -ne $deals.data)

$communications = Invoke-RestMethod -Method Get -Uri "$ApiBase/communications/notifications/pending?windowHours=24" -Headers $headers
Assert-Ok "Pending notifications" ($null -ne $communications.data)

Write-Host "All smoke checks passed." -ForegroundColor Cyan

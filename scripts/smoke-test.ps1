param([string]$BaseUrl = "http://localhost:8080")
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http
$script:passed = 0
$script:failed = 0

function Call-Api {
    param([string]$Method, [string]$Path, $Body, [string]$Token)
    $client = [System.Net.Http.HttpClient]::new()
    $request = [System.Net.Http.HttpRequestMessage]::new(
        [System.Net.Http.HttpMethod]::new($Method), "$BaseUrl$Path")
    if ($Token) { $request.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Token) }
    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 8 -Compress
        $request.Content = [System.Net.Http.StringContent]::new($json, [Text.Encoding]::UTF8, "application/json")
    }
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $data = $null
    if ($content) {
        try { $data = $content | ConvertFrom-Json } catch { $data = $content }
    }
    $result = [pscustomobject]@{ Status=[int]$response.StatusCode; Data=$data }
    $request.Dispose()
    $response.Dispose()
    $client.Dispose()
    $result
}

function Expect {
    param([string]$Label, $Response, [int[]]$Status = @(200))
    if ($Status -contains $Response.Status) {
        $script:passed++
        Write-Host "PASS  $Label (HTTP $($Response.Status))"
    } else {
        $script:failed++
        Write-Host "FAIL  $Label (HTTP $($Response.Status), expected $($Status -join '/'))"
        if ($Response.Data) { Write-Host ($Response.Data | ConvertTo-Json -Depth 5 -Compress) }
    }
}

function Login([string]$Email, [string]$Password) {
    Call-Api POST "/api/auth/login" @{email=$Email; password=$Password}
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
try {
    Expect "Health" (Call-Api GET "/actuator/health")
    $search = Call-Api GET "/api/jobs/search"
    for ($i = 0; $i -lt 30 -and (-not $search.Data.content -or $search.Data.content.Count -lt 1); $i++) {
        Start-Sleep -Seconds 2
        $search = Call-Api GET "/api/jobs/search"
    }
    Expect "Public job search" $search
    if (-not $search.Data.content -or $search.Data.content.Count -lt 1) {
        throw "Seeded job search returned no jobs"
    }

    $admin = Login "admin@shivanitech.in" "admin123"
    Expect "Admin login" $admin
    $adminToken = $admin.Data.token
    Expect "Admin JWT authorizes dashboard" (Call-Api GET "/api/admin/dashboard" $null $adminToken)

    $candidateDemo = Login "candidate@shivanitech.in" "Candidate@123"
    Expect "Candidate login" $candidateDemo
    Expect "Candidate JWT authorizes profile" (Call-Api GET "/api/candidate/profile" $null $candidateDemo.Data.token)
    Expect "Candidate role blocked from admin" (Call-Api GET "/api/admin/dashboard" $null $candidateDemo.Data.token) @(403)

    $employer = Login "employer@shivanitech.in" "Employer@123"
    Expect "Employer login" $employer
    Expect "Employer JWT authorizes own jobs" (Call-Api GET "/api/employer/jobs" $null $employer.Data.token)

    $employee = Login "employee@shivanitech.in" "Employee@123"
    Expect "Employee login" $employee
    Expect "Employee JWT authorizes profile" (Call-Api GET "/api/employee/me" $null $employee.Data.token)
    Expect "Employee role blocked from employer" (Call-Api GET "/api/employer/jobs" $null $employee.Data.token) @(403)

    $email = "smoke.candidate.$stamp@example.com"
    $registration = Call-Api POST "/api/auth/register/candidate" @{
        email=$email; password="Smoke@123"; fullName="Smoke Candidate"; phone="9876500000"
    }
    Expect "Candidate registration" $registration @(201)
    $log = docker compose logs --no-color backend
    $otpMatch = [regex]::Match(($log -join "`n"), "EMAIL NOT SENT.*?$([regex]::Escape($email)).*?verification code is (\d{6})")
    if (-not $otpMatch.Success) { throw "Could not extract candidate OTP from backend fallback log" }
    Expect "Wrong OTP rejected" (Call-Api POST "/api/auth/verify-otp" @{email=$email; otp="000000"}) @(400)
    Expect "Correct OTP accepted" (Call-Api POST "/api/auth/verify-otp" @{email=$email; otp=$otpMatch.Groups[1].Value}) @(204)
    $newCandidate = Login $email "Smoke@123"
    Expect "New candidate login" $newCandidate

    $cat = Call-Api POST "/api/admin/categories" @{name="Smoke Category $stamp"} $adminToken
    Expect "Admin creates category" $cat @(201)
    $des = Call-Api POST "/api/admin/designations" @{name="Smoke Designation $stamp"} $adminToken
    Expect "Admin creates designation" $des @(201)
    $loc = Call-Api POST "/api/admin/locations" @{name="Smoke Location $stamp"} $adminToken
    Expect "Admin creates location" $loc @(201)
    $skill = Call-Api POST "/api/admin/skills" @{name="Smoke Skill $stamp"} $adminToken
    Expect "Admin creates skill" $skill @(201)

    $job = Call-Api POST "/api/admin/jobs" @{
        title="Smoke Job $stamp"; categoryId=$cat.Data.id; designationId=$des.Data.id
        locationId=$loc.Data.id; skillIds=@($skill.Data.id); salaryMin=40000; salaryMax=80000
    } $adminToken
    Expect "Admin creates job" $job @(201)
    Expect "Job detail" (Call-Api GET "/api/jobs/$($job.Data.id)")
    Expect "Search category filter" (Call-Api GET "/api/jobs/search?categoryId=$($cat.Data.id)")
    Expect "Search location filter" (Call-Api GET "/api/jobs/search?locationId=$($loc.Data.id)")
    Expect "Search skill filter" (Call-Api GET "/api/jobs/search?skillId=$($skill.Data.id)")
    Expect "Candidate applies" (Call-Api POST "/api/candidate/jobs/$($job.Data.id)/apply" $null $newCandidate.Data.token) @(201)
    Expect "Duplicate apply rejected" (Call-Api POST "/api/candidate/jobs/$($job.Data.id)/apply" $null $newCandidate.Data.token) @(409)
    Expect "My applications" (Call-Api GET "/api/candidate/applications" $null $newCandidate.Data.token)

    $companyEmail = "smoke.company.$stamp@example.com"
    $company = Call-Api POST "/api/auth/register/company" @{
        email=$companyEmail; password="Smoke@123"; companyName="Smoke Company $stamp"
        contactEmail=$companyEmail; contactPhone="9876500001"
    }
    Expect "Company registration" $company @(201)
    Expect "Pending employer cannot post" (Call-Api POST "/api/employer/jobs" @{
        title="Blocked Job"; categoryId=$cat.Data.id; designationId=$des.Data.id; locationId=$loc.Data.id
    } $company.Data.token) @(403)
    $pending = Call-Api GET "/api/admin/companies?status=PENDING" $null $adminToken
    $companyId = ($pending.Data | Where-Object contactEmail -eq $companyEmail).id
    if (-not $companyId) { throw "Registered company missing from pending list" }
    Expect "Admin verifies company" (Call-Api PATCH "/api/admin/companies/$companyId/verify" $null $adminToken)
    Expect "Verified employer posts job" (Call-Api POST "/api/employer/jobs" @{
        title="Employer Job $stamp"; categoryId=$cat.Data.id; designationId=$des.Data.id; locationId=$loc.Data.id
    } $company.Data.token) @(201)
} catch {
    $script:failed++
    Write-Host "FAIL  Harness error: $($_.Exception.Message)"
}

Write-Host "`nSmoke test: $script:passed passed, $script:failed failed"
if ($script:failed -gt 0) { exit 1 }

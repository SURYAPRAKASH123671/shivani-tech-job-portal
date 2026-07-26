package com.shivanitech.jobportal.controller;

import com.shivanitech.jobportal.dto.company.CompanyResponse;
import com.shivanitech.jobportal.dto.company.CreateCompanyRequest;
import com.shivanitech.jobportal.entity.CompanyStatus;
import com.shivanitech.jobportal.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Admin-only company management: create a company directly (already active, unlike the public
 * self-registration flow which starts PENDING), list registered companies (optionally by status),
 * and move them between PENDING, ACTIVE (verified, may post jobs), and REJECTED. Enforced by
 * ROLE_ADMIN globally in SecurityConfig.
 */
@RestController
@RequestMapping("/api/admin/companies")
@RequiredArgsConstructor
public class AdminCompanyController {

    private final CompanyService companyService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CompanyResponse createCompany(@Valid @RequestBody CreateCompanyRequest request) {
        return companyService.createCompany(request);
    }

    @GetMapping
    public List<CompanyResponse> listCompanies(@RequestParam(required = false) CompanyStatus status) {
        return companyService.listCompanies(status);
    }

    @PatchMapping("/{id}/verify")
    public CompanyResponse verifyCompany(@PathVariable UUID id) {
        return companyService.verifyCompany(id);
    }

    @PatchMapping("/{id}/reject")
    public CompanyResponse rejectCompany(@PathVariable UUID id) {
        return companyService.rejectCompany(id);
    }
}

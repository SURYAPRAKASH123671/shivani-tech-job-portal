package com.shivanitech.jobportal.service;

import com.shivanitech.jobportal.dto.company.CompanyResponse;
import com.shivanitech.jobportal.entity.Company;
import com.shivanitech.jobportal.entity.CompanyStatus;
import com.shivanitech.jobportal.exception.ResourceNotFoundException;
import com.shivanitech.jobportal.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public List<CompanyResponse> listCompanies(CompanyStatus status) {
        List<Company> companies = status == null
                ? companyRepository.findAll()
                : companyRepository.findByStatus(status);
        return companies.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CompanyResponse getMyCompany(String employerEmail) {
        return toResponse(findByOwnerEmail(employerEmail));
    }

    @Transactional
    public CompanyResponse verifyCompany(UUID companyId) {
        Company company = findById(companyId);
        company.setStatus(CompanyStatus.ACTIVE);
        company.setVerifiedAt(LocalDateTime.now());
        return toResponse(companyRepository.save(company));
    }

    @Transactional
    public CompanyResponse rejectCompany(UUID companyId) {
        Company company = findById(companyId);
        company.setStatus(CompanyStatus.REJECTED);
        return toResponse(companyRepository.save(company));
    }

    Company findByOwnerEmail(String email) {
        return companyRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No company profile for " + email));
    }

    private Company findById(UUID id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + id));
    }

    private CompanyResponse toResponse(Company company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .ownerEmail(company.getUser().getEmail())
                .contactEmail(company.getContactEmail())
                .contactPhone(company.getContactPhone())
                .status(company.getStatus().name())
                .verifiedAt(company.getVerifiedAt())
                .createdAt(company.getCreatedAt())
                .build();
    }
}

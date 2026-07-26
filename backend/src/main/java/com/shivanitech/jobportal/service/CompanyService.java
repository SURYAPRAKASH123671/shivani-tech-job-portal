package com.shivanitech.jobportal.service;

import com.shivanitech.jobportal.dto.company.CompanyResponse;
import com.shivanitech.jobportal.dto.company.CreateCompanyRequest;
import com.shivanitech.jobportal.dto.lookup.NameResponse;
import com.shivanitech.jobportal.entity.Company;
import com.shivanitech.jobportal.entity.CompanyStatus;
import com.shivanitech.jobportal.entity.Role;
import com.shivanitech.jobportal.entity.User;
import com.shivanitech.jobportal.exception.DuplicateResourceException;
import com.shivanitech.jobportal.exception.ResourceNotFoundException;
import com.shivanitech.jobportal.repository.CompanyRepository;
import com.shivanitech.jobportal.repository.UserRepository;
import com.shivanitech.jobportal.service.notification.EmailService;
import com.shivanitech.jobportal.service.notification.SmsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SmsService smsService;

    /**
     * Admin-provisioned company (distinct from the public self-registration flow in
     * AuthService.registerCompany): the admin is vouching for this company directly, so it's
     * created already ACTIVE rather than PENDING, and its login is verified/enabled immediately -
     * mirroring how EmployeeService.createEmployee provisions employee logins.
     */
    @Transactional
    public CompanyResponse createCompany(CreateCompanyRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.EMPLOYER)
                .phone(request.getContactPhone())
                .verified(true)
                .enabled(true)
                .build();
        user = userRepository.save(user);

        Company company = Company.builder()
                .user(user)
                .name(request.getCompanyName())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .status(CompanyStatus.ACTIVE)
                .verifiedAt(LocalDateTime.now())
                .build();
        company = companyRepository.save(company);

        notify(company, "Your company account is ready",
                "An administrator has created a company account for \"" + company.getName()
                        + "\" on Shivani Technologies. You can log in with " + user.getEmail()
                        + " and start posting job openings right away.");

        return toResponse(company);
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> listCompanies(CompanyStatus status) {
        List<Company> companies = status == null
                ? companyRepository.findAll()
                : companyRepository.findByStatus(status);
        return companies.stream().map(this::toResponse).toList();
    }

    /** Public-safe list (id + name only) for the candidate job-search "Company" filter. */
    @Transactional(readOnly = true)
    public List<NameResponse> listActiveCompanyNames() {
        return companyRepository.findByStatus(CompanyStatus.ACTIVE).stream()
                .map(c -> new NameResponse(c.getId(), c.getName()))
                .toList();
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
        company = companyRepository.save(company);
        notify(company, "Your company has been verified",
                "Good news - \"" + company.getName() + "\" has been verified on Shivani "
                        + "Technologies. You can now post job openings.");
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse rejectCompany(UUID companyId) {
        Company company = findById(companyId);
        company.setStatus(CompanyStatus.REJECTED);
        company = companyRepository.save(company);
        notify(company, "Your company registration was not approved",
                "Your registration for \"" + company.getName() + "\" on Shivani Technologies "
                        + "was not approved. Contact an administrator if you believe this is a mistake.");
        return toResponse(company);
    }

    /** Best-effort - a failed notification never blocks the underlying company operation. */
    private void notify(Company company, String subject, String body) {
        String email = company.getContactEmail() != null && !company.getContactEmail().isBlank()
                ? company.getContactEmail() : company.getUser().getEmail();
        emailService.send(email, subject, body);
        if (company.getContactPhone() != null && !company.getContactPhone().isBlank()) {
            smsService.send(company.getContactPhone(), subject + ": " + body);
        }
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

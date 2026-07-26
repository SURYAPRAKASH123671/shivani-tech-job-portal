package com.shivanitech.jobportal.service.notification;

import com.shivanitech.jobportal.dto.notification.MailRequest;
import com.shivanitech.jobportal.dto.notification.NotificationResult;
import com.shivanitech.jobportal.dto.notification.NotificationRecipientResponse;
import com.shivanitech.jobportal.dto.notification.SmsRequest;
import com.shivanitech.jobportal.entity.Company;
import com.shivanitech.jobportal.entity.NotificationAudience;
import com.shivanitech.jobportal.repository.CandidateProfileRepository;
import com.shivanitech.jobportal.repository.CompanyRepository;
import com.shivanitech.jobportal.repository.EmployeeProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Bulk/single mail and SMS to candidates, employees, or companies. Recipients
 * are resolved from whichever profile table matches the chosen audience;
 * pass recipientIds to target specific profiles, or leave it empty to
 * broadcast to everyone in that audience.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final CandidateProfileRepository candidateProfileRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final CompanyRepository companyRepository;
    private final EmailService emailService;
    private final SmsService smsService;

    @Transactional(readOnly = true)
    public List<NotificationRecipientResponse> listRecipients(NotificationAudience audience) {
        return switch (audience) {
            case CANDIDATE -> candidateProfileRepository.findAll().stream()
                    .map(profile -> toRecipientResponse(
                            profile.getId(), profile.getFullName(), profile.getUser().getEmail(), profile.getUser().getPhone()))
                    .toList();
            case EMPLOYEE -> employeeProfileRepository.findAll().stream()
                    .map(profile -> toRecipientResponse(
                            profile.getId(), profile.getFullName(), profile.getUser().getEmail(), profile.getUser().getPhone()))
                    .toList();
            case COMPANY -> companyRepository.findAll().stream()
                    .map(company -> toRecipientResponse(
                            company.getId(), company.getName(), companyEmail(company), companyPhone(company)))
                    .toList();
        };
    }

    @Transactional(readOnly = true)
    public NotificationResult sendMail(MailRequest request) {
        List<Recipient> recipients = resolveRecipients(request.getAudience(), request.getRecipientIds());
        int sent = 0, failed = 0, skipped = 0;
        for (Recipient recipient : recipients) {
            if (recipient.email() == null || recipient.email().isBlank()) {
                skipped++;
                continue;
            }
            boolean ok = emailService.send(recipient.email(), request.getSubject(), request.getBody());
            if (ok) sent++; else failed++;
        }
        return NotificationResult.builder()
                .attempted(recipients.size()).sent(sent).failed(failed).skippedNoContact(skipped).build();
    }

    @Transactional(readOnly = true)
    public NotificationResult sendSms(SmsRequest request) {
        List<Recipient> recipients = resolveRecipients(request.getAudience(), request.getRecipientIds());
        int sent = 0, failed = 0, skipped = 0;
        for (Recipient recipient : recipients) {
            if (recipient.phone() == null || recipient.phone().isBlank()) {
                skipped++;
                continue;
            }
            boolean ok = smsService.send(recipient.phone(), request.getMessage());
            if (ok) sent++; else failed++;
        }
        return NotificationResult.builder()
                .attempted(recipients.size()).sent(sent).failed(failed).skippedNoContact(skipped).build();
    }

    private List<Recipient> resolveRecipients(NotificationAudience audience, List<UUID> recipientIds) {
        boolean filterById = recipientIds != null && !recipientIds.isEmpty();
        Set<UUID> ids = filterById ? Set.copyOf(recipientIds) : Set.of();

        return switch (audience) {
            case CANDIDATE -> candidateProfileRepository.findAll().stream()
                    .filter(p -> !filterById || ids.contains(p.getId()))
                    .map(p -> new Recipient(p.getFullName(), p.getUser().getEmail(), p.getUser().getPhone()))
                    .toList();
            case EMPLOYEE -> employeeProfileRepository.findAll().stream()
                    .filter(p -> !filterById || ids.contains(p.getId()))
                    .map(p -> new Recipient(p.getFullName(), p.getUser().getEmail(), p.getUser().getPhone()))
                    .toList();
            case COMPANY -> companyRepository.findAll().stream()
                    .filter(c -> !filterById || ids.contains(c.getId()))
                    .map(this::companyToRecipient)
                    .toList();
        };
    }

    private Recipient companyToRecipient(Company company) {
        return new Recipient(company.getName(), companyEmail(company), companyPhone(company));
    }

    private NotificationRecipientResponse toRecipientResponse(UUID id, String name, String email, String phone) {
        return NotificationRecipientResponse.builder()
                .id(id)
                .name(name)
                .email(email)
                .phone(phone)
                .build();
    }

    private String companyEmail(Company company) {
        return company.getContactEmail() != null && !company.getContactEmail().isBlank()
                ? company.getContactEmail() : company.getUser().getEmail();
    }

    private String companyPhone(Company company) {
        return company.getContactPhone() != null && !company.getContactPhone().isBlank()
                ? company.getContactPhone() : company.getUser().getPhone();
    }
}

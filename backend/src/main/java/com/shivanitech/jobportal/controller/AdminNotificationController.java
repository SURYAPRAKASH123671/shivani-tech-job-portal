package com.shivanitech.jobportal.controller;

import com.shivanitech.jobportal.dto.notification.MailRequest;
import com.shivanitech.jobportal.dto.notification.NotificationResult;
import com.shivanitech.jobportal.dto.notification.NotificationRecipientResponse;
import com.shivanitech.jobportal.dto.notification.SmsRequest;
import com.shivanitech.jobportal.entity.NotificationAudience;
import com.shivanitech.jobportal.service.notification.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only bulk/single mail and SMS to candidates, employees, or
 * companies. Enforced by ROLE_ADMIN globally in SecurityConfig for
 * /api/admin/**. Sends will no-op (logged only) until a real mail/SMS
 * provider is configured — see EmailService / SmsService.
 */
@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final NotificationService notificationService;

    @GetMapping("/recipients")
    public List<NotificationRecipientResponse> listRecipients(@RequestParam NotificationAudience audience) {
        return notificationService.listRecipients(audience);
    }

    @PostMapping("/mail")
    public NotificationResult sendMail(@Valid @RequestBody MailRequest request) {
        return notificationService.sendMail(request);
    }

    @PostMapping("/sms")
    public NotificationResult sendSms(@Valid @RequestBody SmsRequest request) {
        return notificationService.sendSms(request);
    }
}

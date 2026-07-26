package com.shivanitech.jobportal.service.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Thin wrapper around JavaMailSender. Works with any SMTP provider (Gmail,
 * SendGrid SMTP relay, Mailtrap, your own server) — just set MAIL_HOST,
 * MAIL_USERNAME, MAIL_PASSWORD env vars. Until those are set, sends will fail
 * and get logged here rather than crashing the caller, so the rest of the
 * app works fine with no mail provider configured yet.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    /** Never throws — returns false and logs on any failure (including "no provider configured"). */
    public boolean send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            return true;
        } catch (Exception ex) {
            log.warn("[EMAIL NOT SENT - no mail provider configured] to={} subject='{}' body='{}' (reason: {}). " +
                    "Set MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD to enable real sending.",
                    to, subject, body, ex.getMessage());
            return false;
        }
    }
}

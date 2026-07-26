package com.shivanitech.jobportal.service.notification;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Twilio-backed SMS sender. Until TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
 * TWILIO_FROM_NUMBER are set to real values, this logs what it would have
 * sent instead of calling the Twilio API, so the rest of the app works fine
 * with no SMS provider configured yet.
 */
@Service
@Slf4j
public class SmsService {

    @Value("${app.twilio.account-sid}")
    private String accountSid;

    @Value("${app.twilio.auth-token}")
    private String authToken;

    @Value("${app.twilio.from-number}")
    private String fromNumber;

    private boolean configured;

    @PostConstruct
    void init() {
        configured = !accountSid.isBlank() && !authToken.isBlank() && !fromNumber.isBlank();
        if (configured) {
            Twilio.init(accountSid, authToken);
        } else {
            log.warn("Twilio is not configured (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER). " +
                    "SMS sends will be logged only, not delivered.");
        }
    }

    /** Never throws — returns false and logs on any failure (including "no provider configured"). */
    public boolean send(String toPhone, String body) {
        if (!configured) {
            log.info("[SMS not sent - Twilio unconfigured] to={} body={}", toPhone, body);
            return false;
        }
        try {
            Message.creator(new PhoneNumber(toPhone), new PhoneNumber(fromNumber), body).create();
            return true;
        } catch (Exception ex) {
            log.warn("Could not send SMS to {}: {}", toPhone, ex.getMessage());
            return false;
        }
    }
}

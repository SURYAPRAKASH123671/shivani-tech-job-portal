package com.shivanitech.jobportal.dto.notification;

import com.shivanitech.jobportal.entity.NotificationAudience;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class MailRequest {

    @NotNull
    private NotificationAudience audience;

    /** Leave empty/null to send to every recipient in this audience. */
    private List<UUID> recipientIds;

    @NotBlank
    private String subject;

    @NotBlank
    private String body;
}

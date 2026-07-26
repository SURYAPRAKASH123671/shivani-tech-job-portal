package com.shivanitech.jobportal.dto.notification;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class NotificationRecipientResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
}

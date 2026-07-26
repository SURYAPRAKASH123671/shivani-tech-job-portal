package com.shivanitech.jobportal.dto.notification;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationResult {
    private int attempted;
    private int sent;
    private int failed;
    private int skippedNoContact;
}

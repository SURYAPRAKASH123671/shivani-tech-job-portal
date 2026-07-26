package com.shivanitech.jobportal.dto.employee;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class EmployeeResponse {
    private UUID id;
    private String fullName;
    private String designation;
    private String email;
    private boolean enabled;
    private LocalDateTime createdAt;
}

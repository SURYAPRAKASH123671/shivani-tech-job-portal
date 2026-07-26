package com.shivanitech.jobportal.dto.company;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CompanyResponse {
    private UUID id;
    private String name;
    private String ownerEmail;
    private String contactEmail;
    private String contactPhone;
    private String status;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
}

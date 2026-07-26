package com.shivanitech.jobportal.dto.job;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class JobResponse {
    private UUID id;
    private String title;
    private String description;
    private String companyName;
    private UUID categoryId;
    private String category;
    private UUID designationId;
    private String designation;
    private UUID locationId;
    private String location;
    private List<UUID> skillIds;
    private List<String> skills;
    private Integer salaryMin;
    private Integer salaryMax;
    private Integer experienceMin;
    private Integer experienceMax;
    private String qualification;
    private String status;
    private boolean postedByAdmin;
    private LocalDateTime createdAt;
}

package com.shivanitech.jobportal.dto.job;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lightweight application record for reporting/analytics views (admin- and employer-facing
 * dashboards) - distinct from JobApplicationResponse (the candidate's own view) because it
 * includes category/location/candidate name, which a candidate should never see about their own
 * application to avoid leaking irrelevant detail, but an admin/employer legitimately needs for
 * breakdown charts.
 */
@Data
@Builder
@AllArgsConstructor
public class ApplicationSummaryResponse {
    private UUID applicationId;
    private UUID jobId;
    private String jobTitle;
    private String companyName;
    private String category;
    private String location;
    private String candidateName;
    private String status;
    private LocalDateTime appliedAt;
}

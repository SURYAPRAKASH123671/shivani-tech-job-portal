package com.shivanitech.jobportal.dto.dashboard;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardResponse {
    private long totalCandidates;
    private long totalEmployees;

    private long pendingCompanies;
    private long activeCompanies;
    private long rejectedCompanies;

    private long openJobs;
    private long closedJobs;
    private long jobsPostedByAdmin;
    private long jobsPostedByCompanies;

    private long totalApplications;
}

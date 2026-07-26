package com.shivanitech.jobportal.dto.candidate;

import com.shivanitech.jobportal.dto.job.JobApplicationResponse;
import com.shivanitech.jobportal.dto.job.JobResponse;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CandidateDashboardResponse {

    private Welcome welcome;
    private Stats stats;
    private List<JobApplicationResponse> recentApplications;
    private List<JobResponse> recommendedJobs;

    @Data
    @Builder
    public static class Welcome {
        private String fullName;
        private String email;
        private int profileCompletionPercentage;
    }

    @Data
    @Builder
    public static class Stats {
        private long totalApplications;
        private long jobsSaved;
        private long activeApplications;
        private long interviewsScheduled;
    }
}

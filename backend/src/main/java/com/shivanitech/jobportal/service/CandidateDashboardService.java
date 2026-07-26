package com.shivanitech.jobportal.service;

import com.shivanitech.jobportal.dto.candidate.CandidateDashboardResponse;
import com.shivanitech.jobportal.dto.job.JobApplicationResponse;
import com.shivanitech.jobportal.dto.job.JobResponse;
import com.shivanitech.jobportal.entity.ApplicationStatus;
import com.shivanitech.jobportal.entity.CandidateProfile;
import com.shivanitech.jobportal.entity.Job;
import com.shivanitech.jobportal.entity.JobStatus;
import com.shivanitech.jobportal.exception.ResourceNotFoundException;
import com.shivanitech.jobportal.repository.CandidateProfileRepository;
import com.shivanitech.jobportal.repository.JobApplicationRepository;
import com.shivanitech.jobportal.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Assembles the candidate dashboard: profile completion, application stats,
 * recent applications, and a short list of recommended open jobs (matched by
 * skill, then preferred category, then just the newest open jobs as a
 * fallback so the section is never empty).
 */
@Service
@RequiredArgsConstructor
public class CandidateDashboardService {

    private static final int RECOMMENDED_JOBS_LIMIT = 5;
    private static final List<ApplicationStatus> ACTIVE_STATUSES = List.of(ApplicationStatus.APPLIED, ApplicationStatus.SHORTLISTED);

    private final CandidateProfileRepository candidateProfileRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobRepository jobRepository;
    private final JobService jobService;
    private final CandidateProfileService candidateProfileService;

    @Transactional(readOnly = true)
    public CandidateDashboardResponse getDashboard(String email) {
        CandidateProfile profile = candidateProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found for " + email));

        CandidateDashboardResponse.Welcome welcome = CandidateDashboardResponse.Welcome.builder()
                .fullName(profile.getFullName())
                .email(email)
                .profileCompletionPercentage(candidateProfileService.computeCompletion(profile))
                .build();

        CandidateDashboardResponse.Stats stats = CandidateDashboardResponse.Stats.builder()
                .totalApplications(jobApplicationRepository.countByCandidateId(profile.getId()))
                .activeApplications(jobApplicationRepository.countByCandidateIdAndStatusIn(profile.getId(), ACTIVE_STATUSES))
                .jobsSaved(0) // no "saved jobs" feature yet
                .interviewsScheduled(0) // no interview-scheduling feature yet
                .build();

        List<JobApplicationResponse> recentApplications = jobApplicationRepository
                .findTop5ByCandidateIdOrderByAppliedAtDesc(profile.getId()).stream()
                .map(app -> JobApplicationResponse.builder()
                        .applicationId(app.getId())
                        .jobId(app.getJob().getId())
                        .jobTitle(app.getJob().getTitle())
                        .companyName(app.getJob().getCompany() != null ? app.getJob().getCompany().getName() : null)
                        .status(app.getStatus().name())
                        .appliedAt(app.getAppliedAt())
                        .build())
                .toList();

        return CandidateDashboardResponse.builder()
                .welcome(welcome)
                .stats(stats)
                .recentApplications(recentApplications)
                .recommendedJobs(recommendJobs(profile))
                .build();
    }

    private List<JobResponse> recommendJobs(CandidateProfile profile) {
        Map<UUID, Job> byId = new LinkedHashMap<>();

        Set<UUID> skillIds = profile.getSkills().stream().map(s -> s.getId()).collect(Collectors.toSet());
        if (!skillIds.isEmpty()) {
            for (Job job : jobRepository.findOpenJobsBySkillIds(JobStatus.OPEN, skillIds, PageRequest.of(0, RECOMMENDED_JOBS_LIMIT))) {
                byId.put(job.getId(), job);
            }
        }

        if (byId.size() < RECOMMENDED_JOBS_LIMIT && profile.getPreferredCategory() != null) {
            int remaining = RECOMMENDED_JOBS_LIMIT - byId.size();
            for (Job job : jobRepository.findByStatusAndCategoryIdOrderByCreatedAtDesc(
                    JobStatus.OPEN, profile.getPreferredCategory().getId(), PageRequest.of(0, remaining + byId.size()))) {
                if (byId.size() >= RECOMMENDED_JOBS_LIMIT) break;
                byId.putIfAbsent(job.getId(), job);
            }
        }

        if (byId.size() < RECOMMENDED_JOBS_LIMIT) {
            for (Job job : jobRepository.findByStatusOrderByCreatedAtDesc(
                    JobStatus.OPEN, PageRequest.of(0, RECOMMENDED_JOBS_LIMIT + byId.size()))) {
                if (byId.size() >= RECOMMENDED_JOBS_LIMIT) break;
                byId.putIfAbsent(job.getId(), job);
            }
        }

        List<JobResponse> result = new ArrayList<>();
        for (Job job : byId.values()) {
            if (result.size() >= RECOMMENDED_JOBS_LIMIT) break;
            result.add(jobService.toResponse(job));
        }
        return result;
    }
}

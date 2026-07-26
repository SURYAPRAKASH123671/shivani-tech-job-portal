package com.shivanitech.jobportal.service;

import com.shivanitech.jobportal.dto.job.ApplicationSummaryResponse;
import com.shivanitech.jobportal.dto.job.JobApplicationResponse;
import com.shivanitech.jobportal.dto.job.JobRequest;
import com.shivanitech.jobportal.dto.job.JobResponse;
import com.shivanitech.jobportal.dto.job.JobSearchCriteria;
import com.shivanitech.jobportal.entity.*;
import com.shivanitech.jobportal.exception.ConflictException;
import com.shivanitech.jobportal.exception.DuplicateResourceException;
import com.shivanitech.jobportal.exception.ResourceNotFoundException;
import com.shivanitech.jobportal.repository.*;
import com.shivanitech.jobportal.service.notification.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobCategoryRepository categoryRepository;
    private final JobDesignationRepository designationRepository;
    private final JobLocationRepository locationRepository;
    private final SkillRepository skillRepository;
    private final CompanyRepository companyRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final EmailService emailService;

    @Transactional
    public JobResponse createJob(JobRequest request, boolean postedByAdmin) {
        Job job = new Job();
        applyRequestToJob(job, request);
        job.setPostedByAdmin(postedByAdmin);
        job.setStatus(JobStatus.OPEN);
        return toResponse(jobRepository.save(job));
    }

    @Transactional
    public JobResponse updateJob(UUID jobId, JobRequest request) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));
        applyRequestToJob(job, request);
        return toResponse(jobRepository.save(job));
    }

    @Transactional
    public void deleteJob(UUID jobId) {
        if (!jobRepository.existsById(jobId)) {
            throw new ResourceNotFoundException("Job not found: " + jobId);
        }
        if (!jobApplicationRepository.findByJobId(jobId).isEmpty()) {
            throw new ConflictException("This job already has applicants and can't be deleted - close it instead");
        }
        jobRepository.deleteById(jobId);
    }

    @Transactional
    public JobResponse closeJob(UUID jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));
        job.setStatus(JobStatus.CLOSED);
        return toResponse(jobRepository.save(job));
    }

    @Transactional(readOnly = true)
    public JobResponse getJob(UUID jobId) {
        return jobRepository.findById(jobId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));
    }

    @Transactional(readOnly = true)
    public List<JobResponse> listAllJobs(Boolean postedByAdmin) {
        return jobRepository.findAll().stream()
                .filter(job -> postedByAdmin == null || job.isPostedByAdmin() == postedByAdmin)
                .map(this::toResponse)
                .toList();
    }

    // --- Employer: manage jobs for their own (verified/active) company ---

    @Transactional
    public JobResponse createJobForEmployer(String employerEmail, JobRequest request) {
        Company company = requireActiveCompany(employerEmail);
        Job job = new Job();
        applyRequestToJob(job, request);
        job.setCompany(company);
        job.setPostedByAdmin(false);
        job.setStatus(JobStatus.OPEN);
        return toResponse(jobRepository.save(job));
    }

    @Transactional
    public JobResponse updateJobForEmployer(String employerEmail, UUID jobId, JobRequest request) {
        Job job = requireOwnedJob(employerEmail, jobId);
        applyRequestToJob(job, request);
        job.setCompany(requireActiveCompany(employerEmail));
        return toResponse(jobRepository.save(job));
    }

    @Transactional
    public JobResponse closeJobForEmployer(String employerEmail, UUID jobId) {
        Job job = requireOwnedJob(employerEmail, jobId);
        job.setStatus(JobStatus.CLOSED);
        return toResponse(jobRepository.save(job));
    }

    @Transactional(readOnly = true)
    public List<JobResponse> listJobsForEmployer(String employerEmail) {
        Company company = companyRepository.findByUserEmail(employerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No company profile for " + employerEmail));
        return jobRepository.findByCompanyId(company.getId()).stream().map(this::toResponse).toList();
    }

    private Company requireActiveCompany(String employerEmail) {
        Company company = companyRepository.findByUserEmail(employerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No company profile for " + employerEmail));
        if (company.getStatus() != CompanyStatus.ACTIVE) {
            throw new AccessDeniedException("Your company must be verified by an admin before you can post jobs");
        }
        return company;
    }

    private Job requireOwnedJob(String employerEmail, UUID jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));
        if (job.getCompany() == null || !job.getCompany().getUser().getEmail().equalsIgnoreCase(employerEmail)) {
            throw new AccessDeniedException("This job does not belong to your company");
        }
        return job;
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> search(JobSearchCriteria criteria, Pageable pageable) {
        return jobRepository.findAll(JobSpecifications.fromCriteria(criteria), pageable)
                .map(this::toResponse);
    }

    @Transactional
    public void applyToJob(String candidateEmail, UUID jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));

        if (job.getStatus() != JobStatus.OPEN) {
            throw new IllegalStateException("This job is no longer accepting applications");
        }

        CandidateProfile candidate = candidateProfileRepository.findByUserEmail(candidateEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found for " + candidateEmail));

        if (jobApplicationRepository.existsByJobIdAndCandidateId(jobId, candidate.getId())) {
            throw new DuplicateResourceException("You have already applied to this job");
        }

        JobApplication application = JobApplication.builder()
                .job(job)
                .candidate(candidate)
                .status(ApplicationStatus.APPLIED)
                .build();
        jobApplicationRepository.save(application);

        // EmailService.send() never throws (it logs and returns false on failure), so this can't
        // break the application itself even if no mail provider is configured. Sent synchronously
        // for now - if this needs to stop adding SMTP latency to the request, move it behind a
        // task executor or message queue rather than calling it inline here.
        emailService.send(
                candidateEmail,
                "You applied to " + job.getTitle(),
                "You've successfully applied to \"" + job.getTitle() + "\""
                        + (job.getCompany() != null ? " at " + job.getCompany().getName() : "")
                        + ". We'll notify you here if your application status changes.");
    }

    /**
     * Read-only reporting view for an employer's own applications - distinct from
     * getMyApplications (the candidate's own view) since it exposes candidate name and job
     * category/location, which only the receiving company/admin should see, not other candidates.
     */
    @Transactional(readOnly = true)
    public List<ApplicationSummaryResponse> listApplicationsForEmployer(String employerEmail) {
        Company company = companyRepository.findByUserEmail(employerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No company profile for " + employerEmail));
        return jobApplicationRepository.findByJob_Company_Id(company.getId()).stream()
                .map(this::toSummary)
                .toList();
    }

    /** Same shape, system-wide - admin-only. */
    @Transactional(readOnly = true)
    public List<ApplicationSummaryResponse> listAllApplications() {
        return jobApplicationRepository.findAll().stream()
                .map(this::toSummary)
                .toList();
    }

    private ApplicationSummaryResponse toSummary(JobApplication app) {
        Job job = app.getJob();
        return ApplicationSummaryResponse.builder()
                .applicationId(app.getId())
                .jobId(job.getId())
                .jobTitle(job.getTitle())
                .companyName(job.getCompany() != null ? job.getCompany().getName() : null)
                .category(job.getCategory() != null ? job.getCategory().getName() : null)
                .location(job.getLocation() != null ? job.getLocation().getName() : null)
                .candidateName(app.getCandidate() != null ? app.getCandidate().getFullName() : null)
                .status(app.getStatus().name())
                .appliedAt(app.getAppliedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<JobApplicationResponse> getMyApplications(String candidateEmail) {
        CandidateProfile candidate = candidateProfileRepository.findByUserEmail(candidateEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found for " + candidateEmail));

        return jobApplicationRepository.findByCandidateId(candidate.getId()).stream()
                .map(app -> JobApplicationResponse.builder()
                        .applicationId(app.getId())
                        .jobId(app.getJob().getId())
                        .jobTitle(app.getJob().getTitle())
                        .companyName(app.getJob().getCompany() != null ? app.getJob().getCompany().getName() : null)
                        .status(app.getStatus().name())
                        .appliedAt(app.getAppliedAt())
                        .build())
                .toList();
    }

    private void applyRequestToJob(Job job, JobRequest request) {
        if (request.getSalaryMin() != null && request.getSalaryMax() != null
                && request.getSalaryMin() > request.getSalaryMax()) {
            throw new IllegalArgumentException("Minimum salary can't be greater than maximum salary");
        }
        if (request.getExperienceMin() != null && request.getExperienceMax() != null
                && request.getExperienceMin() > request.getExperienceMax()) {
            throw new IllegalArgumentException("Minimum experience can't be greater than maximum experience");
        }

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());
        job.setExperienceMin(request.getExperienceMin());
        job.setExperienceMax(request.getExperienceMax());
        job.setQualification(request.getQualification());

        job.setCategory(categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Job category not found: " + request.getCategoryId())));
        job.setDesignation(designationRepository.findById(request.getDesignationId())
                .orElseThrow(() -> new ResourceNotFoundException("Job designation not found: " + request.getDesignationId())));
        job.setLocation(locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Job location not found: " + request.getLocationId())));

        if (request.getCompanyId() != null) {
            job.setCompany(companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId())));
        }

        if (request.getSkillIds() != null) {
            job.setSkills(resolveSkills(request.getSkillIds()));
        }
    }

    private Set<Skill> resolveSkills(List<UUID> skillIds) {
        Set<UUID> requestedIds = Set.copyOf(skillIds);
        List<Skill> skills = skillRepository.findByIdIn(skillIds);
        Set<UUID> foundIds = skills.stream().map(Skill::getId).collect(Collectors.toSet());

        if (foundIds.size() != requestedIds.size()) {
            UUID missingId = requestedIds.stream().filter(id -> !foundIds.contains(id)).findFirst().orElseThrow();
            throw new ResourceNotFoundException("Skill not found: " + missingId);
        }

        return new HashSet<>(skills);
    }

    /** Package-private (not private) so other services in this package, e.g. dashboards, can reuse it. */
    JobResponse toResponse(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .companyName(job.getCompany() != null ? job.getCompany().getName() : null)
                .categoryId(job.getCategory().getId())
                .category(job.getCategory().getName())
                .designationId(job.getDesignation().getId())
                .designation(job.getDesignation().getName())
                .locationId(job.getLocation().getId())
                .location(job.getLocation().getName())
                .skillIds(job.getSkills().stream().map(Skill::getId).collect(Collectors.toList()))
                .skills(job.getSkills().stream().map(Skill::getName).collect(Collectors.toList()))
                .salaryMin(job.getSalaryMin())
                .salaryMax(job.getSalaryMax())
                .experienceMin(job.getExperienceMin())
                .experienceMax(job.getExperienceMax())
                .qualification(job.getQualification())
                .status(job.getStatus().name())
                .postedByAdmin(job.isPostedByAdmin())
                .createdAt(job.getCreatedAt())
                .build();
    }
}

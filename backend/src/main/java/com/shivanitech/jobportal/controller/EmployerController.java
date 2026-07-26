package com.shivanitech.jobportal.controller;

import com.shivanitech.jobportal.dto.company.CompanyResponse;
import com.shivanitech.jobportal.dto.job.ApplicationSummaryResponse;
import com.shivanitech.jobportal.dto.job.JobRequest;
import com.shivanitech.jobportal.dto.job.JobResponse;
import com.shivanitech.jobportal.service.CompanyService;
import com.shivanitech.jobportal.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Employer Zone: a company's own dashboard. Job-posting endpoints require the
 * company to be ACTIVE (verified by an admin) — enforced in JobService.
 * Enforced by ROLE_EMPLOYER globally in SecurityConfig for /api/employer/**.
 */
@RestController
@RequestMapping("/api/employer")
@RequiredArgsConstructor
public class EmployerController {

    private final CompanyService companyService;
    private final JobService jobService;

    @GetMapping("/company")
    public CompanyResponse myCompany(Authentication authentication) {
        return companyService.getMyCompany(authentication.getName());
    }

    @PostMapping("/jobs")
    public ResponseEntity<JobResponse> createJob(@Valid @RequestBody JobRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobService.createJobForEmployer(authentication.getName(), request));
    }

    @PutMapping("/jobs/{id}")
    public JobResponse updateJob(@PathVariable UUID id, @Valid @RequestBody JobRequest request, Authentication authentication) {
        return jobService.updateJobForEmployer(authentication.getName(), id, request);
    }

    @PatchMapping("/jobs/{id}/close")
    public JobResponse closeJob(@PathVariable UUID id, Authentication authentication) {
        return jobService.closeJobForEmployer(authentication.getName(), id);
    }

    @GetMapping("/jobs")
    public List<JobResponse> myJobs(Authentication authentication) {
        return jobService.listJobsForEmployer(authentication.getName());
    }

    @GetMapping("/applications")
    public List<ApplicationSummaryResponse> myApplications(Authentication authentication) {
        return jobService.listApplicationsForEmployer(authentication.getName());
    }
}

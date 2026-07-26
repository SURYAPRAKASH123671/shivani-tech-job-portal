package com.shivanitech.jobportal.controller;

import com.shivanitech.jobportal.dto.job.JobRequest;
import com.shivanitech.jobportal.dto.job.JobResponse;
import com.shivanitech.jobportal.dto.job.JobSearchCriteria;
import com.shivanitech.jobportal.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // --- Admin: full CRUD over jobs ---

    @PostMapping("/api/admin/jobs")
    public ResponseEntity<JobResponse> createJob(@Valid @RequestBody JobRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.createJob(request, true));
    }

    @PutMapping("/api/admin/jobs/{id}")
    public JobResponse updateJob(@PathVariable UUID id, @Valid @RequestBody JobRequest request) {
        return jobService.updateJob(id, request);
    }

    @DeleteMapping("/api/admin/jobs/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable UUID id) {
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/admin/jobs/{id}/close")
    public JobResponse closeJob(@PathVariable UUID id) {
        return jobService.closeJob(id);
    }

    @GetMapping("/api/admin/jobs")
    public List<JobResponse> listAllJobs(@RequestParam(required = false) Boolean postedByAdmin) {
        return jobService.listAllJobs(postedByAdmin);
    }

    // --- Public / candidate: search and view ---

    @GetMapping("/api/jobs/search")
    public Page<JobResponse> searchJobs(JobSearchCriteria criteria, Pageable pageable) {
        return jobService.search(criteria, pageable);
    }

    @GetMapping("/api/jobs/{id}")
    public JobResponse getJob(@PathVariable UUID id) {
        return jobService.getJob(id);
    }

    // --- Candidate: apply ---

    @PostMapping("/api/candidate/jobs/{id}/apply")
    public ResponseEntity<Void> applyToJob(@PathVariable UUID id, Authentication authentication) {
        jobService.applyToJob(authentication.getName(), id);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/api/candidate/applications")
    public List<com.shivanitech.jobportal.dto.job.JobApplicationResponse> myApplications(Authentication authentication) {
        return jobService.getMyApplications(authentication.getName());
    }
}

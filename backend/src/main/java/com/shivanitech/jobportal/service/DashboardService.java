package com.shivanitech.jobportal.service;

import com.shivanitech.jobportal.dto.dashboard.DashboardResponse;
import com.shivanitech.jobportal.entity.CompanyStatus;
import com.shivanitech.jobportal.entity.JobStatus;
import com.shivanitech.jobportal.entity.Role;
import com.shivanitech.jobportal.repository.CompanyRepository;
import com.shivanitech.jobportal.repository.JobApplicationRepository;
import com.shivanitech.jobportal.repository.JobRepository;
import com.shivanitech.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getStats() {
        return DashboardResponse.builder()
                .totalCandidates(userRepository.countByRole(Role.CANDIDATE))
                .totalEmployees(userRepository.countByRole(Role.EMPLOYEE))
                .pendingCompanies(companyRepository.countByStatus(CompanyStatus.PENDING))
                .activeCompanies(companyRepository.countByStatus(CompanyStatus.ACTIVE))
                .rejectedCompanies(companyRepository.countByStatus(CompanyStatus.REJECTED))
                .openJobs(jobRepository.countByStatus(JobStatus.OPEN))
                .closedJobs(jobRepository.countByStatus(JobStatus.CLOSED))
                .jobsPostedByAdmin(jobRepository.countByPostedByAdmin(true))
                .jobsPostedByCompanies(jobRepository.countByPostedByAdmin(false))
                .totalApplications(jobApplicationRepository.count())
                .build();
    }
}

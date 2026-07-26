package com.shivanitech.jobportal.repository;

import com.shivanitech.jobportal.entity.ApplicationStatus;
import com.shivanitech.jobportal.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {
    boolean existsByJobIdAndCandidateId(UUID jobId, UUID candidateId);
    List<JobApplication> findByCandidateId(UUID candidateId);
    List<JobApplication> findByJobId(UUID jobId);
    Optional<JobApplication> findByJobIdAndCandidateId(UUID jobId, UUID candidateId);
    List<JobApplication> findTop5ByCandidateIdOrderByAppliedAtDesc(UUID candidateId);
    long countByCandidateId(UUID candidateId);
    long countByCandidateIdAndStatusIn(UUID candidateId, Collection<ApplicationStatus> statuses);
}

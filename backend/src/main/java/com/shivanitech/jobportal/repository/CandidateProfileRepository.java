package com.shivanitech.jobportal.repository;

import com.shivanitech.jobportal.entity.CandidateProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CandidateProfileRepository extends JpaRepository<CandidateProfile, UUID> {
    Optional<CandidateProfile> findByUserId(UUID userId);
    Optional<CandidateProfile> findByUserEmail(String email);
}

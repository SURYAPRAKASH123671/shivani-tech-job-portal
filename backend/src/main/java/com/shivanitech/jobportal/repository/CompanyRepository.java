package com.shivanitech.jobportal.repository;

import com.shivanitech.jobportal.entity.Company;
import com.shivanitech.jobportal.entity.CompanyStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
    Optional<Company> findByUserId(UUID userId);
    Optional<Company> findByUserEmail(String email);
    List<Company> findByStatus(CompanyStatus status);
    long countByStatus(CompanyStatus status);
}

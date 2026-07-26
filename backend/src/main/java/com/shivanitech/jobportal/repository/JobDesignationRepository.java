package com.shivanitech.jobportal.repository;

import com.shivanitech.jobportal.entity.JobDesignation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface JobDesignationRepository extends JpaRepository<JobDesignation, UUID> {
}

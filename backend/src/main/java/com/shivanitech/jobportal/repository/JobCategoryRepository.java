package com.shivanitech.jobportal.repository;

import com.shivanitech.jobportal.entity.JobCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface JobCategoryRepository extends JpaRepository<JobCategory, UUID> {
}

package com.shivanitech.jobportal.repository;

import com.shivanitech.jobportal.entity.JobLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface JobLocationRepository extends JpaRepository<JobLocation, UUID> {
}

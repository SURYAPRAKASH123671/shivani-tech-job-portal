package com.shivanitech.jobportal.repository;

import com.shivanitech.jobportal.entity.Job;
import com.shivanitech.jobportal.entity.JobStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {
    List<Job> findByCompanyId(UUID companyId);
    long countByStatus(JobStatus status);
    long countByPostedByAdmin(boolean postedByAdmin);

    List<Job> findByStatusOrderByCreatedAtDesc(JobStatus status, Pageable pageable);
    List<Job> findByStatusAndCategoryIdOrderByCreatedAtDesc(JobStatus status, UUID categoryId, Pageable pageable);

    @Query("select distinct j from Job j join j.skills s where j.status = :status and s.id in :skillIds order by j.createdAt desc")
    List<Job> findOpenJobsBySkillIds(@Param("status") JobStatus status, @Param("skillIds") Collection<UUID> skillIds, Pageable pageable);
}

package com.shivanitech.jobportal.service;

import com.shivanitech.jobportal.dto.job.JobSearchCriteria;
import com.shivanitech.jobportal.entity.Job;
import com.shivanitech.jobportal.entity.JobStatus;
import com.shivanitech.jobportal.entity.Skill;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

/**
 * Builds a JPA Specification<Job> from JobSearchCriteria so the search endpoint
 * doesn't need a separate repository method for every filter combination
 * (company / category / designation / location / skill / salary / experience / qualification).
 */
public final class JobSpecifications {

    private JobSpecifications() {
    }

    public static Specification<Job> fromCriteria(JobSearchCriteria criteria) {
        return (root, query, cb) -> {
            var predicates = cb.conjunction();

            // Only ever return open jobs from the public/candidate search
            predicates = cb.and(predicates, cb.equal(root.get("status"), JobStatus.OPEN));

            if (criteria.getCompanyId() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("company").get("id"), criteria.getCompanyId()));
            }
            if (criteria.getCategoryId() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("category").get("id"), criteria.getCategoryId()));
            }
            if (criteria.getDesignationId() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("designation").get("id"), criteria.getDesignationId()));
            }
            if (criteria.getLocationId() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("location").get("id"), criteria.getLocationId()));
            }
            if (criteria.getSkillId() != null) {
                Join<Job, Skill> skillJoin = root.join("skills");
                predicates = cb.and(predicates, cb.equal(skillJoin.get("id"), criteria.getSkillId()));
                query.distinct(true);
            }
            if (criteria.getMinSalary() != null) {
                predicates = cb.and(predicates, cb.greaterThanOrEqualTo(root.get("salaryMax"), criteria.getMinSalary()));
            }
            if (criteria.getMaxExperience() != null) {
                predicates = cb.and(predicates, cb.lessThanOrEqualTo(root.get("experienceMin"), criteria.getMaxExperience()));
            }
            if (criteria.getQualification() != null && !criteria.getQualification().isBlank()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("qualification")), "%" + criteria.getQualification().toLowerCase() + "%"));
            }

            return predicates;
        };
    }
}

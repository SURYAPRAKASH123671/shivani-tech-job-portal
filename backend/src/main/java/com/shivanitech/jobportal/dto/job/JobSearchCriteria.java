package com.shivanitech.jobportal.dto.job;

import lombok.Data;

import java.util.UUID;

/**
 * Bound from query params on GET /api/jobs/search.
 * Every field is optional - only non-null fields are applied as filters.
 */
@Data
public class JobSearchCriteria {
    private UUID companyId;
    private UUID categoryId;
    private UUID designationId;
    private UUID locationId;
    private UUID skillId;
    private Integer minSalary;
    private Integer maxExperience;
    private String qualification;
}

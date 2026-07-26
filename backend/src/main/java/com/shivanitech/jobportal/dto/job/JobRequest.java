package com.shivanitech.jobportal.dto.job;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class JobRequest {

    @NotBlank
    private String title;

    private String description;

    private UUID companyId;

    @NotNull
    private UUID categoryId;

    @NotNull
    private UUID designationId;

    @NotNull
    private UUID locationId;

    private List<@NotNull UUID> skillIds;

    @PositiveOrZero(message = "Minimum salary must be a positive number")
    private Integer salaryMin;

    @PositiveOrZero(message = "Maximum salary must be a positive number")
    private Integer salaryMax;

    @PositiveOrZero(message = "Minimum experience must be a positive number")
    private Integer experienceMin;

    @PositiveOrZero(message = "Maximum experience must be a positive number")
    private Integer experienceMax;

    private String qualification;
}

package com.shivanitech.jobportal.dto.candidate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CandidateProfileUpdateRequest {

    // Personal
    @NotBlank
    private String fullName;

    @Pattern(regexp = "^[0-9+\\-() ]{7,15}$", message = "Enter a valid phone number")
    private String phone;

    private LocalDate dob;
    private String gender;
    private String address;
    private String city;
    private String state;
    private String country;
    private String pincode;

    // Education
    private String qualification;
    private String college;
    private String university;

    @Min(value = 1950, message = "Graduation year looks wrong")
    @Max(value = 2100, message = "Graduation year looks wrong")
    private Integer graduationYear;

    private String percentageOrCgpa;

    // Professional
    @PositiveOrZero(message = "Experience must be a positive number")
    private Integer experienceYears;

    private String currentCompany;
    private String currentDesignation;

    @PositiveOrZero(message = "Current salary must be a positive number")
    private Integer currentSalary;

    @PositiveOrZero(message = "Expected salary must be a positive number")
    private Integer expectedSalary;

    private String noticePeriod;

    // Skills
    private List<@NotNull UUID> skillIds;
    private List<String> customSkills;

    // Career preferences
    private UUID preferredLocationId;
    private UUID preferredDesignationId;
    private UUID preferredCategoryId;

    // Resume (Option B - paste a URL instead of uploading a PDF)
    private String resumeUrl;
}

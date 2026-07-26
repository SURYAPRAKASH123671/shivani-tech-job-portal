package com.shivanitech.jobportal.dto.candidate;

import com.shivanitech.jobportal.dto.lookup.NameResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class CandidateProfileResponse {

    // Personal
    private String fullName;
    private String email;
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
    private Integer graduationYear;
    private String percentageOrCgpa;

    // Professional
    private Integer experienceYears;
    private String currentCompany;
    private String currentDesignation;
    private Integer currentSalary;
    private Integer expectedSalary;
    private String noticePeriod;

    // Skills
    private List<NameResponse> skills;
    private List<String> customSkills;

    // Career preferences
    private NameResponse preferredLocation;
    private NameResponse preferredDesignation;
    private NameResponse preferredCategory;

    // Resume
    private String resumeUrl;
    private String resumeFileName;

    private int profileCompletionPercentage;
}

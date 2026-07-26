package com.shivanitech.jobportal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "candidate_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "resume_url")
    private String resumeUrl;

    @Column(name = "resume_file_name")
    private String resumeFileName;

    /** Doubles as "Degree" on the candidate profile form. */
    private String qualification;

    /** Doubles as "Experience (years)" on the candidate profile form. */
    @Column(name = "experience_years")
    private Integer experienceYears;

    /** Doubles as "City" on the candidate profile form. */
    @Column(name = "current_location")
    private String currentLocation;

    // --- Personal ---

    private LocalDate dob;

    private String gender;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String state;

    private String country;

    private String pincode;

    // --- Education ---

    private String college;

    private String university;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(name = "percentage_or_cgpa")
    private String percentageOrCgpa;

    // --- Professional ---

    @Column(name = "current_company")
    private String currentCompany;

    @Column(name = "current_designation")
    private String currentDesignation;

    @Column(name = "current_salary")
    private Integer currentSalary;

    @Column(name = "expected_salary")
    private Integer expectedSalary;

    @Column(name = "notice_period")
    private String noticePeriod;

    // --- Career preferences ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_location_id")
    private JobLocation preferredLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_designation_id")
    private JobDesignation preferredDesignation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_category_id")
    private JobCategory preferredCategory;

    // --- Skills ---

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "candidate_skills",
            joinColumns = @JoinColumn(name = "candidate_id"),
            inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    @Builder.Default
    private Set<Skill> skills = new HashSet<>();

    /** Free-text skills a candidate adds that aren't in the admin-managed skill list. */
    @ElementCollection
    @CollectionTable(name = "candidate_custom_skills", joinColumns = @JoinColumn(name = "candidate_id"))
    @Column(name = "skill_name")
    @Builder.Default
    private List<String> customSkills = new ArrayList<>();
}

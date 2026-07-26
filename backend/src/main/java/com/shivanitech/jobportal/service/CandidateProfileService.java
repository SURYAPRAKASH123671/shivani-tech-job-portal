package com.shivanitech.jobportal.service;

import com.shivanitech.jobportal.dto.candidate.CandidateProfileResponse;
import com.shivanitech.jobportal.dto.candidate.CandidateProfileUpdateRequest;
import com.shivanitech.jobportal.dto.lookup.NameResponse;
import com.shivanitech.jobportal.entity.CandidateProfile;
import com.shivanitech.jobportal.entity.JobCategory;
import com.shivanitech.jobportal.entity.JobDesignation;
import com.shivanitech.jobportal.entity.JobLocation;
import com.shivanitech.jobportal.entity.Skill;
import com.shivanitech.jobportal.entity.User;
import com.shivanitech.jobportal.exception.ResourceNotFoundException;
import com.shivanitech.jobportal.repository.CandidateProfileRepository;
import com.shivanitech.jobportal.repository.JobCategoryRepository;
import com.shivanitech.jobportal.repository.JobDesignationRepository;
import com.shivanitech.jobportal.repository.JobLocationRepository;
import com.shivanitech.jobportal.repository.SkillRepository;
import com.shivanitech.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CandidateProfileService {

    private final CandidateProfileRepository candidateProfileRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final JobLocationRepository jobLocationRepository;
    private final JobDesignationRepository jobDesignationRepository;
    private final JobCategoryRepository jobCategoryRepository;

    @Value("${app.uploads-dir}")
    private String uploadsDir;

    @Transactional(readOnly = true)
    public CandidateProfileResponse getProfile(String email) {
        return toResponse(findByEmail(email));
    }

    @Transactional
    public CandidateProfileResponse updateProfile(String email, CandidateProfileUpdateRequest request) {
        CandidateProfile profile = findByEmail(email);
        User user = profile.getUser();

        user.setPhone(request.getPhone());

        profile.setFullName(request.getFullName());
        profile.setDob(request.getDob());
        profile.setGender(request.getGender());
        profile.setAddress(request.getAddress());
        profile.setCurrentLocation(request.getCity());
        profile.setState(request.getState());
        profile.setCountry(request.getCountry());
        profile.setPincode(request.getPincode());

        profile.setQualification(request.getQualification());
        profile.setCollege(request.getCollege());
        profile.setUniversity(request.getUniversity());
        profile.setGraduationYear(request.getGraduationYear());
        profile.setPercentageOrCgpa(request.getPercentageOrCgpa());

        profile.setExperienceYears(request.getExperienceYears());
        profile.setCurrentCompany(request.getCurrentCompany());
        profile.setCurrentDesignation(request.getCurrentDesignation());
        profile.setCurrentSalary(request.getCurrentSalary());
        profile.setExpectedSalary(request.getExpectedSalary());
        profile.setNoticePeriod(request.getNoticePeriod());

        if (request.getSkillIds() != null) {
            profile.setSkills(resolveSkills(request.getSkillIds()));
        }
        if (request.getCustomSkills() != null) {
            // NOT .toList() - that returns an immutable List, and Hibernate throws
            // UnsupportedOperationException when it tries to manage an @ElementCollection
            // backed by one. Confirmed by hitting this exact crash against a live container.
            List<String> customSkills = new ArrayList<>();
            for (String skill : request.getCustomSkills()) {
                if (skill != null && !skill.isBlank()) {
                    customSkills.add(skill);
                }
            }
            profile.setCustomSkills(customSkills);
        }

        profile.setPreferredLocation(resolveOptional(request.getPreferredLocationId(), jobLocationRepository::findById, "Job location"));
        profile.setPreferredDesignation(resolveOptional(request.getPreferredDesignationId(), jobDesignationRepository::findById, "Job designation"));
        profile.setPreferredCategory(resolveOptional(request.getPreferredCategoryId(), jobCategoryRepository::findById, "Job category"));

        if (request.getResumeUrl() != null) {
            if (request.getResumeUrl().isBlank()) {
                profile.setResumeUrl(null);
            } else {
                profile.setResumeUrl(request.getResumeUrl());
                profile.setResumeFileName(null);
            }
        }

        userRepository.save(user);
        profile = candidateProfileRepository.save(profile);
        return toResponse(profile);
    }

    @Transactional
    public CandidateProfileResponse uploadResume(String email, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a PDF file to upload");
        }
        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        boolean hasPdfContentType = "application/pdf".equalsIgnoreCase(contentType);
        boolean hasPdfExtension = originalName.toLowerCase().endsWith(".pdf");
        if (!hasPdfContentType || !hasPdfExtension) {
            throw new IllegalArgumentException("Only PDF resumes are accepted");
        }

        CandidateProfile profile = findByEmail(email);
        try {
            Path dir = Path.of(uploadsDir, "resumes");
            Files.createDirectories(dir);
            Path target = dir.resolve(profile.getId() + ".pdf");
            file.transferTo(target);
        } catch (IOException ex) {
            throw new UncheckedIOException("Could not save the uploaded resume", ex);
        }

        profile.setResumeFileName(originalName.isBlank() ? "resume.pdf" : originalName);
        profile.setResumeUrl(null);
        profile = candidateProfileRepository.save(profile);
        return toResponse(profile);
    }

    @Transactional(readOnly = true)
    public Resource loadResume(String email) {
        CandidateProfile profile = findByEmail(email);
        if (profile.getResumeFileName() == null) {
            throw new ResourceNotFoundException("No uploaded resume on file");
        }
        Path path = Path.of(uploadsDir, "resumes", profile.getId() + ".pdf");
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("No uploaded resume on file");
        }
        return new FileSystemResource(path);
    }

    private CandidateProfile findByEmail(String email) {
        return candidateProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found for " + email));
    }

    private <T> T resolveOptional(UUID id, java.util.function.Function<UUID, java.util.Optional<T>> lookup, String label) {
        if (id == null) {
            return null;
        }
        return lookup.apply(id).orElseThrow(() -> new ResourceNotFoundException(label + " not found: " + id));
    }

    private Set<Skill> resolveSkills(List<UUID> skillIds) {
        Set<UUID> requestedIds = Set.copyOf(skillIds);
        List<Skill> skills = skillRepository.findByIdIn(skillIds);
        Set<UUID> foundIds = skills.stream().map(Skill::getId).collect(java.util.stream.Collectors.toSet());

        if (foundIds.size() != requestedIds.size()) {
            UUID missingId = requestedIds.stream().filter(id -> !foundIds.contains(id)).findFirst().orElseThrow();
            throw new ResourceNotFoundException("Skill not found: " + missingId);
        }

        return new HashSet<>(skills);
    }

    CandidateProfileResponse toResponse(CandidateProfile profile) {
        List<NameResponse> skills = profile.getSkills().stream()
                .map(s -> new NameResponse(s.getId(), s.getName()))
                .toList();
        // customSkills is a lazy @ElementCollection - copying it into a plain list here, while
        // still inside the transactional method, forces initialization now. Passing the raw
        // collection straight through (as this used to) works by coincidence when Hibernate
        // happens to have already touched it earlier in the same request, but throws
        // LazyInitializationException on a plain GET once the session is closed and Jackson
        // tries to serialize it - found live in production on a fresh GET /api/candidate/profile.
        List<String> customSkills = new ArrayList<>(profile.getCustomSkills());

        return CandidateProfileResponse.builder()
                .fullName(profile.getFullName())
                .email(profile.getUser().getEmail())
                .phone(profile.getUser().getPhone())
                .dob(profile.getDob())
                .gender(profile.getGender())
                .address(profile.getAddress())
                .city(profile.getCurrentLocation())
                .state(profile.getState())
                .country(profile.getCountry())
                .pincode(profile.getPincode())
                .qualification(profile.getQualification())
                .college(profile.getCollege())
                .university(profile.getUniversity())
                .graduationYear(profile.getGraduationYear())
                .percentageOrCgpa(profile.getPercentageOrCgpa())
                .experienceYears(profile.getExperienceYears())
                .currentCompany(profile.getCurrentCompany())
                .currentDesignation(profile.getCurrentDesignation())
                .currentSalary(profile.getCurrentSalary())
                .expectedSalary(profile.getExpectedSalary())
                .noticePeriod(profile.getNoticePeriod())
                .skills(skills)
                .customSkills(customSkills)
                .preferredLocation(toName(profile.getPreferredLocation() == null ? null : profile.getPreferredLocation().getId(),
                        profile.getPreferredLocation() == null ? null : profile.getPreferredLocation().getName()))
                .preferredDesignation(toName(profile.getPreferredDesignation() == null ? null : profile.getPreferredDesignation().getId(),
                        profile.getPreferredDesignation() == null ? null : profile.getPreferredDesignation().getName()))
                .preferredCategory(toName(profile.getPreferredCategory() == null ? null : profile.getPreferredCategory().getId(),
                        profile.getPreferredCategory() == null ? null : profile.getPreferredCategory().getName()))
                .resumeUrl(profile.getResumeUrl())
                .resumeFileName(profile.getResumeFileName())
                .profileCompletionPercentage(computeCompletion(profile))
                .build();
    }

    private NameResponse toName(UUID id, String name) {
        return id == null ? null : new NameResponse(id, name);
    }

    /** Package-private (not private) so CandidateDashboardService can reuse it without rebuilding the full response. */
    int computeCompletion(CandidateProfile profile) {
        int total = 7;
        int filled = 0;

        if (profile.getFullName() != null && !profile.getFullName().isBlank()) filled++;
        if (profile.getUser().getPhone() != null && !profile.getUser().getPhone().isBlank()) filled++;
        if (profile.getAddress() != null && !profile.getAddress().isBlank()) filled++;
        if (profile.getQualification() != null && !profile.getQualification().isBlank()) filled++;
        if (!profile.getSkills().isEmpty() || !profile.getCustomSkills().isEmpty()) filled++;
        if ((profile.getResumeUrl() != null && !profile.getResumeUrl().isBlank()) || profile.getResumeFileName() != null) filled++;
        if (profile.getExperienceYears() != null) filled++;

        return Math.round((filled * 100f) / total);
    }
}

package com.shivanitech.jobportal.controller;

import com.shivanitech.jobportal.dto.candidate.CandidateProfileResponse;
import com.shivanitech.jobportal.dto.candidate.CandidateProfileUpdateRequest;
import com.shivanitech.jobportal.service.CandidateProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Candidate's own profile/resume. Enforced by ROLE_CANDIDATE globally in
 * SecurityConfig for /api/candidate/**, and every method resolves the
 * profile from the authenticated user's email, so a candidate can only
 * ever read or edit their own record.
 */
@RestController
@RequestMapping("/api/candidate/profile")
@RequiredArgsConstructor
public class CandidateProfileController {

    private final CandidateProfileService candidateProfileService;

    @GetMapping
    public CandidateProfileResponse getProfile(Authentication authentication) {
        return candidateProfileService.getProfile(authentication.getName());
    }

    @PutMapping
    public CandidateProfileResponse updateProfile(@Valid @RequestBody CandidateProfileUpdateRequest request,
                                                   Authentication authentication) {
        return candidateProfileService.updateProfile(authentication.getName(), request);
    }

    @PostMapping(value = "/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CandidateProfileResponse uploadResume(@RequestParam("file") MultipartFile file, Authentication authentication) {
        return candidateProfileService.uploadResume(authentication.getName(), file);
    }

    @GetMapping("/resume/download")
    public ResponseEntity<Resource> downloadResume(Authentication authentication) {
        Resource resource = candidateProfileService.loadResume(authentication.getName());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"resume.pdf\"")
                .body(resource);
    }
}

package com.shivanitech.jobportal.controller;

import com.shivanitech.jobportal.dto.candidate.CandidateDashboardResponse;
import com.shivanitech.jobportal.service.CandidateDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Candidate's own dashboard. Enforced by ROLE_CANDIDATE globally in
 * SecurityConfig for /api/candidate/**.
 */
@RestController
@RequestMapping("/api/candidate/dashboard")
@RequiredArgsConstructor
public class CandidateDashboardController {

    private final CandidateDashboardService candidateDashboardService;

    @GetMapping
    public CandidateDashboardResponse getDashboard(Authentication authentication) {
        return candidateDashboardService.getDashboard(authentication.getName());
    }
}

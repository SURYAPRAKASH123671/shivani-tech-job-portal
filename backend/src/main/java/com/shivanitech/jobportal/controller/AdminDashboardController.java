package com.shivanitech.jobportal.controller;

import com.shivanitech.jobportal.dto.dashboard.DashboardResponse;
import com.shivanitech.jobportal.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-only aggregate stats. Enforced by ROLE_ADMIN globally in
 * SecurityConfig for /api/admin/**.
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public DashboardResponse getStats() {
        return dashboardService.getStats();
    }
}

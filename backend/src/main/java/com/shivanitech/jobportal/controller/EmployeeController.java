package com.shivanitech.jobportal.controller;

import com.shivanitech.jobportal.dto.employee.EmployeeResponse;
import com.shivanitech.jobportal.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * An employee's own self-service view - previously employees had no API surface of their own at
 * all (only admin-managed CRUD via /api/admin/employees). Enforced by ROLE_EMPLOYEE in
 * SecurityConfig for /api/employee/**.
 */
@RestController
@RequestMapping("/api/employee")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping("/me")
    public EmployeeResponse me(Authentication authentication) {
        return employeeService.getOwnProfile(authentication.getName());
    }
}

package com.shivanitech.jobportal.controller;

import com.shivanitech.jobportal.dto.employee.CreateEmployeeRequest;
import com.shivanitech.jobportal.dto.employee.EmployeeResponse;
import com.shivanitech.jobportal.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Admin-only: create employee logins and toggle access.
 * Enforced by ROLE_ADMIN globally in SecurityConfig for /api/admin/**.
 */
@RestController
@RequestMapping("/api/admin/employees")
@RequiredArgsConstructor
public class AdminEmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createEmployee(request));
    }

    @GetMapping
    public List<EmployeeResponse> listEmployees() {
        return employeeService.listEmployees();
    }

    @PatchMapping("/{id}/disable")
    public ResponseEntity<Void> disableEmployee(@PathVariable UUID id) {
        employeeService.setEnabled(id, false);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/enable")
    public ResponseEntity<Void> enableEmployee(@PathVariable UUID id) {
        employeeService.setEnabled(id, true);
        return ResponseEntity.noContent().build();
    }
}

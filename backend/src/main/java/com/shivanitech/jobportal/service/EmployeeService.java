package com.shivanitech.jobportal.service;

import com.shivanitech.jobportal.dto.employee.CreateEmployeeRequest;
import com.shivanitech.jobportal.dto.employee.EmployeeResponse;
import com.shivanitech.jobportal.entity.EmployeeProfile;
import com.shivanitech.jobportal.entity.Role;
import com.shivanitech.jobportal.entity.User;
import com.shivanitech.jobportal.exception.DuplicateResourceException;
import com.shivanitech.jobportal.exception.ResourceNotFoundException;
import com.shivanitech.jobportal.repository.EmployeeProfileRepository;
import com.shivanitech.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Admin-only: create employee accounts (their own login, ROLE_EMPLOYEE) and
 * manage access. There's no public employee sign-up, mirroring how admin
 * accounts are provisioned.
 */
@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final UserRepository userRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.EMPLOYEE)
                .verified(true)
                .enabled(true)
                .build();
        user = userRepository.save(user);

        EmployeeProfile profile = EmployeeProfile.builder()
                .user(user)
                .fullName(request.getFullName())
                .designation(request.getDesignation())
                .build();
        profile = employeeProfileRepository.save(profile);

        return toResponse(profile, user);
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> listEmployees() {
        return employeeProfileRepository.findAll().stream()
                .map(profile -> toResponse(profile, profile.getUser()))
                .toList();
    }

    @Transactional
    public void setEnabled(UUID employeeProfileId, boolean enabled) {
        EmployeeProfile profile = employeeProfileRepository.findById(employeeProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + employeeProfileId));
        User user = profile.getUser();
        user.setEnabled(enabled);
        userRepository.save(user);
    }

    private EmployeeResponse toResponse(EmployeeProfile profile, User user) {
        return EmployeeResponse.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .designation(profile.getDesignation())
                .email(user.getEmail())
                .enabled(user.isEnabled())
                .createdAt(profile.getCreatedAt())
                .build();
    }
}

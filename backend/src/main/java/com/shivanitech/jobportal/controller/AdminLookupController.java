package com.shivanitech.jobportal.controller;

import com.shivanitech.jobportal.dto.lookup.NameRequest;
import com.shivanitech.jobportal.dto.lookup.NameResponse;
import com.shivanitech.jobportal.service.LookupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Admin-only CRUD for the four lookup entities used when creating a job:
 * categories, designations, locations, skills. All require ROLE_ADMIN
 * (enforced globally in SecurityConfig for /api/admin/**).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminLookupController {

    private final LookupService lookupService;

    // Categories
    @PostMapping("/categories")
    public ResponseEntity<NameResponse> createCategory(@Valid @RequestBody NameRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lookupService.createCategory(request));
    }

    @GetMapping("/categories")
    public List<NameResponse> listCategories() {
        return lookupService.listCategories();
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        lookupService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // Designations
    @PostMapping("/designations")
    public ResponseEntity<NameResponse> createDesignation(@Valid @RequestBody NameRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lookupService.createDesignation(request));
    }

    @GetMapping("/designations")
    public List<NameResponse> listDesignations() {
        return lookupService.listDesignations();
    }

    @DeleteMapping("/designations/{id}")
    public ResponseEntity<Void> deleteDesignation(@PathVariable UUID id) {
        lookupService.deleteDesignation(id);
        return ResponseEntity.noContent().build();
    }

    // Locations
    @PostMapping("/locations")
    public ResponseEntity<NameResponse> createLocation(@Valid @RequestBody NameRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lookupService.createLocation(request));
    }

    @GetMapping("/locations")
    public List<NameResponse> listLocations() {
        return lookupService.listLocations();
    }

    @DeleteMapping("/locations/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable UUID id) {
        lookupService.deleteLocation(id);
        return ResponseEntity.noContent().build();
    }

    // Skills
    @PostMapping("/skills")
    public ResponseEntity<NameResponse> createSkill(@Valid @RequestBody NameRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lookupService.createSkill(request));
    }

    @GetMapping("/skills")
    public List<NameResponse> listSkills() {
        return lookupService.listSkills();
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<Void> deleteSkill(@PathVariable UUID id) {
        lookupService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }
}

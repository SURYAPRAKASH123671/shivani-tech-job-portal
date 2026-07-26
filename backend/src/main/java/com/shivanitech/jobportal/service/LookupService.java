package com.shivanitech.jobportal.service;

import com.shivanitech.jobportal.dto.lookup.NameRequest;
import com.shivanitech.jobportal.dto.lookup.NameResponse;
import com.shivanitech.jobportal.entity.JobCategory;
import com.shivanitech.jobportal.entity.JobDesignation;
import com.shivanitech.jobportal.entity.JobLocation;
import com.shivanitech.jobportal.entity.Skill;
import com.shivanitech.jobportal.exception.ResourceNotFoundException;
import com.shivanitech.jobportal.repository.JobCategoryRepository;
import com.shivanitech.jobportal.repository.JobDesignationRepository;
import com.shivanitech.jobportal.repository.JobLocationRepository;
import com.shivanitech.jobportal.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Handles CRUD for the four simple lookup entities admins maintain:
 * job categories, designations, locations, and skills. They all share
 * the same id+name shape, so one service covers all four.
 */
@Service
@RequiredArgsConstructor
public class LookupService {

    private final JobCategoryRepository categoryRepository;
    private final JobDesignationRepository designationRepository;
    private final JobLocationRepository locationRepository;
    private final SkillRepository skillRepository;

    // --- Categories ---
    public NameResponse createCategory(NameRequest req) {
        JobCategory saved = categoryRepository.save(JobCategory.builder().name(req.getName()).build());
        return new NameResponse(saved.getId(), saved.getName());
    }

    public List<NameResponse> listCategories() {
        return categoryRepository.findAll().stream()
                .map(c -> new NameResponse(c.getId(), c.getName())).toList();
    }

    public void deleteCategory(UUID id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Job category not found: " + id);
        }
        categoryRepository.deleteById(id);
    }

    // --- Designations ---
    public NameResponse createDesignation(NameRequest req) {
        JobDesignation saved = designationRepository.save(JobDesignation.builder().name(req.getName()).build());
        return new NameResponse(saved.getId(), saved.getName());
    }

    public List<NameResponse> listDesignations() {
        return designationRepository.findAll().stream()
                .map(d -> new NameResponse(d.getId(), d.getName())).toList();
    }

    public void deleteDesignation(UUID id) {
        if (!designationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Job designation not found: " + id);
        }
        designationRepository.deleteById(id);
    }

    // --- Locations ---
    public NameResponse createLocation(NameRequest req) {
        JobLocation saved = locationRepository.save(JobLocation.builder().name(req.getName()).build());
        return new NameResponse(saved.getId(), saved.getName());
    }

    public List<NameResponse> listLocations() {
        return locationRepository.findAll().stream()
                .map(l -> new NameResponse(l.getId(), l.getName())).toList();
    }

    public void deleteLocation(UUID id) {
        if (!locationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Job location not found: " + id);
        }
        locationRepository.deleteById(id);
    }

    // --- Skills ---
    public NameResponse createSkill(NameRequest req) {
        Skill saved = skillRepository.save(Skill.builder().name(req.getName()).build());
        return new NameResponse(saved.getId(), saved.getName());
    }

    public List<NameResponse> listSkills() {
        return skillRepository.findAll().stream()
                .map(s -> new NameResponse(s.getId(), s.getName())).toList();
    }

    public void deleteSkill(UUID id) {
        if (!skillRepository.existsById(id)) {
            throw new ResourceNotFoundException("Skill not found: " + id);
        }
        skillRepository.deleteById(id);
    }
}

package com.shivanitech.jobportal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "job_designations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobDesignation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;
}

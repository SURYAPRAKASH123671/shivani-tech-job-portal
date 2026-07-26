package com.shivanitech.jobportal.dto.lookup;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class NameResponse {
    private UUID id;
    private String name;
}

package com.shivanitech.jobportal.dto.lookup;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NameRequest {
    @NotBlank
    private String name;
}

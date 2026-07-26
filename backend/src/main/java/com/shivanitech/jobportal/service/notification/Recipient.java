package com.shivanitech.jobportal.service.notification;

/** A resolved send target, regardless of which entity it came from. */
public record Recipient(String name, String email, String phone) {
}

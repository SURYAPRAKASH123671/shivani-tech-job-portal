package com.shivanitech.jobportal.exception;

/** Generic "this can't be done right now because of related data" exception - maps to 409. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}

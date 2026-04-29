package com.medina.organism;

/**
 * OrganismException — unchecked exception thrown by the Organism Bridge SDK.
 */
public class OrganismException extends RuntimeException {
    public OrganismException(String message) {
        super(message);
    }
    public OrganismException(String message, Throwable cause) {
        super(message, cause);
    }
}

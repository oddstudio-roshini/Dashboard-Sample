package com.medicare.repository;

import com.medicare.entity.Doctor;
import com.medicare.entity.Doctor.DoctorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * DoctorRepository.java (Repository)
 * ─────────────────────────────────────
 * Spring Data JPA repository for Doctor entity.
 *
 * Custom methods:
 *   findByClinicalId       → Check if clinical ID already exists
 *   findByEmail            → Check if email already taken
 *   findByStatus           → Filter doctors by status (ACTIVE/INACTIVE/BLOCKED)
 *   countByStatus          → Count doctors per status for dashboard stats
 *   searchDoctors          → Full-text search across name, clinical ID, email
 *   findTopByOrderByUsernameDesc → Used to generate next auto-increment username
 */
@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByClinicalId(String clinicalId);

    Optional<Doctor> findByEmail(String email);

    Optional<Doctor> findByUsername(String username);

    boolean existsByUsername(String username);

    List<Doctor> findByStatus(DoctorStatus status);

    long countByStatus(DoctorStatus status);

    @Query("SELECT d FROM Doctor d WHERE " +
           "LOWER(d.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.clinicalId) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.email) LIKE LOWER(CONCAT('%', :query, '%'))")

    List<Doctor> searchDoctors(String query);

    Optional<Doctor> findTopByOrderByIdDesc();
}

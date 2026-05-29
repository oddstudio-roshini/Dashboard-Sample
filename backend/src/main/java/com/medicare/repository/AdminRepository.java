package com.medicare.repository;

import com.medicare.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * AdminRepository.java (Repository)
 * ───────────────────────────────────
 * Spring Data JPA repository for Admin entity.
 * Provides CRUD operations + custom query methods automatically.
 *
 * findByEmail → Used during login to look up admin by email.
 */
@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByEmail(String email);
}

package com.medicare.repository;

import com.medicare.entity.AdminPasskey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * AdminPasskeyRepository.java
 * ─────────────────────────────
 * JPA repository for AdminPasskey entity.
 *
 * findByCredentialId  – used during authentication to look up the
 *                       stored credential by the ID the authenticator
 *                       sends back.
 * findByAdminId       – used to list / delete all passkeys for an admin.
 */
@Repository
public interface AdminPasskeyRepository extends JpaRepository<AdminPasskey, Long> {

    Optional<AdminPasskey> findByCredentialId(String credentialId);

    List<AdminPasskey> findByAdminId(Long adminId);

    boolean existsByCredentialId(String credentialId);
}

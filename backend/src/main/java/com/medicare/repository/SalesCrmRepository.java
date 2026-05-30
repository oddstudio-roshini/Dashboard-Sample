package com.medicare.repository;

import com.medicare.entity.SalesCrm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SalesCrmRepository extends JpaRepository<SalesCrm, Long> {

    Optional<SalesCrm> findByProviderId(Long providerId);

    @Query("""
        SELECT c FROM SalesCrm c
        WHERE c.followUpDate IS NOT NULL
          AND c.status NOT IN ('Converted', 'Not Interested')
        ORDER BY c.followUpDate ASC
    """)
    List<SalesCrm> findPendingFollowUps();

    @Query("SELECT COUNT(c) FROM SalesCrm c WHERE c.status = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT COUNT(c) FROM SalesCrm c WHERE c.isWhale = true")
    long countWhales();
}

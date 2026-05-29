//package com.medicare.repository;
//
//import com.medicare.entity.Branch;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//import java.util.List;
//
//public interface BranchRepository extends JpaRepository<Branch, Long> {
//
//    List<Branch> findByHospitalId(Long hospitalId);
//
//    @Query("SELECT b FROM Branch b WHERE b.hospital.id = :hospitalId AND " +
//           "(:status IS NULL OR b.status = :status) AND " +
//           "(:search IS NULL OR LOWER(b.branchName) LIKE LOWER(CONCAT('%',:search,'%')) " +
//           "  OR LOWER(b.city) LIKE LOWER(CONCAT('%',:search,'%')) " +
//           "  OR LOWER(b.managerName) LIKE LOWER(CONCAT('%',:search,'%')))")
//    List<Branch> searchByHospital(@Param("hospitalId") Long hospitalId,
//                                  @Param("status") Branch.BranchStatus status,
//                                  @Param("search") String search);
//}


package com.medicare.repository;

import com.medicare.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    List<Branch> findByHospitalId(Long hospitalId);

    @Query(value = """
    SELECT *
    FROM branches b
    WHERE b.hospital_id = :hospitalId
    AND (
        CAST(:status AS TEXT) IS NULL
        OR b.status = CAST(:status AS TEXT)
    )
    AND (
        CAST(:search AS TEXT) IS NULL
        OR LOWER(b.branch_name) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        OR LOWER(b.city) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        OR LOWER(b.manager_name) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
    )
    """, nativeQuery = true)
    List<Branch> searchByHospital(
            @Param("hospitalId") Long hospitalId,
            @Param("status") String status,
            @Param("search") String search
    );

    /** Global branch search across all hospitals */
    @Query(value = """
    SELECT b.*
    FROM branches b
    JOIN hospitals h ON h.id = b.hospital_id
    WHERE (
        CAST(:status AS TEXT) IS NULL
        OR b.status = CAST(:status AS TEXT)
    )
    AND (
        CAST(:search AS TEXT) IS NULL
        OR LOWER(b.branch_name) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        OR LOWER(b.city)        LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        OR LOWER(b.manager_name) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        OR LOWER(h.name)        LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        OR LOWER(b.address)     LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
    )
    ORDER BY h.name, b.branch_name
    """, nativeQuery = true)
    List<Branch> searchAll(
            @Param("status") String status,
            @Param("search") String search
    );

    /** Returns rows of [bodyPart (String), count (Long)] — counts branches per hospital body part */
    @Query("SELECT b.hospital.bodyPart, COUNT(b) FROM Branch b GROUP BY b.hospital.bodyPart")
    List<Object[]> countBranchesByBodyPart();
}
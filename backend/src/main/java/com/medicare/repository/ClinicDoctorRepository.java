package com.medicare.repository;

import com.medicare.entity.ClinicDoctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ClinicDoctorRepository extends JpaRepository<ClinicDoctor, Long> {

    List<ClinicDoctor> findByBranchId(Long branchId);

    java.util.Optional<ClinicDoctor> findByContactEmailIgnoreCase(String contactEmail);

//    @Query("SELECT d FROM ClinicDoctor d WHERE d.branch.id = :branchId AND " +
//           "(:status IS NULL OR d.status = :status) AND " +
//           "(:search IS NULL OR " +
//           "  LOWER(d.firstName) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//           "  LOWER(d.lastName) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//           "  LOWER(d.specialization) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//           "  LOWER(d.highestQualification) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//           "  LOWER(d.registrationNumber) LIKE LOWER(CONCAT('%',:search,'%')))")
//    List<ClinicDoctor> searchByBranch(@Param("branchId") Long branchId,
//                                      @Param("status") ClinicDoctor.DoctorStatus status,
//                                      @Param("search") String search);


    @Query(value = """
    SELECT *
    FROM clinic_doctors cd
    WHERE cd.branch_id = :branchId
    AND (
        CAST(:status AS TEXT) IS NULL
        OR cd.status = CAST(:status AS TEXT)
    )
    AND (
        CAST(:search AS TEXT) IS NULL
        OR LOWER(cd.first_name) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        OR LOWER(cd.last_name) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        OR LOWER(cd.specialization) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
    )
    """, nativeQuery = true)
    List<ClinicDoctor> searchByBranch(
            @Param("branchId") Long branchId,
            @Param("status") String status,
            @Param("search") String search
    );

    // All doctors across all branches of a hospital
    @Query("SELECT d FROM ClinicDoctor d WHERE d.hospital.id = :hospitalId AND " +
           "(:status IS NULL OR d.status = :status) AND " +
           "(:search IS NULL OR " +
           "  LOWER(d.firstName) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
           "  LOWER(d.lastName) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
           "  LOWER(d.specialization) LIKE LOWER(CONCAT('%',:search,'%')))")
    List<ClinicDoctor> searchByHospital(@Param("hospitalId") Long hospitalId,
                                        @Param("status") ClinicDoctor.DoctorStatus status,
                                        @Param("search") String search);
}

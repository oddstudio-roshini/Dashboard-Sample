package com.medicare.repository;

import com.medicare.entity.ClinicPatient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ClinicPatientRepository extends JpaRepository<ClinicPatient, Long> {

    List<ClinicPatient> findAllByOrderByIdAsc();
    List<ClinicPatient> findByClinicDoctorId(Long clinicDoctorId);
    java.util.Optional<ClinicPatient> findByContactEmailIgnoreCase(String email);

//    @Query("SELECT p FROM ClinicPatient p WHERE p.clinicDoctor.id = :doctorId AND " +
//           "(:status IS NULL OR p.appointmentStatus = :status) AND " +
//           "(:gender IS NULL OR LOWER(p.gender) = LOWER(:gender)) AND " +
//           "(:search IS NULL OR LOWER(p.firstName) LIKE LOWER(CONCAT('%',:search,'%')) " +
//           "  OR LOWER(p.lastName) LIKE LOWER(CONCAT('%',:search,'%')) " +
//           "  OR LOWER(p.diagnosis) LIKE LOWER(CONCAT('%',:search,'%'))" +
//           "  OR LOWER(p.visitType) LIKE LOWER(CONCAT('%',:search,'%')))")
//    List<ClinicPatient> searchByDoctor(@Param("doctorId") Long doctorId,
//                                       @Param("status") ClinicPatient.AppointmentStatus status,
//                                       @Param("gender") String gender,
//                                       @Param("search") String search);

    @Query(value = """
    SELECT *
    FROM clinic_patients p
    WHERE p.clinic_doctor_id = :doctorId

    AND (
        CAST(:status AS TEXT) IS NULL
        OR p.appointment_status = CAST(:status AS TEXT)
    )

    AND (
        CAST(:gender AS TEXT) IS NULL
        OR LOWER(p.gender) = LOWER(CAST(:gender AS TEXT))
    )

    AND (
        CAST(:search AS TEXT) IS NULL
        OR LOWER(p.first_name) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        OR LOWER(p.last_name) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        OR LOWER(p.contact_phone) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        OR LOWER(p.contact_email) LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
    )
    """, nativeQuery = true)
    List<ClinicPatient> searchByDoctor(
            @Param("doctorId") Long doctorId,
            @Param("status") String status,
            @Param("gender") String gender,
            @Param("search") String search
    );
}

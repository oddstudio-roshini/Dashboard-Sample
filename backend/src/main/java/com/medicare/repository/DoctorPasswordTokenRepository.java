package com.medicare.repository;

import com.medicare.entity.DoctorPasswordToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DoctorPasswordTokenRepository extends JpaRepository<DoctorPasswordToken, Long> {
    Optional<DoctorPasswordToken> findByToken(String token);
    void deleteByDoctorId(Long doctorId);
}

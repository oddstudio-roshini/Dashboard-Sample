package com.medicare.service;

import com.medicare.config.JwtUtil;
import com.medicare.dto.DTOs.DoctorLoginRequest;
import com.medicare.dto.DTOs.DoctorLoginResponse;
import com.medicare.entity.Doctor;
import com.medicare.entity.DoctorLog;
import com.medicare.repository.DoctorLogRepository;
import com.medicare.repository.DoctorRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DoctorAuthService {

    private final DoctorRepository doctorRepository;
    private final DoctorLogRepository doctorLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public DoctorLoginResponse login(DoctorLoginRequest request) {

        Doctor doctor = doctorRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (!passwordEncoder.matches(request.getPassword(), doctor.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        if (Boolean.TRUE.equals(doctor.getIsSuspended())) {
            throw new RuntimeException("Doctor account is suspended");
        }

        doctor.setLastLogin(LocalDateTime.now());
        doctor.setIsOnline(true);
        doctor.setDevice("WEB");

        if (doctor.getStatus() == Doctor.DoctorStatus.INACTIVE) {
            doctor.setStatus(Doctor.DoctorStatus.ACTIVE);
        }

        doctorRepository.save(doctor);

        DoctorLog log = DoctorLog.builder()
                .doctorId(doctor.getId())
                .doctorName(doctor.getFirstName() + " " + doctor.getLastName())
                .action(DoctorLog.LogAction.LOGIN)
                .performedBy("DOCTOR")
                .description("Doctor logged in from dashboard")
                .clinic(doctor.getClinicHospital())
                .device("WEB")
                .timestamp(LocalDateTime.now())
                .build();

        doctorLogRepository.save(log);

        String token = jwtUtil.generateToken(doctor.getUsername());

        return DoctorLoginResponse.builder()
                .token(token)
                .doctorId(doctor.getId())
                .doctorName(doctor.getFirstName() + " " + doctor.getLastName())
                .username(doctor.getUsername())
                .requirePasswordChange(doctor.getRequirePasswordChange())
                .build();
    }

    public void logout(Long doctorId) {

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        LocalDateTime logoutTime = LocalDateTime.now();
        doctor.setLastLogout(logoutTime);
        doctor.setIsOnline(false);

        doctorRepository.save(doctor);

        DoctorLog log = DoctorLog.builder()
                .doctorId(doctor.getId())
                .doctorName(doctor.getFirstName() + " " + doctor.getLastName())
                .action(DoctorLog.LogAction.LOGOUT)
                .performedBy("DOCTOR")
                .description("Doctor logged out from their dashboard")
                .clinic(doctor.getClinicHospital())
                .device("WEB")
                .timestamp(logoutTime)
                .build();

        doctorLogRepository.save(log);
    }
}

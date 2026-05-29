//package com.medicare.service;
//
//import com.medicare.dto.ClinicDTOs;
//import com.medicare.entity.*;
//import com.medicare.repository.*;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.stereotype.Service;
//
//import java.util.List;
//import java.util.stream.Collectors;
//
//@Service
//@RequiredArgsConstructor
//@Slf4j
//public class ClinicService {
//
//    private final HospitalRepository hospitalRepository;
//    private final BranchRepository branchRepository;
//    private final ClinicDoctorRepository clinicDoctorRepository;
//    private final ClinicPatientRepository clinicPatientRepository;
//
//    // ─── Stats ─────────────────────────────────────────────────────────────
//
//    public ClinicDTOs.ClinicStatsResponse getStats() {
//        return ClinicDTOs.ClinicStatsResponse.builder()
//                .totalHospitals(hospitalRepository.count())
//                .totalBranches(branchRepository.count())
//                .totalDoctors(clinicDoctorRepository.count())
//                .totalPatients(clinicPatientRepository.count())
//                .build();
//    }
//
//    // ─── Hospitals ─────────────────────────────────────────────────────────
//
//    public List<ClinicDTOs.HospitalResponse> searchHospitals(
//            String bodyPart,
//            String status,
//            String pincode,
//            String search) {
//
//        String bp = blank(bodyPart);
//        String pin = blank(pincode);
//        String q = blank(search);
//        String statusValue = blank(status);
//
//        List<Hospital> hospitals = (bp != null)
//                ? hospitalRepository.search(
//                bp,
//                statusValue,
//                pin,
//                q,
//                null,
//                null
//        )
//                : hospitalRepository.searchAll(
//                statusValue,
//                pin,
//                q,
//                null,
//                null
//        );
//
//        return hospitals.stream()
//                .map(h -> {
//                    List<Branch> branches =
//                            branchRepository.findByHospitalId(h.getId());
//
//                    long docCount = branches.stream()
//                            .mapToLong(b ->
//                                    clinicDoctorRepository
//                                            .findByBranchId(b.getId())
//                                            .size())
//                            .sum();
//
//                    return ClinicDTOs.toHospitalResponse(
//                            h,
//                            branches.size(),
//                            docCount
//                    );
//                })
//                .collect(Collectors.toList());
//    }
//
//    public ClinicDTOs.HospitalResponse getHospital(Long id) {
//
//        Hospital h = hospitalRepository.findById(id)
//                .orElseThrow(() ->
//                        new RuntimeException("Hospital not found: " + id));
//
//        List<Branch> branches =
//                branchRepository.findByHospitalId(id);
//
//        long docCount = branches.stream()
//                .mapToLong(b ->
//                        clinicDoctorRepository
//                                .findByBranchId(b.getId())
//                                .size())
//                .sum();
//
//        return ClinicDTOs.toHospitalResponse(
//                h,
//                branches.size(),
//                docCount
//        );
//    }
//
//    // ─── Branches ──────────────────────────────────────────────────────────
//
//    public List<ClinicDTOs.BranchResponse> searchBranches(
//            Long hospitalId,
//            String status,
//            String search) {
//        String statusValue = blank(status);
//
//        return branchRepository.searchByHospital(
//                        hospitalId,
//                        statusValue,
//                        blank(search)
//                )
//                .stream()
//                .map(ClinicDTOs::toBranchResponse)
//                .collect(Collectors.toList());
//    }
//
//    public ClinicDTOs.BranchResponse getBranch(Long id) {
//
//        return ClinicDTOs.toBranchResponse(
//                branchRepository.findById(id)
//                        .orElseThrow(() ->
//                                new RuntimeException(
//                                        "Branch not found: " + id))
//        );
//    }
//
//    // ─── Clinic Doctors ────────────────────────────────────────────────────
//
//    public List<ClinicDTOs.ClinicDoctorResponse> searchDoctors(
//            Long branchId,
//            String status,
//            String search) {
//
//        ClinicDoctor.DoctorStatus statusEnum =
//                parseDoctorStatus(status);
//
//        return clinicDoctorRepository.searchByBranch(
//                        branchId,
//                        blank(status),
//                        blank(search)
//                )
//                .stream()
//                .map(d ->
//                        ClinicDTOs.toDoctorResponse(
//                                d,
//                                clinicPatientRepository
//                                        .findByClinicDoctorId(d.getId())
//                                        .size()
//                        )
//                )
//                .collect(Collectors.toList());
//    }
//
//    public ClinicDTOs.ClinicDoctorResponse getClinicDoctor(Long id) {
//
//        ClinicDoctor d = clinicDoctorRepository.findById(id)
//                .orElseThrow(() ->
//                        new RuntimeException("Doctor not found: " + id));
//
//        return ClinicDTOs.toDoctorResponse(
//                d,
//                clinicPatientRepository
//                        .findByClinicDoctorId(id)
//                        .size()
//        );
//    }
//
//    // ─── Patients ──────────────────────────────────────────────────────────
//
//    // ─── Patients ──────────────────────────────────────────────────────────
//
//    public List<ClinicDTOs.PatientResponse> searchPatients(
//            Long doctorId,
//            String status,
//            String gender,
//            String search) {
//
//        return clinicPatientRepository.searchByDoctor(
//                        doctorId,
//                        blank(status),
//                        blank(gender),
//                        blank(search)
//                )
//                .stream()
//                .map(ClinicDTOs::toPatientResponse)
//                .collect(Collectors.toList());
//    }
//
//    // ─── Helpers ───────────────────────────────────────────────────────────
//
//    private String blank(String s) {
//        return (s == null || s.isBlank()) ? null : s;
//    }
//
//    private Hospital.HospitalStatus parseHospitalStatus(String s) {
//
//        if (s == null || s.isBlank()) {
//            return null;
//        }
//
//        try {
//            return Hospital.HospitalStatus.valueOf(
//                    s.toUpperCase());
//        } catch (Exception e) {
//            return null;
//        }
//    }
//
//    private Branch.BranchStatus parseBranchStatus(String s) {
//
//        if (s == null || s.isBlank()) {
//            return null;
//        }
//
//        try {
//            return Branch.BranchStatus.valueOf(
//                    s.toUpperCase());
//        } catch (Exception e) {
//            return null;
//        }
//    }
//
//    private ClinicDoctor.DoctorStatus parseDoctorStatus(String s) {
//
//        if (s == null || s.isBlank()) {
//            return null;
//        }
//
//        try {
//            return ClinicDoctor.DoctorStatus.valueOf(
//                    s.toUpperCase());
//        } catch (Exception e) {
//            return null;
//        }
//    }
//}


package com.medicare.service;

import com.medicare.dto.ClinicDTOs;
import com.medicare.entity.*;
import com.medicare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClinicService {

    private final HospitalRepository hospitalRepository;
    private final BranchRepository branchRepository;
    private final ClinicDoctorRepository clinicDoctorRepository;
    private final ClinicPatientRepository clinicPatientRepository;

    // ─── Stats ─────────────────────────────────────────────────────────────

    public ClinicDTOs.ClinicStatsResponse getStats() {
        return ClinicDTOs.ClinicStatsResponse.builder()
                .totalHospitals(hospitalRepository.count())
                .totalBranches(branchRepository.count())
                .totalDoctors(clinicDoctorRepository.count())
                .totalPatients(clinicPatientRepository.count())
                .build();
    }

    // ─── Body Part Counts ──────────────────────────────────────────────────

    public List<ClinicDTOs.BodyPartCountResponse> getBodyPartCounts() {
        // hospital counts keyed by bodyPart
        Map<String, Long> hMap = new HashMap<>();
        for (Object[] row : hospitalRepository.countHospitalsByBodyPart()) {
            hMap.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        // branch counts keyed by bodyPart (via hospital join)
        Map<String, Long> bMap = new HashMap<>();
        for (Object[] row : branchRepository.countBranchesByBodyPart()) {
            bMap.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        // merge — include every bodyPart that appears in either map
        Map<String, ClinicDTOs.BodyPartCountResponse> merged = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        hMap.forEach((bp, cnt) -> merged.computeIfAbsent(bp, k ->
                ClinicDTOs.BodyPartCountResponse.builder().bodyPart(k).hospitalCount(0).branchCount(0).build())
                .setHospitalCount(cnt));
        bMap.forEach((bp, cnt) -> merged.computeIfAbsent(bp, k ->
                ClinicDTOs.BodyPartCountResponse.builder().bodyPart(k).hospitalCount(0).branchCount(0).build())
                .setBranchCount(cnt));
        return new java.util.ArrayList<>(merged.values());
    }

    // ─── Hospitals ─────────────────────────────────────────────────────────

    public List<ClinicDTOs.HospitalResponse> searchHospitals(
            String bodyPart,
            String status,
            String pincode,
            String search,
            String hospitalName,
            String area) {

        String bp          = blank(bodyPart);
        String pin         = blank(pincode);
        String q           = blank(search);
        String statusValue = blank(status);
        String hName       = blank(hospitalName);
        String areaVal     = blank(area);

        List<Hospital> hospitals = (bp != null)
                ? hospitalRepository.search(bp, statusValue, pin, q, hName, areaVal)
                : hospitalRepository.searchAll(statusValue, pin, q, hName, areaVal);

        return hospitals.stream()
                .map(h -> {
                    List<Branch> branches =
                            branchRepository.findByHospitalId(h.getId());

                    long docCount = branches.stream()
                            .mapToLong(b ->
                                    clinicDoctorRepository
                                            .findByBranchId(b.getId())
                                            .size())
                            .sum();

                    return ClinicDTOs.toHospitalResponse(
                            h,
                            branches.size(),
                            docCount
                    );
                })
                .collect(Collectors.toList());
    }

    public ClinicDTOs.HospitalResponse getHospital(Long id) {

        Hospital h = hospitalRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Hospital not found: " + id));

        List<Branch> branches =
                branchRepository.findByHospitalId(id);

        long docCount = branches.stream()
                .mapToLong(b ->
                        clinicDoctorRepository
                                .findByBranchId(b.getId())
                                .size())
                .sum();

        return ClinicDTOs.toHospitalResponse(
                h,
                branches.size(),
                docCount
        );
    }

    // ─── Branches ──────────────────────────────────────────────────────────

    public List<ClinicDTOs.BranchResponse> searchBranches(
            Long hospitalId,
            String status,
            String search) {
        return branchRepository.searchByHospital(hospitalId, blank(status), blank(search))
                .stream().map(ClinicDTOs::toBranchResponse).collect(Collectors.toList());
    }

    /** Global branch search — across all hospitals, no hospitalId required. */
    public List<ClinicDTOs.BranchResponse> searchAllBranches(String status, String search) {
        return branchRepository.searchAll(blank(status), blank(search))
                .stream().map(ClinicDTOs::toBranchResponse).collect(Collectors.toList());
    }

    public ClinicDTOs.BranchResponse getBranch(Long id) {

        return ClinicDTOs.toBranchResponse(
                branchRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Branch not found: " + id))
        );
    }

    // ─── Clinic Doctors ────────────────────────────────────────────────────

    public List<ClinicDTOs.ClinicDoctorResponse> searchDoctors(
            Long branchId,
            String status,
            String search) {

        ClinicDoctor.DoctorStatus statusEnum =
                parseDoctorStatus(status);

        return clinicDoctorRepository.searchByBranch(
                        branchId,
                        blank(status),
                        blank(search)
                )
                .stream()
                .map(d ->
                        ClinicDTOs.toDoctorResponse(
                                d,
                                clinicPatientRepository
                                        .findByClinicDoctorId(d.getId())
                                        .size()
                        )
                )
                .collect(Collectors.toList());
    }

    public List<ClinicDTOs.ClinicDoctorResponse> searchDoctorsByHospital(Long hospitalId, String search) {
        String q = blank(search);
        return branchRepository.findByHospitalId(hospitalId)
                .stream()
                .flatMap(b -> clinicDoctorRepository.searchByBranch(b.getId(), null, q).stream())
                .map(d -> ClinicDTOs.toDoctorResponse(
                        d, clinicPatientRepository.findByClinicDoctorId(d.getId()).size()
                ))
                .collect(Collectors.toList());
    }

    public ClinicDTOs.ClinicDoctorResponse getClinicDoctor(Long id) {

        ClinicDoctor d = clinicDoctorRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Doctor not found: " + id));

        return ClinicDTOs.toDoctorResponse(
                d,
                clinicPatientRepository
                        .findByClinicDoctorId(id)
                        .size()
        );
    }

    // ─── Patients ──────────────────────────────────────────────────────────

    // ─── Patients ──────────────────────────────────────────────────────────

    public List<ClinicDTOs.PatientResponse> searchPatients(
            Long doctorId,
            String status,
            String gender,
            String search) {

        return clinicPatientRepository.searchByDoctor(
                        doctorId,
                        blank(status),
                        blank(gender),
                        blank(search)
                )
                .stream()
                .map(ClinicDTOs::toPatientResponse)
                .collect(Collectors.toList());
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    private String blank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private Hospital.HospitalStatus parseHospitalStatus(String s) {

        if (s == null || s.isBlank()) {
            return null;
        }

        try {
            return Hospital.HospitalStatus.valueOf(
                    s.toUpperCase());
        } catch (Exception e) {
            return null;
        }
    }

    private Branch.BranchStatus parseBranchStatus(String s) {

        if (s == null || s.isBlank()) {
            return null;
        }

        try {
            return Branch.BranchStatus.valueOf(
                    s.toUpperCase());
        } catch (Exception e) {
            return null;
        }
    }

    private ClinicDoctor.DoctorStatus parseDoctorStatus(String s) {

        if (s == null || s.isBlank()) {
            return null;
        }

        try {
            return ClinicDoctor.DoctorStatus.valueOf(
                    s.toUpperCase());
        } catch (Exception e) {
            return null;
        }
    }
}
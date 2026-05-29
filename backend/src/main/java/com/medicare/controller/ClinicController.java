//package com.medicare.controller;
//
//import com.medicare.dto.ClinicDTOs;
//import com.medicare.service.ClinicService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//
//@RestController
//@RequestMapping("/api/clinics")
//@RequiredArgsConstructor
//@CrossOrigin(origins = "http://localhost:3000")
//public class ClinicController {
//
//    private final ClinicService clinicService;
//
//    @GetMapping("/stats")
//    public ResponseEntity<ClinicDTOs.ClinicStatsResponse> getStats() {
//        return ResponseEntity.ok(clinicService.getStats());
//    }
//
//    /**
//     * GET /api/clinics/hospitals
//     * Query params: bodyPart, status, pincode, search
//     * - bodyPart absent → returns ALL hospitals (Hospitals Directory)
//     * - bodyPart present → filters by body part (Browse by Body Part)
//     */
//    @GetMapping("/hospitals")
//    public ResponseEntity<List<ClinicDTOs.HospitalResponse>> getHospitals(
//            @RequestParam(required = false) String bodyPart,
//            @RequestParam(required = false) String status,
//            @RequestParam(required = false) String pincode,
//            @RequestParam(required = false) String search,
//            @RequestParam(required = false) String hospitalName,
//            @RequestParam(required = false) String area) {
//        if (search != null) {
//            search = search.trim().toLowerCase();
//        }
//
//        if (bodyPart != null) {
//            bodyPart = bodyPart.trim();
//        }
//
//        return ResponseEntity.ok(
//                clinicService.searchHospitals(bodyPart, status, pincode, search)
//        );
////        return ResponseEntity.ok(clinicService.searchHospitals(bodyPart, status, pincode, search));
//    }
//
//    @GetMapping("/hospitals/{id}")
//    public ResponseEntity<ClinicDTOs.HospitalResponse> getHospital(@PathVariable Long id) {
//        return ResponseEntity.ok(clinicService.getHospital(id));
//    }
//
//    @GetMapping("/hospitals/{hospitalId}/branches")
//    public ResponseEntity<List<ClinicDTOs.BranchResponse>> getBranches(
//            @PathVariable Long hospitalId,
//            @RequestParam(required = false) String status,
//            @RequestParam(required = false) String search) {
//        return ResponseEntity.ok(clinicService.searchBranches(hospitalId, status, search));
//    }
//
//    @GetMapping("/branches/{id}")
//    public ResponseEntity<ClinicDTOs.BranchResponse> getBranch(@PathVariable Long id) {
//        return ResponseEntity.ok(clinicService.getBranch(id));
//    }
//
//    @GetMapping("/branches/{branchId}/doctors")
//    public ResponseEntity<List<ClinicDTOs.ClinicDoctorResponse>> getDoctors(
//            @PathVariable Long branchId,
//            @RequestParam(required = false) String status,
//            @RequestParam(required = false) String search) {
//        return ResponseEntity.ok(clinicService.searchDoctors(branchId, status, search));
//    }
//
//    @GetMapping("/doctors/{id}")
//    public ResponseEntity<ClinicDTOs.ClinicDoctorResponse> getDoctor(@PathVariable Long id) {
//        return ResponseEntity.ok(clinicService.getClinicDoctor(id));
//    }
//
//    @GetMapping("/doctors/{doctorId}/patients")
//    public ResponseEntity<List<ClinicDTOs.PatientResponse>> getPatients(
//            @PathVariable Long doctorId,
//            @RequestParam(required = false) String status,
//            @RequestParam(required = false) String gender,
//            @RequestParam(required = false) String search) {
//        return ResponseEntity.ok(clinicService.searchPatients(doctorId, status, gender, search));
//    }
//}



package com.medicare.controller;

import com.medicare.dto.ClinicDTOs;
import com.medicare.service.ClinicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clinics")
@RequiredArgsConstructor
public class ClinicController {

    private final ClinicService clinicService;

    @GetMapping("/stats")
    public ResponseEntity<ClinicDTOs.ClinicStatsResponse> getStats() {
        return ResponseEntity.ok(clinicService.getStats());
    }

    @GetMapping("/body-part-counts")
    public ResponseEntity<List<ClinicDTOs.BodyPartCountResponse>> getBodyPartCounts() {
        return ResponseEntity.ok(clinicService.getBodyPartCounts());
    }

    /**
     * GET /api/clinics/hospitals
     * Query params: bodyPart, status, pincode, search
     * - bodyPart absent → returns ALL hospitals (Hospitals Directory)
     * - bodyPart present → filters by body part (Browse by Body Part)
     */
    @GetMapping("/hospitals")
    public ResponseEntity<List<ClinicDTOs.HospitalResponse>> getHospitals(
            @RequestParam(required = false) String bodyPart,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String hospitalName,
            @RequestParam(required = false) String area) {
        if (search != null) {
            search = search.trim().toLowerCase();
        }

        if (bodyPart != null) bodyPart = bodyPart.trim();
        if (hospitalName != null) hospitalName = hospitalName.trim();
        if (area != null) area = area.trim();
        if (pincode != null) pincode = pincode.trim();

        return ResponseEntity.ok(
                clinicService.searchHospitals(bodyPart, status, pincode, search, hospitalName, area)
        );
    }

    @GetMapping("/hospitals/{id}")
    public ResponseEntity<ClinicDTOs.HospitalResponse> getHospital(@PathVariable Long id) {
        return ResponseEntity.ok(clinicService.getHospital(id));
    }

    /**
     * GET /api/clinics/branches
     * Global branch search — no hospitalId required.
     * Query params: search, status
     */
    @GetMapping("/branches")
    public ResponseEntity<List<ClinicDTOs.BranchResponse>> getAllBranches(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        if (search != null) search = search.trim();
        if (status != null) status = status.trim();
        return ResponseEntity.ok(clinicService.searchAllBranches(status, search));
    }

    @GetMapping("/hospitals/{hospitalId}/branches")
    public ResponseEntity<List<ClinicDTOs.BranchResponse>> getBranches(
            @PathVariable Long hospitalId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(clinicService.searchBranches(hospitalId, status, search));
    }

    @GetMapping("/branches/{id}")
    public ResponseEntity<ClinicDTOs.BranchResponse> getBranch(@PathVariable Long id) {
        return ResponseEntity.ok(clinicService.getBranch(id));
    }

    @GetMapping("/hospitals/{hospitalId}/doctors")
    public ResponseEntity<List<ClinicDTOs.ClinicDoctorResponse>> getDoctorsByHospital(
            @PathVariable Long hospitalId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(clinicService.searchDoctorsByHospital(hospitalId, search));
    }

    @GetMapping("/branches/{branchId}/doctors")
    public ResponseEntity<List<ClinicDTOs.ClinicDoctorResponse>> getDoctors(
            @PathVariable Long branchId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(clinicService.searchDoctors(branchId, status, search));
    }

    @GetMapping("/doctors/{id}")
    public ResponseEntity<ClinicDTOs.ClinicDoctorResponse> getDoctor(@PathVariable Long id) {
        return ResponseEntity.ok(clinicService.getClinicDoctor(id));
    }

    @GetMapping("/doctors/{doctorId}/patients")
    public ResponseEntity<List<ClinicDTOs.PatientResponse>> getPatients(
            @PathVariable Long doctorId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(clinicService.searchPatients(doctorId, status, gender, search));
    }
}
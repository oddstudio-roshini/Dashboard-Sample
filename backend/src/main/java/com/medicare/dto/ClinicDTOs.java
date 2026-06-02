//package com.medicare.dto;
//
//import com.medicare.entity.*;
//import lombok.*;
//import java.time.LocalDate;
//
//public class ClinicDTOs {
//
//    @Data @Builder @NoArgsConstructor @AllArgsConstructor
//    public static class HospitalResponse {
//        private Long id;
//        private String name;
//        private String area;
//        private String city;
//        private String state;
//        private String pincode;
//        private String address;
//        private String specialization;
//        private String contactName;
//        private String contactNumber;
//        private String email;
//        private String bodyPart;
//        private Double latitude;
//        private Double longitude;
//        private String status;
//        private Integer establishedYear;
//        private long branchCount;
//        private long doctorCount;
//    }
//
//    @Data @Builder @NoArgsConstructor @AllArgsConstructor
//    public static class BranchResponse {
//        private Long id;
//        private Long hospitalId;
//        private String hospitalName;
//        private String branchName;
//        private String branchCode;
//        private String address;
//        private String city;
//        private String contactPhone;
//        private String contactEmail;
//        private String managerName;
//        private Integer totalDoctors;
//        private String status;
//    }
//
//    @Data @Builder @NoArgsConstructor @AllArgsConstructor
//    public static class ClinicDoctorResponse {
//        private Long id;
//        private Long branchId;
//        private String branchName;
//        private Long hospitalId;
//        private String hospitalName;
//        private String firstName;
//        private String lastName;
//        private String fullName;
//        private String specialization;
//        private String highestQualification;
//        private String registrationNumber;
//        private Integer experienceYears;
//        private String contactPhone;
//        private String contactEmail;
//        private Integer consultationFee;
//        private String availableDays;
//        private String consultationHours;
//        private String status;
//        private long patientCount;
//    }
//
//    @Data @Builder @NoArgsConstructor @AllArgsConstructor
//    public static class PatientResponse {
//        private Long id;
//        private Long clinicDoctorId;
//        private String doctorName;
//        private String firstName;
//        private String lastName;
//        private String fullName;
//        private Integer age;
//        private String gender;
//        private String contactPhone;
//        private String contactEmail;
//        private String address;
//        private String diagnosis;
//        private LocalDate appointmentDate;
//        private String appointmentStatus;
//        private String visitType;
//        private String notes;
//    }
//
//    @Data @Builder @NoArgsConstructor @AllArgsConstructor
//    public static class ClinicStatsResponse {
//        private long totalHospitals;
//        private long totalBranches;
//        private long totalDoctors;
//        private long totalPatients;
//    }
//
//    // ── Mapper helpers ─────────────────────────────────────────────────────────
//
//    public static HospitalResponse toHospitalResponse(Hospital h, long branchCount, long doctorCount) {
//        return HospitalResponse.builder()
//                .id(h.getId())
//                .name(h.getName())
//                .area(h.getArea())
//                .city(h.getCity())
//                .state(h.getState())
//                .pincode(h.getPincode())
//                .address(h.getAddress())
//                .specialization(h.getSpecialization())
//                .contactName(h.getContactName())
//                .contactNumber(h.getContactNumber())
//                .email(h.getEmail())
//                .bodyPart(h.getBodyPart())
//                .status(h.getStatus().name())
//                .establishedYear(h.getEstablishedYear())
//                .branchCount(branchCount)
//                .doctorCount(doctorCount)
//                .build();
//    }
//
//    public static BranchResponse toBranchResponse(Branch b) {
//        return BranchResponse.builder()
//                .id(b.getId())
//                .hospitalId(b.getHospital().getId())
//                .hospitalName(b.getHospital().getName())
//                .branchName(b.getBranchName())
//                .branchCode(b.getBranchCode())
//                .address(b.getAddress())
//                .city(b.getCity())
//                .contactPhone(b.getContactPhone())
//                .contactEmail(b.getContactEmail())
//                .managerName(b.getManagerName())
//                .totalDoctors(b.getTotalDoctors())
//                .status(b.getStatus().name())
//                .build();
//    }
//
//    public static ClinicDoctorResponse toDoctorResponse(ClinicDoctor d, long patientCount) {
//        return ClinicDoctorResponse.builder()
//                .id(d.getId())
//                .branchId(d.getBranch().getId())
//                .branchName(d.getBranch().getBranchName())
//                .hospitalId(d.getHospital().getId())
//                .hospitalName(d.getHospital().getName())
//                .firstName(d.getFirstName())
//                .lastName(d.getLastName())
//                .fullName(d.getFirstName() + " " + d.getLastName())
//                .specialization(d.getSpecialization())
//                .highestQualification(d.getHighestQualification())
//                .registrationNumber(d.getRegistrationNumber())
//                .experienceYears(d.getExperienceYears())
//                .contactPhone(d.getContactPhone())
//                .contactEmail(d.getContactEmail())
//                .consultationFee(d.getConsultationFee())
//                .availableDays(d.getAvailableDays())
//                .consultationHours(d.getConsultationHours())
//                .status(d.getStatus().name())
//                .patientCount(patientCount)
//                .build();
//    }
//
//    public static PatientResponse toPatientResponse(ClinicPatient p) {
//        return PatientResponse.builder()
//                .id(p.getId())
//                .clinicDoctorId(p.getClinicDoctor().getId())
//                .doctorName(p.getClinicDoctor().getFirstName() + " " + p.getClinicDoctor().getLastName())
//                .firstName(p.getFirstName())
//                .lastName(p.getLastName())
//                .fullName(p.getFirstName() + " " + p.getLastName())
//                .age(p.getAge())
//                .gender(p.getGender())
//                .contactPhone(p.getContactPhone())
//                .contactEmail(p.getContactEmail())
//                .address(p.getAddress())
//                .diagnosis(p.getDiagnosis())
//                .appointmentDate(p.getAppointmentDate())
//                .appointmentStatus(p.getAppointmentStatus().name())
//                .visitType(p.getVisitType())
//                .notes(p.getNotes())
//                .build();
//    }
//}

package com.medicare.dto;

import com.medicare.entity.*;
import lombok.*;
import java.time.LocalDate;

public class ClinicDTOs {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class HospitalResponse {
        private Long id;
        private String name;
        private String area;
        private String city;
        private String state;
        private String pincode;
        private String address;
        private String specialization;
        private String contactName;
        private String contactNumber;
        private String email;
        private String bodyPart;
        private String status;
        private Integer establishedYear;
        private Double latitude;
        private Double longitude;
        private long branchCount;
        private long doctorCount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BranchResponse {
        private Long id;
        private Long hospitalId;
        private String hospitalName;
        private String branchName;
        private String branchCode;
        private String address;
        private String city;
        private String contactPhone;
        private String contactEmail;
        private String managerName;
        private Integer totalDoctors;
        private Double latitude;
        private Double longitude;
        private String status;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ClinicDoctorResponse {
        private Long id;
        private Long branchId;
        private String branchName;
        private Long hospitalId;
        private String hospitalName;
        private String firstName;
        private String lastName;
        private String fullName;
        private String specialization;
        private String highestQualification;
        private String registrationNumber;
        private Integer experienceYears;
        private String contactPhone;
        private String contactEmail;
        private Integer consultationFee;
        private String availableDays;
        private String consultationHours;
        private String status;
        private long patientCount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PatientResponse {
        private Long id;
        private Long clinicDoctorId;
        private String doctorName;
        private String firstName;
        private String lastName;
        private String fullName;
        private Integer age;
        private String gender;
        private String contactPhone;
        private String contactEmail;
        private String address;
        private String diagnosis;
        private LocalDate appointmentDate;
        private String appointmentStatus;
        private String visitType;
        private String notes;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ClinicStatsResponse {
        private long totalHospitals;
        private long totalBranches;
        private long totalDoctors;
        private long totalPatients;
    }

    public static HospitalResponse toHospitalResponse(Hospital h, long branchCount, long doctorCount) {
        return HospitalResponse.builder()
                .id(h.getId()).name(h.getName()).area(h.getArea())
                .city(h.getCity()).state(h.getState()).pincode(h.getPincode())
                .address(h.getAddress()).specialization(h.getSpecialization())
                .contactName(h.getContactName()).contactNumber(h.getContactNumber())
                .email(h.getEmail()).bodyPart(h.getBodyPart())
                .status(h.getStatus().name()).establishedYear(h.getEstablishedYear())
                .latitude(h.getLatitude()).longitude(h.getLongitude())
                .branchCount(branchCount).doctorCount(doctorCount)
                .build();
    }

    public static BranchResponse toBranchResponse(Branch b) {
        return BranchResponse.builder()
                .id(b.getId()).hospitalId(b.getHospital().getId())
                .hospitalName(b.getHospital().getName())
                .branchName(b.getBranchName()).branchCode(b.getBranchCode())
                .address(b.getAddress()).city(b.getCity())
                .contactPhone(b.getContactPhone()).contactEmail(b.getContactEmail())
                .managerName(b.getManagerName()).totalDoctors(b.getTotalDoctors())
                .latitude(b.getLatitude()).longitude(b.getLongitude())
                .status(b.getStatus().name())
                .build();
    }

    public static ClinicDoctorResponse toDoctorResponse(ClinicDoctor d, long patientCount) {
        return ClinicDoctorResponse.builder()
                .id(d.getId()).branchId(d.getBranch().getId())
                .branchName(d.getBranch().getBranchName())
                .hospitalId(d.getHospital().getId()).hospitalName(d.getHospital().getName())
                .firstName(d.getFirstName()).lastName(d.getLastName())
                .fullName(d.getFirstName() + " " + d.getLastName())
                .specialization(d.getSpecialization())
                .highestQualification(d.getHighestQualification())
                .registrationNumber(d.getRegistrationNumber())
                .experienceYears(d.getExperienceYears())
                .contactPhone(d.getContactPhone()).contactEmail(d.getContactEmail())
                .consultationFee(d.getConsultationFee())
                .availableDays(d.getAvailableDays()).consultationHours(d.getConsultationHours())
                .status(d.getStatus() != null ? d.getStatus().name() : "ACTIVE").patientCount(patientCount)
                .build();
    }

    public static PatientResponse toPatientResponse(ClinicPatient p) {
        ClinicDoctor doc = p.getClinicDoctor();
        String firstName = p.getFirstName() != null ? p.getFirstName() : "";
        String lastName  = p.getLastName()  != null ? p.getLastName()  : "";
        return PatientResponse.builder()
                .id(p.getId())
                .clinicDoctorId(doc != null ? doc.getId() : null)
                .doctorName(doc != null ? doc.getFirstName() + " " + doc.getLastName() : "")
                .firstName(firstName)
                .lastName(lastName)
                .fullName((firstName + " " + lastName).trim())
                .age(p.getAge())
                .gender(p.getGender())
                .contactPhone(p.getContactPhone())
                .contactEmail(p.getContactEmail())
                .address(p.getAddress())
                .diagnosis(p.getDiagnosis())
                .appointmentDate(p.getAppointmentDate())
                .appointmentStatus(p.getAppointmentStatus() != null
                        ? p.getAppointmentStatus().name() : "SCHEDULED")
                .visitType(p.getVisitType())
                .notes(p.getNotes())
                .build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BodyPartCountResponse {
        private String bodyPart;
        private long hospitalCount;
        private long branchCount;
    }
}


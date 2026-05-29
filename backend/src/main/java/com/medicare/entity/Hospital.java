//package com.medicare.entity;
//
//import jakarta.persistence.*;
//import lombok.*;
//import java.time.LocalDateTime;
//
//@Entity
//@Table(name = "hospitals")
//@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
//public class Hospital {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    @Column(nullable = false)
//    private String name;
//
//    private String area;
//    private String city;
//    private String state;
//    private String pincode;
//    private String address;
//    private String specialization;
//
//    @Column(name = "contact_name")
//    private String contactName;
//
//    @Column(name = "contact_number")
//    private String contactNumber;
//
//    private String email;
//
//    @Column(name = "body_part", nullable = false)
//    private String bodyPart;
//
//    @Column(name = "latitude")
//    private Double latitude;
//
//    @Column(name = "longitude")
//    private Double longitude;
//
//    @Enumerated(EnumType.STRING)
//    @Column(nullable = false)
//    @Builder.Default
//    private HospitalStatus status = HospitalStatus.ACTIVE;
//
//    @Column(name = "established_year")
//    private Integer establishedYear;
//
//    @Column(name = "created_at")
//    @Builder.Default
//    private LocalDateTime createdAt = LocalDateTime.now();
//
//    public enum HospitalStatus { ACTIVE, INACTIVE }
//}


package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hospitals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String area;
    private String city;
    private String state;
    private String pincode;
    private String address;
    private String specialization;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_number")
    private String contactNumber;

    private String email;

    @Column(name = "body_part", nullable = false)
    private String bodyPart;

    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private HospitalStatus status = HospitalStatus.ACTIVE;

    @Column(name = "established_year")
    private Integer establishedYear;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum HospitalStatus { ACTIVE, INACTIVE }
}

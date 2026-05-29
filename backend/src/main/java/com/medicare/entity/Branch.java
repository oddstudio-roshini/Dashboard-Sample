//package com.medicare.entity;
//
//import jakarta.persistence.*;
//import lombok.*;
//import java.time.LocalDateTime;
//
//@Entity
//@Table(name = "branches")
//@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
//public class Branch {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "hospital_id", nullable = false)
//    private Hospital hospital;
//
//    @Column(name = "branch_name", nullable = false)
//    private String branchName;
//
//    @Column(name = "branch_code", unique = true)
//    private String branchCode;
//
//    private String address;
//    private String city;
//
//    @Column(name = "contact_phone")
//    private String contactPhone;
//
//    @Column(name = "contact_email")
//    private String contactEmail;
//
//    @Column(name = "manager_name")
//    private String managerName;
//
//
//
//    @Column(name = "total_doctors")
//    @Builder.Default
//    private Integer totalDoctors = 0;
//
//    @Enumerated(EnumType.STRING)
//    @Column(nullable = false)
//    @Builder.Default
//    private BranchStatus status = BranchStatus.ACTIVE;
//
//    @Column(name = "created_at")
//    @Builder.Default
//    private LocalDateTime createdAt = LocalDateTime.now();
//
//    public enum BranchStatus { ACTIVE, INACTIVE }
//}


package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "branches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(name = "branch_name", nullable = false)
    private String branchName;

    @Column(name = "branch_code", unique = true)
    private String branchCode;

    private String address;
    private String city;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "manager_name")
    private String managerName;

    @Column(name = "total_doctors")
    @Builder.Default
    private Integer totalDoctors = 0;

    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BranchStatus status = BranchStatus.ACTIVE;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum BranchStatus { ACTIVE, INACTIVE }
}

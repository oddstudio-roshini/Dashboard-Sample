package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sales_providers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SalesProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String website;

    private String phoneNumber;

    private Integer reviewsCount;

    private Double reviewsAverage;

    private String placeType;

    private String opensAt;

    private String searchCategory;

    private String searchArea;

    private String pincode;

    @Column(columnDefinition = "TEXT")
    private String googleMapLink;

    /** Sheet name from Excel — e.g. Orthopedics_Hospital, Physiotherapy */
    private String sheetCategory;
}

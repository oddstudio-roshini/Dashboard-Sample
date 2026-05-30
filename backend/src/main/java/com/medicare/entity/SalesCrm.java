package com.medicare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sales_crm")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SalesCrm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false, unique = true)
    private SalesProvider provider;

    @Column(nullable = false)
    @Builder.Default
    private String status = "Lead";

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String notes = "";

    private String lastContacted;

    private String followUpDate;

    @Builder.Default
    private Boolean isWhale = false;
}

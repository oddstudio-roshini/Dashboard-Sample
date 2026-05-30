package com.medicare.dto;

import lombok.Data;
import java.util.List;

public class SalesDTOs {

    @Data
    public static class ProviderResponse {
        private Long id;
        private String name;
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
        private String googleMapLink;
        private String sheetCategory;
        // CRM fields (embedded for convenience)
        private String status;
        private String notes;
        private String lastContacted;
        private String followUpDate;
        private Boolean isWhale;
    }

    @Data
    public static class CrmUpdateRequest {
        private String status;
        private String notes;
        private String lastContacted;
        private String followUpDate;
        private Boolean isWhale;
    }

    @Data
    public static class StatsResponse {
        private long totalProviders;
        private long totalAreas;
        private long converted;
        private long demosBooked;
        private long whales;
        private long contacted;
        private long leads;
        private long notInterested;
    }

    @Data
    public static class FiltersResponse {
        private List<String> categories;
        private List<String> areas;
        private List<String> pincodes;
    }

    @Data
    public static class TaskResponse {
        private Long providerId;
        private String providerName;
        private String address;
        private String status;
        private String followUpDate;
    }
}

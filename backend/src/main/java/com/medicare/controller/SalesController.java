package com.medicare.controller;

import com.medicare.dto.SalesDTOs;
import com.medicare.service.SalesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class SalesController {

    private final SalesService salesService;

    /** GET /api/sales/providers?search=&category=&area=&pincode=&whaleOnly= */
    @GetMapping("/providers")
    public ResponseEntity<List<SalesDTOs.ProviderResponse>> getProviders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) Boolean whaleOnly) {
        return ResponseEntity.ok(salesService.getProviders(search, category, area, pincode, whaleOnly));
    }

    /** PUT /api/sales/providers/{id}/crm */
    @PutMapping("/providers/{id}/crm")
    public ResponseEntity<SalesDTOs.ProviderResponse> updateCrm(
            @PathVariable Long id,
            @RequestBody SalesDTOs.CrmUpdateRequest req) {
        return ResponseEntity.ok(salesService.updateCrm(id, req));
    }

    /** GET /api/sales/stats */
    @GetMapping("/stats")
    public ResponseEntity<SalesDTOs.StatsResponse> getStats() {
        return ResponseEntity.ok(salesService.getStats());
    }

    /** GET /api/sales/filters */
    @GetMapping("/filters")
    public ResponseEntity<SalesDTOs.FiltersResponse> getFilters() {
        return ResponseEntity.ok(salesService.getFilters());
    }

    /** GET /api/sales/tasks */
    @GetMapping("/tasks")
    public ResponseEntity<List<SalesDTOs.TaskResponse>> getTasks() {
        return ResponseEntity.ok(salesService.getTasks());
    }
}

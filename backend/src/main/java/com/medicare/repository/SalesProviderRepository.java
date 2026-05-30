package com.medicare.repository;

import com.medicare.entity.SalesProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SalesProviderRepository extends JpaRepository<SalesProvider, Long> {

    List<SalesProvider> findAllByOrderByNameAsc();

    @Query("SELECT DISTINCT p.sheetCategory FROM SalesProvider p WHERE p.sheetCategory IS NOT NULL AND p.sheetCategory <> '' ORDER BY p.sheetCategory")
    List<String> findDistinctCategories();

    @Query("SELECT DISTINCT p.searchArea FROM SalesProvider p WHERE p.searchArea IS NOT NULL ORDER BY p.searchArea")
    List<String> findDistinctAreas();

    @Query("SELECT DISTINCT p.pincode FROM SalesProvider p WHERE p.pincode IS NOT NULL ORDER BY p.pincode")
    List<String> findDistinctPincodes();
}

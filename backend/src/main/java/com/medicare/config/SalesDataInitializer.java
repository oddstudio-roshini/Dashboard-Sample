package com.medicare.config;

import com.medicare.entity.SalesProvider;
import com.medicare.repository.SalesCrmRepository;
import com.medicare.repository.SalesProviderRepository;
import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import org.springframework.transaction.annotation.Transactional;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class SalesDataInitializer implements ApplicationRunner {

    private final SalesProviderRepository providerRepo;
    private final SalesCrmRepository crmRepo;

    private static final int EXPECTED_COUNT = 2027;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        long existing = providerRepo.count();
        if (existing >= EXPECTED_COUNT) {
            log.info("Sales providers already fully seeded ({}) — skipping.", existing);
            return;
        }

        // Wipe and re-seed so we always get a clean full dataset
        if (existing > 0) {
            log.info("Incomplete seed detected ({} rows). Wiping and re-seeding...", existing);
            crmRepo.deleteAll();      // delete CRM first (FK constraint)
            providerRepo.deleteAll();
        }

        ClassPathResource resource = new ClassPathResource("data/sales_providers.csv");
        try (CSVReader reader = new CSVReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

            reader.readNext(); // skip header
            String[] row;
            var batch = new ArrayList<SalesProvider>(200);
            int count = 0;

            while ((row = reader.readNext()) != null) {
                if (row.length < 13) continue;
                String name = clean(row[0]);
                if (name.isBlank()) continue;

                batch.add(SalesProvider.builder()
                        .name(name)
                        .address(clean(row[1]))
                        .website(clean(row[2]))
                        .phoneNumber(clean(row[3]))
                        .reviewsCount(parseInt(row[4]))
                        .reviewsAverage(parseDouble(row[5]))
                        .placeType(clean(row[6]))
                        .opensAt(clean(row[7]))
                        .searchCategory(clean(row[8]))
                        .searchArea(clean(row[9]))
                        .pincode(clean(row[10]))
                        .googleMapLink(clean(row[11]))
                        .sheetCategory(clean(row[12]))
                        .build());

                if (batch.size() == 200) {
                    providerRepo.saveAll(batch);
                    count += batch.size();
                    batch.clear();
                }
            }

            if (!batch.isEmpty()) {
                providerRepo.saveAll(batch);
                count += batch.size();
            }

            log.info("Sales Data Initializer: seeded {} providers.", count);
        } catch (Exception e) {
            log.error("Failed to seed sales providers: {}", e.getMessage(), e);
        }
    }

    private String clean(String s) {
        return s == null ? "" : s.trim();
    }

    private Integer parseInt(String s) {
        try { return s == null || s.isBlank() ? null : (int) Double.parseDouble(s.trim()); }
        catch (NumberFormatException e) { return null; }
    }

    private Double parseDouble(String s) {
        try { return s == null || s.isBlank() ? null : Double.parseDouble(s.trim()); }
        catch (NumberFormatException e) { return null; }
    }
}

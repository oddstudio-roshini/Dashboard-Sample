package com.medicare.service;

import com.medicare.dto.SalesDTOs;
import com.medicare.entity.SalesCrm;
import com.medicare.entity.SalesProvider;
import com.medicare.repository.SalesCrmRepository;
import com.medicare.repository.SalesProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SalesService {

    private final SalesProviderRepository providerRepo;
    private final SalesCrmRepository crmRepo;

    // ── Providers ─────────────────────────────────────────────────────────────

    public List<SalesDTOs.ProviderResponse> getProviders(
            String search, String category, String area, String pincode, Boolean whaleOnly) {

        final String s = (search   != null && !search.isBlank())   ? search.trim().toLowerCase()   : null;
        final String c = (category != null && !category.equals("All")) ? category : null;
        final String a = (area     != null && !area.equals("All"))     ? area     : null;
        final String p = (pincode  != null && !pincode.isBlank())  ? pincode.trim()  : null;

        // Load all and filter in Java — 438 rows, no performance concern
        List<SalesProvider> all = providerRepo.findAllByOrderByNameAsc();

        return all.stream()
                .filter(prov -> {
                    if (s != null) {
                        boolean nameMatch    = prov.getName()    != null && prov.getName().toLowerCase().contains(s);
                        boolean addressMatch = prov.getAddress() != null && prov.getAddress().toLowerCase().contains(s);
                        if (!nameMatch && !addressMatch) return false;
                    }
                    if (c != null && !c.equals(prov.getSheetCategory())) return false;
                    if (a != null && !a.equals(prov.getSearchArea()))     return false;
                    if (p != null && !p.equals(prov.getPincode()))        return false;
                    return true;
                })
                .map(prov -> {
                    SalesCrm crm = crmRepo.findByProviderId(prov.getId())
                            .orElseGet(() -> defaultCrm(prov));
                    if (Boolean.TRUE.equals(whaleOnly) && !Boolean.TRUE.equals(crm.getIsWhale())) return null;
                    return toResponse(prov, crm);
                })
                .filter(r -> r != null)
                .collect(Collectors.toList());
    }

    // ── CRM Update ────────────────────────────────────────────────────────────

    @Transactional
    public SalesDTOs.ProviderResponse updateCrm(Long providerId, SalesDTOs.CrmUpdateRequest req) {
        SalesProvider provider = providerRepo.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found: " + providerId));

        SalesCrm crm = crmRepo.findByProviderId(providerId)
                .orElseGet(() -> {
                    SalesCrm newCrm = SalesCrm.builder().provider(provider).build();
                    return newCrm;
                });

        if (req.getStatus() != null)       crm.setStatus(req.getStatus());
        if (req.getNotes() != null)         crm.setNotes(req.getNotes());
        if (req.getLastContacted() != null) crm.setLastContacted(req.getLastContacted());
        if (req.getFollowUpDate() != null)  crm.setFollowUpDate(req.getFollowUpDate());
        if (req.getIsWhale() != null)       crm.setIsWhale(req.getIsWhale());

        crmRepo.save(crm);
        return toResponse(provider, crm);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    public SalesDTOs.StatsResponse getStats() {
        SalesDTOs.StatsResponse stats = new SalesDTOs.StatsResponse();
        stats.setTotalProviders(providerRepo.count());
        stats.setConverted(crmRepo.countByStatus("Converted"));
        stats.setDemosBooked(crmRepo.countByStatus("Demo Booked"));
        stats.setContacted(crmRepo.countByStatus("Contacted"));
        stats.setLeads(crmRepo.countByStatus("Lead"));
        stats.setNotInterested(crmRepo.countByStatus("Not Interested"));
        stats.setWhales(crmRepo.countWhales());

        Set<String> areas = providerRepo.findAll().stream()
                .map(SalesProvider::getSearchArea).filter(a -> a != null && !a.isBlank())
                .collect(Collectors.toSet());
        stats.setTotalAreas(areas.size());
        return stats;
    }

    // ── Filters ───────────────────────────────────────────────────────────────

    public SalesDTOs.FiltersResponse getFilters() {
        SalesDTOs.FiltersResponse f = new SalesDTOs.FiltersResponse();
        f.setCategories(providerRepo.findDistinctCategories());
        f.setAreas(providerRepo.findDistinctAreas());
        f.setPincodes(providerRepo.findDistinctPincodes());
        return f;
    }

    // ── Tasks ─────────────────────────────────────────────────────────────────

    public List<SalesDTOs.TaskResponse> getTasks() {
        return crmRepo.findPendingFollowUps().stream().map(crm -> {
            SalesDTOs.TaskResponse t = new SalesDTOs.TaskResponse();
            t.setProviderId(crm.getProvider().getId());
            t.setProviderName(crm.getProvider().getName());
            t.setAddress(crm.getProvider().getAddress());
            t.setStatus(crm.getStatus());
            t.setFollowUpDate(crm.getFollowUpDate());
            return t;
        }).collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private SalesCrm defaultCrm(SalesProvider p) {
        return SalesCrm.builder().provider(p).status("Lead").notes("").isWhale(false).build();
    }

    private SalesDTOs.ProviderResponse toResponse(SalesProvider p, SalesCrm crm) {
        SalesDTOs.ProviderResponse r = new SalesDTOs.ProviderResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setAddress(p.getAddress());
        r.setWebsite(p.getWebsite());
        r.setPhoneNumber(p.getPhoneNumber());
        r.setReviewsCount(p.getReviewsCount());
        r.setReviewsAverage(p.getReviewsAverage());
        r.setPlaceType(p.getPlaceType());
        r.setOpensAt(p.getOpensAt());
        r.setSearchCategory(p.getSearchCategory());
        r.setSearchArea(p.getSearchArea());
        r.setPincode(p.getPincode());
        r.setGoogleMapLink(p.getGoogleMapLink());
        r.setSheetCategory(p.getSheetCategory());
        r.setStatus(crm.getStatus());
        r.setNotes(crm.getNotes());
        r.setLastContacted(crm.getLastContacted());
        r.setFollowUpDate(crm.getFollowUpDate());
        r.setIsWhale(crm.getIsWhale());
        return r;
    }
}

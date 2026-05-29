package com.medicare.repository;

import com.medicare.entity.BodyPart;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BodyPartRepository extends JpaRepository<BodyPart, Long> {
    Optional<BodyPart> findByNameIgnoreCase(String name);
    List<BodyPart> findAllByOrderByDisplayOrderAscNameAsc();
}

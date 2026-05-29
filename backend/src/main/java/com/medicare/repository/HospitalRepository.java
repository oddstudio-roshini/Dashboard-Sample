////package com.medicare.repository;
////
////import com.medicare.entity.Hospital;
////import org.springframework.data.jpa.repository.JpaRepository;
////import org.springframework.data.jpa.repository.Query;
////import org.springframework.data.repository.query.Param;
////
////import java.util.List;
////
////public interface HospitalRepository extends JpaRepository<Hospital, Long> {
////
////    List<Hospital> findByBodyPartIgnoreCase(String bodyPart);
////
////    @Query(value = """
////        SELECT * FROM hospitals h
////        WHERE
////        (:bodyPart IS NULL OR LOWER(h.body_part) = LOWER(CAST(:bodyPart AS TEXT)))
////        AND (:status IS NULL OR h.status = CAST(:status AS TEXT))
////        AND (:pincode IS NULL OR h.pincode = CAST(:pincode AS TEXT))
////
////        AND (:hospitalName IS NULL
////            OR LOWER(h.name) LIKE CONCAT('%', LOWER(CAST(:hospitalName AS TEXT)), '%'))
////
////        AND (:area IS NULL
////            OR LOWER(h.area) LIKE CONCAT('%', LOWER(CAST(:area AS TEXT)), '%'))
////
////        AND (
////            :search IS NULL
////            OR LOWER(h.name) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////            OR LOWER(h.area) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////            OR LOWER(h.city) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////            OR LOWER(h.specialization) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////            OR LOWER(h.contact_name) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////            OR LOWER(h.pincode) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////        )
////        """, nativeQuery = true)
////    List<Hospital> search(
////            @Param("bodyPart") String bodyPart,
////            @Param("status") String status,
////            @Param("pincode") String pincode,
////            @Param("search") String search,
////            @Param("hospitalName") String hospitalName,
////            @Param("area") String area
////    );
////
////    @Query(value = """
////        SELECT * FROM hospitals h
////        WHERE
////        (:status IS NULL OR h.status = CAST(:status AS TEXT))
////        AND (:pincode IS NULL OR h.pincode = CAST(:pincode AS TEXT))
////
////        AND (:hospitalName IS NULL
////            OR LOWER(h.name) LIKE CONCAT('%', LOWER(CAST(:hospitalName AS TEXT)), '%'))
////
////        AND (:area IS NULL
////            OR LOWER(h.area) LIKE CONCAT('%', LOWER(CAST(:area AS TEXT)), '%'))
////
////        AND (
////            :search IS NULL
////            OR LOWER(h.name) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////            OR LOWER(h.area) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////            OR LOWER(h.city) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////            OR LOWER(h.specialization) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////            OR LOWER(h.contact_name) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////            OR LOWER(h.pincode) LIKE CONCAT('%', LOWER(CAST(:search AS TEXT)), '%')
////        )
////        """, nativeQuery = true)
////    List<Hospital> searchAll(
////            @Param("status") String status,
////            @Param("pincode") String pincode,
////            @Param("search") String search,
////            @Param("hospitalName") String hospitalName,
////            @Param("area") String area
////    );
////
////    List<Hospital> findAllByOrderByNameAsc();
////}
//
//
//package com.medicare.repository;
//
//import com.medicare.entity.Hospital;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//import java.util.List;
//
//public interface HospitalRepository extends JpaRepository<Hospital, Long> {
//
//    List<Hospital> findByBodyPartIgnoreCase(String bodyPart);
//
//    // Used when a body part is selected
//    @Query("SELECT h FROM Hospital h WHERE " +
//            "LOWER(h.bodyPart) = LOWER(:bodyPart) AND " +
//            "(:status IS NULL OR h.status = :status) AND " +
//            "(:pincode IS NULL OR h.pincode = :pincode) AND " +
//            "(:search IS NULL OR " +
//            "  LOWER(h.name) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//            "  LOWER(h.area) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//            "  LOWER(h.city) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//            "  LOWER(h.specialization) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//            "  LOWER(h.contactName) LIKE LOWER(CONCAT('%',:search,'%')))")
//    List<Hospital> search(@Param("bodyPart") String bodyPart,
//                          @Param("status") Hospital.HospitalStatus status,
//                          @Param("pincode") String pincode,
//                          @Param("search") String search);
//
//    // Used for Hospitals Directory (no body part filter)
//    @Query("SELECT h FROM Hospital h WHERE " +
//            "(:status IS NULL OR h.status = :status) AND " +
//            "(:pincode IS NULL OR h.pincode = :pincode) AND " +
//            "(:search IS NULL OR " +
//            "  LOWER(h.name) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//            "  LOWER(h.area) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//            "  LOWER(h.city) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//            "  LOWER(h.specialization) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
//            "  LOWER(h.contactName) LIKE LOWER(CONCAT('%',:search,'%')))")
//    List<Hospital> searchAll(@Param("status") Hospital.HospitalStatus status,
//                             @Param("pincode") String pincode,
//                             @Param("search") String search);
//
//    List<Hospital> findAllByOrderByNameAsc();
//}


//package com.medicare.repository;
//
//import com.medicare.entity.Hospital;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//
//import java.util.List;
//
//public interface HospitalRepository extends JpaRepository<Hospital, Long> {
//
//    List<Hospital> findByBodyPartIgnoreCase(String bodyPart);
//
//    // BODY PART SEARCH
//    @Query(value = """
//        SELECT * FROM hospitals h
//        WHERE
//        (:bodyPart IS NULL OR LOWER(CAST(h.body_part AS TEXT)) = LOWER(CAST(:bodyPart AS TEXT)))
//
//        AND (:status IS NULL OR CAST(h.status AS TEXT) = CAST(:status AS TEXT))
//
//        AND (:pincode IS NULL OR CAST(h.pincode AS TEXT) = CAST(:pincode AS TEXT))
//
//        AND (
//            :hospitalName IS NULL
//            OR LOWER(CAST(h.name AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:hospitalName AS TEXT), '%'))
//        )
//
//        AND (
//            :area IS NULL
//            OR LOWER(CAST(h.area AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:area AS TEXT), '%'))
//        )
//
//        AND (
//            :search IS NULL
//
//            OR LOWER(CAST(h.name AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//
//            OR LOWER(CAST(h.area AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//
//            OR LOWER(CAST(h.city AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//
//            OR LOWER(CAST(h.specialization AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//
//            OR LOWER(CAST(h.contact_name AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//
//            OR LOWER(CAST(h.pincode AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//        )
//        """, nativeQuery = true)
//
//    List<Hospital> search(
//            @Param("bodyPart") String bodyPart,
//            @Param("status") String status,
//            @Param("pincode") String pincode,
//            @Param("search") String search,
//            @Param("hospitalName") String hospitalName,
//            @Param("area") String area
//    );
//
//
//    // HOSPITAL DIRECTORY SEARCH
//    @Query(value = """
//        SELECT * FROM hospitals h
//        WHERE
//
//        (:status IS NULL OR CAST(h.status AS TEXT) = CAST(:status AS TEXT))
//
//        AND (:pincode IS NULL OR CAST(h.pincode AS TEXT) = CAST(:pincode AS TEXT))
//
//        AND (
//            :hospitalName IS NULL
//            OR LOWER(CAST(h.name AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:hospitalName AS TEXT), '%'))
//        )
//
//        AND (
//            :area IS NULL
//            OR LOWER(CAST(h.area AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:area AS TEXT), '%'))
//        )
//
//        AND (
//            :search IS NULL
//
//            OR LOWER(CAST(h.name AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//
//            OR LOWER(CAST(h.area AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//
//            OR LOWER(CAST(h.city AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//
//            OR LOWER(CAST(h.specialization AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//
//            OR LOWER(CAST(h.contact_name AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//
//            OR LOWER(CAST(h.pincode AS TEXT))
//               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
//        )
//        """, nativeQuery = true)
//
//    List<Hospital> searchAll(
//            @Param("status") String status,
//            @Param("pincode") String pincode,
//            @Param("search") String search,
//            @Param("hospitalName") String hospitalName,
//            @Param("area") String area
//    );
//
//    List<Hospital> findAllByOrderByNameAsc();
//}



package com.medicare.repository;

import com.medicare.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    List<Hospital> findByBodyPartIgnoreCase(String bodyPart);

    // BODY PART SEARCH
    @Query(value = """
        SELECT * FROM hospitals h
        WHERE
        (:bodyPart IS NULL OR LOWER(CAST(h.body_part AS TEXT)) = LOWER(CAST(:bodyPart AS TEXT)))
 
        AND (:status IS NULL OR CAST(h.status AS TEXT) = CAST(:status AS TEXT))
 
        AND (:pincode IS NULL OR CAST(h.pincode AS TEXT) LIKE CONCAT(CAST(:pincode AS TEXT), '%'))
 
        AND (
            :hospitalName IS NULL
            OR LOWER(CAST(h.name AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:hospitalName AS TEXT), '%'))
        )
 
        AND (
            :area IS NULL
            OR LOWER(CAST(h.area AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:area AS TEXT), '%'))
        )
 
        AND (
            :search IS NULL
 
            OR LOWER(CAST(h.name AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
 
            OR LOWER(CAST(h.area AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
 
            OR LOWER(CAST(h.city AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
 
            OR LOWER(CAST(h.specialization AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
 
            OR LOWER(CAST(h.contact_name AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
 
            OR LOWER(CAST(h.pincode AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        )
        """, nativeQuery = true)

    List<Hospital> search(
            @Param("bodyPart") String bodyPart,
            @Param("status") String status,
            @Param("pincode") String pincode,
            @Param("search") String search,
            @Param("hospitalName") String hospitalName,
            @Param("area") String area
    );


    // HOSPITAL DIRECTORY SEARCH
    @Query(value = """
        SELECT * FROM hospitals h
        WHERE
 
        (:status IS NULL OR CAST(h.status AS TEXT) = CAST(:status AS TEXT))
 
        AND (:pincode IS NULL OR CAST(h.pincode AS TEXT) LIKE CONCAT(CAST(:pincode AS TEXT), '%'))
 
        AND (
            :hospitalName IS NULL
            OR LOWER(CAST(h.name AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:hospitalName AS TEXT), '%'))
        )
 
        AND (
            :area IS NULL
            OR LOWER(CAST(h.area AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:area AS TEXT), '%'))
        )
 
        AND (
            :search IS NULL
 
            OR LOWER(CAST(h.name AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
 
            OR LOWER(CAST(h.area AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
 
            OR LOWER(CAST(h.city AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
 
            OR LOWER(CAST(h.specialization AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
 
            OR LOWER(CAST(h.contact_name AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
 
            OR LOWER(CAST(h.pincode AS TEXT))
               LIKE LOWER(CONCAT('%', CAST(:search AS TEXT), '%'))
        )
        """, nativeQuery = true)

    List<Hospital> searchAll(
            @Param("status") String status,
            @Param("pincode") String pincode,
            @Param("search") String search,
            @Param("hospitalName") String hospitalName,
            @Param("area") String area
    );

    List<Hospital> findAllByOrderByNameAsc();

    /** Returns rows of [bodyPart (String), count (Long)] */
    @Query("SELECT h.bodyPart, COUNT(h) FROM Hospital h GROUP BY h.bodyPart")
    List<Object[]> countHospitalsByBodyPart();
}
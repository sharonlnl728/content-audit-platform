package com.audit.template.repository;

import com.audit.template.entity.GoldenSetSample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoldenSetSampleRepository extends JpaRepository<GoldenSetSample, Long> {
    
    // Find samples by Golden Set ID
    List<GoldenSetSample> findByGoldenSetId(Long goldenSetId);
    
    // Delete all samples by Golden Set ID
    @Modifying
    @Query("DELETE FROM GoldenSetSample gss WHERE gss.goldenSetId = :goldenSetId")
    void deleteByGoldenSetId(@Param("goldenSetId") Long goldenSetId);
}





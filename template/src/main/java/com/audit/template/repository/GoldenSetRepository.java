package com.audit.template.repository;

import com.audit.template.entity.GoldenSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoldenSetRepository extends JpaRepository<GoldenSet, Long> {
    
    // Find Golden Sets by template ID
    List<GoldenSet> findByTemplateId(String templateId);
    
    // Find Golden Set by template ID and default status
    Optional<GoldenSet> findByTemplateIdAndIsDefault(String templateId, Boolean isDefault);
    
    // Optimized query to fetch Golden Sets with Samples in one query
    @Query("SELECT DISTINCT gs FROM GoldenSet gs LEFT JOIN FETCH gs.samples WHERE gs.templateId = :templateId")
    List<GoldenSet> findByTemplateIdWithSamples(@Param("templateId") String templateId);
    
    // Count Golden Sets by template ID
    @Query("SELECT COUNT(gs) FROM GoldenSet gs WHERE gs.templateId = :templateId")
    Long countGoldenSetsByTemplateId(@Param("templateId") String templateId);
    
    // Delete all Golden Sets by template ID
    void deleteByTemplateId(String templateId);
}





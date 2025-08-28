package com.audit.template.repository;

import com.audit.template.entity.AuditTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import java.util.Optional;

@Repository
public interface AuditTemplateRepository extends JpaRepository<AuditTemplate, Long> {
    
    // Find all active templates
    List<AuditTemplate> findByIsActiveTrue();
    
    // Find default template
    Optional<AuditTemplate> findByIsDefaultTrue();
    
    // Find templates by creator
    List<AuditTemplate> findByCreatedBy(Long createdBy);
    
    // Find templates by creator and active status
    List<AuditTemplate> findByCreatedByAndIsActive(Long createdBy, Boolean isActive);
    
    // Find by template ID
    Optional<AuditTemplate> findByTemplateId(String templateId);
    
    // Check if template ID exists
    boolean existsByTemplateId(String templateId);
    
    // Find active templates by content type
    List<AuditTemplate> findByContentTypeAndIsActiveTrue(String contentType);
    
    // Find active templates by name (fuzzy search)
    List<AuditTemplate> findByNameContainingAndIsActiveTrue(String name);
    
    // Count active templates
    @Query("SELECT COUNT(t) FROM AuditTemplate t WHERE t.isActive = true")
    Long countActiveTemplates();
    
    // Count templates by creator
    @Query("SELECT COUNT(t) FROM AuditTemplate t WHERE t.createdBy = ?1")
    Long countByCreatedBy(Long createdBy);



    @Modifying
    @Transactional
    @Query(value = "UPDATE audit_templates SET name=:name, version=:version, description=:description, content_type=:contentType, industry=:industry, rules=CAST(CASE WHEN :rules = '[]' THEN '[]'::jsonb ELSE :rules::jsonb END AS jsonb), decision_logic=CAST(CASE WHEN :decisionLogic = '{}' THEN '{}'::jsonb ELSE :decisionLogic::jsonb END AS jsonb), ai_prompt_template=CAST(CASE WHEN :aiPromptTemplate = '{}' THEN '{}'::jsonb ELSE :aiPromptTemplate::jsonb END AS jsonb), metadata=CAST(CASE WHEN :metadata = '{}' THEN '{}'::jsonb ELSE :metadata::jsonb END AS jsonb), is_active=:isActive, is_default=:isDefault, updated_at=NOW() WHERE id=:id", nativeQuery = true)
    int updateTemplateNative(@Param("id") Long id,
                             @Param("name") String name,
                             @Param("version") String version,
                             @Param("description") String description,
                             @Param("contentType") String contentType,
                             @Param("industry") String industry,
                             @Param("rules") String rules,
                             @Param("decisionLogic") String decisionLogic,
                             @Param("aiPromptTemplate") String aiPromptTemplate,
                             @Param("metadata") String metadata,
                             @Param("isActive") Boolean isActive,
                             @Param("isDefault") Boolean isDefault);

    @Modifying
    @Query(value = "INSERT INTO audit_templates (template_id, name, version, description, content_type, industry, rules, decision_logic, ai_prompt_template, metadata, is_active, is_default, created_by, created_at, updated_at) VALUES (:templateId, :name, :version, :description, :contentType, :industry, CAST(CASE WHEN :rules = '[]' THEN '[]'::jsonb ELSE :rules::jsonb END AS jsonb), CAST(CASE WHEN :decisionLogic = '{}' THEN '{}'::jsonb ELSE :decisionLogic::jsonb END AS jsonb), CAST(CASE WHEN :aiPromptTemplate = '{}' THEN '{}'::jsonb ELSE :aiPromptTemplate::jsonb END AS jsonb), CAST(CASE WHEN :metadata = '{}' THEN '{}'::jsonb ELSE :metadata::jsonb END AS jsonb), TRUE, :isDefault, :createdBy, NOW(), NOW())", nativeQuery = true)
    int insertTemplateNative(@Param("templateId") String templateId,
                             @Param("name") String name,
                             @Param("version") String version,
                             @Param("description") String description,
                             @Param("contentType") String contentType,
                             @Param("industry") String industry,
                             @Param("rules") String rules,
                             @Param("decisionLogic") String decisionLogic,
                             @Param("aiPromptTemplate") String aiPromptTemplate,
                             @Param("metadata") String metadata,
                             @Param("isDefault") Boolean isDefault,
                             @Param("createdBy") Long createdBy);
} 
package com.audit.template.service;

import com.audit.template.entity.GoldenSet;
import com.audit.template.entity.GoldenSetSample;
import com.audit.template.repository.GoldenSetRepository;
import com.audit.template.repository.GoldenSetSampleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

@Service
public class GoldenSetService {
    
    @Autowired
    private GoldenSetRepository goldenSetRepository;
    
    @Autowired
    private GoldenSetSampleRepository goldenSetSampleRepository;
    
    // Get all Golden Sets for a template with optimized query
    public List<GoldenSet> getGoldenSetsByTemplateId(String templateId) {
        // Use optimized query to avoid N+1 problem
        List<GoldenSet> goldenSets = goldenSetRepository.findByTemplateIdWithSamples(templateId);
        
        // Ensure samples are properly initialized (should not be null with JOIN FETCH)
        for (GoldenSet goldenSet : goldenSets) {
            if (goldenSet.getSamples() == null) {
                goldenSet.setSamples(new ArrayList<>());
            }
        }
        
        return goldenSets;
    }
    
    // Get Golden Set by ID with samples
    public Optional<GoldenSet> getGoldenSetById(Long id) {
        Optional<GoldenSet> goldenSetOpt = goldenSetRepository.findById(id);
        if (goldenSetOpt.isPresent()) {
            GoldenSet goldenSet = goldenSetOpt.get();
            // Ensure samples are loaded
            if (goldenSet.getSamples() == null) {
                List<GoldenSetSample> samples = goldenSetSampleRepository.findByGoldenSetId(goldenSet.getId());
                goldenSet.setSamples(samples);
            }
        }
        return goldenSetOpt;
    }
    
    // Create new Golden Set
    @Transactional
    public GoldenSet createGoldenSet(GoldenSet goldenSet, Long userId) {
        // Set creation metadata
        goldenSet.setCreatedBy(userId);
        goldenSet.setCreatedAt(LocalDateTime.now());
        goldenSet.setUpdatedAt(LocalDateTime.now());
        goldenSet.setIsDefault(false);  // 新创建的Golden Set默认不是默认状态
        
        // Save Golden Set
        GoldenSet savedGoldenSet = goldenSetRepository.save(goldenSet);
        
        // Save samples if provided
        if (goldenSet.getSamples() != null && !goldenSet.getSamples().isEmpty()) {
            for (GoldenSetSample sample : goldenSet.getSamples()) {
                sample.setGoldenSet(savedGoldenSet);
                goldenSetSampleRepository.save(sample);
            }
        }
        
        return savedGoldenSet;
    }
    
    // Update Golden Set
    @Transactional
    public GoldenSet updateGoldenSet(Long id, GoldenSet goldenSet, Long userId) {
        Optional<GoldenSet> existingOpt = goldenSetRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Golden Set not found");
        }
        
        GoldenSet existing = existingOpt.get();
        
        // Check permissions
        if (!existing.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Update fields
        existing.setName(goldenSet.getName());
        existing.setDescription(goldenSet.getDescription());
        existing.setCategory(goldenSet.getCategory());
        existing.setVersion(goldenSet.getVersion());
        existing.setUpdatedAt(LocalDateTime.now());
        
        return goldenSetRepository.save(existing);
    }
    
    // Delete Golden Set
    @Transactional
    public void deleteGoldenSet(Long id, Long userId) {
        Optional<GoldenSet> existingOpt = goldenSetRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Golden Set not found");
        }
        
        GoldenSet existing = existingOpt.get();
        
        // Check permissions
        if (!existing.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Allow deleting any Golden Set, including default ones
        // Log if deleting default Golden Set for audit purposes
        if (Boolean.TRUE.equals(existing.getIsDefault())) {
            System.out.println("User " + userId + " is deleting default Golden Set " + id + " - " + existing.getName());
        }
        
        // Delete related samples first
        if (existing.getSamples() != null && !existing.getSamples().isEmpty()) {
            goldenSetSampleRepository.deleteByGoldenSetId(id);
        }
        
        // Hard delete - completely remove from database
        goldenSetRepository.deleteById(id);
    }
    
    // Set Golden Set as default
    @Transactional
    public GoldenSet setDefaultGoldenSet(Long id, Long userId) {
        Optional<GoldenSet> existingOpt = goldenSetRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Golden Set not found");
        }
        
        GoldenSet existing = existingOpt.get();
        
        // Check permissions
        if (!existing.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Remove default status from other Golden Sets in the same template
        List<GoldenSet> otherSets = goldenSetRepository.findByTemplateId(existing.getTemplateId());
        for (GoldenSet otherSet : otherSets) {
            if (!otherSet.getId().equals(id)) {
                otherSet.setIsDefault(false);
                otherSet.setUpdatedAt(LocalDateTime.now());
                goldenSetRepository.save(otherSet);
            }
        }
        
        // Set this Golden Set as default
        existing.setIsDefault(true);
        existing.setUpdatedAt(LocalDateTime.now());
        return goldenSetRepository.save(existing);
    }
    
    // Remove default status from Golden Set
    @Transactional
    public GoldenSet removeDefaultGoldenSet(Long id, Long userId) {
        Optional<GoldenSet> existingOpt = goldenSetRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Golden Set not found");
        }
        
        GoldenSet existing = existingOpt.get();
        
        // Check permissions
        if (!existing.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Check if this Golden Set is actually default
        if (!Boolean.TRUE.equals(existing.getIsDefault())) {
            throw new RuntimeException("Golden Set is not default");
        }
        
        // Remove default status
        existing.setIsDefault(false);
        existing.setUpdatedAt(LocalDateTime.now());
        return goldenSetRepository.save(existing);
    }
}






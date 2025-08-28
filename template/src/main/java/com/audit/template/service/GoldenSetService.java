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
import java.util.Map;
import java.util.stream.Collectors;

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
        goldenSet.setIsDefault(false);  // Newly created Golden Set is not default by default
        
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
        // Check if user has permission to update this golden set
        GoldenSet existing = goldenSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Golden Set not found"));
        
        // Update basic fields
        existing.setName(goldenSet.getName());
        existing.setDescription(goldenSet.getDescription());
        existing.setCategory(goldenSet.getCategory());
        existing.setVersion(goldenSet.getVersion());
        existing.setUpdatedAt(LocalDateTime.now());
        // existing.setUpdatedBy(userId); // GoldenSet entity doesn't have updatedBy field
        
        // Handle samples updates
        if (goldenSet.getSamples() != null) {
            updateGoldenSetSamples(existing, goldenSet.getSamples());
        }
        
        return goldenSetRepository.save(existing);
    }
    
    /**
     * Update Golden Set samples (add, update, delete)
     * With orphanRemoval = true, JPA automatically handles deletion of removed samples
     */
    @Transactional
    private void updateGoldenSetSamples(GoldenSet existingGoldenSet, List<GoldenSetSample> newSamples) {
        List<GoldenSetSample> existingSamples = existingGoldenSet.getSamples();
        
        // Log initial state
        System.out.println("=== Update Golden Set Samples ===");
        System.out.println("Existing samples count: " + existingSamples.size());
        System.out.println("New samples count: " + newSamples.size());
        
        // Create maps for efficient lookup
        Map<String, GoldenSetSample> existingSamplesMap = existingSamples.stream()
                .collect(Collectors.toMap(GoldenSetSample::getSampleId, sample -> sample));
        
        Map<String, GoldenSetSample> newSamplesMap = newSamples.stream()
                .collect(Collectors.toMap(GoldenSetSample::getSampleId, sample -> sample));
        
        // Log sample IDs for debugging
        System.out.println("Existing sample IDs: " + existingSamples.stream().map(GoldenSetSample::getSampleId).collect(Collectors.toList()));
        System.out.println("New sample IDs: " + newSamples.stream().map(GoldenSetSample::getSampleId).collect(Collectors.toList()));
        
        // Remove samples that are no longer in the new list
        int beforeDeleteCount = existingSamples.size();
        existingSamples.removeIf(existingSample -> 
            !newSamplesMap.containsKey(existingSample.getSampleId()));
        int afterDeleteCount = existingSamples.size();
        
        System.out.println("Samples deleted: " + (beforeDeleteCount - afterDeleteCount));
        
        // Update existing samples and add new ones
        for (GoldenSetSample newSample : newSamples) {
            GoldenSetSample existingSample = existingSamples.stream()
                    .filter(sample -> sample.getSampleId().equals(newSample.getSampleId()))
                    .findFirst()
                    .orElse(null);
            
            if (existingSample != null) {
                // Update existing sample
                existingSample.setContent(newSample.getContent());
                existingSample.setExpectedResult(newSample.getExpectedResult());
                existingSample.setCategory(newSample.getCategory());
                existingSample.setSeverity(newSample.getSeverity());
                existingSample.setAiStatus(newSample.getAiStatus());
                existingSample.setNotes(newSample.getNotes());
                existingSample.setUpdatedAt(LocalDateTime.now());
                System.out.println("Updated sample: " + existingSample.getSampleId());
            } else {
                // Add new sample
                newSample.setGoldenSet(existingGoldenSet);
                if (newSample.getCreatedAt() == null) {
                    newSample.setCreatedAt(LocalDateTime.now());
                }
                newSample.setUpdatedAt(LocalDateTime.now());
                existingSamples.add(newSample);
                System.out.println("Added new sample: " + newSample.getSampleId());
            }
        }
        
        System.out.println("Final samples count: " + existingSamples.size());
        System.out.println("=== End Update ===");
    }
    
    // Sample CRUD Operations
    
    // Create sample
    @Transactional
    public GoldenSetSample createSample(Long goldenSetId, GoldenSetSample sample, Long userId) {
        // Check if Golden Set exists
        Optional<GoldenSet> goldenSetOpt = goldenSetRepository.findById(goldenSetId);
        if (goldenSetOpt.isEmpty()) {
            throw new RuntimeException("Golden Set not found");
        }
        
        GoldenSet goldenSet = goldenSetOpt.get();
        
        // Check permissions
        if (!goldenSet.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Set sample properties
        sample.setId(null); // Let JPA generate ID
        sample.setGoldenSetId(goldenSetId);
        sample.setGoldenSet(goldenSet);
        sample.setCreatedAt(LocalDateTime.now());
        sample.setUpdatedAt(LocalDateTime.now());
        
        // Save sample
        GoldenSetSample savedSample = goldenSetSampleRepository.save(sample);
        
        // Add to Golden Set's samples list
        goldenSet.getSamples().add(savedSample);
        goldenSetRepository.save(goldenSet);
        
        return savedSample;
    }
    
    // Read samples
    public List<GoldenSetSample> getSamplesByGoldenSetId(Long goldenSetId) {
        return goldenSetSampleRepository.findByGoldenSetId(goldenSetId);
    }
    
    // Update sample
    @Transactional
    public GoldenSetSample updateSample(Long sampleId, GoldenSetSample sampleDto, Long userId) {
        // Check if sample exists
        Optional<GoldenSetSample> existingOpt = goldenSetSampleRepository.findById(sampleId);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Sample not found");
        }
        
        GoldenSetSample existing = existingOpt.get();
        
        // Check permissions through Golden Set
        Optional<GoldenSet> goldenSetOpt = goldenSetRepository.findById(existing.getGoldenSetId());
        if (goldenSetOpt.isEmpty()) {
            throw new RuntimeException("Golden Set not found");
        }
        
        GoldenSet goldenSet = goldenSetOpt.get();
        if (!goldenSet.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Update sample fields
        existing.setContent(sampleDto.getContent());
        existing.setExpectedResult(sampleDto.getExpectedResult());
        existing.setCategory(sampleDto.getCategory());
        existing.setSeverity(sampleDto.getSeverity());
        existing.setNotes(sampleDto.getNotes());
        existing.setUpdatedAt(LocalDateTime.now());
        
        // Save and return
        return goldenSetSampleRepository.save(existing);
    }
    
    // Delete sample
    @Transactional
    public void deleteSample(Long sampleId, Long userId) {
        // Check if sample exists
        Optional<GoldenSetSample> existingOpt = goldenSetSampleRepository.findById(sampleId);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Sample not found");
        }
        
        GoldenSetSample existing = existingOpt.get();
        
        // Check permissions through Golden Set
        Optional<GoldenSet> goldenSetOpt = goldenSetRepository.findById(existing.getGoldenSetId());
        if (goldenSetOpt.isEmpty()) {
            throw new RuntimeException("Golden Set not found");
        }
        
        GoldenSet goldenSet = goldenSetOpt.get();
        if (!goldenSet.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Remove from Golden Set's samples list
        goldenSet.getSamples().removeIf(s -> s.getId().equals(sampleId));
        goldenSetRepository.save(goldenSet);
        
        // Delete sample
        goldenSetSampleRepository.deleteById(sampleId);
    }
    
    // Import samples (append mode)
    @Transactional
    public GoldenSet importSamples(Long goldenSetId, List<GoldenSetSample> newSamples, Long userId) {
        // Check if Golden Set exists
        Optional<GoldenSet> goldenSetOpt = goldenSetRepository.findById(goldenSetId);
        if (goldenSetOpt.isEmpty()) {
            throw new RuntimeException("Golden Set not found");
        }
        
        GoldenSet goldenSet = goldenSetOpt.get();
        
        // Check permissions
        if (!goldenSet.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Get existing samples
        List<GoldenSetSample> existingSamples = goldenSet.getSamples();
        
        // Process new samples
        for (GoldenSetSample newSample : newSamples) {
            // Set sample properties
            newSample.setId(null); // Let JPA generate ID
            newSample.setGoldenSetId(goldenSetId);
            newSample.setGoldenSet(goldenSet);
            newSample.setCreatedAt(LocalDateTime.now());
            newSample.setUpdatedAt(LocalDateTime.now());
            
            // Save sample
            GoldenSetSample savedSample = goldenSetSampleRepository.save(newSample);
            
            // Add to existing samples list
            existingSamples.add(savedSample);
        }
        
        // Update Golden Set's samples list
        goldenSet.setSamples(existingSamples);
        goldenSet.setUpdatedAt(LocalDateTime.now());
        
        // Save and return
        return goldenSetRepository.save(goldenSet);
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
        
        // Remove manual deletion logic for samples, let JPA cascade deletion handle it automatically
        // Because updateGoldenSet has already synchronized the state with merge, JPA knows the real state of samples
        
        // Hard delete - completely remove from database
        // JPA will automatically delete related samples due to CascadeType.ALL
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






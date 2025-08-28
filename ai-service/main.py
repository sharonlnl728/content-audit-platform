from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import torch
import numpy as np
from PIL import Image
import io
import base64
import cv2
import logging
import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import re
import openai
import openai
from config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler"""
    # Startup
    load_models()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="AI Content Audit Service", 
    description="AI-powered content moderation service with template configuration support",
    version="1.0.0",
    lifespan=lifespan
)

# CORS is handled by the gateway, no need to configure here

# Initialize OpenAI client if API key is provided
openai_client = None
if config.is_openai_available():
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=config.get_openai_api_key())
        logger.info(f"OpenAI client initialized successfully with model: {config.get_openai_model()}")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {e}")
        openai_client = None
else:
    logger.warning("OpenAI not available. Please set OPENAI_API_KEY environment variable.")

# Data models
class TextAuditRequest(BaseModel):
    content: str
    template_config: Optional[dict] = None  # Add template configuration support

class ImageAuditRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    template_config: Optional[dict] = None  # Add template configuration support

class AuditResponse(BaseModel):
    is_violation: bool
    confidence: float
    reason: str
    categories: List[str]
    status: str  # Add status field for frontend compatibility

# Global variables to store models
text_model = None
text_tokenizer = None

# Sensitive word database
SENSITIVE_WORDS = {
    'politics': ['political_sensitive_word1', 'political_sensitive_word2'],
    'porn': ['pornography', 'sexual', 'nudity'],
    'violence': ['violence', 'kill', 'death'],
    'spam': ['advertisement', 'promotion', 'make_money']
}

def load_models():
    """Load AI models"""
    global text_model, text_tokenizer
    
    try:
        # Use pre-trained Chinese model
        model_name = "hfl/chinese-roberta-wwm-ext"
        text_tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Use base model here, in actual projects should use fine-tuned model
        text_model = AutoModelForSequenceClassification.from_pretrained(
            model_name, 
            num_labels=2  # Binary classification: normal/violation
        )
        
        text_model.eval()
        logger.info("Text models loaded successfully")
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        # If model loading fails, use rule engine
        logger.info("Using rule-based engine as fallback")

def preprocess_image(image_bytes):
    """Image preprocessing"""
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Resize image
        image = cv2.resize(image, (224, 224))
        
        # Normalize
        image = image.astype(np.float32) / 255.0
        
        return image
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        raise HTTPException(status_code=400, detail="Invalid image data")

def openai_text_audit(content: str, template_config: Optional[dict] = None) -> AuditResponse:
    """OpenAI-based text audit with template configuration support"""
    try:
        if not openai_client:
            raise Exception("OpenAI client not available")
        
        # Build dynamic prompt based on template configuration
        prompt = build_template_aware_prompt(content, template_config)
        
        # Use template-specific system prompt if available, otherwise fallback to default
        system_prompt = """You are a content moderation expert specializing in ad content review. Your task is to analyze content for violations and respond ONLY with valid JSON in this exact format: {"status": "BLOCK/PASS/REVIEW", "is_violation": true/false, "confidence": 0.0-1.0, "reason": "explanation", "categories": ["category1", "category2"]}.

IMPORTANT CLASSIFICATION GUIDELINES:
- BLOCK: Clear violations like explicit scams, adult content, illegal activities, or obvious fraud
- PASS: Clearly legitimate business content, normal promotions, or safe advertisements
- REVIEW: Ambiguous content that needs human judgment, including:
  * Content with "wealth opportunities", "hidden knowledge", or "exclusive access" language
  * Claims about "what banks don't want you to know" or similar conspiracy-like language
  * Content promising results without clear business model
  * Borderline promotional content with suspicious elements
  * Content that could be legitimate but uses questionable marketing language

For categories: Use 'advertising' for legitimate business promotions, 'legitimate_business' for normal commercial content, 'edge_case' for ambiguous content needing review, 'scam' only for clear fraudulent content, 'spam' only for unsolicited mass messages.

When in doubt about whether content is clearly violating or clearly safe, classify as REVIEW."""
        
        # Override with template-specific prompt if available
        if template_config and 'ai_prompt_template' in template_config:
            ai_prompt_template = template_config['ai_prompt_template']
            
            # Handle both dict and list formats
            if isinstance(ai_prompt_template, dict):
                template_system_prompt = ai_prompt_template.get('system_prompt', '')
            elif isinstance(ai_prompt_template, list) and len(ai_prompt_template) > 0:
                # If it's a list, try to get the first item
                first_item = ai_prompt_template[0]
                if isinstance(first_item, dict):
                    template_system_prompt = first_item.get('system_prompt', '')
                else:
                    template_system_prompt = str(first_item)
            else:
                template_system_prompt = str(ai_prompt_template)
                
            if template_system_prompt:
                system_prompt = template_system_prompt
        else:
            pass
        
        response = openai_client.chat.completions.create(
            model=config.get_openai_model(),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=300
        )
        
        # Parse response
        result_text = response.choices[0].message.content.strip()
        
        # Extract JSON from response
        import json
        try:
            # Try to find JSON in the response
            start_idx = result_text.find('{')
            end_idx = result_text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = result_text[start_idx:end_idx]
                result = json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
                
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse OpenAI response: {e}")
            logger.error(f"Response: {result_text}")
            # Fallback to rule-based audit
            return rule_based_text_audit(content)
        
        # Map OpenAI response to our format
        status = result.get("status", "REVIEW")
        is_violation = result.get("is_violation", False)
        
        # If status is provided, use it to determine violation
        if status == "BLOCK":
            is_violation = True
        elif status == "PASS":
            is_violation = False
        # For REVIEW, use the provided is_violation value
        
        # Map OpenAI response to standard format with better logic
        if status == "BLOCK":
            final_status = "BLOCK"
        elif status == "PASS":
            final_status = "PASS"
        elif status == "REVIEW":
            final_status = "REVIEW"
        else:
            # If no clear status, determine based on content analysis
            if "misleading" in result_text.lower() or "high-risk" in result_text.lower() or "borderline" in result_text.lower():
                final_status = "REVIEW"  # Borderline cases should be reviewed
            elif is_violation:
                final_status = "BLOCK"   # Clear violations
            else:
                final_status = "PASS"    # Safe content
        
        # Clean up categories to be more accurate
        categories = result.get("categories", [])
        if not is_violation and categories:
            # For non-violating content, ensure categories are appropriate
            cleaned_categories = []
            for cat in categories:
                cat_lower = cat.lower()
                if any(spam_word in cat_lower for spam_word in ['spam', 'scam', 'fraud']):
                    # Replace spam-related categories with appropriate ones for legitimate content
                    if 'advertising' in cat_lower or 'promotion' in cat_lower:
                        cleaned_categories.append('advertising')
                    elif 'business' in cat_lower or 'service' in cat_lower:
                        cleaned_categories.append('legitimate_business')
                    else:
                        cleaned_categories.append('advertising')  # Default for legitimate content
                else:
                    cleaned_categories.append(cat)
            categories = cleaned_categories if cleaned_categories else ['advertising']
        
        return AuditResponse(
            is_violation=is_violation,
            confidence=result.get("confidence", 0.5),
            reason=result.get("reason", f"Content analyzed by OpenAI: {status}"),
            categories=categories,
            status=final_status  # Restore status field
        )
        
    except Exception as e:
        logger.error(f"OpenAI audit error: {e}")
        # Fallback to rule-based audit
        return rule_based_text_audit(content)

def rule_based_text_audit(content: str) -> AuditResponse:
    """Rule-based text audit (fallback solution)"""
    is_violation = False
    confidence = 0.0
    reason = "Content normal"
    categories = []
    
    content_lower = content.lower()
    
    # Check sensitive words
    for category, words in SENSITIVE_WORDS.items():
        for word in words:
            if word in content_lower:
                is_violation = True
                confidence = max(confidence, 0.8)
                reason = f"Detected {category} related content"
                categories.append(category)
    
    # Check content length and features
    if len(content) > 1000:
        confidence = max(confidence, 0.3)
    
    if not is_violation:
        confidence = 0.95
        reason = "Content normal"
    
    # Determine status based on violation
    if is_violation:
        status = "BLOCK"
    else:
        status = "PASS"
    
    return AuditResponse(
        is_violation=is_violation,
        confidence=confidence,
        reason=reason,
        categories=categories,
        status=status
    )

def model_based_text_audit(content: str) -> AuditResponse:
    """Model-based text audit"""
    try:
        # Text preprocessing
        inputs = text_tokenizer(
            content, 
            return_tensors="pt", 
            max_length=512, 
            truncation=True,
            padding=True
        )
        
        # Model inference
        with torch.no_grad():
            outputs = text_model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            confidence = torch.max(predictions).item()
            predicted_class = torch.argmax(predictions).item()
        
        # Parse results
        is_violation = predicted_class == 1  # 1 means violation
        
        # Get specific violation reason
        reason = get_violation_reason(content) if is_violation else "Content normal"
        categories = get_violation_categories(content) if is_violation else []
        
        return AuditResponse(
            is_violation=is_violation,
            confidence=confidence,
            reason=reason,
            categories=categories,
            status="BLOCK" if is_violation else "PASS"  # Add status field
        )
        
    except Exception as e:
        logger.error(f"Model inference error: {e}")
        # Fallback to rule engine
        return rule_based_text_audit(content)

def get_violation_reason(content: str) -> str:
    """Get violation reason"""
    content_lower = content.lower()
    
    for category, words in SENSITIVE_WORDS.items():
        for word in words:
            if word in content_lower:
                return f"Contains {category} related sensitive content"
    
    return "Suspected violation content"

def get_violation_categories(content: str) -> List[str]:
    """Get violation categories"""
    categories = []
    content_lower = content.lower()
    
    for category, words in SENSITIVE_WORDS.items():
        for word in words:
            if word in content_lower and category not in categories:
                categories.append(category)
    
    return categories

def rule_based_image_audit(image_data) -> AuditResponse:
    """Rule-based image audit"""
    try:
        # Simple image feature detection
        image = preprocess_image(image_data)
        
        # Calculate basic image features
        mean_intensity = np.mean(image)
        std_intensity = np.std(image)
        
        # Judge based on simple rules
        is_violation = False
        confidence = 0.7
        reason = "Image normal"
        categories = []
        
        # Example rule: too dark or too bright images may have issues
        if mean_intensity < 0.1 or mean_intensity > 0.9:
            is_violation = True
            confidence = 0.6
            reason = "Image abnormal"
            categories = ["suspicious"]
        
        return AuditResponse(
            is_violation=is_violation,
            confidence=confidence,
            reason=reason,
            categories=categories,
            status="BLOCK" if is_violation else "PASS"  # Add status field
        )
        
    except Exception as e:
        logger.error(f"Image audit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def build_template_aware_prompt(content: str, template_config: Optional[dict] = None) -> str:
    """Build AI prompt based on template configuration"""
    
    # Base prompt structure
    base_prompt = f"""
You are an expert content moderator. Analyze the following content and determine if it should be PASSED, BLOCKED, or sent for REVIEW.

Content: "{content}"
"""
    
    # If no template config, use default prompt
    if not template_config:
        return base_prompt + """
Consider these factors:
1. **Violence & Hate Speech**: Physical threats, incitement to violence, hate speech
2. **Sexual Content**: Explicit sexual content, pornography, inappropriate sexual references
3. **Spam & Scams**: Misleading advertisements, phishing attempts, excessive promotional content
4. **Political Extremism**: Extremist political views, incitement to violence
5. **Privacy & Security**: Personal information exposure, security threats
6. **Content Quality**: Low-quality, nonsensical, or inappropriate content

Classification Rules:
- **PASS**: Content is appropriate, safe, and follows community guidelines
- **BLOCK**: Content violates community guidelines and should be removed
- **REVIEW**: Content is borderline or unclear, needs human review
"""
    
    # Build template-specific prompt
    prompt_parts = [base_prompt]
    
    # Add industry context
    if template_config.get('industry'):
        prompt_parts.append(f"**Industry Context**: {template_config['industry']}")
    
    # Add rules configuration
    if template_config.get('rules'):
        rules = template_config['rules']
        
        # Handle both array and dictionary formats for backward compatibility
        if isinstance(rules, list):
            # New format: rules is an array of rule names
            prompt_parts.append("\n**Specific Rules to Check**:")
            for rule_name in rules:
                prompt_parts.append(f"- {rule_name}")
        elif isinstance(rules, dict) and rules.get('text_rules'):
            # Old format: rules is a dictionary with text_rules
            prompt_parts.append("\n**Specific Rules to Check**:")
            for rule in rules['text_rules']:
                rule_name = rule.get('name', 'Unknown Rule')
                rule_type = rule.get('type', 'Unknown Type')
                categories = ', '.join(rule.get('categories', []))
                severity = rule.get('severity', 'MEDIUM')
                action = rule.get('action', 'REVIEW')
                
                prompt_parts.append(f"- {rule_name} ({rule_type}): Focus on {categories}, Severity: {severity}, Action: {action}")
    
    # Add decision logic
    if template_config.get('decision_logic'):
        decision_logic = template_config['decision_logic']
        prompt_parts.append("\n**Decision Logic**:")
        
        if decision_logic.get('auto_reject'):
            conditions = decision_logic['auto_reject'].get('conditions', [])
            prompt_parts.append("- **Auto Reject** when: " + "; ".join(conditions))
        
        if decision_logic.get('auto_approve'):
            conditions = decision_logic['auto_approve'].get('conditions', [])
            prompt_parts.append("- **Auto Approve** when: " + "; ".join(conditions))
        
        if decision_logic.get('need_review'):
            conditions = decision_logic['need_review'].get('conditions', [])
            prompt_parts.append("- **Need Review** when: " + "; ".join(conditions))
    
    # Add AI prompt template if available
    if template_config.get('ai_prompt_template'):
        ai_template = template_config['ai_prompt_template']
        if ai_template.get('system_prompt'):
            prompt_parts.append(f"\n**System Instructions**: {ai_template['system_prompt']}")
        
        if ai_template.get('focus_areas'):
            prompt_parts.append(f"\n**Focus Areas**: {ai_template['focus_areas']}")
    
    # Add metadata context
    if template_config.get('metadata'):
        metadata = template_config['metadata']
        if metadata.get('applicable_regions'):
            regions = ', '.join(metadata['applicable_regions'])
            prompt_parts.append(f"\n**Applicable Regions**: {regions}")
        
        if metadata.get('supported_content_types'):
            content_types = ', '.join(metadata['supported_content_types'])
            prompt_parts.append(f"\n**Content Types**: {content_types}")
    
    # Add response format
    prompt_parts.append("""
Please respond in this exact JSON format:
{
    "status": "PASS|BLOCK|REVIEW",
    "confidence": 0.0-1.0,
    "reason": "Clear explanation of your decision based on the template rules",
    "categories": ["category1", "category2"],
    "is_violation": true/false,
    "rule_matched": "specific rule name if applicable"
}

Note: 
- Use "PASS" for normal, appropriate content
- Use "BLOCK" for clearly inappropriate content  
- Use "REVIEW" for borderline cases
- Set is_violation=true for BLOCK, false for PASS, and based on your assessment for REVIEW
- Provide specific reasons for your classification based on the template rules
- Reference specific rules that were triggered

Only respond with valid JSON, no additional text.
""")
    
    return '\n'.join(prompt_parts)



@app.get("/")
async def root():
    return {"message": "AI Content Audit Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-audit-service"}

@app.post("/ai/text/audit", response_model=AuditResponse)
async def audit_text(request: TextAuditRequest):
    """Text content audit"""
    try:
        if request.template_config:
            if 'ai_prompt_template' in request.template_config:
                pass
        
        if not request.content or not request.content.strip():
            raise HTTPException(status_code=400, detail="Content cannot be empty")
        
        # Priority: OpenAI > Model > Rule Engine
        if openai_client and config.is_openai_available():
            result = openai_text_audit(request.content, request.template_config)
            logger.info(f"OpenAI text audit completed: violation={result.is_violation}, confidence={result.confidence}")
        elif text_model is not None:
            result = model_based_text_audit(request.content)
            logger.info(f"Model text audit completed: violation={result.is_violation}, confidence={result.confidence}")
        else:
            result = rule_based_text_audit(request.content)
            logger.info(f"Rule-based text audit completed: violation={result.is_violation}, confidence={result.confidence}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text audit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/image/audit", response_model=AuditResponse)
async def audit_image(request: ImageAuditRequest):
    """Image content audit"""
    try:
        image_data = None
        
        if request.image_base64:
            # Decode base64 image
            try:
                image_data = base64.b64decode(request.image_base64)
            except Exception as e:
                raise HTTPException(status_code=400, detail="Invalid base64 image data")
                
        elif request.image_url:
            # Download network image
            import requests
            try:
                response = requests.get(request.image_url, timeout=10)
                response.raise_for_status()
                image_data = response.content
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Cannot download image: {e}")
        else:
            raise HTTPException(status_code=400, detail="Either image_url or image_base64 must be provided")
        
        # Audit image
        result = rule_based_image_audit(image_data)
        
        logger.info(f"Image audit completed: violation={result.is_violation}, confidence={result.confidence}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image audit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ai/models/status")
async def get_models_status():
    """Get model status"""
    return {
        "openai": "available" if openai_client and config.is_openai_available() else "not_available",
        "openai_model": config.get_openai_model() if config.is_openai_available() else "none",
        "text_model": "loaded" if text_model is not None else "not_loaded",
        "image_model": "rule_based",
        "status": "operational",
        "config": {
            "use_openai": config.is_openai_available(),
            "confidence_threshold": config.CONFIDENCE_THRESHOLD,
            "max_text_length": config.MAX_TEXT_LENGTH
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8083) 
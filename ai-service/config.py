import os
from typing import Optional

class Config:
    """AI Service Configuration"""
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4")
    USE_OPENAI: bool = os.getenv("USE_OPENAI", "true").lower() == "true"
    
    # AI Service Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8083"))
    
    # Model Configuration
    TEXT_MODEL_NAME: str = os.getenv("TEXT_MODEL_NAME", "hfl/chinese-roberta-wwm-ext")
    MAX_TEXT_LENGTH: int = int(os.getenv("MAX_TEXT_LENGTH", "512"))
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.7"))
    
    @classmethod
    def is_openai_available(cls) -> bool:
        """Check if OpenAI is available"""
        return cls.USE_OPENAI and cls.OPENAI_API_KEY is not None
    
    @classmethod
    def get_openai_model(cls) -> str:
        """Get OpenAI model name"""
        return cls.OPENAI_MODEL
    
    @classmethod
    def get_openai_api_key(cls) -> Optional[str]:
        """Get OpenAI API key"""
        return cls.OPENAI_API_KEY

# Global config instance
config = Config()





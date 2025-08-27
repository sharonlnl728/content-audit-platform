#!/bin/bash

# AI Service Startup Script with OpenAI

echo "=== Starting AI Service with OpenAI ==="

# Set OpenAI environment variables
export USE_OPENAI=true
export OPENAI_MODEL=gpt-4

# Check if OpenAI API key is provided
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is not set!"
    echo "Please set your OpenAI API key:"
    echo "export OPENAI_API_KEY='your-api-key-here'"
    echo ""
    echo "Or run this script with the API key:"
    echo "OPENAI_API_KEY='your-key' ./start-openai.sh"
    exit 1
fi

echo "✅ OpenAI API Key: ${OPENAI_API_KEY:0:10}..."
echo "✅ OpenAI Model: $OPENAI_MODEL"
echo "✅ Use OpenAI: $USE_OPENAI"

# Install dependencies if needed
if [ ! -d "ai-venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv ai-venv
fi

echo "📦 Activating virtual environment..."
source ai-venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "🚀 Starting AI Service..."
python main.py





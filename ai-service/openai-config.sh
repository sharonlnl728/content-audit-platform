#!/bin/bash

# Please replace 'your-api-key-here' below with your real OpenAI API Key

export OPENAI_API_KEY="your-api-key-here"
export USE_OPENAI=true
export OPENAI_MODEL=gpt-4

echo "OpenAI configuration loaded:"
echo "API Key: ${OPENAI_API_KEY:0:10}..."
echo "Model: $OPENAI_MODEL"
echo "Use OpenAI: $USE_OPENAI"






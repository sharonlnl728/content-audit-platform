#!/bin/bash

# Load environment variables from root directory .env file
if [ -f "../.env" ]; then
    echo "Loading environment variables from ../.env"
    export $(cat ../.env | grep -v '^#' | xargs)
else
    echo "Warning: ../.env file not found"
fi

# Activate virtual environment
source venv/bin/activate

# Start AI service
python main.py

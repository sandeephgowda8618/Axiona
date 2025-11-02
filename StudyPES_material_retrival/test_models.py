#!/usr/bin/env python3
"""
Test available Google AI models
"""

import google.generativeai as genai

# Configure AI
api_key = "AIzaSyBuesQHpmMfx-gjkCQ7R6gh4t_FAG0qnYE"
genai.configure(api_key=api_key)

print("🔍 Checking available models...")

# List available models
for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"✅ Model: {model.name}")
        print(f"   Display Name: {model.display_name}")
        print(f"   Description: {model.description}")
        print("-" * 50)

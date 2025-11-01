#!/usr/bin/env python3
"""
Build Source.js - Converts metadata JSON to JS-exportable format
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime
import argparse

def convert_json_to_js(json_file: str, output_file: str = None):
    """Convert metadata JSON to JavaScript export format"""
    
    json_path = Path(json_file)
    if not json_path.exists():
        raise FileNotFoundError(f"JSON file not found: {json_file}")
    
    # Read JSON data
    with open(json_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    
    # Determine output file
    if not output_file:
        output_file = json_path.with_suffix('.js')
    
    output_path = Path(output_file)
    
    # Write JavaScript file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("// Generated PDF Metadata for Frontend\n")
        f.write(f"// Generated from: {json_path.name}\n")
        f.write(f"// Generated on: {datetime.now().isoformat()}\n")
        f.write(f"// Total entries: {len(metadata)}\n\n")
        
        f.write("export const SourceData = ")
        json.dump(metadata, f, indent=2, ensure_ascii=False)
        f.write(";\n")
    
    print(f"✅ Successfully converted {json_path} to {output_path}")
    print(f"📊 Processed {len(metadata)} entries")
    return str(output_path)

def main():
    if len(sys.argv) < 2:
        print("Usage: python build_source_converter.py <json_file> [output_file]")
        return 1
    
    json_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        result = convert_json_to_js(json_file, output_file)
        print(f"🎉 Conversion completed! Output: {result}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

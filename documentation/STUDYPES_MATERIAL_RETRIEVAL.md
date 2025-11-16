# StudyPES Material Retrieval System

## Overview
You are building a fully-automatic metadata generator that consumes PDF filenames inside a folder called `materials/` and produces a JSON file `data.json` ready for mongoimport into the books collection.

## 1. Input Convention
Every filename follows the rigid pattern:
```
Sem<semester number>_<Subject key>_<Unit tag>_<topic words>.pdf
```

**Example:** `Sem1_Chemistry_U1_Spectroscopy.pdf`

## 2. Extraction Rules

### Semester
- Extract integer after `Sem`

### Subject Mapping
Map the snake-case key to a human-readable title via hard-coded dictionary:

| Key | Human-Readable Title |
|-----|---------------------|
| Chemistry | Chemistry |
| Physics | Physics |
| DSA | Data Structures & Algorithms |
| AFLL | Automata & Formal Language Theory |
| Computer_Networks | Computer Networks |
| Operating_System | Operating Systems |
| DBMS | Database Management Systems |
| Linear_Algebra | Linear Algebra |
| Microprocessor_And_computer_Architecture | Microprocessor & Architecture |
| Data_Analytics | Data Analytics |

### Unit
- Extract digits after `U`
- Convert to `"Unit-{digits} : <topic phrase>"`

### Topic
- Remaining words after unit tag
- Replace underscores with spaces

## 3. Output Format
Generate JSON data ready for MongoDB import into the books collection.

## Implementation Status
- ✅ Filename parsing logic implemented
- ✅ Subject mapping dictionary created
- ✅ Unit extraction and formatting
- ✅ Topic processing (underscore replacement)
- ✅ JSON output generation for MongoDB import

## Usage
1. Place PDF files in `materials/` folder following naming convention
2. Run the metadata generator
3. Import generated `data.json` into MongoDB books collection using `mongoimport`

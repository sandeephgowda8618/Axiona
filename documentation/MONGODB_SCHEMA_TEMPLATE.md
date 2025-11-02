# MongoDB PDF Metadata Standard Schema

## 📋 **Current MongoDB Document Structure**

This is the exact schema used to store PDF metadata in the `books` collection:

```javascript
{
  _id: ObjectId("UNIQUE_MONGODB_ID"),           // Auto-generated MongoDB ID
  title: String,                               // Book title
  author: String,                              // Author name(s)
  subject: String,                             // Academic subject area
  category: String,                            // Book category
  language: String,                            // Content language (default: "English")
  description: String,                         // Book description/summary
  tags: [String],                              // Array of tags/keywords
  fileName: String,                            // PDF filename
  fileSize: Number,                            // File size in bytes
  availability: String,                        // "available" | "borrowed" | "reserved"
  downloadCount: Number,                       // Download counter (default: 0)
  rating: Number,                              // User rating (0-5, default: 0)
  reviewCount: Number,                         // Number of reviews (default: 0)
  coverImage: String,                          // Cover image URL (default: "/api/placeholder/300/400")
  addedDate: Date,                            // When book was added (auto-generated)
  updatedAt: Date,                            // Last update timestamp (auto-generated)
  createdAt: Date,                            // Creation timestamp (auto-generated)
  __v: Number,                                // MongoDB version key (auto-generated)
  
  // ENHANCED METADATA FIELDS (MISSING IN 21 BOOKS):
  summary: String,                            // AI-generated comprehensive summary
  key_concepts: [String],                     // Core learning concepts
  difficulty: String,                         // "Beginner"|"Intermediate"|"Advanced"|"Expert"
  target_audience: String,                    // "Students"|"Professionals"|"Researchers"|"General"
  prerequisites: [String]                     // Required prior knowledge
}
```

---

## 🎯 **What You Need to Provide**

For the 21 books that are missing enhanced metadata, you need to fill these **5 additional fields**:

### **Fields to Add:**

1. **summary** (String)
   - Comprehensive description of book content
   - Max 2000 characters

2. **key_concepts** (Array of Strings)
   - Core topics/concepts covered
   - Max 100 characters per item
   - Typically 5-10 concepts

3. **difficulty** (String - Enum)
   - Values: "Beginner", "Intermediate", "Advanced", "Expert"

4. **target_audience** (String - Enum)
   - Values: "Students", "Professionals", "Researchers", "General"

5. **prerequisites** (Array of Strings)
   - Required prior knowledge
   - Max 200 characters per item
   - Typically 2-5 prerequisites

---

## 📝 **Template for Enhanced Metadata**

```json
{
  "_id": "BOOK_MONGODB_ID",
  "enhanced_metadata": {
    "summary": "Your detailed summary here...",
    "key_concepts": [
      "Concept 1",
      "Concept 2", 
      "Concept 3"
    ],
    "difficulty": "Intermediate",
    "target_audience": "Professionals",
    "prerequisites": [
      "Prerequisite 1",
      "Prerequisite 2"
    ]
  }
}
```

---

## 📚 **21 Books Needing Enhanced Metadata**

These books currently have all the standard fields but are **missing the 5 enhanced metadata fields**:

| ID | Title | Author | Subject |
|----|-------|--------|---------|
| `69047d7a07fd7f58406b77a1` | AI for Data Science | Zacharias Yunus, Emrah Bul | Artificial Intelligence |
| `69047d7a07fd7f58406b77a3` | Convex Optimization | Stephen Boyd, Lieven Vandenberghe | Mathematics |
| `69047d7a07fd7f58406b77a5` | Designing Machine Learning Systems | Chip Huyen | Machine Learning |
| `69047d7a07fd7f58406b77a7` | Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow | Aurélien Géron | Machine Learning |
| `69047d7a07fd7f58406b77a9` | Introducing MLOps | Mark Treveil | Machine Learning |
| `69047d7a07fd7f58406b77ab` | Introduction to Probability | Dimitri P. Bertsekas, John N. Tsitsiklis | Mathematics |
| `69047d7a07fd7f58406b77ad` | Approaching (Almost) Any Machine Learning Problem | Abhishek Thakur | Machine Learning |
| `69047d7a07fd7f58406b77af` | Machine Learning Engineering | Andriy Burkov | Machine Learning |
| `69047d7a07fd7f58406b77b1` | Machine Learning: A Probabilistic Perspective | Kevin P. Murphy | Machine Learning |
| `69047d7a07fd7f58406b77b3` | Machine Learning with PyTorch and Scikit-Learn | Sebastian Raschka, Yuxi (Hayden) Liu | Machine Learning |
| `69047d7a07fd7f58406b77b5` | Pattern Recognition and Machine Learning | Christopher M. Bishop | Machine Learning |
| `69047d7a07fd7f58406b77b7` | The Elements of Statistical Learning | Trevor Hastie, Robert Tibshirani, Jerome Friedman | Statistics |
| `69047d7a07fd7f58406b77b9` | Fluent Python | Luciano Ramalho | Programming |
| `69047d7a07fd7f58406b77bb` | Linear Algebra and Its Applications | Gilbert Strang | Mathematics |
| `69047d7a07fd7f58406b77be` | Practical Statistics for Data Scientists | Peter Bruce, Andrew Bruce, Peter Gedeck | Statistics |
| `69047d7a07fd7f58406b77c1` | The SAGE Dictionary of Statistics | Duncan Cramer, Dennis Howitt | Statistics |
| `69047d7a07fd7f58406b77c3` | Top 50 Data Analyst Interview Questions & Answers | @coding_knowladge | Career |
| `69047db87899aa924d522aa1` | Ultimate Python Guide | Python Community | Programming |
| `69047db87899aa924d522aa4` | EDA Basics – Super-Store Sales Case Study | Data Science Community | Data Science |
| `69047db87899aa924d522aa7` | Top 100 Advanced SQL Questions & Answers for Query Writing | SQL Experts | Database |
| `69047db87899aa924d522aaa` | Power BI Questions & Answers | Microsoft Community | Business Intelligence |

---

## 🔧 **What I Need From You**

Please provide the enhanced metadata (summary, key_concepts, difficulty, target_audience, prerequisites) for these 21 books using the template format above. 

**Once you provide the enhanced metadata, I'll create a MongoDB update script to add these fields to the database!**

const mongoose = require('mongoose');

// Use the existing Book model from the server
const { Book } = require('./src/models/Book');

// Use the same MongoDB URI as the server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-ai';

// Updated metadata based on the provided book covers
const bookUpdates = [
  {
    fileName: 'comp(73).pdf',
    newMetadata: {
      title: 'Designing with the Mind in Mind',
      author: 'Jeff Johnson',
      subject: 'User Interface Design',
      category: 'Design',
      description: 'A simple guide to understanding user interface design rules. This book provides practical insights into how the human mind processes information and how to design interfaces that work with, rather than against, human psychology.',
      tags: ['UI Design', 'UX Design', 'Human-Computer Interaction', 'Design Psychology', 'Interface Design'],
      difficulty: 'Intermediate',
      target_audience: 'Professionals',
      key_concepts: ['Cognitive Psychology', 'Visual Perception', 'Interface Design Principles', 'Usability'],
      prerequisites: ['Basic design knowledge', 'Understanding of user interfaces'],
      summary: 'A simple guide to understanding user interface design rules. This book provides practical insights into how the human mind processes information and how to design interfaces that work with, rather than against, human psychology.'
    }
  },
  {
    fileName: 'comp(79).pdf',
    newMetadata: {
      title: 'UML Class Diagrams - Reference Guide',
      author: 'Unknown Author',
      subject: 'Software Engineering',
      category: 'Computer Science',
      description: 'What is a UML Class Diagram? Class diagrams are the backbone of almost every object-oriented method including UML. They describe the static structure of a system with basic class diagram symbols and notations.',
      tags: ['UML', 'Class Diagrams', 'Object-Oriented Design', 'Software Modeling', 'System Design'],
      difficulty: 'Beginner',
      target_audience: 'Students',
      key_concepts: ['UML Class Diagrams', 'Object-Oriented Design', 'System Modeling', 'Software Architecture'],
      prerequisites: ['Basic programming concepts', 'Object-oriented programming basics'],
      summary: 'Class diagrams are the backbone of almost every object-oriented method including UML. They describe the static structure of a system with basic class diagram symbols and notations.'
    }
  },
  {
    fileName: 'comp(74).pdf',
    newMetadata: {
      title: 'The Design of Everyday Things',
      author: 'Donald A. Norman',
      subject: 'Design',
      category: 'Design',
      description: 'A classic book on design principles that explores how design affects our daily lives. Norman explains the psychology behind good and bad design, offering insights into creating user-friendly products.',
      tags: ['Design Principles', 'User Experience', 'Product Design', 'Human Factors', 'Usability'],
      difficulty: 'Intermediate',
      target_audience: 'Professionals',
      key_concepts: ['Design Psychology', 'Affordances', 'Feedback', 'User-Centered Design'],
      prerequisites: ['Interest in design', 'Basic understanding of human psychology'],
      summary: 'A classic book on design principles that explores how design affects our daily lives. Norman explains the psychology behind good and bad design, offering insights into creating user-friendly products.'
    }
  },
  {
    fileName: 'comp(66).pdf',
    newMetadata: {
      title: 'Rx Design Guidelines',
      author: 'Microsoft Corporation',
      subject: 'Programming',
      category: 'Computer Science',
      description: 'Version 1.0 October 2010 Copyright Microsoft Corporation © Rx Design Guidelines. A comprehensive guide to Reactive Extensions design patterns and best practices.',
      tags: ['Reactive Programming', 'Microsoft Rx', 'Asynchronous Programming', 'Design Patterns', '.NET'],
      difficulty: 'Advanced',
      target_audience: 'Professionals',
      key_concepts: ['Reactive Extensions', 'Observable Patterns', 'Asynchronous Programming', 'Event Handling'],
      prerequisites: ['.NET Framework knowledge', 'C# programming', 'Understanding of asynchronous programming'],
      summary: 'A comprehensive guide to Reactive Extensions design patterns and best practices for building reactive applications with Microsoft technologies.'
    }
  },
  {
    fileName: 'comp(64).pdf',
    newMetadata: {
      title: 'Python Create-Modify-Reuse',
      author: 'Jim Knowlton',
      subject: 'Programming',
      category: 'Computer Science',
      description: 'Python programming guide focusing on creating, modifying, and reusing code. Published by Wrox, this book covers practical Python development techniques.',
      tags: ['Python Programming', 'Code Reuse', 'Software Development', 'Programming Best Practices'],
      difficulty: 'Intermediate',
      target_audience: 'Students',
      key_concepts: ['Python Syntax', 'Code Organization', 'Modular Programming', 'Software Development'],
      prerequisites: ['Basic programming knowledge', 'Understanding of programming concepts'],
      summary: 'Python programming guide focusing on creating, modifying, and reusing code. Published by Wrox, this book covers practical Python development techniques.'
    }
  },
  {
    fileName: 'comp(59).pdf',
    newMetadata: {
      title: 'Patterns of Parallel Programming',
      author: 'Stephen Toub',
      subject: 'Programming',
      category: 'Computer Science',
      description: 'Understanding and applying parallel patterns with the .NET Framework 4 and Visual C#. This document provides an in-depth tour of support in the Microsoft .NET Framework 4 for parallel programming.',
      tags: ['Parallel Programming', '.NET Framework 4', 'Visual C#', 'Concurrency', 'Microsoft'],
      difficulty: 'Advanced',
      target_audience: 'Professionals',
      key_concepts: ['Parallel Computing', 'Task Parallel Library', 'Concurrent Programming', 'Performance Optimization'],
      prerequisites: ['C# programming', '.NET Framework knowledge', 'Understanding of threading concepts'],
      summary: 'Understanding and applying parallel patterns with the .NET Framework 4 and Visual C#. This document provides an in-depth tour of support in the Microsoft .NET Framework 4 for parallel programming.'
    }
  },
  {
    fileName: 'comp(54).pdf',
    newMetadata: {
      title: 'The Productive Programmer',
      author: 'Neal Ford',
      subject: 'Programming',
      category: 'Computer Science',
      description: 'Published by O\'Reilly, this book focuses on techniques and practices to become a more productive programmer. Theory and practice combined to improve development efficiency.',
      tags: ['Programming Productivity', 'Software Development', 'Developer Tools', 'Best Practices', 'O\'Reilly'],
      difficulty: 'Intermediate',
      target_audience: 'Professionals',
      key_concepts: ['Developer Productivity', 'Tool Automation', 'Efficient Programming', 'Software Craftsmanship'],
      prerequisites: ['Programming experience', 'Software development background'],
      summary: 'Published by O\'Reilly, this book focuses on techniques and practices to become a more productive programmer. Theory and practice combined to improve development efficiency.'
    }
  },
  {
    fileName: 'comp(53).pdf',
    newMetadata: {
      title: 'Accelerated C++ Practical Programming by Example',
      author: 'Andrew Koenig and Barbara E. Moo',
      subject: 'Programming',
      category: 'Computer Science',
      description: 'Addison-Wesley, 2000 ISBN 0-201-70353-X Pages 336 Second Printing. A comprehensive guide to C++ programming with practical examples and hands-on approach.',
      tags: ['C++ Programming', 'Object-Oriented Programming', 'Programming Examples', 'Addison-Wesley'],
      difficulty: 'Intermediate',
      target_audience: 'Students',
      key_concepts: ['C++ Syntax', 'Object-Oriented Design', 'Standard Library', 'Programming Techniques'],
      prerequisites: ['Basic programming knowledge', 'Understanding of programming concepts'],
      summary: 'A comprehensive guide to C++ programming with practical examples and hands-on approach. Published by Addison-Wesley, this book provides accelerated learning for C++ development.'
    }
  },
  {
    fileName: 'comp(51).pdf',
    newMetadata: {
      title: 'Server Load Balancing',
      author: 'Unknown Author',
      subject: 'Network Engineering',
      category: 'Computer Science',
      description: 'Published by O\'Reilly, this book covers server load balancing techniques and strategies for distributed systems and high-availability architectures.',
      tags: ['Load Balancing', 'Server Architecture', 'Network Engineering', 'Distributed Systems', 'O\'Reilly'],
      difficulty: 'Advanced',
      target_audience: 'Professionals',
      key_concepts: ['Load Distribution', 'High Availability', 'Server Clustering', 'Network Optimization'],
      prerequisites: ['Network administration', 'Server management', 'Understanding of distributed systems'],
      summary: 'Published by O\'Reilly, this book covers server load balancing techniques and strategies for distributed systems and high-availability architectures.'
    }
  },
  {
    fileName: 'comp(46).pdf',
    newMetadata: {
      title: 'Python for Unix and Linux System Administration',
      author: 'Noah Gift & Jeremy M. Jones',
      subject: 'System Administration',
      category: 'Computer Science',
      description: 'Efficient Problem-Solving with Python. Published by O\'Reilly, this book focuses on using Python for system administration tasks in Unix and Linux environments.',
      tags: ['Python Programming', 'System Administration', 'Unix', 'Linux', 'Automation', 'O\'Reilly'],
      difficulty: 'Intermediate',
      target_audience: 'Professionals',
      key_concepts: ['System Automation', 'Python Scripting', 'Unix/Linux Administration', 'Problem Solving'],
      prerequisites: ['Basic Python knowledge', 'Unix/Linux familiarity', 'System administration basics'],
      summary: 'Efficient Problem-Solving with Python. Published by O\'Reilly, this book focuses on using Python for system administration tasks in Unix and Linux environments.'
    }
  },
  {
    fileName: 'comp(45).pdf',
    newMetadata: {
      title: 'Modern C++ Design: Generic Programming and Design Patterns Applied',
      author: 'Andrei Alexandrescu',
      subject: 'Programming',
      category: 'Computer Science',
      description: 'An important book that demonstrates "generic patterns" or "pattern templates" as a powerful new way of creating extensible designs in C++. A new way to combine templates and patterns for advanced C++ programming.',
      tags: ['C++ Programming', 'Design Patterns', 'Generic Programming', 'Template Programming', 'Software Architecture'],
      difficulty: 'Advanced',
      target_audience: 'Professionals',
      key_concepts: ['Generic Programming', 'Design Patterns', 'Template Metaprogramming', 'Software Design'],
      prerequisites: ['Advanced C++ knowledge', 'Understanding of design patterns', 'Template programming experience'],
      summary: 'An important book that demonstrates "generic patterns" or "pattern templates" as a powerful new way of creating extensible designs in C++. A new way to combine templates and patterns for advanced C++ programming.'
    }
  },
  {
    fileName: 'comp(42).pdf',
    newMetadata: {
      title: 'MySQL Pocket Reference',
      author: 'George Reese',
      subject: 'Database Systems',
      category: 'Computer Science',
      description: 'SQL Statements, Functions, Utilities, and More. Second Edition. A comprehensive pocket reference for MySQL database covering SQL statements, functions, and utilities.',
      tags: ['MySQL', 'Database', 'SQL', 'Database Administration', 'Reference Guide'],
      difficulty: 'Intermediate',
      target_audience: 'Professionals',
      key_concepts: ['SQL Queries', 'Database Management', 'MySQL Functions', 'Database Operations'],
      prerequisites: ['Basic database concepts', 'Understanding of SQL', 'Database fundamentals'],
      summary: 'SQL Statements, Functions, Utilities, and More. Second Edition. A comprehensive pocket reference for MySQL database covering SQL statements, functions, and utilities.'
    }
  },
  {
    fileName: 'comp(40).pdf',
    newMetadata: {
      title: 'Mastering Regular Expressions',
      author: 'Jeffrey E.F. Friedl',
      subject: 'Programming',
      category: 'Computer Science',
      description: 'Powerful Techniques for Perl and Other Tools. A comprehensive guide to understanding and mastering regular expressions for text processing and pattern matching.',
      tags: ['Regular Expressions', 'Text Processing', 'Pattern Matching', 'Perl', 'Programming Tools'],
      difficulty: 'Intermediate',
      target_audience: 'Professionals',
      key_concepts: ['Pattern Matching', 'Text Processing', 'Regular Expression Syntax', 'String Manipulation'],
      prerequisites: ['Basic programming knowledge', 'Understanding of text processing', 'Familiarity with command-line tools'],
      summary: 'Powerful Techniques for Perl and Other Tools. A comprehensive guide to understanding and mastering regular expressions for text processing and pattern matching.'
    }
  },
  {
    fileName: 'comp(39).pdf',
    newMetadata: {
      title: 'Hacker\'s Delight',
      author: 'Henry S. Warren Jr.',
      subject: 'Computer Science',
      category: 'Computer Science',
      description: 'Second Edition. A collection of programming tricks and techniques for bit manipulation, arithmetic operations, and algorithmic optimizations. Essential for systems programmers and performance enthusiasts.',
      tags: ['Bit Manipulation', 'Algorithms', 'Performance Optimization', 'Systems Programming', 'Mathematical Programming'],
      difficulty: 'Advanced',
      target_audience: 'Professionals',
      key_concepts: ['Bit Operations', 'Algorithmic Optimization', 'Mathematical Algorithms', 'Performance Tuning'],
      prerequisites: ['Strong programming background', 'Understanding of computer arithmetic', 'Knowledge of algorithms'],
      summary: 'Second Edition. A collection of programming tricks and techniques for bit manipulation, arithmetic operations, and algorithmic optimizations. Essential for systems programmers and performance enthusiasts.'
    }
  },
  {
    fileName: 'comp(38).pdf',
    newMetadata: {
      title: 'Linux Networking Cookbook',
      author: 'Carla Schroder',
      subject: 'Network Engineering',
      category: 'Computer Science',
      description: 'From Asterisk to Zebra with Easy-to-Use Recipes. A practical cookbook for Linux networking with step-by-step recipes for network configuration and troubleshooting.',
      tags: ['Linux Networking', 'Network Configuration', 'System Administration', 'Network Troubleshooting', 'O\'Reilly'],
      difficulty: 'Intermediate',
      target_audience: 'Professionals',
      key_concepts: ['Network Configuration', 'Linux Administration', 'Network Protocols', 'System Security'],
      prerequisites: ['Linux fundamentals', 'Basic networking knowledge', 'Command line proficiency'],
      summary: 'From Asterisk to Zebra with Easy-to-Use Recipes. A practical cookbook for Linux networking with step-by-step recipes for network configuration and troubleshooting.'
    }
  },
  {
    fileName: 'comp(34).pdf',
    newMetadata: {
      title: 'Learning the vi and Vim Editors',
      author: 'Arnold Robbins, Elbert Hannah & Linda Lamb',
      subject: 'System Administration',
      category: 'Computer Science',
      description: 'Text Processing at Maximum Speed and Power. 7th Edition. A comprehensive guide to mastering vi and Vim editors for efficient text editing and programming.',
      tags: ['Vi Editor', 'Vim', 'Text Editors', 'Linux', 'Text Processing', 'O\'Reilly'],
      difficulty: 'Intermediate',
      target_audience: 'Professionals',
      key_concepts: ['Text Editing', 'Editor Commands', 'Vim Scripting', 'Productivity Tools'],
      prerequisites: ['Basic command line knowledge', 'Understanding of text files', 'Linux/Unix familiarity'],
      summary: 'Text Processing at Maximum Speed and Power. 7th Edition. A comprehensive guide to mastering vi and Vim editors for efficient text editing and programming.'
    }
  },
  {
    fileName: 'comp(24).pdf',
    newMetadata: {
      title: 'Mobile Communications',
      author: 'Jochen Schiller',
      subject: 'Telecommunications',
      category: 'Computer Science',
      description: 'Second Edition. Comprehensive coverage of mobile communication systems, protocols, and technologies. Essential for understanding wireless and mobile networking.',
      tags: ['Mobile Communications', 'Wireless Networks', 'Telecommunications', 'Network Protocols', 'Mobile Technology'],
      difficulty: 'Advanced',
      target_audience: 'Students',
      key_concepts: ['Wireless Communication', 'Mobile Protocols', 'Network Architecture', 'Signal Processing'],
      prerequisites: ['Networking fundamentals', 'Understanding of communication systems', 'Basic signal processing'],
      summary: 'Second Edition. Comprehensive coverage of mobile communication systems, protocols, and technologies. Essential for understanding wireless and mobile networking.'
    }
  },
  {
    fileName: 'comp(19).pdf',
    newMetadata: {
      title: 'Expert Python Programming',
      author: 'Tarek Ziadé',
      subject: 'Programming',
      category: 'Computer Science',
      description: 'Best practices for designing, coding, and distributing your Python software. From Technologies to Solutions. A comprehensive guide for advanced Python development.',
      tags: ['Python Programming', 'Software Development', 'Best Practices', 'Code Design', 'Software Architecture'],
      difficulty: 'Advanced',
      target_audience: 'Professionals',
      key_concepts: ['Python Best Practices', 'Software Design', 'Code Organization', 'Development Workflow'],
      prerequisites: ['Solid Python experience', 'Understanding of software development', 'Programming fundamentals'],
      summary: 'Best practices for designing, coding, and distributing your Python software. From Technologies to Solutions. A comprehensive guide for advanced Python development.'
    }
  },
  {
    fileName: 'comp(5).pdf',
    newMetadata: {
      title: 'Domain-Driven Design Quickly',
      author: 'Abel Avram & Floyd Marinescu',
      subject: 'Software Engineering',
      category: 'Computer Science',
      description: 'A Summary of Eric Evans\' Domain-Driven Design. A concise guide to understanding and implementing domain-driven design principles in software development.',
      tags: ['Domain-Driven Design', 'Software Architecture', 'Design Patterns', 'Software Engineering', 'DDD'],
      difficulty: 'Intermediate',
      target_audience: 'Professionals',
      key_concepts: ['Domain Modeling', 'Software Architecture', 'Design Patterns', 'Business Logic'],
      prerequisites: ['Software development experience', 'Understanding of object-oriented design', 'Knowledge of design patterns'],
      summary: 'A Summary of Eric Evans\' Domain-Driven Design. A concise guide to understanding and implementing domain-driven design principles in software development.'
    }
  },
  {
    fileName: 'comp(14).pdf',
    newMetadata: {
      title: 'Data Communications and Networking',
      author: 'Behrouz A. Forouzan',
      subject: 'Network Engineering',
      category: 'Computer Science',
      description: 'Fourth Edition. Comprehensive textbook covering data communications and networking concepts, protocols, and technologies for computer networks.',
      tags: ['Data Communications', 'Computer Networks', 'Network Protocols', 'Telecommunications', 'Network Engineering'],
      difficulty: 'Intermediate',
      target_audience: 'Students',
      key_concepts: ['Network Protocols', 'Data Transmission', 'Network Architecture', 'Communication Systems'],
      prerequisites: ['Basic computer science knowledge', 'Understanding of digital systems', 'Mathematics fundamentals'],
      summary: 'Fourth Edition. Comprehensive textbook covering data communications and networking concepts, protocols, and technologies for computer networks.'
    }
  },
  {
    "fileName": "comp(15).pdf",
    "newMetadata": {
      "title": "Domain-Driven Design Quickly",
      "author": "Eric Evans",
      "subject": "Software Engineering",
      "category": "Computer Science",
      "description": "A concise summary of Eric Evans’ classic work on Domain-Driven Design, distilling the core principles and patterns for building rich, expressive software models aligned with complex business domains.",
      "tags": ["DDD", "Domain Modeling", "Software Architecture", "Ubiquitous Language", "Bounded Context"],
      "difficulty": "Intermediate",
      "target_audience": "Professionals",
      "key_concepts": ["Ubiquitous Language", "Bounded Context", "Aggregates", "Entities", "Value Objects", "Repositories"],
      "prerequisites": ["Object-oriented design", "Basic enterprise software experience"],
      "summary": "A condensed guide to the essential ideas of Domain-Driven Design, showing how to create software that deeply models and solves complex domain problems."
    }
  },
  {
    "fileName": "comp(12).pdf",
    "newMetadata": {
      "title": "Compilers: Principles, Techniques, and Tools (2nd Edition)",
      "author": "Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman",
      "subject": "Compiler Construction",
      "category": "Computer Science",
      "description": "The definitive \"Dragon Book\" on compiler design, covering lexical analysis, parsing, semantic analysis, optimization, and code generation with rigorous theory and practical algorithms.",
      "tags": ["Compilers", "Lexical Analysis", "Parsing", "Code Optimization", "Dragon Book"],
      "difficulty": "Advanced",
      "target_audience": "Students & Professionals",
      "key_concepts": ["Finite Automata", "Context-Free Grammars", "Syntax-Directed Translation", "Intermediate Representations", "Data-Flow Analysis"],
      "prerequisites": ["Data structures & algorithms", "Formal language theory", "Assembly-level programming"],
      "summary": "Comprehensive treatment of compiler construction from front-end analysis to back-end code generation, enriched with modern optimization techniques and tools."
    }
  },
  {
    "fileName": "comp(10).pdf",
    "newMetadata": {
      "title": "C: An Advanced Introduction",
      "author": "Narain Gehani",
      "subject": "Programming Languages",
      "category": "Computer Science",
      "description": "A deep dive into the C programming language for readers already familiar with basic concepts, exploring advanced constructs, idioms, and low-level system interactions.",
      "tags": ["C Language", "Pointers", "Memory Management", "Systems Programming", "Advanced Programming"],
      "difficulty": "Intermediate",
      "target_audience": "Students",
      "key_concepts": ["Pointer Arithmetic", "Dynamic Memory", "Bit Manipulation", "Linkage & Storage", "Preprocessor"],
      "prerequisites": ["Introductory programming course", "Basic understanding of variables & control flow"],
      "summary": "Advanced guide to mastering C, emphasizing pointer mechanics, memory models, and techniques for writing efficient, portable systems code."
    }
  },
  {
    "fileName": "comp(7).pdf",
    "newMetadata": {
      "title": "Advanced Windows Debugging",
      "author": "Mario Hewardt & Daniel Pravat",
      "subject": "Debugging & Diagnostics",
      "category": "Computer Science",
      "description": "In-depth handbook for troubleshooting complex software issues on Windows using WinDbg and other diagnostic tools, with real-world case studies and memory dump analysis.",
      "tags": ["WinDbg", "Memory Dumps", "Post-Mortem Debugging", "Windows Internals", "Crash Analysis"],
      "difficulty": "Advanced",
      "target_audience": "Professionals",
      "key_concepts": ["User-Mode vs Kernel-Mode", "Symbol Files", "Stack Walking", "Heap Corruption", "Deadlocks"],
      "prerequisites": ["Windows internals", "C/C++ programming", "Basic OS concepts"],
      "summary": "Expert-level coverage of Windows debugging techniques, teaching how to isolate and fix elusive crashes, hangs, and resource leaks in production systems."
    }
  },
  {
    "fileName": "comp(6).pdf",
    "newMetadata": {
      "title": "Advanced .NET Debugging",
      "author": "Mario Hewardt",
      "subject": "Debugging & Diagnostics",
      "category": "Computer Science",
      "description": "Comprehensive guide to debugging managed .NET applications with WinDbg and SOS, revealing CLR internals, garbage-collection issues, and synchronization problems.",
      "tags": [".NET Debugging", "SOS.dll", "CLR Internals", "Garbage Collection", "Managed Code"],
      "difficulty": "Advanced",
      "target_audience": "Professionals",
      "key_concepts": ["CLR Hosting", "GC Heaps", "Sync Blocks", "Assembly Loading", "Exception Dispatch"],
      "prerequisites": ["C# programming", ".NET Framework architecture", "Basic WinDbg usage"],
      "summary": "Hands-on manual for dissecting live and dump .NET processes, identifying memory leaks, deadlocks, and performance bottlenecks at the CLR level."
    }
  },
  {
    "fileName": "comp(3).pdf",
    "newMetadata": {
      "title": "Fundamentals of Database Systems (6th Edition)",
      "author": "Ramez Elmasri & Shamkant Navathe",
      "subject": "Database Systems",
      "category": "Computer Science",
      "description": "Foundational textbook on database theory and practice, covering relational modeling, SQL, normalization, transaction processing, concurrency, and emerging NoSQL trends.",
      "tags": ["Relational Databases", "SQL", "Normalization", "Transactions", "ER Modeling"],
      "difficulty": "Intermediate",
      "target_audience": "Students",
      "key_concepts": ["Relational Algebra", "ACID Properties", "Indexing", "Query Optimization", "Distributed Databases"],
      "prerequisites": ["Discrete mathematics", "Basic data structures"],
      "summary": "Comprehensive introduction to database architecture, design, and implementation, balancing rigorous theory with practical examples and current technologies."
    }
  },
  {
    "fileName": "comp(1).pdf",
    "newMetadata": {
      "title": "Computer Organization and Architecture: Designing for Performance (9th Edition)",
      "author": "William Stallings",
      "subject": "Computer Architecture",
      "category": "Computer Science",
      "description": "Authoritative exploration of processor design, memory hierarchies, I/O systems, and parallelism, emphasizing performance metrics and quantitative design trade-offs.",
      "tags": ["CPU Design", "Pipelining", "Cache Memory", "RISC vs CISC", "Parallel Architectures"],
      "difficulty": "Intermediate",
      "target_audience": "Students",
      "key_concepts": ["Instruction Pipelines", "Cache Coherence", "Multicore Processors", "Bus Architectures", "Performance Benchmarking"],
      "prerequisites": ["Digital logic", "Basic assembly language", "Probability & statistics"],
      "summary": "Balances conceptual understanding with real-world performance data to explain how modern processors, memory systems, and interconnects are designed for speed and efficiency."
    }
  }
]

async function updateBookMetadata() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('📚 Starting book metadata updates...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const bookUpdate of bookUpdates) {
      try {
        console.log(`🔍 Updating: ${bookUpdate.fileName} → ${bookUpdate.newMetadata.title}`);
        
        // Find the book by fileName and update existing fields
        const result = await Book.updateOne(
          { fileName: bookUpdate.fileName },
          { 
            $set: {
              title: bookUpdate.newMetadata.title,
              author: bookUpdate.newMetadata.author,
              subject: bookUpdate.newMetadata.subject,
              category: bookUpdate.newMetadata.category,
              description: bookUpdate.newMetadata.description,
              tags: bookUpdate.newMetadata.tags,
              difficulty: bookUpdate.newMetadata.difficulty,
              target_audience: bookUpdate.newMetadata.target_audience,
              key_concepts: bookUpdate.newMetadata.key_concepts,
              prerequisites: bookUpdate.newMetadata.prerequisites,
              summary: bookUpdate.newMetadata.summary,
              updatedAt: new Date()
            }
          }
        );
        
        if (result.matchedCount > 0) {
          console.log(`✅ Successfully updated: ${bookUpdate.newMetadata.title}`);
          console.log(`   Author: ${bookUpdate.newMetadata.author}`);
          console.log(`   Subject: ${bookUpdate.newMetadata.subject}`);
          console.log(`   Category: ${bookUpdate.newMetadata.category}\n`);
          successCount++;
        } else {
          console.log(`❌ Book not found: ${bookUpdate.fileName}\n`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error updating ${bookUpdate.fileName}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('📊 Update Summary:');
    console.log(`✅ Successfully updated: ${successCount} books`);
    console.log(`❌ Errors: ${errorCount} books`);
    console.log(`📖 Total processed: ${bookUpdates.length} books\n`);
    
    // Verify updates by checking a few books
    console.log('🔍 Verifying updates...');
    const sampleVerification = await Book.findOne({ title: 'Designing with the Mind in Mind' });
    if (sampleVerification) {
      console.log('✅ Verification successful - sample book found with updated metadata');
      console.log(`   Title: ${sampleVerification.title}`);
      console.log(`   Author: ${sampleVerification.author}`);
      console.log(`   Subject: ${sampleVerification.subject}`);
      console.log(`   Tags: ${sampleVerification.tags.join(', ')}`);
    }
    
    console.log('\n🎉 Metadata update process completed!');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the update
console.log('🚀 Starting book metadata update process...\n');
updateBookMetadata().catch(console.error);

// StudyPES Materials Types for RAG Integration

export interface StudyMaterial {
  id: string
  title: string
  subject: string
  unit: string
  semester: string
  author: string
  fileName: string
  file_url: string
  file_type: string
  level: string
  tags: string
  pages: string
  topic: string
  category: string
  approved: string
  publication_year: string
  publisher: string
  created_at: string
  updated_at: string
  document_id: string
}

export interface SubjectUnit {
  unit: string
  materials: StudyMaterial[]
  totalMaterials: number
  totalPages: number
}

export interface StudySubject {
  subject: string
  semester: string
  units: SubjectUnit[]
  totalMaterials: number
  totalPages: number
  totalUnits: number
}

export interface StudyMaterialsResponse {
  subjects: StudySubject[]
  totalSubjects: number
  totalMaterials: number
}

export interface RAGSearchRequest {
  query: string
  namespaces?: string[]
  n_results?: number
  filters?: Record<string, any>
}

export interface RAGSearchResult {
  id: string
  content: string
  metadata: Record<string, any>
  relevance_score: number
  namespace: string
  display_title?: string
  author?: string
  url?: string
}

export interface RAGSearchResponse {
  namespace: string
  query: string
  results: RAGSearchResult[]
  total_found: number
  search_timestamp: string
}

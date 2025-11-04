// StudyPES RAG Integration Service

import { 
  StudyMaterialsResponse, 
  StudySubject, 
  RAGSearchRequest, 
  RAGSearchResponse 
} from '../types/studymaterials'

class StudyPESRAGService {
  private baseURL: string

  constructor() {
    this.baseURL = 'http://localhost:8000' // RAG system endpoint
  }

  /**
   * Fetch all StudyPES materials organized by subjects and units
   */
  async getStudyMaterials(): Promise<StudyMaterialsResponse> {
    try {
      console.log('🔍 Fetching StudyPES materials from RAG system...')
      
      // Search for all studymaterials to get the complete dataset
      const response = await fetch(`${this.baseURL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '', // Empty query to get all materials
          namespace: 'studymaterials',
          n_results: 1000 // Get all materials
        } as RAGSearchRequest)
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch materials: ${response.statusText}`)
      }

      const data: RAGSearchResponse = await response.json()
      console.log('✅ Raw materials fetched:', data.results.length)

      // Organize materials by subject and unit
      return this.organizeMaterialsBySubject(data.results)
      
    } catch (error) {
      console.error('❌ Error fetching StudyPES materials:', error)
      throw error
    }
  }

  /**
   * Search for specific materials using RAG
   */
  async searchMaterials(query: string, filters?: Record<string, any>): Promise<RAGSearchResponse> {
    try {
      const response = await fetch(`${this.baseURL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          namespace: 'studymaterials',
          n_results: 50,
          filters
        } as RAGSearchRequest)
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Error searching materials:', error)
      throw error
    }
  }

  /**
   * Get materials for a specific subject
   */
  async getSubjectMaterials(subject: string): Promise<StudySubject | null> {
    try {
      const allMaterials = await this.getStudyMaterials()
      return allMaterials.subjects.find(s => s.subject === subject) || null
    } catch (error) {
      console.error('❌ Error fetching subject materials:', error)
      throw error
    }
  }

  /**
   * Get materials for a specific subject and unit
   */
  async getUnitMaterials(subject: string, unit: string) {
    try {
      const response = await fetch(`${this.baseURL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${subject} unit ${unit}`,
          namespace: 'studymaterials',
          n_results: 100,
          filters: {
            subject: subject,
            unit: unit
          }
        } as RAGSearchRequest)
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch unit materials: ${response.statusText}`)
      }

      const data: RAGSearchResponse = await response.json()
      return data.results.map(result => ({
        id: result.id,
        title: result.metadata.title || 'Untitled',
        subject: result.metadata.subject || subject,
        unit: result.metadata.unit || unit,
        semester: result.metadata.semester || '',
        author: result.metadata.author || 'Unknown',
        fileName: result.metadata.fileName || '',
        file_url: result.metadata.file_url || '',
        file_type: result.metadata.file_type || 'PDF',
        level: result.metadata.level || 'General',
        tags: result.metadata.tags || '',
        pages: result.metadata.pages || '0',
        topic: result.metadata.topic || '',
        category: result.metadata.category || 'StudyPES',
        approved: result.metadata.approved || 'Unknown',
        publication_year: result.metadata.publication_year || '',
        publisher: result.metadata.publisher || 'StudyPES',
        created_at: result.metadata.created_at || '',
        updated_at: result.metadata.updated_at || '',
        document_id: result.metadata.document_id || result.id
      }))
    } catch (error) {
      console.error('❌ Error fetching unit materials:', error)
      throw error
    }
  }

  /**
   * Organize RAG search results by subject and unit
   */
  private organizeMaterialsBySubject(results: any[]): StudyMaterialsResponse {
    const subjectsMap = new Map<string, StudySubject>()

    results.forEach(result => {
      const metadata = result.metadata || {}
      const subject = metadata.subject || 'Unknown Subject'
      const unit = metadata.unit || '0'
      const semester = metadata.semester || 'General'

      // Initialize subject if not exists
      if (!subjectsMap.has(subject)) {
        subjectsMap.set(subject, {
          subject,
          semester,
          units: [],
          totalMaterials: 0,
          totalPages: 0,
          totalUnits: 0
        })
      }

      const subjectData = subjectsMap.get(subject)!
      
      // Find or create unit
      let unitData = subjectData.units.find(u => u.unit === unit)
      if (!unitData) {
        unitData = {
          unit,
          materials: [],
          totalMaterials: 0,
          totalPages: 0
        }
        subjectData.units.push(unitData)
      }

      // Add material to unit
      const material = {
        id: result.id,
        title: metadata.title || 'Untitled Document',
        subject,
        unit,
        semester,
        author: metadata.author || 'StudyPES Materials',
        fileName: metadata.fileName || '',
        file_url: metadata.file_url || '',
        file_type: metadata.file_type || 'PDF',
        level: metadata.level || 'General',
        tags: metadata.tags || '',
        pages: metadata.pages || '0',
        topic: metadata.topic || '',
        category: metadata.category || 'StudyPES',
        approved: metadata.approved || 'True',
        publication_year: metadata.publication_year || '2024',
        publisher: metadata.publisher || 'StudyPES',
        created_at: metadata.created_at || '',
        updated_at: metadata.updated_at || '',
        document_id: metadata.document_id || result.id
      }

      unitData.materials.push(material)
      unitData.totalMaterials++
      unitData.totalPages += parseInt(material.pages) || 0

      subjectData.totalMaterials++
      subjectData.totalPages += parseInt(material.pages) || 0
    })

    // Sort units by unit number and calculate totals
    const subjects = Array.from(subjectsMap.values()).map(subject => {
      subject.units.sort((a, b) => {
        const aNum = parseInt(a.unit) || 0
        const bNum = parseInt(b.unit) || 0
        return aNum - bNum
      })
      subject.totalUnits = subject.units.length
      return subject
    })

    // Sort subjects alphabetically
    subjects.sort((a, b) => a.subject.localeCompare(b.subject))

    return {
      subjects,
      totalSubjects: subjects.length,
      totalMaterials: subjects.reduce((sum, s) => sum + s.totalMaterials, 0)
    }
  }
}

export const studyPESRAGService = new StudyPESRAGService()
export default studyPESRAGService

// Roadmap Generation API Service
// Integrates with MCP RAG System for personalized roadmap generation

interface RoadmapPhaseData {
  [key: string]: string | number | boolean;
}

interface RoadmapWizardData {
  phase1?: RoadmapPhaseData;
  phase2?: RoadmapPhaseData;
  phase3?: RoadmapPhaseData;
  phase4?: RoadmapPhaseData;
  phase5?: RoadmapPhaseData;
}

interface RoadmapPhase {
  title: string;
  content: string;
  duration?: string;
  objectives?: string[];
  resources?: string[];
  milestones?: string[];
}

interface RoadmapGenerationResponse {
  user_profile: string;
  roadmap_content: string;
  phases: RoadmapPhase[];
  estimated_duration: string;
  personalization_score: number;
  relevant_resources: number;
  model_used: string;
  generated_at: string;
  success: boolean;
}

interface RoadmapGenerationRequest {
  user_id?: string;
  phase1?: RoadmapPhaseData;
  phase2?: RoadmapPhaseData;
  phase3?: RoadmapPhaseData;
  phase4?: RoadmapPhaseData;
  phase5?: RoadmapPhaseData;
  search_namespaces?: string[];
  max_resources?: number;
}

class RoadmapAPIService {
  private baseURL: string;
  private timeout: number = 30000; // 30 second timeout for LLM generation

  constructor() {
    // Use environment variable or default to local development
    this.baseURL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8000';
  }

  /**
   * Generate a personalized roadmap using the MCP RAG system
   */
  async generateRoadmap(wizardData: RoadmapWizardData, userId?: string): Promise<RoadmapGenerationResponse> {
    try {
      const requestData: RoadmapGenerationRequest = {
        user_id: userId,
        phase1: wizardData.phase1,
        phase2: wizardData.phase2,
        phase3: wizardData.phase3,
        phase4: wizardData.phase4,
        phase5: wizardData.phase5,
        search_namespaces: ['roadmap', 'pdf', 'books', 'videos'],
        max_resources: 5
      };

      console.log('Sending roadmap generation request:', requestData);

      const response = await fetch(`${this.baseURL}/generate-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error ${response.status}: ${errorData}`);
      }

      const roadmapResponse: RoadmapGenerationResponse = await response.json();
      
      console.log('Received roadmap response:', roadmapResponse);
      
      return roadmapResponse;

    } catch (error) {
      console.error('Roadmap generation failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Roadmap generation timed out. Please try again.');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred during roadmap generation');
    }
  }

  /**
   * Check if the RAG system is healthy and ready
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Search the RAG system for specific content
   */
  async searchContent(query: string, namespace?: string): Promise<any> {
    try {
      const requestData = {
        query,
        namespace: namespace || 'roadmap',
        n_results: 5
      };

      const response = await fetch(`${this.baseURL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Content search failed:', error);
      throw error;
    }
  }

  /**
   * Get available collections/namespaces
   */
  async getAvailableNamespaces(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseURL}/collections`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.status}`);
      }

      const data = await response.json();
      return Object.keys(data.collections || {});
    } catch (error) {
      console.error('Failed to get namespaces:', error);
      return ['roadmap', 'pdf', 'books', 'videos']; // fallback
    }
  }

  /**
   * Format wizard data for API consumption
   */
  private formatWizardData(wizardData: RoadmapWizardData): RoadmapWizardData {
    // Clean and validate the wizard data
    const cleaned: RoadmapWizardData = {};

    if (wizardData.phase1) {
      cleaned.phase1 = { ...wizardData.phase1 };
    }
    if (wizardData.phase2) {
      cleaned.phase2 = { ...wizardData.phase2 };
    }
    if (wizardData.phase3) {
      cleaned.phase3 = { ...wizardData.phase3 };
    }
    if (wizardData.phase4) {
      cleaned.phase4 = { ...wizardData.phase4 };
    }
    if (wizardData.phase5) {
      cleaned.phase5 = { ...wizardData.phase5 };
    }

    return cleaned;
  }
}

// Export singleton instance
export const roadmapAPI = new RoadmapAPIService();

// Export types for use in components
export type {
  RoadmapWizardData,
  RoadmapPhaseData,
  RoadmapGenerationResponse,
  RoadmapPhase
};

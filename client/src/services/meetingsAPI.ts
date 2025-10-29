import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export interface Meeting {
  _id: string;
  meetingId: string;
  title: string;
  description?: string;
  createdBy: string;
  hostUserId: string;
  participants: MeetingParticipant[];
  settings: MeetingSettings;
  roomPassword?: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  roomId: string;
  scheduledStartTime?: Date;
  actualStartTime?: Date;
  endTime?: Date;
  duration?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingParticipant {
  userId: string;
  userName: string;
  userEmail: string;
  joinedAt: Date;
  leftAt?: Date;
  role: 'host' | 'moderator' | 'participant';
  isActive: boolean;
}

export interface MeetingSettings {
  maxParticipants: number;
  isPublic: boolean;
  requireApproval: boolean;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowRecording: boolean;
  muteOnEntry: boolean;
}

export interface MeetingInfo {
  meetingId: string;
  title: string;
  description?: string;
  status: string;
  maxParticipants: number;
  currentParticipants: number;
  requiresPassword: boolean;
  allowChat: boolean;
  allowScreenShare: boolean;
  isJoinable: boolean;
  isFull: boolean;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  createdBy: string;
  scheduledStartTime?: string;
  settings?: Partial<MeetingSettings>;
  roomPassword?: string;
}

export interface JoinMeetingRequest {
  userId: string;
  userName: string;
  userEmail: string;
  roomPassword?: string;
}

export interface ChatMessage {
  _id: string;
  meetingId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  messageType: 'text' | 'system' | 'emoji';
}

class MeetingsAPI {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/api/meetings${endpoint}`;
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Create a new meeting
   */
  async createMeeting(request: CreateMeetingRequest): Promise<{ success: boolean; message: string; data: Meeting }> {
    return this.request('/', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Get meeting information (for joining)
   */
  async getMeetingInfo(meetingId: string): Promise<{ success: boolean; data: MeetingInfo }> {
    return this.request(`/${meetingId}/info`);
  }

  /**
   * Get full meeting details
   */
  async getMeeting(meetingId: string): Promise<{ success: boolean; data: Meeting }> {
    return this.request(`/${meetingId}`);
  }

  /**
   * Join a meeting
   */
  async joinMeeting(meetingId: string, request: JoinMeetingRequest): Promise<{ 
    success: boolean; 
    message: string; 
    data: { meeting: Meeting; roomId: string; participantCount: number } 
  }> {
    return this.request(`/${meetingId}/join`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Leave a meeting
   */
  async leaveMeeting(meetingId: string, userId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: { participantCount: number } 
  }> {
    return this.request(`/${meetingId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  /**
   * End a meeting (host only)
   */
  async endMeeting(meetingId: string, userId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: Meeting 
  }> {
    return this.request(`/${meetingId}/end`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  /**
   * Get chat messages for a meeting
   */
  async getChatMessages(meetingId: string, options: {
    limit?: number;
    skip?: number;
    since?: string;
  } = {}): Promise<{ success: boolean; data: ChatMessage[] }> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.skip) params.set('skip', options.skip.toString());
    if (options.since) params.set('since', options.since);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/${meetingId}/messages${query}`);
  }

  /**
   * Get user's meetings
   */
  async getUserMeetings(userId: string, options: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ 
    success: boolean; 
    data: Meeting[]; 
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  }> {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/user/${userId}${query}`);
  }

  /**
   * Get active meetings
   */
  async getActiveMeetings(): Promise<{ success: boolean; data: Meeting[]; count: number }> {
    return this.request('/status/active');
  }

  /**
   * Get room statistics
   */
  async getRoomStats(): Promise<{ 
    success: boolean; 
    data: {
      totalRooms: number;
      totalParticipants: number;
      rooms: Array<{
        roomId: string;
        participantCount: number;
        createdAt: Date;
        meetingId: string;
      }>;
    }
  }> {
    return this.request('/stats/rooms');
  }
}

// Export singleton instance
export const meetingsAPI = new MeetingsAPI();
export default meetingsAPI;

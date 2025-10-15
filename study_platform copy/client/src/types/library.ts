// Study Materials Types
export interface StudyMaterial {
  id: string
  title: string
  subject: string
  class: string
  year: string
  pages: number
  downloadUrl: string
  thumbnail: string
  author?: string
  description?: string
  uploadDate: Date
  downloadCount: number
  fileSize: string
  category: 'lecture-notes' | 'assignments' | 'past-papers' | 'reference'
}

export interface StudyMaterialFilters {
  class: string
  year: string
  subject: string
  category: string
  search: string
}

export interface StudyMaterialSort {
  field: 'recent' | 'popular' | 'title' | 'subject'
  direction: 'asc' | 'desc'
}

// Library Types
export interface LibraryBook {
  id: string
  title: string
  author: string
  isbn: string
  publisher: string
  edition: string
  subject: string
  category: string
  year: number
  pages: number
  language: string
  rating: number
  reviewCount: number
  description: string
  coverImage: string
  downloadUrl?: string
  previewUrl?: string
  fileSize?: string
  availability: 'available' | 'borrowed' | 'reserved'
  addedDate: Date
  downloadCount: number
  isFavorite: boolean
  tags: string[]
}

export interface LibraryFilters {
  category: string
  subject: string
  language: string
  availability: string
  rating: number
  search: string
}

export interface LibrarySort {
  field: 'recent' | 'popular' | 'rating' | 'title' | 'author'
  direction: 'asc' | 'desc'
}

// Common types
export interface PaginationInfo {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
}

export interface SearchResult<T> {
  items: T[]
  pagination: PaginationInfo
  filters: any
  sort: any
}

// API Response types
export interface StudyMaterialResponse {
  materials: StudyMaterial[]
  totalCount: number
  categories: string[]
  subjects: string[]
  classes: string[]
  years: string[]
}

export interface LibraryResponse {
  books: LibraryBook[]
  totalCount: number
  categories: string[]
  subjects: string[]
  languages: string[]
  authors: string[]
  publishers: string[]
}

// Upload types
export interface MaterialUpload {
  title: string
  description?: string
  subject: string
  class: string
  year: string
  category: 'lecture-notes' | 'assignments' | 'past-papers' | 'reference'
  file: File
  tags?: string[]
}

export interface BookRequest {
  title: string
  author: string
  isbn?: string
  publisher?: string
  edition?: string
  subject: string
  category: string
  reason: string
  priority: 'low' | 'medium' | 'high'
}

// User interaction types
export interface MaterialView {
  materialId: string
  userId: string
  viewDate: Date
  duration: number // in seconds
}

export interface MaterialDownload {
  materialId: string
  userId: string
  downloadDate: Date
  success: boolean
}

export interface BookFavorite {
  bookId: string
  userId: string
  addedDate: Date
}

export interface BookReview {
  id: string
  bookId: string
  userId: string
  rating: number
  review?: string
  reviewDate: Date
  helpful: number
  reported: boolean
}

// Admin types
export interface MaterialModeration {
  id: string
  materialId: string
  moderatorId: string
  action: 'approved' | 'rejected' | 'pending'
  reason?: string
  actionDate: Date
}

export interface LibraryStats {
  totalBooks: number
  totalMaterials: number
  totalDownloads: number
  totalUsers: number
  popularBooks: LibraryBook[]
  popularMaterials: StudyMaterial[]
  recentActivity: {
    downloads: number
    uploads: number
    requests: number
  }
}

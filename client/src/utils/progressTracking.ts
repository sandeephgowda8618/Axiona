// Helper functions for tracking material progress

export const trackMaterialAccess = (
  trackFunction: (activity: any, weekNumber: number) => void,
  material: {
    id: string,
    title: string,
    type: 'pdf' | 'reference' | 'video' | 'slide'
  },
  currentWeek: number = 1
) => {
  const activity = {
    type: material.type,
    id: material.id,
    title: material.title,
    timestamp: Date.now(),
    ...(material.type === 'video' && { duration: 0 }), // Will be updated based on actual viewing
    ...(material.type === 'pdf' && { pages: 0 }) // Will be updated based on actual reading
  }

  trackFunction(activity, currentWeek)
  
  console.log(`📚 Material tracked: ${material.title} (${material.type}) for Week ${currentWeek}`)
}

export const generateMockMaterialId = (title: string, type: string): string => {
  return `${type}_${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
}

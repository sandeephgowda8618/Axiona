import React, { useState } from 'react'
import { demoNotes } from '../data/demoData'

const subjectColors: Record<string, string> = {
	Physics: 'bg-blue-100 text-blue-700',
	'Computer Science': 'bg-purple-100 text-purple-700',
	Chemistry: 'bg-green-100 text-green-700',
	History: 'bg-orange-100 text-orange-700',
	Mathematics: 'bg-red-100 text-red-700',
	Biology: 'bg-teal-100 text-teal-700',
}

const MyRack: React.FC = () => {
	const [selected, setSelected] = useState<string[]>([])
	const [page, setPage] = useState(1)
	const totalPages = 2
	const notesPerPage = 3
	const paginatedNotes = demoNotes.slice((page - 1) * notesPerPage, page * notesPerPage)

	const handleSelect = (id: string) => {
		setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white border-b border-gray-200 shadow-sm">
				<div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
							<span className="text-white font-bold text-sm">📚</span>
						</div>
						<span className="text-xl font-bold text-gray-800">My Rack – Study-AI Mini</span>
					</div>
					<div className="flex items-center space-x-3">
						<button className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 font-medium hover:bg-gray-50 transition-colors">
							📥 Export TXT
						</button>
						<button className="px-4 py-2 rounded-lg bg-red-100 text-red-600 font-medium hover:bg-red-200 transition-colors">
							🗑️ Delete Selected
						</button>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-6 py-8">
				<div className="flex items-start justify-between mb-6">
					<div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">Study Notes Collection</h1>
						<p className="text-gray-600">Manage and organize your saved study materials</p>
					</div>
					<div className="text-right text-sm text-gray-500">
						<div>12 notes saved • Last updated 2 hours ago</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					{paginatedNotes.map(note => (
						<div key={note.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
							<div className="flex items-start space-x-3">
								<input 
									type="checkbox" 
									checked={selected.includes(note.id)} 
									onChange={() => handleSelect(note.id)} 
									className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
								/>
								<div className="flex-1 min-w-0">
									<h3 className="font-semibold text-gray-900 text-base mb-2 leading-tight">{note.title}</h3>
									<p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">{note.content}</p>
									<div className="flex items-center justify-between">
										<span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${subjectColors[note.subject] || 'bg-gray-100 text-gray-700'}`}>
											{note.subject}
										</span>
										<span className="text-xs text-gray-400">
											{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-500">
						Showing {((page-1)*notesPerPage)+1}-{Math.min(page*notesPerPage, demoNotes.length)} of {demoNotes.length} notes
					</span>
					<div className="flex items-center space-x-2">
						<button
							onClick={() => page > 1 && setPage(page - 1)}
							disabled={page === 1}
							className={`w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-sm font-medium transition-colors ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
						>
							‹
						</button>
						<button 
							className={`w-10 h-10 rounded-lg font-semibold text-sm flex items-center justify-center transition-colors ${page === 1 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
							onClick={() => setPage(1)}
						>
							1
						</button>
						<button 
							className={`w-10 h-10 rounded-lg font-semibold text-sm flex items-center justify-center transition-colors ${page === 2 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
							onClick={() => setPage(2)}
						>
							2
						</button>
						<button
							onClick={() => page < totalPages && setPage(page + 1)}
							disabled={page === totalPages}
							className={`w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-sm font-medium transition-colors ${page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
						>
							›
						</button>
					</div>
				</div>
			</main>
		</div>
	)
}

export default MyRack
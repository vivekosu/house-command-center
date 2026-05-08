import { useNavigate } from 'react-router-dom'

const NAV = [
  { id: 'today', label: 'Today', path: '/today' },
  { id: 'tasks', label: 'Tasks', path: '/tasks' },
  { id: 'notes', label: 'Notes', path: '/notes' },
  { id: 'vendors', label: 'Vendors', path: '/vendors' },
  { id: 'weekly', label: 'Plan', path: '/weekly' },
]

const ICONS = {
  today: <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
  tasks: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></>,
  notes: <><path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></>,
  vendors: <><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  weekly: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
}

export default function BottomNav({ active }) {
  const navigate = useNavigate()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50 pb-safe">
      {NAV.map(item => (
        <button key={item.id} onClick={() => navigate(item.path)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium
            ${active === item.id ? 'text-blue-600' : 'text-gray-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor"
            strokeWidth={active === item.id ? 2.2 : 1.8}
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            {ICONS[item.id]}
          </svg>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
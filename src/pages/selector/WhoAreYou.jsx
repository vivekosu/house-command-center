import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../context/RoleContext'

console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Project ID:', import.meta.env.VITE_PROJECT_ID)

const ROLE_COLORS = {
  owner: 'bg-blue-100 text-blue-800',
  editor: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-700',
  clarifier: 'bg-purple-100 text-purple-800'
}

export default function WhoAreYou() {
  const [users, setUsers] = useState([])
  const { selectUser } = useRole()
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('users').select('*')
      .eq('project_id', import.meta.env.VITE_PROJECT_ID)
      .eq('is_active', true)
      .then(({ data }) => setUsers(data || []))
  }, [])

  const pick = (user) => { selectUser(user); navigate('/today') }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-xl font-bold text-gray-900">House Command Center</h1>
          <p className="text-sm text-gray-400 mt-1">Who are you?</p>
        </div>
        <div className="flex flex-col gap-3">
          {users.map(user => (
            <button key={user.id} onClick={() => pick(user)}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm flex-shrink-0">
                {user.name.slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">{user.name}</div>
                <div className="text-xs text-gray-400 mt-0.5 capitalize">{user.team_type} · {user.role}</div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[user.role]}`}>
                {user.role}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-6">Choice saved on this device</p>
      </div>
    </div>
  )
}
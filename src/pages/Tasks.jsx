import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { daysOverdue, formatDate } from '../lib/utils'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

const STATUS_COLORS = {
  planned: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting_vendor: 'bg-yellow-100 text-yellow-700',
  waiting_material: 'bg-orange-100 text-orange-700',
  waiting_decision: 'bg-purple-100 text-purple-700',
  blocked: 'bg-red-100 text-red-700',
  delayed: 'bg-red-100 text-red-700',
  done: 'bg-green-100 text-green-700',
  verified: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-500',
}

export default function Tasks() {
  const { currentUser, isEditor } = useRole()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')

  useEffect(() => { loadTasks() }, [filter])

  async function loadTasks() {
    setLoading(true)
    let q = supabase.from('tasks').select('*, spaces(name, floor), categories(name, color), task_vendors(vendors(name))').eq('project_id', import.meta.env.VITE_PROJECT_ID).order('end_date', { ascending: true })
    if (filter === 'active') q = q.not('status', 'in', '("done","verified","closed")')
    else if (filter === 'done') q = q.in('status', ['done', 'verified', 'closed'])
    const { data } = await q
    setTasks(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Tasks" rightAction={isEditor && <button onClick={() => navigate('/tasks/new')} className="text-blue-600 font-semibold text-sm">+ Add</button>} />
      <div className="pt-16 px-3">
        <div className="flex gap-2 py-3">
          {['active', 'all', 'done'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>{f}</button>
          ))}
        </div>
        {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
        {!loading && tasks.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-2">📋</div><div>No tasks found</div></div>}
        {tasks.map(task => {
          const overdue = daysOverdue(task.end_date)
          return (
            <div key={task.id} className={`bg-white border rounded-xl p-3 mb-2 cursor-pointer ${overdue > 0 && !['done','verified','closed'].includes(task.status) ? 'border-l-4 border-l-red-400 rounded-l-none' : 'border-gray-100'}`} onClick={() => navigate(`/tasks/${task.id}`)}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold text-sm text-gray-900 flex-1 leading-tight">{task.title}</div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-600'}`}>{task.status?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{task.spaces?.floor} · {task.spaces?.name}</span>
                {task.categories?.name && <span className="text-xs text-gray-400">· {task.categories.name}</span>}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="text-xs text-blue-500">{task.task_vendors?.map(tv => tv.vendors?.name).filter(Boolean).join(', ')}</div>
                {task.end_date && <div className={`text-xs font-medium ${overdue > 0 && !['done','verified','closed'].includes(task.status) ? 'text-red-600' : 'text-gray-400'}`}>{overdue > 0 && !['done','verified','closed'].includes(task.status) ? `${overdue}d late` : formatDate(task.end_date)}</div>}
              </div>
            </div>
          )
        })}
      </div>
      <BottomNav active="tasks" />
    </div>
  )
}

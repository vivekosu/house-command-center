import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { daysOverdue, formatDate } from '../lib/utils'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

export default function Today() {
  const { currentUser } = useRole()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ overdue: 0, dueToday: 0, done: 0, clarify: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadTodayTasks() }, [])

  async function loadTodayTasks() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('tasks')
      .select('*, spaces(name, floor), categories(name, color), task_vendors(vendor_id, vendors(name, phone, missed_count, language_pref))')
      .eq('project_id', import.meta.env.VITE_PROJECT_ID)
      .not('status', 'in', '("done","verified","closed")')
      .lte('end_date', today)
      .order('end_date', { ascending: true })
    setTasks(data || [])
    setStats({
      overdue: (data || []).filter(t => daysOverdue(t.end_date) > 0).length,
      dueToday: (data || []).filter(t => t.end_date === today).length,
      done: 0, clarify: 0
    })
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]
  const urgent = tasks.filter(t => daysOverdue(t.end_date) > 0)
  const dueToday = tasks.filter(t => t.end_date === today)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Today" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} />
      <div className="pt-16 px-3 pb-2">
        <div className="grid grid-cols-4 gap-2 mb-4 pt-3">
          {[{label:'Overdue',val:stats.overdue,color:'text-red-600'},{label:'Due today',val:stats.dueToday,color:'text-amber-600'},{label:'Done',val:stats.done,color:'text-green-600'},{label:'Clarify',val:stats.clarify,color:'text-purple-600'}].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-gray-100">
              <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading tasks...</div>}
        {!loading && urgent.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 px-1">🔴 Overdue ({urgent.length})</div>
            {urgent.map(task => <TaskCard key={task.id} task={task} navigate={navigate} />)}
          </div>
        )}
        {!loading && dueToday.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 px-1">🟡 Due Today ({dueToday.length})</div>
            {dueToday.map(task => <TaskCard key={task.id} task={task} navigate={navigate} />)}
          </div>
        )}
        {!loading && tasks.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-3xl mb-2">✅</div>
            <div className="font-medium text-gray-600">All caught up!</div>
            <div className="text-sm mt-1">No overdue or due-today tasks</div>
          </div>
        )}
      </div>
      <BottomNav active="today" />
    </div>
  )
}

function TaskCard({ task, navigate }) {
  const overdue = daysOverdue(task.end_date)
  return (
    <div className={`bg-white border rounded-xl p-3 mb-3 cursor-pointer ${overdue > 0 ? 'border-l-4 border-l-red-400 rounded-l-none' : 'border-gray-100'}`} onClick={() => navigate(`/tasks/${task.id}`)}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-semibold text-sm text-gray-900 flex-1">{task.title}</div>
        {overdue > 0 ? <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{overdue}d late</span> : <span className="text-xs text-gray-400">{formatDate(task.end_date)}</span>}
      </div>
      <div className="text-xs text-gray-400">{task.spaces?.floor} · {task.spaces?.name} · {task.categories?.name}</div>
      {task.task_vendors?.length > 0 && <div className="text-xs text-blue-500 mt-1">{task.task_vendors.map(tv => tv.vendors?.name).filter(Boolean).join(', ')}</div>}
    </div>
  )
}

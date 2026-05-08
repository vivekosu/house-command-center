import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../context/RoleContext'
import { formatDate, daysOverdue } from '../../lib/utils'

export default function VendorHome() {
  const { currentUser } = useRole()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser?.id) return
    supabase.from('task_vendors').select('*, tasks(*, spaces(name,floor), categories(name))').eq('vendor_id', currentUser.id)
      .then(({ data }) => {
        const active = (data || [])
          .map(tv => tv.tasks)
          .filter(t => t && !['done','verified','closed'].includes(t.status))
        setTasks(active); setLoading(false)
      })
  }, [currentUser?.id])

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="text-lg font-bold text-gray-900">{currentUser?.name}</div>
        <div className="text-xs text-gray-400 mt-0.5">{tasks.length} active tasks</div>
      </div>
      <div className="px-3 pt-4">
        {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
        {!loading && tasks.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-3xl mb-2">✅</div>
            <div className="font-medium text-gray-600">No pending tasks</div>
          </div>
        )}
        {tasks.map(task => {
          const overdue = daysOverdue(task.end_date)
          return (
            <div key={task.id} className={`bg-white border rounded-xl p-3 mb-3 cursor-pointer ${overdue > 0 ? 'border-l-4 border-l-red-400 rounded-l-none' : 'border-gray-100'}`} onClick={() => navigate(`/vendor/task/${task.id}`)}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold text-sm text-gray-900 flex-1">{task.title}</div>
                {overdue > 0 ? <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{overdue}d late</span> : <span className="text-xs text-gray-400">{formatDate(task.end_date)}</span>}
              </div>
              <div className="text-xs text-gray-400">{task.spaces?.floor} · {task.spaces?.name} · {task.categories?.name}</div>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">Tap to update</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

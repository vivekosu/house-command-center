import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { formatDate, daysOverdue } from '../lib/utils'
import { buildMessage, openWhatsApp } from '../lib/templates'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

function getWeekStart(offset = 0) {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  const start = new Date(d.setDate(diff))
  return start.toISOString().split('T')[0]
}

export default function WeeklyPlan() {
  const { currentUser } = useRole()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [vendors, setVendors] = useState([])
  const [checkedVendors, setCheckedVendors] = useState({})
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(true)

  const weekStart = getWeekStart(weekOffset)
  const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 86400000).toISOString().split('T')[0]

  useEffect(() => { loadData() }, [weekOffset])

  async function loadData() {
    setLoading(true)
    const [{ data: t }, { data: v }] = await Promise.all([
      supabase.from('tasks').select('*, spaces(name,floor), categories(name), task_vendors(vendors(id,name,phone,language_pref))').eq('project_id', import.meta.env.VITE_PROJECT_ID).not('status', 'in', '("done","verified","closed")').lte('end_date', weekEnd).order('end_date'),
      supabase.from('vendors').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true)
    ])
    setTasks(t || [])
    setVendors(v || [])
    setLoading(false)
  }

  function sendWeeklyPlan(vendor) {
    const vendorTasks = tasks.filter(t => t.task_vendors?.some(tv => tv.vendors?.id === vendor.id))
    if (vendorTasks.length === 0) { alert('No tasks for this vendor this week'); return }
    const msg = buildMessage('weekly_plan', {
      vendor: vendor.name,
      weekLabel: `${formatDate(weekStart)} – ${formatDate(weekEnd)}`,
      tasks: vendorTasks.map(t => ({ title: t.title, area: `${t.spaces?.floor} · ${t.spaces?.name}`, date: formatDate(t.end_date) }))
    }, vendor.language_pref)
    openWhatsApp(vendor.phone, msg)
  }

  const vendorTaskMap = {}
  tasks.forEach(t => {
    t.task_vendors?.forEach(tv => {
      if (tv.vendors?.id) {
        if (!vendorTaskMap[tv.vendors.id]) vendorTaskMap[tv.vendors.id] = []
        vendorTaskMap[tv.vendors.id].push(t)
      }
    })
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Weekly Plan" subtitle={`${formatDate(weekStart)} – ${formatDate(weekEnd)}`} />
      <div className="pt-16 px-3">
        <div className="flex items-center justify-between py-3">
          <button onClick={() => setWeekOffset(o => o - 1)} className="text-blue-600 text-sm font-medium">← Prev</button>
          <span className="text-xs text-gray-500 font-medium">{weekOffset === 0 ? 'This Week' : weekOffset > 0 ? `+${weekOffset} weeks` : `${weekOffset} weeks`}</span>
          <button onClick={() => setWeekOffset(o => o + 1)} className="text-blue-600 text-sm font-medium">Next →</button>
        </div>
        {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
        {!loading && Object.keys(vendorTaskMap).length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-2">📅</div><div>No tasks this week</div></div>}
        {vendors.filter(v => vendorTaskMap[v.id]?.length > 0).map(vendor => (
          <div key={vendor.id} className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold text-sm text-gray-900">{vendor.name}</div>
                <div className="text-xs text-gray-400">{vendorTaskMap[vendor.id]?.length} tasks</div>
              </div>
              <button onClick={() => sendWeeklyPlan(vendor)} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium">Send Plan</button>
            </div>
            {vendorTaskMap[vendor.id]?.map(t => (
              <div key={t.id} className="py-1.5 border-t border-gray-50 cursor-pointer" onClick={() => navigate(`/tasks/${t.id}`)}>
                <div className="text-sm text-gray-700">{t.title}</div>
                <div className="text-xs text-gray-400">{t.spaces?.floor} · {t.spaces?.name} · {formatDate(t.end_date)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <BottomNav active="weekly" />
    </div>
  )
}

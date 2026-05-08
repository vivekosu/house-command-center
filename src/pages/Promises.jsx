import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { formatDate } from '../lib/utils'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

export default function Promises() {
  const { currentUser, isEditor } = useRole()
  const navigate = useNavigate()
  const [promises, setPromises] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  useEffect(() => { loadPromises() }, [filter])

  async function loadPromises() {
    setLoading(true)
    let q = supabase.from('promises').select('*, vendors(name,phone), tasks(title)').order('promised_date', { ascending: true })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setPromises(data || [])
    setLoading(false)
  }

  async function markStatus(id, status) {
    await supabase.from('promises').update({ status }).eq('id', id)
    loadPromises()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Promises" />
      <div className="pt-16 px-3">
        <div className="flex gap-2 py-3">
          {['pending','kept','missed','all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>{f}</button>
          ))}
        </div>
        {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
        {!loading && promises.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-2">🤝</div><div>No {filter} promises</div></div>}
        {promises.map(p => (
          <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-3 mb-2">
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="font-semibold text-sm text-gray-900">{p.vendors?.name}</div>
                <div className="text-xs text-gray-400">{p.tasks?.title}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${p.status === 'kept' ? 'bg-green-50 text-green-600' : p.status === 'missed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{p.status}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">{p.promise_type?.replace(/_/g,' ')} · {formatDate(p.promised_date)}{p.workers_promised ? ` · ${p.workers_promised} workers` : ''}</div>
            {p.status === 'pending' && isEditor && (
              <div className="flex gap-2">
                <button onClick={() => markStatus(p.id, 'kept')} className="flex-1 text-xs bg-green-50 text-green-700 py-1.5 rounded-lg font-medium">✓ Kept</button>
                <button onClick={() => markStatus(p.id, 'missed')} className="flex-1 text-xs bg-red-50 text-red-700 py-1.5 rounded-lg font-medium">✗ Missed</button>
                <button onClick={() => markStatus(p.id, 'partial')} className="flex-1 text-xs bg-yellow-50 text-yellow-700 py-1.5 rounded-lg font-medium">~ Partial</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <BottomNav active="" />
    </div>
  )
}

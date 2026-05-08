import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

export default function Vendors() {
  const { currentUser, isEditor } = useRole()
  const navigate = useNavigate()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadVendors() }, [])

  async function loadVendors() {
    const { data } = await supabase.from('vendors').select('*, categories(name,color)').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true).order('name')
    setVendors(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Vendors" rightAction={isEditor && <button onClick={() => navigate('/vendors/new')} className="text-blue-600 font-semibold text-sm">+ Add</button>} />
      <div className="pt-16 px-3 py-3">
        {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
        {!loading && vendors.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-2">👷</div><div>No vendors yet</div></div>}
        {vendors.map(v => (
          <div key={v.id} className={`bg-white border rounded-xl p-3 mb-2 cursor-pointer ${v.payment_hold ? 'border-l-4 border-l-red-400' : 'border-gray-100'}`} onClick={() => navigate(`/vendors/${v.id}`)}>
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-sm text-gray-900">{v.name}</div>
              <div className="flex gap-1.5">
                {v.payment_hold && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">Hold</span>}
                {v.missed_count > 0 && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.missed_count >= 3 ? 'bg-red-50 text-red-600' : v.missed_count >= 2 ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-600'}`}>{v.missed_count} missed</span>}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {v.categories?.name && <span>{v.categories.name}</span>}
              <span>{v.phone}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <a href={`tel:${v.phone}`} onClick={e => e.stopPropagation()} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg">Call</a>
              <a href={`https://wa.me/${v.phone?.replace(/\D/g,'')}`} target="_blank" onClick={e => e.stopPropagation()} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">WhatsApp</a>
            </div>
          </div>
        ))}
      </div>
      <BottomNav active="vendors" />
    </div>
  )
}

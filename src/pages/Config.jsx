import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { generateVendorLink, generateTeamLink } from '../lib/roleLoader'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

export default function Config() {
  const { currentUser, clearUser } = useRole()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [vendors, setVendors] = useState([])
  const [tab, setTab] = useState('team')

  useEffect(() => {
    supabase.from('users').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).then(({data}) => setUsers(data || []))
    supabase.from('vendors').select('*, categories(name)').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true).then(({data}) => setVendors(data || []))
  }, [])

  function copyLink(link) { navigator.clipboard.writeText(link); alert('Link copied!') }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Config" />
      <div className="pt-16 px-3">
        <div className="flex gap-2 py-3">
          {['team','vendors','account'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>{t}</button>
          ))}
        </div>

        {tab === 'team' && (
          <div>
            <div className="text-xs font-bold text-gray-500 mb-2">Team Members</div>
            {users.map(u => (
              <div key={u.id} className="bg-white border border-gray-100 rounded-xl p-3 mb-2 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{u.role} · {u.team_type}</div>
                </div>
                <button onClick={() => copyLink(generateTeamLink(u.access_token))} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">Copy Link</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'vendors' && (
          <div>
            <div className="text-xs font-bold text-gray-500 mb-2">Vendor Portal Links</div>
            {vendors.map(v => (
              <div key={v.id} className="bg-white border border-gray-100 rounded-xl p-3 mb-2 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-gray-900">{v.name}</div>
                  <div className="text-xs text-gray-400">{v.categories?.name}</div>
                </div>
                <button onClick={() => copyLink(generateVendorLink(v.access_token))} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">Copy Link</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'account' && (
          <div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
              <div className="font-medium text-gray-900 mb-1">{currentUser?.name}</div>
              <div className="text-xs text-gray-400 capitalize">{currentUser?.role} · {currentUser?.team_type}</div>
              <div className="text-xs text-gray-400">{currentUser?.phone}</div>
            </div>
            <button onClick={() => { clearUser(); navigate('/') }} className="w-full border border-red-200 text-red-600 py-3 rounded-xl text-sm font-medium">Switch User</button>
          </div>
        )}
      </div>
      <BottomNav active="" />
    </div>
  )
}

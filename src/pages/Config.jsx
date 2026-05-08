import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { generateVendorLink, generateTeamLink } from '../lib/roleLoader'
import ContactPicker from '../components/contacts/ContactPicker'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

const TEAM_TYPES = ['owner', 'family', 'supervisor', 'architect', 'designer', 'controller', 'other']

export default function Config() {
  const { currentUser, clearUser } = useRole()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [vendors, setVendors] = useState([])
  const [categories, setCategories] = useState([])
  const [tab, setTab] = useState('team')

  const [pickerFor, setPickerFor] = useState(null)
  const [addingTeam, setAddingTeam] = useState(false)
  const [addingVendor, setAddingVendor] = useState(false)
  const [teamForm, setTeamForm] = useState({ name: '', phone: '', role: 'editor', team_type: 'family' })
  const [vendorForm, setVendorForm] = useState({ name: '', phone: '', whatsapp_phone: '', category_id: '', language_pref: 'hindi' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: u }, { data: v }, { data: c }] = await Promise.all([
      supabase.from('users').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).order('name'),
      supabase.from('vendors').select('*, categories(name)').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true).order('name'),
      supabase.from('categories').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true).order('name')
    ])
    setUsers(u || [])
    setVendors(v || [])
    setCategories(c || [])
  }

  function copyLink(link) { navigator.clipboard.writeText(link); alert('Link copied!') }

  function startAddTeam() {
    setTeamForm({ name: '', phone: '', role: 'editor', team_type: 'family' })
    setPickerFor('team')
  }
  function startAddVendor() {
    setVendorForm({ name: '', phone: '', whatsapp_phone: '', category_id: '', language_pref: 'hindi' })
    setPickerFor('vendor')
  }

  function handleContactPicked({ name, phone }) {
    if (pickerFor === 'team') {
      setTeamForm(f => ({ ...f, name, phone }))
      setAddingTeam(true)
    } else if (pickerFor === 'vendor') {
      setVendorForm(f => ({ ...f, name, phone, whatsapp_phone: phone }))
      setAddingVendor(true)
    }
    setPickerFor(null)
  }

  async function saveTeamMember() {
    if (!teamForm.name.trim()) return alert('Name is required')
    const { error } = await supabase.from('users').insert({
      project_id: import.meta.env.VITE_PROJECT_ID,
      name: teamForm.name.trim(),
      phone: teamForm.phone.trim() || null,
      role: teamForm.role,
      team_type: teamForm.team_type,
      is_active: true
    })
    if (error) return alert('Failed: ' + error.message)
    setAddingTeam(false)
    loadAll()
  }

  async function saveVendor() {
    if (!vendorForm.name.trim() || !vendorForm.phone.trim()) return alert('Name and phone required')
    const { error } = await supabase.from('vendors').insert({
      project_id: import.meta.env.VITE_PROJECT_ID,
      name: vendorForm.name.trim(),
      phone: vendorForm.phone.trim(),
      whatsapp_phone: vendorForm.whatsapp_phone.trim() || vendorForm.phone.trim(),
      category_id: vendorForm.category_id || null,
      language_pref: vendorForm.language_pref,
      is_active: true
    })
    if (error) return alert('Failed: ' + error.message)
    setAddingVendor(false)
    loadAll()
  }

  const teamGroups = TEAM_TYPES.reduce((acc, t) => {
    const list = users.filter(u => (u.team_type || 'other') === t)
    if (list.length > 0) acc[t] = list
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {pickerFor && <ContactPicker onPick={handleContactPicked} onClose={() => setPickerFor(null)} />}

      {addingTeam && (
        <Modal onClose={() => setAddingTeam(false)} title="Add team member" onSave={saveTeamMember}>
          <input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} placeholder="Name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-2" />
          <input value={teamForm.phone} onChange={e => setTeamForm({ ...teamForm, phone: e.target.value })} placeholder="Phone" type="tel" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-2" />
          <select value={teamForm.team_type} onChange={e => setTeamForm({ ...teamForm, team_type: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white mb-2">
            {TEAM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select value={teamForm.role} onChange={e => setTeamForm({ ...teamForm, role: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
            <option value="owner">Owner</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
            <option value="clarifier">Clarifier</option>
          </select>
        </Modal>
      )}

      {addingVendor && (
        <Modal onClose={() => setAddingVendor(false)} title="Add vendor" onSave={saveVendor}>
          <input value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} placeholder="Name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-2" />
          <input value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} placeholder="Phone" type="tel" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-2" />
          <input value={vendorForm.whatsapp_phone} onChange={e => setVendorForm({ ...vendorForm, whatsapp_phone: e.target.value })} placeholder="WhatsApp number (if different)" type="tel" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-2" />
          <select value={vendorForm.category_id} onChange={e => setVendorForm({ ...vendorForm, category_id: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white mb-2">
            <option value="">Category…</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={vendorForm.language_pref} onChange={e => setVendorForm({ ...vendorForm, language_pref: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
            <option value="hindi">Hindi only</option>
            <option value="english">English only</option>
            <option value="bilingual">Bilingual (Eng + Hindi)</option>
          </select>
        </Modal>
      )}

      <Header title="Config" />
      <div className="pt-16 px-3">
        <div className="flex gap-2 py-3">
          {['team', 'vendors', 'account'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>{t}</button>
          ))}
        </div>

        {tab === 'team' && (
          <div>
            <button onClick={startAddTeam} className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold mb-4">
              + Add team member (from contacts)
            </button>
            {Object.keys(teamGroups).length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                <div className="text-3xl mb-2">👥</div>
                <div>No team members yet</div>
                <div className="text-xs mt-1">If you ran seed.sql, refresh — otherwise tap Add above.</div>
              </div>
            )}
            {Object.entries(teamGroups).map(([type, members]) => (
              <div key={type} className="mb-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 capitalize">{type} ({members.length})</div>
                {members.map(u => (
                  <div key={u.id} className="bg-white border border-gray-100 rounded-xl p-3 mb-2 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{u.role}{u.phone ? ` · ${u.phone}` : ''}</div>
                    </div>
                    {u.access_token && (
                      <button onClick={() => copyLink(generateTeamLink(u.access_token))} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">Copy Link</button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === 'vendors' && (
          <div>
            <button onClick={startAddVendor} className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold mb-4">
              + Add vendor (from contacts)
            </button>
            {vendors.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                <div className="text-3xl mb-2">👷</div>
                <div>No vendors yet</div>
              </div>
            )}
            <div className="text-xs font-bold text-gray-500 mb-2">Vendor Portal Links</div>
            {vendors.map(v => (
              <div key={v.id} className="bg-white border border-gray-100 rounded-xl p-3 mb-2 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{v.name}</div>
                  <div className="text-xs text-gray-400">{v.categories?.name || 'No category'} · {v.phone}</div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => navigate(`/vendors/${v.id}`)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">Open</button>
                  <button onClick={() => copyLink(generateVendorLink(v.access_token))} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">Link</button>
                </div>
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
            <button onClick={() => navigate('/templates')} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium mb-2">📝 Manage WhatsApp templates</button>
            <button onClick={() => navigate('/notes')} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium mb-2">🗒 View all notes</button>
            <button onClick={() => navigate('/photos')} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium mb-2">📷 Photo gallery</button>
            <button onClick={() => navigate('/clarifications')} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium mb-2">❓ Clarifications</button>
            <button onClick={() => navigate('/promises')} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium mb-2">🤝 Promises log</button>
            <button onClick={() => navigate('/whatsapp')} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium mb-2">💬 Send WhatsApp</button>
            <button onClick={() => { clearUser(); navigate('/') }} className="w-full border border-red-200 text-red-600 py-3 rounded-xl text-sm font-medium">Switch User</button>
          </div>
        )}
      </div>
      <BottomNav active="" />
    </div>
  )
}

function Modal({ title, children, onClose, onSave }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-md p-5 pb-8" onClick={e => e.stopPropagation()}>
        <div className="w-8 h-1 bg-gray-200 rounded mx-auto mb-4" />
        <div className="font-bold text-gray-900 mb-3">{title}</div>
        {children}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">Cancel</button>
          <button onClick={onSave} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  )
}

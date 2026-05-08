import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { formatDate } from '../lib/utils'
import { generateVendorLink } from '../lib/roleLoader'
import ContactPicker from '../components/contacts/ContactPicker'

export default function VendorDetail() {
  const { id } = useParams()
  const { currentUser, isEditor, isOwner } = useRole()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [tasks, setTasks] = useState([])
  const [promises, setPromises] = useState([])
  const [categories, setCategories] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [showContactPicker, setShowContactPicker] = useState(false)
  const isNew = id === 'new'

  useEffect(() => {
    if (!isNew) loadVendor()
    supabase.from('categories').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).then(({data}) => setCategories(data || []))
  }, [id])

  async function loadVendor() {
    const [{ data: v }, { data: t }, { data: p }] = await Promise.all([
      supabase.from('vendors').select('*, categories(name)').eq('id', id).single(),
      supabase.from('task_vendors').select('*, tasks(id,title,status,end_date)').eq('vendor_id', id),
      supabase.from('promises').select('*').eq('vendor_id', id).order('created_at', { ascending: false })
    ])
    setVendor(v); setForm(v || {}); setTasks(t || []); setPromises(p || [])
  }

  async function save() {
    if (isNew) {
      const { data } = await supabase.from('vendors').insert({ ...form, project_id: import.meta.env.VITE_PROJECT_ID }).select().single()
      navigate(`/vendors/${data.id}`)
    } else {
      await supabase.from('vendors').update(form).eq('id', id)
      setEditing(false); loadVendor()
    }
  }

  if (isNew || editing) return (
    <div className="min-h-screen bg-gray-50">
      {showContactPicker && (
        <ContactPicker
          onClose={() => setShowContactPicker(false)}
          onPick={({ name, phone }) => {
            setForm({ ...form, name, phone, whatsapp_phone: form.whatsapp_phone || phone })
            setShowContactPicker(false)
          }}
        />
      )}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => isNew ? navigate(-1) : setEditing(false)} className="text-blue-600 font-medium text-sm">Cancel</button>
        <div className="flex-1 font-bold text-gray-900 text-sm">{isNew ? 'New Vendor' : 'Edit Vendor'}</div>
        <button onClick={save} className="text-blue-600 font-semibold text-sm">Save</button>
      </div>
      <div className="px-4 py-3 space-y-3">
        <button
          type="button"
          onClick={() => setShowContactPicker(true)}
          className="w-full border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 py-3 rounded-xl text-sm font-semibold"
        >
          📱 Pick from phone contacts
        </button>
        {[['Name','name','text'],['Phone','phone','tel'],['WhatsApp','whatsapp_phone','tel']].map(([label, key, type]) => (
          <input key={key} type={type} value={form[key] || ''} onChange={e => setForm({...form, [key]: e.target.value})} placeholder={label} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none" />
        ))}
        <select value={form.category_id || ''} onChange={e => setForm({...form, category_id: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-white">
          <option value="">Select category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={form.language_pref || 'hindi'} onChange={e => setForm({...form, language_pref: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-white">
          <option value="hindi">Hindi</option>
          <option value="english">English</option>
          <option value="bilingual">Bilingual</option>
        </select>
        <textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes" rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none resize-none" />
      </div>
    </div>
  )

  if (!vendor) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>

  const link = generateVendorLink(vendor.access_token)
  const activeTasks = tasks.filter(tv => tv.tasks && !['done','verified','closed'].includes(tv.tasks.status))

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="text-blue-600 font-medium text-sm">← Back</button>
        <div className="flex-1 font-bold text-gray-900 text-sm">{vendor.name}</div>
        {isEditor && <button onClick={() => setEditing(true)} className="text-blue-600 text-sm">Edit</button>}
      </div>
      <div className="px-4 py-3">
        <div className="flex gap-2 mb-4">
          <a href={`tel:${vendor.phone}`} className="flex-1 bg-green-50 text-green-700 py-2.5 rounded-xl text-sm font-medium text-center">📞 Call</a>
          <a href={`https://wa.me/${vendor.phone?.replace(/\D/g,'')}`} target="_blank" className="flex-1 bg-green-50 text-green-700 py-2.5 rounded-xl text-sm font-medium text-center">💬 WhatsApp</a>
          {isOwner && <button onClick={() => { navigator.clipboard.writeText(link); alert('Link copied!') }} className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-sm font-medium">🔗 Link</button>}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-400 text-xs">Category: </span><span className="text-gray-700">{vendor.categories?.name || '—'}</span></div>
            <div><span className="text-gray-400 text-xs">Language: </span><span className="text-gray-700 capitalize">{vendor.language_pref}</span></div>
            <div><span className="text-gray-400 text-xs">Missed: </span><span className={`font-medium ${vendor.missed_count > 2 ? 'text-red-600' : vendor.missed_count > 0 ? 'text-amber-600' : 'text-green-600'}`}>{vendor.missed_count || 0}</span></div>
            <div><span className="text-gray-400 text-xs">Payment: </span><span className={`font-medium ${vendor.payment_hold ? 'text-red-600' : 'text-green-600'}`}>{vendor.payment_hold ? 'On Hold' : 'Active'}</span></div>
          </div>
          {vendor.notes && <div className="mt-2 text-xs text-gray-500 border-t border-gray-50 pt-2">{vendor.notes}</div>}
        </div>

        {activeTasks.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
            <div className="text-xs font-bold text-gray-500 mb-2">Active Tasks ({activeTasks.length})</div>
            {activeTasks.map(tv => (
              <div key={tv.id} className="py-1.5 border-b border-gray-50 last:border-0 cursor-pointer" onClick={() => navigate(`/tasks/${tv.tasks.id}`)}>
                <div className="text-sm text-gray-700">{tv.tasks.title}</div>
                <div className="text-xs text-gray-400">{tv.tasks.status?.replace('_',' ')} · {formatDate(tv.tasks.end_date)}</div>
              </div>
            ))}
          </div>
        )}

        {promises.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-3">
            <div className="text-xs font-bold text-gray-500 mb-2">Recent Promises ({promises.length})</div>
            {promises.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="text-xs text-gray-700">{p.promise_type?.replace('_',' ')} · {formatDate(p.promised_date)}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'kept' ? 'bg-green-50 text-green-600' : p.status === 'missed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

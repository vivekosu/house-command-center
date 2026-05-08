import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { daysOverdue, formatDate, escalationLevel } from '../lib/utils'
import PhotoUpload from '../components/ui/PhotoUpload'

const STATUSES = ['planned','in_progress','waiting_vendor','waiting_material','waiting_decision','blocked','delayed','done','verified']

export default function TaskDetail() {
  const { id } = useParams()
  const { currentUser, isEditor } = useRole()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [notes, setNotes] = useState([])
  const [photos, setPhotos] = useState([])
  const [promises, setPromises] = useState([])
  const [note, setNote] = useState('')
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const isNew = id === 'new'

  useEffect(() => { if (!isNew) loadTask() }, [id])

  async function loadTask() {
    const [{ data: t }, { data: n }, { data: p }, { data: ph }] = await Promise.all([
      supabase.from('tasks').select('*, spaces(name,floor), categories(name,color), task_vendors(scope, is_primary, vendors(id,name,phone,missed_count,language_pref))').eq('id', id).single(),
      supabase.from('notes').select('*, users(name)').eq('entity_type', 'task').eq('entity_id', id).order('created_at', { ascending: false }),
      supabase.from('promises').select('*').eq('task_id', id).order('created_at', { ascending: false }),
      supabase.from('photos').select('*, users(name)').eq('task_id', id).order('taken_at', { ascending: false })
    ])
    setTask(t); setNotes(n || []); setPromises(p || []); setPhotos(ph || [])
  }

  async function addNote() {
    if (!note.trim()) return
    await supabase.from('notes').insert({ entity_type: 'task', entity_id: id, content: note, source: 'typed', added_by_user: currentUser?.id })
    setNote(''); loadTask()
  }

  async function updateStatus(status) {
    await supabase.from('tasks').update({ status, ...(status === 'done' ? { actual_end_date: new Date().toISOString() } : {}) }).eq('id', id)
    setShowStatusPicker(false); loadTask()
  }

  if (isNew) return <NewTaskForm navigate={navigate} currentUser={currentUser} />
  if (!task) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>

  const overdue = daysOverdue(task.end_date)
  const vendors = task.task_vendors || []

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {showPhotoUpload && <PhotoUpload taskId={id} userId={currentUser?.id} onClose={() => setShowPhotoUpload(false)} onDone={() => { setShowPhotoUpload(false); loadTask() }} />}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="text-blue-600 font-medium text-sm">← Back</button>
        <div className="flex-1">
          <div className="font-bold text-gray-900 text-sm leading-tight">{task.title}</div>
          <div className="text-xs text-gray-400">{task.spaces?.floor} · {task.spaces?.name}</div>
        </div>
        {overdue > 0 && !['done','verified','closed'].includes(task.status) && <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{overdue}d late</span>}
      </div>

      <div className="px-4 py-3">
        <div className="flex gap-2 mb-3 flex-wrap">
          <button onClick={() => setShowStatusPicker(true)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium">{task.status?.replace('_',' ')} ▾</button>
          {task.categories?.name && <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg">{task.categories.name}</span>}
          {task.priority === 'critical' && <span className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold">Critical</span>}
        </div>

        {showStatusPicker && (
          <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3 shadow-sm">
            <div className="text-xs font-bold text-gray-500 mb-2">Change Status</div>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => <button key={s} onClick={() => updateStatus(s)} className={`text-xs px-2 py-1 rounded-lg border ${task.status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'}`}>{s.replace('_',' ')}</button>)}
            </div>
          </div>
        )}

        {vendors.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
            <div className="text-xs font-bold text-gray-500 mb-2">Vendors</div>
            {vendors.map(tv => {
              const v = tv.vendors; if (!v) return null
              const esc = escalationLevel(v.missed_count || 0)
              return (
                <div key={v.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{v.name}</div>
                    <div className="text-xs text-gray-400">{v.phone} · missed: {v.missed_count || 0}</div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${v.phone}`} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg">Call</a>
                    <a href={`https://wa.me/${v.phone?.replace(/\D/g,'')}`} target="_blank" className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">WhatsApp</a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-gray-500">Dates</div>
          </div>
          <div className="flex gap-4 text-xs text-gray-600">
            {task.start_date && <div><span className="text-gray-400">Start: </span>{formatDate(task.start_date)}</div>}
            {task.end_date && <div><span className="text-gray-400">Due: </span>{formatDate(task.end_date)}</div>}
            {task.actual_end_date && <div><span className="text-gray-400">Done: </span>{formatDate(task.actual_end_date)}</div>}
          </div>
        </div>

        {promises.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
            <div className="text-xs font-bold text-gray-500 mb-2">Promises ({promises.length})</div>
            {promises.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                <div className="text-xs text-gray-700">{p.promise_type?.replace('_',' ')} · {formatDate(p.promised_date)}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'kept' ? 'bg-green-50 text-green-600' : p.status === 'missed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}

        {photos.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-bold text-gray-500 mb-2">Photos ({photos.length})</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map(ph => <img key={ph.id} src={ph.public_url} alt={ph.description} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />)}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
          <div className="text-xs font-bold text-gray-500 mb-2">Notes ({notes.length})</div>
          {notes.slice(0, 5).map(n => (
            <div key={n.id} className="py-1.5 border-b border-gray-50 last:border-0">
              <div className="text-sm text-gray-700">{n.content}</div>
              <div className="text-xs text-gray-400 mt-0.5">{n.users?.name} · {new Date(n.created_at).toLocaleDateString()}</div>
            </div>
          ))}
          {isEditor && (
            <div className="flex gap-2 mt-2">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add note..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none" onKeyDown={e => e.key === 'Enter' && addNote()} />
              <button onClick={addNote} className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg">Add</button>
            </div>
          )}
        </div>

        {isEditor && (
          <button onClick={() => setShowPhotoUpload(true)} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium">📷 Add Photo</button>
        )}
      </div>
    </div>
  )
}

function NewTaskForm({ navigate, currentUser }) {
  const [form, setForm] = useState({ title: '', status: 'planned', priority: 'normal', end_date: '' })
  const [spaces, setSpaces] = useState([])
  const [categories, setCategories] = useState([])
  const [vendors, setVendors] = useState([])
  const [selectedSpace, setSelectedSpace] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedVendors, setSelectedVendors] = useState([])

  useEffect(() => {
    Promise.all([
      supabase.from('spaces').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID),
      supabase.from('categories').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true),
      supabase.from('vendors').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true)
    ]).then(([{data: s}, {data: c}, {data: v}]) => {
      setSpaces(s || []); setCategories(c || []); setVendors(v || [])
    })
  }, [])

  async function save() {
    if (!form.title.trim()) return
    const { data: task } = await supabase.from('tasks').insert({ ...form, project_id: import.meta.env.VITE_PROJECT_ID, space_id: selectedSpace || null, category_id: selectedCategory || null, created_by: currentUser?.id }).select().single()
    if (task && selectedVendors.length > 0) {
      await supabase.from('task_vendors').insert(selectedVendors.map(vid => ({ task_id: task.id, vendor_id: vid, is_primary: true })))
    }
    navigate(`/tasks/${task.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="text-blue-600 font-medium text-sm">Cancel</button>
        <div className="flex-1 font-bold text-gray-900 text-sm">New Task</div>
        <button onClick={save} className="text-blue-600 font-semibold text-sm">Save</button>
      </div>
      <div className="px-4 py-3 space-y-3">
        <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Task title" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none" />
        <select value={selectedSpace} onChange={e => setSelectedSpace(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-white">
          <option value="">Select space</option>
          {spaces.map(s => <option key={s.id} value={s.id}>{s.floor} · {s.name}</option>)}
        </select>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-white">
          <option value="">Select category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none" />
        <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-white">
          <option value="normal">Normal priority</option>
          <option value="critical">Critical</option>
          <option value="low">Low</option>
        </select>
        <div>
          <div className="text-xs font-bold text-gray-500 mb-2">Vendors</div>
          {vendors.map(v => (
            <label key={v.id} className="flex items-center gap-2 py-1.5">
              <input type="checkbox" checked={selectedVendors.includes(v.id)} onChange={e => setSelectedVendors(e.target.checked ? [...selectedVendors, v.id] : selectedVendors.filter(id => id !== v.id))} />
              <span className="text-sm text-gray-700">{v.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

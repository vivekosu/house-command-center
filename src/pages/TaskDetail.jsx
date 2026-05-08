import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { daysOverdue, formatDate, escalationLevel } from '../lib/utils'
import { startVoiceRecognition, parseTranscriptToTask } from '../lib/voice'
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
  const [editingDates, setEditingDates] = useState(false)
  const [dateForm, setDateForm] = useState({ start_date: '', end_date: '' })
  const [showPromiseForm, setShowPromiseForm] = useState(false)
  const [promiseForm, setPromiseForm] = useState({
    vendor_id: '',
    promise_type: 'complete_work',
    promised_date: new Date().toISOString().split('T')[0],
    workers_promised: '',
    description: ''
  })
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
    if (t) setDateForm({ start_date: t.start_date || '', end_date: t.end_date || '' })
  }

  async function saveDates() {
    const payload = {
      start_date: dateForm.start_date && dateForm.start_date.trim() ? dateForm.start_date : null,
      end_date: dateForm.end_date && dateForm.end_date.trim() ? dateForm.end_date : null,
    }
    const { error } = await supabase.from('tasks').update(payload).eq('id', id)
    if (error) return alert('Failed: ' + error.message)
    setEditingDates(false)
    loadTask()
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

  async function savePromise() {
    if (!promiseForm.vendor_id) return alert('Pick a vendor')
    if (!promiseForm.promised_date) return alert('Pick a date')
    const payload = {
      task_id: id,
      vendor_id: promiseForm.vendor_id,
      promise_type: promiseForm.promise_type,
      promised_date: promiseForm.promised_date,
      workers_promised: promiseForm.workers_promised ? parseInt(promiseForm.workers_promised) : null,
      description: promiseForm.description.trim() || null,
      status: 'pending',
      logged_by: currentUser?.id
    }
    const { error } = await supabase.from('promises').insert(payload)
    if (error) return alert('Failed: ' + error.message)
    setShowPromiseForm(false)
    setPromiseForm({ vendor_id: '', promise_type: 'complete_work', promised_date: new Date().toISOString().split('T')[0], workers_promised: '', description: '' })
    loadTask()
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
                <div key={v.id} className="py-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{v.name}</div>
                      <div className="text-xs text-gray-400">{v.phone} · missed: {v.missed_count || 0}</div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${v.phone}`} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg">Call</a>
                      <a href={`https://wa.me/${v.phone?.replace(/\D/g,'')}`} target="_blank" className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">WhatsApp</a>
                    </div>
                  </div>
                  {esc && (
                    <div className={`mt-1.5 text-[11px] px-2 py-1 rounded-lg font-medium ${esc.level <= 2 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                      ⚠️ Escalation level {esc.level}: {esc.action}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-gray-500">Dates</div>
            {isEditor && <button onClick={() => setEditingDates(!editingDates)} className="text-xs text-blue-600 font-medium">{editingDates ? 'Cancel' : 'Edit'}</button>}
          </div>
          {!editingDates && (
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <div><span className="text-gray-400">Task given: </span>{task.start_date ? formatDate(task.start_date) : '—'}</div>
              <div><span className="text-gray-400">Target: </span>{task.end_date ? formatDate(task.end_date) : '—'}</div>
              {task.actual_end_date && <div><span className="text-gray-400">Done: </span>{formatDate(task.actual_end_date)}</div>}
            </div>
          )}
          {editingDates && (
            <div className="space-y-2">
              <div>
                <div className="text-[11px] font-bold text-gray-500 mb-0.5">Task given (start)</div>
                <input type="date" value={dateForm.start_date} onChange={e => setDateForm({...dateForm, start_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-500 mb-0.5">Target completion (due)</div>
                <input type="date" value={dateForm.end_date} onChange={e => setDateForm({...dateForm, end_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
              <button onClick={saveDates} className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold">Save dates</button>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-gray-500">Promises ({promises.length})</div>
            {isEditor && vendors.length > 0 && (
              <button onClick={() => { setPromiseForm({ ...promiseForm, vendor_id: vendors[0]?.vendors?.id || '' }); setShowPromiseForm(true) }} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium">+ Log promise</button>
            )}
          </div>
          {promises.length === 0 && <div className="text-xs text-gray-400 py-2">No promises logged yet</div>}
          {promises.slice(0, 5).map(p => (
            <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex-1">
                <div className="text-xs text-gray-700">{p.promise_type?.replace(/_/g,' ')} · {formatDate(p.promised_date)}{p.workers_promised ? ` · ${p.workers_promised} workers` : ''}</div>
                {p.description && <div className="text-[11px] text-gray-400 mt-0.5">{p.description}</div>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'kept' ? 'bg-green-50 text-green-600' : p.status === 'missed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{p.status}</span>
            </div>
          ))}
        </div>

        {showPromiseForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowPromiseForm(false)}>
            <div className="bg-white rounded-t-2xl w-full max-w-md p-5 pb-8" onClick={e => e.stopPropagation()}>
              <div className="w-8 h-1 bg-gray-200 rounded mx-auto mb-4" />
              <div className="font-bold text-gray-900 mb-3">Log a promise</div>
              <select value={promiseForm.vendor_id} onChange={e => setPromiseForm({ ...promiseForm, vendor_id: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white mb-2">
                <option value="">Pick vendor…</option>
                {vendors.map(tv => tv.vendors && <option key={tv.vendors.id} value={tv.vendors.id}>{tv.vendors.name}</option>)}
              </select>
              <select value={promiseForm.promise_type} onChange={e => setPromiseForm({ ...promiseForm, promise_type: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white mb-2">
                <option value="complete_work">Complete work</option>
                <option value="start_work">Start work</option>
                <option value="send_workers">Send workers</option>
                <option value="deliver_material">Deliver material</option>
                <option value="send_invoice">Send invoice</option>
                <option value="other">Other</option>
              </select>
              <input type="date" value={promiseForm.promised_date} onChange={e => setPromiseForm({ ...promiseForm, promised_date: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-2" />
              <input type="number" value={promiseForm.workers_promised} onChange={e => setPromiseForm({ ...promiseForm, workers_promised: e.target.value })} placeholder="Workers promised (optional)" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-2" />
              <textarea value={promiseForm.description} onChange={e => setPromiseForm({ ...promiseForm, description: e.target.value })} placeholder="Description (optional)" rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none mb-3" />
              <div className="flex gap-2">
                <button onClick={() => setShowPromiseForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">Cancel</button>
                <button onClick={savePromise} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold">Save promise</button>
              </div>
            </div>
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
  const [form, setForm] = useState({ title: '', status: 'planned', priority: 'normal', start_date: '', end_date: '' })
  const [spaces, setSpaces] = useState([])
  const [categories, setCategories] = useState([])
  const [vendors, setVendors] = useState([])
  const [selectedSpace, setSelectedSpace] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedVendors, setSelectedVendors] = useState([])
  const [recording, setRecording] = useState(false)
  const [recRef, setRecRef] = useState(null)
  const [voiceLang, setVoiceLang] = useState('en-IN')

  useEffect(() => {
    Promise.all([
      supabase.from('spaces').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID),
      supabase.from('categories').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true),
      supabase.from('vendors').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true)
    ]).then(([{data: s}, {data: c}, {data: v}]) => {
      setSpaces(s || []); setCategories(c || []); setVendors(v || [])
    })
  }, [])

  function toggleVoice() {
    if (recording) {
      recRef?.stop()
      setRecording(false)
      return
    }
    setRecording(true)
    const r = startVoiceRecognition({
      lang: voiceLang,
      onResult: (text) => {
        const parsed = parseTranscriptToTask(text)
        // Try to match suggested floor and category to actual records
        const matchSpace = spaces.find(s => s.floor === parsed.floor)
        const matchCat = categories.find(c => c.name.toLowerCase() === parsed.category.toLowerCase())
        setForm(f => ({ ...f, title: parsed.title, priority: parsed.priority }))
        if (matchSpace) setSelectedSpace(matchSpace.id)
        if (matchCat) setSelectedCategory(matchCat.id)
      },
      onEnd: () => setRecording(false),
      onError: (err) => { setRecording(false); alert('Voice error: ' + err) }
    })
    setRecRef(r)
    if (!r) setRecording(false)
  }

  async function save() {
    if (!form.title.trim()) return alert('Please enter a task title')
    // Convert empty date strings to null (Postgres rejects "" for date columns)
    const cleanForm = {
      ...form,
      end_date: form.end_date && form.end_date.trim() ? form.end_date : null,
      start_date: form.start_date && form.start_date.trim() ? form.start_date : null,
    }
    const payload = {
      ...cleanForm,
      project_id: import.meta.env.VITE_PROJECT_ID,
      space_id: selectedSpace || null,
      category_id: selectedCategory || null,
      created_by: currentUser?.id || null
    }
    const { data: task, error } = await supabase.from('tasks').insert(payload).select().single()
    if (error) { alert('Failed to save: ' + error.message + '\n\nDetails: ' + (error.details || 'none') + '\nHint: ' + (error.hint || 'none')); return }
    if (!task) { alert('No task returned by server'); return }
    if (selectedVendors.length > 0) {
      const { error: tvErr } = await supabase.from('task_vendors').insert(selectedVendors.map(vid => ({ task_id: task.id, vendor_id: vid, is_primary: true })))
      if (tvErr) alert('Task saved but vendors not linked: ' + tvErr.message)
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setVoiceLang('en-IN'); setTimeout(toggleVoice, 0) }}
            disabled={recording}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold ${recording && voiceLang === 'en-IN' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-700 border-2 border-dashed border-blue-300'} disabled:opacity-50`}
          >
            {recording && voiceLang === 'en-IN' ? '⏹ Stop' : '🎤 Speak (English)'}
          </button>
          <button
            type="button"
            onClick={() => { setVoiceLang('hi-IN'); setTimeout(toggleVoice, 0) }}
            disabled={recording}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold ${recording && voiceLang === 'hi-IN' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-orange-50 text-orange-700 border-2 border-dashed border-orange-300'} disabled:opacity-50`}
          >
            {recording && voiceLang === 'hi-IN' ? '⏹ रोकें' : '🎤 बोलें (हिंदी)'}
          </button>
        </div>
        {recording && (
          <button type="button" onClick={toggleVoice} className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium">⏹ Stop recording</button>
        )}
        <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Task title" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none" />
        <select value={selectedSpace} onChange={e => setSelectedSpace(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-white">
          <option value="">Select space</option>
          {spaces.map(s => <option key={s.id} value={s.id}>{s.floor} · {s.name}</option>)}
        </select>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-white">
          <option value="">Select category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div>
          <div className="text-xs font-bold text-gray-500 mb-1">Task given (start date)</div>
          <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none" />
        </div>
        <div>
          <div className="text-xs font-bold text-gray-500 mb-1">Target completion (due date)</div>
          <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none" />
        </div>
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

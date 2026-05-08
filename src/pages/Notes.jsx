import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { startVoiceRecognition } from '../lib/voice'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

export default function Notes() {
  const { currentUser, isEditor } = useRole()
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [entityType, setEntityType] = useState('task')
  const [entityId, setEntityId] = useState('')
  const [tasks, setTasks] = useState([])
  const [vendors, setVendors] = useState([])
  const [recording, setRecording] = useState(false)
  const [usedVoice, setUsedVoice] = useState(false)
  const [voiceLang, setVoiceLang] = useState('en-IN')
  const recRef = useRef(null)

  useEffect(() => { loadNotes() }, [filter])
  useEffect(() => {
    supabase.from('tasks').select('id,title').eq('project_id', import.meta.env.VITE_PROJECT_ID)
      .order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => setTasks(data || []))
    supabase.from('vendors').select('id,name').eq('project_id', import.meta.env.VITE_PROJECT_ID)
      .eq('is_active', true).order('name')
      .then(({ data }) => setVendors(data || []))
  }, [])

  async function loadNotes() {
    setLoading(true)
    const { data: projectTasks } = await supabase
      .from('tasks').select('id,title').eq('project_id', import.meta.env.VITE_PROJECT_ID)
    const { data: projectVendors } = await supabase
      .from('vendors').select('id,name').eq('project_id', import.meta.env.VITE_PROJECT_ID)

    const taskMap = Object.fromEntries((projectTasks || []).map(t => [t.id, t.title]))
    const vendorMap = Object.fromEntries((projectVendors || []).map(v => [v.id, v.name]))
    const taskIds = Object.keys(taskMap)
    const vendorIds = Object.keys(vendorMap)

    let combined = []

    if ((filter === 'all' || filter === 'task') && taskIds.length > 0) {
      const { data } = await supabase.from('notes')
        .select('*, users(name), vendors(name)')
        .eq('entity_type', 'task').in('entity_id', taskIds)
        .order('created_at', { ascending: false }).limit(100)
      combined = combined.concat((data || []).map(n => ({ ...n, entityName: taskMap[n.entity_id] || '—' })))
    }
    if ((filter === 'all' || filter === 'vendor') && vendorIds.length > 0) {
      const { data } = await supabase.from('notes')
        .select('*, users(name), vendors(name)')
        .eq('entity_type', 'vendor').in('entity_id', vendorIds)
        .order('created_at', { ascending: false }).limit(100)
      combined = combined.concat((data || []).map(n => ({ ...n, entityName: vendorMap[n.entity_id] || '—' })))
    }

    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setNotes(combined)
    setLoading(false)
  }

  function toggleVoice() {
    if (recording) {
      recRef.current?.stop()
      setRecording(false)
      return
    }
    setRecording(true)
    setUsedVoice(true)
    recRef.current = startVoiceRecognition({
      lang: voiceLang,
      onResult: (text) => setContent(c => c ? `${c} ${text}` : text),
      onEnd: () => setRecording(false),
      onError: (err) => { setRecording(false); alert('Voice error: ' + err) }
    })
    if (!recRef.current) setRecording(false)
  }

  async function saveNote() {
    if (!content.trim()) return alert('Please type or speak something first.')
    if (!entityId) return alert('Please pick a task or vendor.')
    const payload = {
      entity_type: entityType,
      entity_id: entityId,
      content: content.trim(),
      source: usedVoice ? 'voice' : 'typed',
      added_by_user: currentUser?.roleType === 'team' ? currentUser?.id : null,
      added_by_vendor: currentUser?.roleType === 'vendor' ? currentUser?.id : null
    }
    const { error } = await supabase.from('notes').insert(payload)
    if (error) return alert('Failed: ' + error.message)
    setContent('')
    setEntityId('')
    setUsedVoice(false)
    setShowForm(false)
    loadNotes()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Notes" rightAction={isEditor && <button onClick={() => setShowForm(true)} className="text-blue-600 font-semibold text-sm">+ Add</button>} />

      <div className="pt-16 px-3">
        <div className="flex gap-2 py-3">
          {['all', 'task', 'vendor'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
              {f === 'all' ? 'All' : f === 'task' ? 'Task notes' : 'Vendor notes'}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
            <div className="flex gap-2 mb-2">
              <select value={entityType} onChange={e => { setEntityType(e.target.value); setEntityId('') }} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white">
                <option value="task">Task</option>
                <option value="vendor">Vendor</option>
              </select>
              <select value={entityId} onChange={e => setEntityId(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white">
                <option value="">Pick {entityType}…</option>
                {(entityType === 'task' ? tasks : vendors).map(item => (
                  <option key={item.id} value={item.id}>{item.title || item.name}</option>
                ))}
              </select>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Type the note, or tap mic to speak…"
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none resize-none mb-2"
            />
            <div className="flex gap-2 mb-2">
              <span className="text-xs text-gray-500 self-center mr-1">Voice in:</span>
              {[['en-IN', 'English'], ['hi-IN', 'Hindi']].map(([code, label]) => (
                <button key={code} onClick={() => setVoiceLang(code)} className={`text-xs px-3 py-1 rounded-full ${voiceLang === code ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{label}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={toggleVoice} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${recording ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-700'}`}>
                {recording ? '⏹ Stop recording' : '🎤 Voice note'}
              </button>
              <button onClick={() => { setShowForm(false); setContent(''); setEntityId(''); setUsedVoice(false) }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={saveNote} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold">Save</button>
            </div>
            <div className="text-[11px] text-gray-400 mt-2">Speak in the selected language. The app does NOT translate — speak the language you want stored.</div>
          </div>
        )}

        {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading notes…</div>}
        {!loading && notes.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-3xl mb-2">🗒</div>
            <div>No notes yet</div>
            <div className="text-xs mt-1">Tap + Add to write or speak the first note.</div>
          </div>
        )}

        {notes.map(n => (
          <div key={n.id} className="bg-white border border-gray-100 rounded-xl p-3 mb-2 cursor-pointer"
            onClick={() => n.entity_type === 'task' ? navigate(`/tasks/${n.entity_id}`) : navigate(`/vendors/${n.entity_id}`)}>
            <div className="text-sm text-gray-800 mb-1 whitespace-pre-wrap">{n.content}</div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div>
                <span className={`px-1.5 py-0.5 rounded ${n.entity_type === 'task' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {n.entity_type === 'task' ? 'Task' : 'Vendor'}
                </span>
                <span className="ml-1.5">{n.entityName}</span>
              </div>
              <div>
                {n.source === 'voice' && <span className="mr-1">🎤</span>}
                {n.users?.name || n.vendors?.name || '—'} · {new Date(n.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="notes" />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../context/RoleContext'
import { formatDate } from '../../lib/utils'
import PhotoUpload from '../../components/ui/PhotoUpload'

const STATUSES = ['planned','in_progress','waiting_material','waiting_decision','done']

export default function VendorTask() {
  const { id } = useParams()
  const { currentUser } = useRole()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [photos, setPhotos] = useState([])
  const [note, setNote] = useState('')
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)

  useEffect(() => { loadTask() }, [id])

  async function loadTask() {
    const [{ data: t }, { data: ph }] = await Promise.all([
      supabase.from('tasks').select('*, spaces(name,floor), categories(name)').eq('id', id).single(),
      supabase.from('photos').select('*').eq('task_id', id).order('taken_at', { ascending: false })
    ])
    setTask(t); setPhotos(ph || [])
  }

  async function updateStatus(status) {
    await supabase.from('tasks').update({ status }).eq('id', id)
    loadTask()
  }

  async function addNote() {
    if (!note.trim()) return
    await supabase.from('notes').insert({ entity_type: 'task', entity_id: id, content: note, source: 'typed', added_by_vendor: currentUser?.id })
    setNote(''); loadTask()
  }

  if (!task) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {showPhotoUpload && <PhotoUpload taskId={id} userId={null} onClose={() => setShowPhotoUpload(false)} onDone={() => { setShowPhotoUpload(false); loadTask() }} />}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="text-blue-600 font-medium text-sm">← Back</button>
        <div className="flex-1">
          <div className="font-bold text-gray-900 text-sm">{task.title}</div>
          <div className="text-xs text-gray-400">{task.spaces?.floor} · {task.spaces?.name}</div>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
          <div className="text-xs font-bold text-gray-500 mb-2">Update Status</div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button key={s} onClick={() => updateStatus(s)} className={`text-xs px-3 py-1.5 rounded-lg border ${task.status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'}`}>{s.replace('_',' ')}</button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
          <div className="text-xs font-bold text-gray-500 mb-2">Add Note</div>
          <div className="flex gap-2">
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Progress update..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none" onKeyDown={e => e.key === 'Enter' && addNote()} />
            <button onClick={addNote} className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg">Send</button>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-bold text-gray-500 mb-2">Photos ({photos.length})</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map(ph => <img key={ph.id} src={ph.public_url} alt={ph.description} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />)}
            </div>
          </div>
        )}

        <button onClick={() => setShowPhotoUpload(true)} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium">📷 Upload Progress Photo</button>
      </div>
    </div>
  )
}

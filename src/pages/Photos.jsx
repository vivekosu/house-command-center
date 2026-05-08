import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { formatDate } from '../lib/utils'
import PhotoUpload from '../components/ui/PhotoUpload'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

export default function Photos() {
  const { currentUser, isEditor, isOwner } = useRole()
  const navigate = useNavigate()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selected, setSelected] = useState(null)
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => { loadPhotos() }, [])

  async function loadPhotos() {
    setLoading(true)

    // Get task IDs and vendor IDs for THIS project
    const { data: projectTasks } = await supabase
      .from('tasks').select('id, title')
      .eq('project_id', import.meta.env.VITE_PROJECT_ID)
    const { data: projectVendors } = await supabase
      .from('vendors').select('id, name')
      .eq('project_id', import.meta.env.VITE_PROJECT_ID)

    const taskMap = Object.fromEntries((projectTasks || []).map(t => [t.id, t.title]))
    const vendorMap = Object.fromEntries((projectVendors || []).map(v => [v.id, v.name]))
    const taskIds = Object.keys(taskMap)
    const vendorIds = Object.keys(vendorMap)

    // Fetch all photos that belong to a task or vendor in this project,
    // OR that have no task/vendor link (orphan uploads also visible)
    const { data: allPhotos, error } = await supabase
      .from('photos')
      .select('*')
      .order('taken_at', { ascending: false })
      .limit(200)

    if (error) {
      setDebugInfo('Error loading photos: ' + error.message)
      setLoading(false)
      return
    }

    const filtered = (allPhotos || []).filter(p => {
      // include if linked to a task in this project
      if (p.task_id && taskIds.includes(p.task_id)) return true
      // include if linked to a vendor in this project
      if (p.vendor_id && vendorIds.includes(p.vendor_id)) return true
      // include if no link at all (orphan upload)
      if (!p.task_id && !p.vendor_id) return true
      return false
    }).map(p => ({
      ...p,
      taskTitle: p.task_id ? taskMap[p.task_id] : null,
      vendorName: p.vendor_id ? vendorMap[p.vendor_id] : null,
    }))

    setPhotos(filtered)
    setDebugInfo(`Found ${allPhotos?.length || 0} total photos in DB, ${filtered.length} match this project`)
    setLoading(false)
  }

  async function deletePhoto(photo) {
    if (!confirm('Delete this photo permanently? This cannot be undone.')) return
    // Try to delete from storage first
    if (photo.storage_path) {
      const { error: storageErr } = await supabase.storage.from('site-photos').remove([photo.storage_path])
      if (storageErr) console.warn('Storage delete failed:', storageErr.message)
    }
    // Then delete the DB row
    const { error } = await supabase.from('photos').delete().eq('id', photo.id)
    if (error) return alert('Failed to delete: ' + error.message)
    setSelected(null)
    loadPhotos()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {showUpload && <PhotoUpload taskId={null} userId={currentUser?.id} onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); loadPhotos() }} />}
      {selected && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col" onClick={() => setSelected(null)}>
          <div className="flex items-center justify-between p-3" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="text-white text-sm font-medium px-3 py-1.5">✕ Close</button>
            {isOwner && (
              <button onClick={() => deletePhoto(selected)} className="bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg">🗑 Delete</button>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center px-3">
            <img src={selected.public_url} alt={selected.description} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="text-white text-sm text-center px-4 pb-8">
            {selected.description}
            {selected.taskTitle && <div className="text-xs opacity-75 mt-1">Task: {selected.taskTitle}</div>}
          </div>
        </div>
      )}
      <Header title="Photos" rightAction={isEditor && <button onClick={() => setShowUpload(true)} className="text-blue-600 font-semibold text-sm">+ Add</button>} />
      <div className="pt-16 px-3 py-3">
        {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
        {!loading && photos.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-3xl mb-2">📷</div>
            <div>No photos yet</div>
            <div className="text-xs mt-2 text-gray-300 px-4">{debugInfo}</div>
          </div>
        )}
        {!loading && photos.length > 0 && (
          <div className="text-[11px] text-gray-400 mb-2">{photos.length} photos</div>
        )}
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map(ph => (
            <div key={ph.id} className="aspect-square cursor-pointer relative" onClick={() => setSelected(ph)}>
              <img
                src={ph.public_url}
                alt={ph.description || 'Site photo'}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => { e.target.style.opacity = '0.3'; e.target.alt = 'Failed to load' }}
              />
              {ph.taskTitle && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-b-lg truncate">
                  {ph.taskTitle}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="photos" />
    </div>
  )
}

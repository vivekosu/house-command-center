import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import PhotoUpload from '../components/ui/PhotoUpload'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

export default function Photos() {
  const { currentUser, isEditor } = useRole()
  const navigate = useNavigate()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => { loadPhotos() }, [])

  async function loadPhotos() {
    const { data } = await supabase.from('photos').select('*, tasks(title), users(name), vendors(name)').eq('tasks.project_id', import.meta.env.VITE_PROJECT_ID).order('taken_at', { ascending: false }).limit(100)
    setPhotos(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {showUpload && <PhotoUpload taskId={null} userId={currentUser?.id} onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); loadPhotos() }} />}
      {selected && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <img src={selected.public_url} alt={selected.description} className="max-w-full max-h-full object-contain" />
          <div className="absolute bottom-8 left-4 right-4 text-white text-sm text-center">{selected.description}</div>
        </div>
      )}
      <Header title="Photos" rightAction={isEditor && <button onClick={() => setShowUpload(true)} className="text-blue-600 font-semibold text-sm">+ Add</button>} />
      <div className="pt-16 px-3 py-3">
        {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
        {!loading && photos.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-2">📷</div><div>No photos yet</div></div>}
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map(ph => (
            <div key={ph.id} className="aspect-square cursor-pointer" onClick={() => setSelected(ph)}>
              <img src={ph.public_url} alt={ph.description} className="w-full h-full object-cover rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="photos" />
    </div>
  )
}

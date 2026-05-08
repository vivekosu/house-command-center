import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PhotoUpload({ taskId, userId, onClose, onDone }) {
  const [file, setFile] = useState(null)
  const [desc, setDesc] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  async function upload() {
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `tasks/${taskId || 'general'}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('site-photos').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('site-photos').getPublicUrl(path)
      await supabase.from('photos').insert({
        task_id: taskId || null, storage_path: path, public_url: publicUrl,
        description: desc, uploaded_by_user: userId, taken_at: new Date().toISOString()
      })
      onDone()
    } catch (e) { alert('Upload failed: ' + e.message) }
    setUploading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md p-5 pb-8">
        <div className="w-8 h-1 bg-gray-200 rounded mx-auto mb-4" />
        <div className="font-bold text-gray-900 mb-4">Upload site photo</div>
        {preview
          ? <img src={preview} className="w-full h-48 object-cover rounded-xl mb-3" alt="Preview" />
          : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer mb-3 bg-gray-50">
              <div className="text-3xl mb-2">📷</div>
              <div className="text-sm text-gray-500">Tap to take or choose photo</div>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
            </label>
          )
        }
        <input value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Description (e.g. POP 60% done)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 outline-none" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">Cancel</button>
          <button onClick={upload} disabled={!file || uploading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { buildMessage, openWhatsApp, TEMPLATES } from '../lib/templates'
import { formatDate } from '../lib/utils'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

export default function WhatsAppSend() {
  const { currentUser } = useRole()
  const navigate = useNavigate()
  const [vendors, setVendors] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState('reminder')
  const [preview, setPreview] = useState('')
  const [extraParams, setExtraParams] = useState({ time: '', workers: '2', date: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    supabase.from('vendors').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true).then(({data}) => setVendors(data || []))
    supabase.from('tasks').select('*, spaces(name,floor)').eq('project_id', import.meta.env.VITE_PROJECT_ID).not('status', 'in', '("done","verified","closed")').order('end_date').then(({data}) => setTasks(data || []))
  }, [])

  useEffect(() => { if (selectedVendor) { buildPreview() } else { setPreview('') } }, [selectedVendor, selectedTask, selectedTemplate, extraParams])

  function buildPreview() {
    if (!selectedVendor) return setPreview('')
    const v = vendors.find(v => v.id === selectedVendor)
    const t = tasks.find(t => t.id === selectedTask)
    if (!v) return
    const daysLate = t ? Math.max(0, Math.floor((new Date() - new Date(t.end_date)) / 86400000)) : 0
    const params = {
      vendor: v.name, task: t?.title || '(task)', area: t?.spaces?.name || '(area)', floor: t?.spaces?.floor || '(floor)',
      date: formatDate(extraParams.date), time: extraParams.time, workers: extraParams.workers, daysLate, missCount: v.missed_count || 0
    }
    setPreview(buildMessage(selectedTemplate, params, v.language_pref))
  }

  function send() {
    const v = vendors.find(v => v.id === selectedVendor)
    if (!v || !preview) return
    openWhatsApp(v.whatsapp_phone || v.phone, preview)
    if (selectedTask) {
      supabase.from('wa_log').insert({ vendor_id: v.id, task_id: selectedTask, message_text: preview, sent_by: currentUser?.id })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="WhatsApp" subtitle="Send message to vendor" />
      <div className="pt-16 px-3 py-3 space-y-3">
        <div>
          <div className="text-xs font-bold text-gray-500 mb-1.5">Vendor</div>
          <select value={selectedVendor || ''} onChange={e => setSelectedVendor(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-white">
            <option value="">Select vendor</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-500 mb-1.5">Task (optional)</div>
          <select value={selectedTask || ''} onChange={e => setSelectedTask(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-white">
            <option value="">No specific task</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-500 mb-1.5">Template</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TEMPLATES).map(([key, tpl]) => (
              <button key={key} onClick={() => setSelectedTemplate(key)} className={`text-xs px-3 py-1.5 rounded-full ${selectedTemplate === key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{tpl.name}</button>
            ))}
          </div>
        </div>
        {['confirmation'].includes(selectedTemplate) && (
          <div className="flex gap-2">
            <input type="time" value={extraParams.time} onChange={e => setExtraParams({...extraParams, time: e.target.value})} className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Time" />
            <input type="number" value={extraParams.workers} onChange={e => setExtraParams({...extraParams, workers: e.target.value})} className="w-20 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Workers" />
          </div>
        )}
        {preview && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="text-xs font-bold text-green-700 mb-2">Preview</div>
            <div className="text-xs text-gray-700 whitespace-pre-wrap">{preview}</div>
          </div>
        )}
        <button onClick={send} disabled={!selectedVendor || !preview} className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40">Open WhatsApp & Send</button>
      </div>
      <BottomNav active="" />
    </div>
  )
}

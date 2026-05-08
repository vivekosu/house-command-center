import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { buildMessage, openWhatsApp, TEMPLATES } from '../lib/templates'
import { formatDate } from '../lib/utils'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

export default function WhatsAppSend() {
  const { currentUser } = useRole()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // initial values from URL params (deep-link support from TaskDetail etc.)
  const initRecipientType = searchParams.get('rtype') || (searchParams.get('vendor') ? 'vendor' : '')
  const initRecipientId = searchParams.get('vendor') || searchParams.get('user') || ''
  const initTask = searchParams.get('task') || ''
  const initMode = searchParams.get('mode') || 'template'

  const [vendors, setVendors] = useState([])
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])

  const [recipientType, setRecipientType] = useState(initRecipientType || 'vendor')
  const [recipientId, setRecipientId] = useState(initRecipientId)
  const [selectedTask, setSelectedTask] = useState(initTask)
  const [mode, setMode] = useState(initMode) // 'template' | 'free'
  const [selectedTemplate, setSelectedTemplate] = useState('reminder')
  const [freeMessage, setFreeMessage] = useState('')
  const [preview, setPreview] = useState('')
  const [extraParams, setExtraParams] = useState({ time: '', workers: '2', date: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    supabase.from('vendors').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true).order('name').then(({ data }) => setVendors(data || []))
    supabase.from('users').select('*').eq('project_id', import.meta.env.VITE_PROJECT_ID).eq('is_active', true).order('name').then(({ data }) => setUsers(data || []))
    supabase.from('tasks').select('*, spaces(name,floor)').eq('project_id', import.meta.env.VITE_PROJECT_ID).not('status', 'in', '("done","verified","closed")').order('end_date').then(({ data }) => setTasks(data || []))
  }, [])

  useEffect(() => {
    if (mode === 'free') { setPreview(freeMessage); return }
    buildTemplatePreview()
  }, [recipientType, recipientId, selectedTask, selectedTemplate, extraParams, mode, freeMessage, vendors, users])

  function getRecipient() {
    if (recipientType === 'vendor') return vendors.find(v => v.id === recipientId)
    if (recipientType === 'user') return users.find(u => u.id === recipientId)
    return null
  }

  function getPhone(r) {
    if (!r) return ''
    return r.whatsapp_phone || r.phone || ''
  }

  function getLanguagePref(r) {
    // vendors have language_pref; team members get english by default
    return r?.language_pref || (recipientType === 'vendor' ? 'hindi' : 'english')
  }

  function buildTemplatePreview() {
    const r = getRecipient()
    if (!r) { setPreview(''); return }
    const t = tasks.find(t => t.id === selectedTask)
    const daysLate = t && t.end_date ? Math.max(0, Math.floor((new Date() - new Date(t.end_date)) / 86400000)) : 0
    const params = {
      vendor: r.name,
      task: t?.title || '(no specific task)',
      area: t?.spaces?.name || '—',
      floor: t?.spaces?.floor || '—',
      date: formatDate(extraParams.date),
      time: extraParams.time || '—',
      workers: extraParams.workers || '—',
      daysLate,
      missCount: r.missed_count || 0
    }
    setPreview(buildMessage(selectedTemplate, params, getLanguagePref(r)))
  }

  function send() {
    const r = getRecipient()
    if (!r || !preview) return
    const phone = getPhone(r)
    if (!phone) return alert('No phone number on file for ' + r.name)
    openWhatsApp(phone, preview)
    // Log to wa_log only if recipient is a vendor (schema only has vendor_id)
    if (recipientType === 'vendor') {
      supabase.from('wa_log').insert({
        vendor_id: r.id,
        task_id: selectedTask || null,
        message_text: preview,
        sent_by: currentUser?.id
      })
    }
  }

  const recipientList = recipientType === 'vendor' ? vendors : users

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Send WhatsApp" subtitle="To anyone — vendor, family, team" />
      <div className="pt-16 px-3 py-3 space-y-3">

        {/* Step 1 — recipient type */}
        <div>
          <div className="text-xs font-bold text-gray-500 mb-1.5">Send to</div>
          <div className="flex gap-2">
            {[['vendor', '👷 Vendor'], ['user', '👨‍👩‍👧 Team / Family']].map(([code, label]) => (
              <button
                key={code}
                onClick={() => { setRecipientType(code); setRecipientId('') }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${recipientType === code ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — pick recipient */}
        <div>
          <div className="text-xs font-bold text-gray-500 mb-1.5">{recipientType === 'vendor' ? 'Vendor' : 'Person'}</div>
          <select value={recipientId} onChange={e => setRecipientId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-white">
            <option value="">Select {recipientType === 'vendor' ? 'vendor' : 'person'}…</option>
            {recipientList.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}{r.team_type ? ` (${r.team_type})` : ''}{r.phone ? ` · ${r.phone}` : ''}
              </option>
            ))}
          </select>
          {recipientId && !getPhone(getRecipient()) && (
            <div className="text-xs text-red-600 mt-1">⚠️ No phone number on file. Edit this person to add one.</div>
          )}
        </div>

        {/* Step 3 — task (optional, used for placeholders) */}
        <div>
          <div className="text-xs font-bold text-gray-500 mb-1.5">Related task (optional)</div>
          <select value={selectedTask} onChange={e => setSelectedTask(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-white">
            <option value="">No specific task</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>

        {/* Step 4 — message mode */}
        <div>
          <div className="text-xs font-bold text-gray-500 mb-1.5">Message</div>
          <div className="flex gap-2 mb-2">
            <button onClick={() => setMode('template')} className={`flex-1 py-2 rounded-xl text-xs font-medium ${mode === 'template' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>📋 Use template</button>
            <button onClick={() => setMode('free')} className={`flex-1 py-2 rounded-xl text-xs font-medium ${mode === 'free' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>✏️ Type your own</button>
          </div>

          {mode === 'template' && (
            <>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TEMPLATES).map(([key, tpl]) => (
                  <button key={key} onClick={() => setSelectedTemplate(key)} className={`text-xs px-3 py-1.5 rounded-full ${selectedTemplate === key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{tpl.name}</button>
                ))}
              </div>
              {selectedTemplate === 'confirmation' && (
                <div className="flex gap-2 mt-2">
                  <input type="time" value={extraParams.time} onChange={e => setExtraParams({ ...extraParams, time: e.target.value })} className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                  <input type="number" value={extraParams.workers} onChange={e => setExtraParams({ ...extraParams, workers: e.target.value })} className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Workers" />
                </div>
              )}
            </>
          )}

          {mode === 'free' && (
            <textarea
              value={freeMessage}
              onChange={e => setFreeMessage(e.target.value)}
              placeholder="Type your message here…"
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
            />
          )}
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="text-xs font-bold text-green-700 mb-2">Preview</div>
            <div className="text-xs text-gray-700 whitespace-pre-wrap">{preview}</div>
          </div>
        )}

        <button onClick={send} disabled={!recipientId || !preview} className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40">
          📱 Open WhatsApp & Send
        </button>

        <div className="text-[11px] text-gray-400 text-center">
          You'll review the message in WhatsApp before it's actually sent. Nothing is sent automatically.
        </div>
      </div>
      <BottomNav active="" />
    </div>
  )
}

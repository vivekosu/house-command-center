import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import { TEMPLATES } from '../lib/templates'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

const SAMPLE_PARAMS = { vendor: 'Ramesh ji', task: 'POP work', area: 'Drawing Room', floor: '1st Floor', date: 'today', time: '9:00 AM', workers: '3', daysLate: '2', missCount: '1' }
const PLACEHOLDERS = ['{vendor}', '{task}', '{area}', '{floor}', '{date}', '{time}', '{workers}', '{daysLate}', '{missCount}']

export default function Templates() {
  const { currentUser, isOwner } = useRole()
  const navigate = useNavigate()
  const [custom, setCustom] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('builtin')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', body_en: '', body_hi: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('templates')
      .select('*')
      .eq('project_id', import.meta.env.VITE_PROJECT_ID)
      .eq('is_custom', true)
      .order('created_at', { ascending: false })
    setCustom(data || [])
    setLoading(false)
  }

  function startNew() {
    setEditing(null)
    setForm({ name: '', body_en: '', body_hi: '' })
    setShowForm(true)
  }

  function startEdit(t) {
    setEditing(t)
    setForm({ name: t.name, body_en: t.body_en, body_hi: t.body_hi || '' })
    setShowForm(true)
  }

  async function save() {
    if (!form.name.trim() || !form.body_en.trim()) return alert('Name and English body required')
    const payload = {
      project_id: import.meta.env.VITE_PROJECT_ID,
      name: form.name.trim(),
      type: 'custom',
      body_en: form.body_en,
      body_hi: form.body_hi || null,
      is_custom: true,
      is_system: false,
      created_by: currentUser?.id
    }
    let error
    if (editing) {
      ({ error } = await supabase.from('templates').update(payload).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('templates').insert(payload))
    }
    if (error) return alert('Failed: ' + error.message)
    setShowForm(false); load()
  }

  async function remove(id) {
    if (!confirm('Delete this template?')) return
    const { error } = await supabase.from('templates').delete().eq('id', id)
    if (error) return alert('Failed: ' + error.message)
    load()
  }

  function fillPlaceholders(text) {
    let out = text
    Object.entries(SAMPLE_PARAMS).forEach(([k, v]) => { out = out.replaceAll(`{${k}}`, v) })
    return out
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="WhatsApp Templates" rightAction={isOwner && tab === 'custom' && <button onClick={startNew} className="text-blue-600 font-semibold text-sm">+ Add</button>} />

      <div className="pt-16 px-3">
        <div className="flex gap-2 py-3">
          {[['builtin', 'Built-in'], ['custom', 'My templates']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${tab === id ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>{label}</button>
          ))}
        </div>

        {tab === 'builtin' && Object.entries(TEMPLATES).map(([key, tpl]) => {
          const { en } = tpl.build(SAMPLE_PARAMS)
          return (
            <div key={key} className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
              <div className="font-semibold text-sm text-gray-900 mb-1">{tpl.name}</div>
              <div className="text-xs text-gray-500 whitespace-pre-wrap line-clamp-4">{en}</div>
              <button onClick={() => navigate('/whatsapp')} className="mt-2 text-xs text-blue-600 font-medium">Use this template →</button>
            </div>
          )
        })}

        {tab === 'custom' && (
          <>
            {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
            {!loading && custom.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                <div className="text-3xl mb-2">📝</div>
                <div>No custom templates yet</div>
                {isOwner && <button onClick={startNew} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">+ Add your first template</button>}
              </div>
            )}
            {custom.map(t => (
              <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                  {isOwner && (
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(t)} className="text-xs text-blue-600 px-2 py-0.5">Edit</button>
                      <button onClick={() => remove(t.id)} className="text-xs text-red-600 px-2 py-0.5">Delete</button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 whitespace-pre-wrap line-clamp-3">{fillPlaceholders(t.body_en)}</div>
                {t.body_hi && <div className="text-xs text-gray-400 whitespace-pre-wrap line-clamp-2 mt-1 border-t border-gray-50 pt-1">{fillPlaceholders(t.body_hi)}</div>}
              </div>
            ))}
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-5 pb-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-8 h-1 bg-gray-200 rounded mx-auto mb-4" />
            <div className="font-bold text-gray-900 mb-1">{editing ? 'Edit template' : 'New custom template'}</div>
            <div className="text-xs text-gray-500 mb-3">Use placeholders like {'{vendor}'}, {'{task}'}, {'{date}'}…</div>

            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Template name (e.g. Site visit reminder)" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-2" />

            <div className="text-xs font-bold text-gray-500 mb-1">English message</div>
            <textarea value={form.body_en} onChange={e => setForm({ ...form, body_en: e.target.value })} rows={5} placeholder="Dear {vendor} ji, please send {workers} workers tomorrow..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none mb-2 font-mono" />

            <div className="text-xs font-bold text-gray-500 mb-1">Hindi message (optional)</div>
            <textarea value={form.body_hi} onChange={e => setForm({ ...form, body_hi: e.target.value })} rows={5} placeholder="प्रिय {vendor} जी, कृपया कल {workers} मजदूर भेजें..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none mb-2 font-mono" />

            <div className="text-[11px] text-gray-400 mb-2">Placeholders: {PLACEHOLDERS.join(' ')}</div>

            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">Cancel</button>
              <button onClick={save} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold">{editing ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="" />
    </div>
  )
}

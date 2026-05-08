import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

export default function Clarifications() {
  const { currentUser, isEditor } = useRole()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ question: '', assigned_to: '' })
  const [users, setUsers] = useState([])

  useEffect(() => {
    supabase.from('users').select('id,name').eq('project_id', import.meta.env.VITE_PROJECT_ID)
      .then(({ data }) => setUsers(data || []))
  }, [])

  useEffect(() => { loadData() }, [filter])

  async function loadData() {
    setLoading(true)
    let q = supabase.from('clarifications').select('*, assigned_user:users!clarifications_assigned_to_fkey(name)').eq('project_id', import.meta.env.VITE_PROJECT_ID).order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data: c } = await q
    setItems(c || [])
    setLoading(false)
  }

  async function addClarification() {
    if (!form.question.trim()) return
    await supabase.from('clarifications').insert({ ...form, project_id: import.meta.env.VITE_PROJECT_ID, raised_by: currentUser?.id, status: 'open', assigned_to: form.assigned_to || null })
    setForm({ question: '', assigned_to: '' }); setShowForm(false); loadData()
  }

  async function resolve(id, answer) {
    await supabase.from('clarifications').update({ status: 'answered', answer, answered_at: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Clarifications" rightAction={isEditor && <button onClick={() => setShowForm(true)} className="text-blue-600 font-semibold text-sm">+ Add</button>} />
      <div className="pt-16 px-3">
        <div className="flex gap-2 py-3">
          {['open','answered','all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>{f}</button>
          ))}
        </div>
        {showForm && (
          <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
            <textarea value={form.question} onChange={e => setForm({...form, question: e.target.value})} placeholder="What needs clarification?" rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none resize-none mb-2" />
            <select value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white mb-2">
              <option value="">Assign to (optional)</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={addClarification} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold">Add</button>
            </div>
          </div>
        )}
        {loading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
        {!loading && items.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-2">❓</div><div>No {filter} clarifications</div></div>}
        {items.map(item => <ClarificationCard key={item.id} item={item} isEditor={isEditor} onResolve={resolve} />)}
      </div>
      <BottomNav active="" />
    </div>
  )
}

function ClarificationCard({ item, isEditor, onResolve }) {
  const [answer, setAnswer] = useState('')
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 mb-2">
      <div className="text-sm text-gray-800 font-medium mb-1">{item.question}</div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-400">Assigned to: {item.assigned_user?.name || 'Unassigned'}</div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'answered' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{item.status}</span>
      </div>
      {item.answer && <div className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-2">{item.answer}</div>}
      {item.status === 'open' && isEditor && (
        <div className="flex gap-2 mt-2">
          <input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Answer..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none" />
          <button onClick={() => answer && onResolve(item.id, answer)} className="text-sm bg-green-600 text-white px-3 py-2 rounded-lg">Answer</button>
        </div>
      )}
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { TEMPLATES } from '../lib/templates'
import BottomNav from '../components/ui/BottomNav'
import Header from '../components/ui/Header'

export default function Templates() {
  const navigate = useNavigate()
  const sampleParams = { vendor: 'Ramesh ji', task: 'POP work', area: 'Drawing Room', floor: '1st Floor', date: 'today', time: '9:00 AM', workers: '3', daysLate: '2', missCount: '1' }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Message Templates" />
      <div className="pt-16 px-3 py-3">
        {Object.entries(TEMPLATES).map(([key, tpl]) => {
          const { en } = tpl.build(sampleParams)
          return (
            <div key={key} className="bg-white border border-gray-100 rounded-xl p-3 mb-3">
              <div className="font-semibold text-sm text-gray-900 mb-1">{tpl.name}</div>
              <div className="text-xs text-gray-500 whitespace-pre-wrap line-clamp-4">{en}</div>
              <button onClick={() => navigate('/whatsapp')} className="mt-2 text-xs text-blue-600 font-medium">Use this template →</button>
            </div>
          )
        })}
      </div>
      <BottomNav active="" />
    </div>
  )
}

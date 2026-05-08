import { useRole } from '../../context/RoleContext'
import { useNavigate } from 'react-router-dom'

export default function Header({ title, subtitle, rightAction }) {
  const { currentUser } = useRole()
  const navigate = useNavigate()
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40 px-4 py-3 flex items-center justify-between">
      <div>
        <div className="font-bold text-gray-900 text-base leading-tight">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2">
        {rightAction}
        <div onClick={() => navigate('/config')}
          className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold cursor-pointer">
          {currentUser?.name?.slice(0,2).toUpperCase() || '??'}
        </div>
      </div>
    </header>
  )
}
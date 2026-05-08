import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { resolveRole } from '../../lib/roleLoader'
import { useRole } from '../../context/RoleContext'

export default function VendorEntry() {
  const { token } = useParams()
  const { selectUser } = useRole()
  const navigate = useNavigate()

  useEffect(() => {
    resolveRole(token, 'vendor').then(vendor => {
      if (vendor) { selectUser(vendor); navigate('/vendor/home') }
      else navigate('/')
    })
  }, [token])

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-3xl mb-3">🏠</div>
        <div className="text-gray-500 text-sm">Loading your tasks...</div>
      </div>
    </div>
  )
}
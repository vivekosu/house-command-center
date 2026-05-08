import { createContext, useContext, useState, useEffect } from 'react'

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('hcc_user')
    if (saved) { try { setCurrentUser(JSON.parse(saved)) } catch {} }
    setLoading(false)
  }, [])

  const selectUser = (user) => {
    localStorage.setItem('hcc_user', JSON.stringify(user))
    setCurrentUser(user)
  }

  const clearUser = () => {
    localStorage.removeItem('hcc_user')
    setCurrentUser(null)
  }

  const isOwner = currentUser?.role === 'owner'
  const isEditor = ['owner', 'editor'].includes(currentUser?.role)
  const isVendor = currentUser?.roleType === 'vendor'

  return (
    <RoleContext.Provider value={{ currentUser, selectUser, clearUser, loading, isOwner, isEditor, isVendor }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
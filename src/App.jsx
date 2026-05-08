import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { RoleProvider, useRole } from './context/RoleContext'
import { resolveRole } from './lib/roleLoader'
import WhoAreYou from './pages/selector/WhoAreYou'
import Today from './pages/Today'
import Tasks from './pages/Tasks'
import TaskDetail from './pages/TaskDetail'
import Vendors from './pages/Vendors'
import VendorDetail from './pages/VendorDetail'
import Promises from './pages/Promises'
import WhatsAppSend from './pages/WhatsAppSend'
import Templates from './pages/Templates'
import Clarifications from './pages/Clarifications'
import WeeklyPlan from './pages/WeeklyPlan'
import Photos from './pages/Photos'
import Notes from './pages/Notes'
import Config from './pages/Config'
import VendorEntry from './pages/vendor/VendorEntry'
import VendorHome from './pages/vendor/VendorHome'
import VendorTask from './pages/vendor/VendorTask'

function TeamEntry() {
  const { token } = useParams()
  const { selectUser, currentUser } = useRole()
  useEffect(() => {
    resolveRole(token, 'team').then(user => { if (user) selectUser(user) })
  }, [token])
  if (currentUser) return <Navigate to="/today" />
  return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>
}

function AppRoutes() {
  const { currentUser, loading } = useRole()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>
  return (
    <Routes>
      <Route path="/v/:token" element={<VendorEntry />} />
      <Route path="/vendor/home" element={currentUser?.roleType === 'vendor' ? <VendorHome /> : <Navigate to="/" />} />
      <Route path="/vendor/task/:id" element={currentUser?.roleType === 'vendor' ? <VendorTask /> : <Navigate to="/" />} />
      <Route path="/team/:token" element={<TeamEntry />} />
      <Route path="/" element={currentUser ? <Navigate to="/today" /> : <WhoAreYou />} />
      <Route path="/today" element={currentUser ? <Today /> : <Navigate to="/" />} />
      <Route path="/tasks" element={currentUser ? <Tasks /> : <Navigate to="/" />} />
      <Route path="/tasks/:id" element={currentUser ? <TaskDetail /> : <Navigate to="/" />} />
      <Route path="/vendors" element={currentUser ? <Vendors /> : <Navigate to="/" />} />
      <Route path="/vendors/:id" element={currentUser ? <VendorDetail /> : <Navigate to="/" />} />
      <Route path="/promises" element={currentUser ? <Promises /> : <Navigate to="/" />} />
      <Route path="/whatsapp" element={currentUser ? <WhatsAppSend /> : <Navigate to="/" />} />
      <Route path="/templates" element={currentUser ? <Templates /> : <Navigate to="/" />} />
      <Route path="/clarifications" element={currentUser ? <Clarifications /> : <Navigate to="/" />} />
      <Route path="/weekly" element={currentUser ? <WeeklyPlan /> : <Navigate to="/" />} />
      <Route path="/photos" element={currentUser ? <Photos /> : <Navigate to="/" />} />
      <Route path="/notes" element={currentUser ? <Notes /> : <Navigate to="/" />} />
      <Route path="/config" element={currentUser?.role === 'owner' ? <Config /> : <Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <AppRoutes />
      </RoleProvider>
    </BrowserRouter>
  )
}
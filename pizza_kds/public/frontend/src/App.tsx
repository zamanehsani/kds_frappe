import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { useOnline } from '@/hooks/use-online'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import AudioUnlockPrompt from '@/components/AudioUnlockPrompt'
import ConnectionLostPage from '@/components/ConnectionLostPage'

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  useOnline()

  return (
    <>
      <Routes>
        <Route
          path="/kds/login"
          element={isAuthenticated ? <Navigate to="/kds/staff" replace /> : <LoginPage />}
        />
        <Route
          path="/kds/staff"
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/kds/login" replace />}
        />
        <Route path="*" element={<Navigate to="/kds/staff" replace />} />
      </Routes>
      {isAuthenticated && <AudioUnlockPrompt />}
      {isAuthenticated && <ConnectionLostPage />}
    </>
  )
}

export default App

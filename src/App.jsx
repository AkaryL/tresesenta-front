import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Map from './pages/Map'
import Passport from './pages/Passport'
import Profile from './pages/Profile'
import RoutesPage from './pages/RoutesPage'
import Create from './pages/Create'
import './App.css'

function App() {
  const { isAuthenticated, loading, user } = useAuth()

  console.log('App render - isAuthenticated:', isAuthenticated, 'loading:', loading, 'user:', user)

  if (loading) {
    console.log('App: showing loading screen')
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    )
  }

  console.log('App: rendering routes')

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/map"
        element={isAuthenticated ? <Map /> : <Navigate to="/login" />}
      />
      <Route
        path="/passport"
        element={isAuthenticated ? <Passport /> : <Navigate to="/login" />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
      />
      <Route
        path="/routes"
        element={isAuthenticated ? <RoutesPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/create"
        element={isAuthenticated ? <Create /> : <Navigate to="/login" />}
      />
    </Routes>
  )
}

export default App

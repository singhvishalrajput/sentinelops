import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DarkModeProvider } from './contexts/DarkModeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Hero from './pages/Hero'
import Dashboard from './pages/Dashboard'
import Vulnerabilities from './pages/Vulnerabilities'
import Login from './pages/Login'

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Dashboard Routes - Require Authentication + AWS Account */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireAWSAccount={true}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vulnerabilities" 
            element={
              <ProtectedRoute requireAWSAccount={true}>
                <Vulnerabilities />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </DarkModeProvider>
  )
}

export default App

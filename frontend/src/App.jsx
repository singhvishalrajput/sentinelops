import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DarkModeProvider } from './contexts/DarkModeContext'
import Hero from './pages/Hero'
import Dashboard from './pages/Dashboard'
import AssetInventory from './pages/AssetInventory'
import Vulnerabilities from './pages/Vulnerabilities'
import Compliance from './pages/Compliance'
import Automation from './pages/Automation'
import Login from './pages/Login'

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<AssetInventory />} />
          <Route path="/vulnerabilities" element={<Vulnerabilities />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/automation" element={<Automation />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  )
}

export default App

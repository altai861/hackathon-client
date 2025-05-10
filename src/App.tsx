import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LandingPage } from './components/landing-page/LandingPage'
import { Login } from './components/login/Login'
import { SignUp } from './components/signup/SignUp'
import { Main } from './components/main/Main'
import { Admin } from './components/admin/Admin'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />}/>
        <Route path="/login" element={<Login />}/>
        <Route path="/signup" element={<SignUp />}/>
        <Route path="/main" element={<Main />}/>
        <Route path="/admin" element={<Admin />}/>
      </Routes>
    </Router>
  )
}

export default App

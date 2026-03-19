import { useState } from 'react'
import logo from '../assets/logo.png'
import '../App.css'
import { handleImageClick } from '../services/announcementService'
import { addAnnouncement } from '../services/announcementService' // update filename if needed
import { useNavigate } from 'react-router-dom'
import { logoutResident } from '../services/authService'

function App() {

  return (
    <>
      <div>
        <h1 className="greeting-message">User Dashboard</h1>
        <button onClick={logoutResident}>Log Out</button>
      </div>
    </>
  )
}

export default App
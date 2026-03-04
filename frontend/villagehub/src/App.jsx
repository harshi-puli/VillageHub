import { useState } from 'react'
import logo from './assets/logo.png'
import './App.css'
import { handleImageClick } from './services/announcementService'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h1 className="greeting-message" >Welcome folks.</h1>
        <img src={logo} alt="Description of my image" onClick={handleImageClick} />
        </div>
    </>
  )
}

export default App

import { useState } from 'react'
import logo from './assets/logo.png'
import './App.css'
import { handleImageClick } from './services/announcementService'
import { addAnnouncement } from './services/announcementService' // update filename if needed

function App() {
  const [count, setCount] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const testAddAnnouncement = async () => {
    try {
      const announcement = await addAnnouncement({
        title: 'Test Announcement',
        description: 'This is a test',
        dueDate: new Date(),
        category: 'general'
      })
      setResult(announcement)
      console.log('✅ Success:', announcement)
    } catch (err) {
      setError(err.message)
      console.error('❌ Error:', err)
    }
  }

  return (
    <>
      <div>
        <h1 className="greeting-message">Welcome folks.</h1>
        <img src={logo} alt="Description of my image" onClick={handleImageClick} />
        <p>test that announcement!</p>
        <button onClick={testAddAnnouncement}>Test addAnnouncement</button>
        {result && <pre style={{ background: '#d4edda', padding: '10px' }}>{JSON.stringify(result, null, 2)}</pre>}
        {error && <pre style={{ background: '#f8d7da', padding: '10px' }}>{error}</pre>}
      </div>
    </>
  )
}

export default App
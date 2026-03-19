import { useState, useEffect } from 'react'
import styles from './Login.module.css'
import { useNavigate } from 'react-router-dom'
import { loginResident, registerResident, subscribeToAuthState } from '../services/authService'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
 
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
        if (user) {
        // Fetch profile to check isAdmin
        const { getDoc, doc } = await import('firebase/firestore')
        const { db } = await import('../firebase')
        const snap = await getDoc(doc(db, 'users', user.uid))
        const profile = snap.exists() ? snap.data() : null

        if (profile?.isAdmin === true) {
            navigate('/AdminDashboard')
        } else {
            navigate('/UserDashboard')
        }
        }
    })
    return () => unsubscribe()
    }, [navigate])
 
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
 
    if (isLogin) {
      const { error } = await loginResident({ email, password })
      if (error) setError(error)
    } else {
      const { error } = await registerResident({ email, password, name, unitNumber })
      if (error) setError(error)
    }
 
    setLoading(false)
  }
 
  return (
    <div>
      <h2>{isLogin ? 'Log In' : 'Sign Up'}</h2>
 
      {error && <p style={{ color: 'red' }}>{error}</p>}
 
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} /><br />
            <input type="text" placeholder="Unit number" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} required disabled={loading} /><br />
          </>
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} /><br />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} /><br />
        <button type="submit" disabled={loading}>{loading ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}</button>
      </form>
 
      <button onClick={() => { setIsLogin(!isLogin); setError('') }}>
        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
      </button>
    </div>
  )
}
 
export default Login
 
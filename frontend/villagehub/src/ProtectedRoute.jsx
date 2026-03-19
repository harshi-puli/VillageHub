import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { subscribeToAuthState } from "./services/authService";
import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [user, setUser] = useState(undefined) // undefined = still loading
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const snap = await getDoc(doc(db, "users", firebaseUser.uid))
        setProfile(snap.exists() ? snap.data() : null)
      } else {
        setUser(null)
        setProfile(null)
      }
    })
    return () => unsubscribe()
  }, [])

  // Still loading
  if (user === undefined) return <p>Loading...</p>

  // Not logged in
  if (!user) return <Navigate to="/login" replace />

  if (adminOnly && profile === null) return <p>Loading...</p>

  console.log('profile:', profile)
  console.log('adminOnly:', adminOnly)
  console.log('isAdmin:', profile?.isAdmin)
  
  // Trying to access admin route but not an admin
  if (adminOnly && profile?.isAdmin !== true) return <Navigate to="/UserDashboard" replace />

  return children
}

export default ProtectedRoute
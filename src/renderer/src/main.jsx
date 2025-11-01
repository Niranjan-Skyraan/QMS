
import './index.css'
import { StrictMode, version } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import SearchProvider from './context/SearchContext'
import axios from 'axios'

// === GLOBAL “screen-unlock” LISTENER ===
// This listener is defensive: main already attempts to ping the server on unlock/resume.
// The renderer's listener is optional and can be used for UI-only or additional analytics.

if (window.screenEvents?.onUnlock){
  window.screenEvents.onUnlock(async (empIdFromMain, ipFromMain)=>{
    try{
      console.log('🔓 Renderer: screen unlock event received →', empIdFromMain, ipFromMain)

      let verison = 'unknown'
      try{
        verison = await window.electronAPI.getAppVersion()
      }catch(err){
        console.warn('Failed to get app version:', err)
      }

      console.log('version', version);

      const empId = empIdFromMain || window.localStorage.getItem('emp_id') ||null

      if(empId){
        // optional: ping active-users again from renderer (safe; main already attempted)

        try{
          await axios.get(`http://localhost:5006/logactive-users/${empId}?ip=${encodeURIComponent(ipFromMain || '')}&version=${version}`)
          console.log('✅ active-users pinged from renderer (optional)')
        }catch(err){
          console.error('❌ failed to ping active-users from renderer:', err)
        }
      }else {
        console.log(
          'Renderer: no empId available; main already attempted server notification (preferred).'
        )
      }

    }catch(err){
      console.error('Error in renderer screen-unlock handler:', err)
    }
  })
}

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <SearchProvider>
      <NotificationProvider>
        <App/>
      </NotificationProvider>
    </SearchProvider>
  </AuthProvider>
    
  
)

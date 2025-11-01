import React, { createContext, useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Home from './views/home/home'
import LoginForm from './components/LoginForm'
import User from './components/User'
import { QueueProvider } from './context/QueueContext'


function App() {
  const {auth} = useAuth()
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <QueueProvider>
      <Router>
        <Routes>
          <Route
            path='/'
            element ={
              auth?.isAuthenticated ? (
                <Navigate to={auth.role === 'admin' ? '/admin' : '/user'} />
              ) : (
                <LoginForm />
              )
            }
          />

          <Route
            path="/login"
            element={auth?.isAuthenticated ? <Navigate to="/" /> : <LoginForm />}
          />

          <Route
            path='/admin'
            element={
              auth?.isAuthenticated && auth.role ==='admin' ?  <Home/> : (<Navigate to="/login" replace/>)
            }
          />

          <Route
            path='/user'
            element={
              auth?.isAuthenticated && 
              (auth?.role ==='user' || auth?.role ==='hr') ? (<User/>) : (<Navigate to="/login" replace />)
            }
          />

        </Routes>
      </Router>
    </QueueProvider>
  )
}

export default App

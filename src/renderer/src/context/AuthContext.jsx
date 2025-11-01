import React, {createContext, useState, useContext, useEffect, Children} from 'react'

const AuthContext = createContext();

export const AuthProvider = ({children}) =>{
  const [auth, setAuth] = useState(()=>{
    const savedAuth = localStorage.getItem('auth_token')
    if (savedAuth){
      try{
        return JSON.parse(savedAuth);
      }catch(err){
        console.error('Error parsing auth token from localStorage:', err);
        return false
      }
    }
    return false;
  })

  useEffect(()=>{
    localStorage.setItem('auth_token', JSON.stringify(auth));
  }, [auth]);


  return (
    <AuthContext.Provider value={{auth, setAuth}}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = ()=> useContext(AuthContext)
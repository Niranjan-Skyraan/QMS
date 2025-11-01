import React, { createContext, useState} from 'react'

export const searchContext = createContext()

const SearchProvider = ({children}) => {
  const [currentTeam, setCurrentTeam] = useState('');
  const[search, setSearch] = useState('')
  return (
    <searchContext.Provider value= {{search, setSearch, currentTeam, setCurrentTeam}}>
      {children}
    </searchContext.Provider>
  )
}

export default SearchProvider
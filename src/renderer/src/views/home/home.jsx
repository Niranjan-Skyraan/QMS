import React,{useContext, useEffect, useState} from 'react'
import TabView from '../../components/TabView'
import Header from '../../components/Header'

const home = () => {
  const [currentPage, setCurrentPage] = useState('Queue')
  const [taskManagerInitialTab, setTaskManagerInitialTab] = useState(null)

  const onPageChange =(page, sub=null)=>{
    setCurrentPage(page)
    if (page === 'Task Manager' && sub){
      setTaskManagerInitialTab(sub)
    }
  }

  const handleInitialHandled= () => setTaskManagerInitialTab(null)

  return (
    <div>
      <div className=' mb-5'>
        <Header/>
      </div>
      <div className='w-100'>
        <TabView/>
      </div>
    </div>
  )
}

export default home
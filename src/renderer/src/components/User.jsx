import React, {useContext, useState} from 'react'
import UserPage from './UserPage'
import { useAuth } from '../context/AuthContext'
import Header from './Header';
const User = () => {
  const {auth}= useAuth();
  const [currentPage, setCurrentPage] = useState('Queue');
  const onPageChange = (val)=>{
    setCurrentPage(val)
  }

  console.log(currentPage)

  const [task, settask] = useState([]);
  function onTrigger(task){
    console.log('onTrigger Function Calling', task);
    settask(task)
  }

  return (
    <div>
      <div className=' mb-5'>
        <Header/>
      </div>
      <div className=''>
        <UserPage onTrigger= {onTrigger}/>
      </div>
    </div>
  )
}

export default User
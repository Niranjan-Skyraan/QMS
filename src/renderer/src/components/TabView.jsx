import React, {useState, useEffect, useContext}from 'react'
import {Individual} from './tabView/Individual'
import { useAuth } from '../context/AuthContext'
import NotifyMessageAudio from '../assets/audio/NotifyMessage.mp3'
import ServerURL from '../utils/MainUrl';
import Queue from './tabView/Queue';

const TabView = () => {
  const {auth} = useAuth();
  const [current, setCurrent] = useState('')

  useEffect(()=>{
    console.log("HELOELEOLLLLLLLLLL");
    const cur = sessionStorage.getItem('currentTab')
    setCurrent(cur ? parseInt(cur): 1)
    const notificationState = localStorage.getItem('notificationState')
    
    if (!notificationState ) localStorage.setItem('notificationState', 'on')
    console.log(localStorage.getItem("notificationState"));
    const eventSource = new EventSource(ServerURL(auth.emp_id))
    
    eventSource.onmessage = async (event) =>{
      console.log('Inside of Message TabView SSE');
      try{
        const queue = typeof event.data ==='string' ? JSON.parse(event.data) : event.data
        const notificationState = localStorage.getItem('notificationState')
        
        if (window.Notification && notificationState === 'on'){
          console.log("setttend");
          if (queue?.message ==="new"){
            const notification = new Notification('New Request',{
              body: 'Peoples are on the Queue Now!'
            })

            const playCustomSound = true;
            if (playCustomSound){
              const audio = new Audio(NotifyMessageAudio)
              audio.volume = 1.0
              audio.play().catch((err) => console.error("Audio playback failed", err))
            }

            notification.onClick = (event, arg) =>{
              setCurrent(3)
              window.electron_api.showMainWindow()
            }
          }

          if (queue?.message === 'ticket_raised'){
            let notification = new Notification('New Ticket', {body:"Ticket Raised"})

            const playCustomSound = true
            if (playCustomSound){
              const audio = new Audio(NotifyMessageAudio)
              audio.volume = 1.0
              audio.play().catch((err)=>console.error("Audio playback failed", err))
            }

          }

        }
      }catch(err){
        console.log(err);
      }
    }

  },[])

  useEffect(()=>{
    if (current) sessionStorage.setItem('currentTab', current)
  }, [current])

  let components = []

  if(auth.role === 'admin'){
    components = [
    <Individual/>,
    <Queue/>
    ]
  }else if(auth.is_team_lead ===1 && auth.role !=='admin') {
    alert("NOPE")
  }
  return (
    <div className=''>
      <div className='flex justify-around bg-slate-100 mx-9 p-5 text-lg relative'>
        <div className='px-5'
          onClick={()=>setCurrent(1)}
        >
          <p className={current ===1 ?'underline underline-offset-8 decoration-green-600 decoration-5':'' }>Individual</p>
        </div>
        <div className='px-5'
          onClick={()=>setCurrent(2)}
        >
          <p className={`${current ===2?'underline underline-offset-8 decoration-green-600 decoration-5':''} cursor-pointer`}>Queue</p>
        </div>
        <p>History</p>
      </div>
      {components[current - 1]}
    </div>
  )
}

export default TabView  
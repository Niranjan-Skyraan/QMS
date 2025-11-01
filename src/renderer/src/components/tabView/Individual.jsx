import React, {useEffect, useRef} from 'react'
import Tables from './Tables'
import ServerUrl from '../../utils/MainUrl'
import {useAuth} from '../../context/AuthContext'
import NotifyMessageAudio from '../../assets/audio/NotifyMessage.mp3'
import { notification } from 'antd'
import { useQueue } from '../../context/QueueContext'


export const Individual = () => {

  const {auth} = useAuth();
  const {setQueue} = useQueue()
  const audioRef = useRef(new Audio(NotifyMessageAudio))
  
  useEffect(()=>{
    audioRef.current.volume = 1.0;
    audioRef.current.load()
  },[])

  useEffect(()=>{
    console.log("hoHFLKCJLW");
    const notificationState = localStorage.getItem('notificationState')
    if (notificationState ==="undefined") localStorage.setItem("notificationState", 'on')

    const eventSource = new EventSource(ServerUrl(auth.emp_id))
      eventSource.onopen = () => {
      console.log('✅ SSE Connection OPENED - readyState:', eventSource.readyState);
    };

    eventSource.onmessage = async (event) =>{
      console.log('als;djgq;e.,xcnofhep42f,c.');
      try{
        const queue =  typeof event.data ==="string" ? JSON.parse(event.data) : event.data;
        const notificationState = localStorage.getItem('notificationState');
        console.log(queue.message, "received" ,notificationState);
        if (window.Notification && notificationState == 'on'){
          if(queue?.message === 'new'){
            console.log('yes message');
            const notification =new Notification('New Request', {
              body: "Peoples are on the queue now!!!"
            })

            const playCustomSound = true;
            if (playCustomSound){
              const audio = audioRef.current
              audio.currentTime = 0;
              audio.play()
                    .then(()=>console.log("Audio Played Immediately"))
                    .catch((err)=>console.error("Audio playback failed: ", err))
            }

            notification.onclick = (event, arg)=>{
              setCurrent(3);
              window.electron_api.showMainWindow()
            }
          }

          if (queue.message === 'req_task'){
            let notification = new Notification("Task Request", {
              body: queue.title
            })

            const playCustomSound = true;
            if (playCustomSound){
              const audio = new Audio(NotifyMessageAudio)
              audio.volume = 1
              audio.play().catch((err)=>console.error('Audio playback failed:', err))
            }

            // setTasks(queue.tasklist)
            // setAllNotifications(queue.notifications)

            notification.onclick=(event, arg)=>{
              window.electron_api.showMainWindow()
            }
          }

          if (queue?.message === 'updated_task') {
            // setTasks(queue?.tasklist)
          }
          if (queue?.message === 'task_deleted') {
            console.log(queue, 'desssssssssssssssssleted')
            // setTasks(queue.tasklist)
          }
          
          if (queue?.message === 'ticket_raised') {
            let notification = new Notification('New Ticket', {
              body: 'Ticket Raised'
            })

            const playCustomSound = true
            if (playCustomSound) {
              const audio = new Audio(NotifyMessageAudio)
              audio.volume = 1.0
              audio.play().catch((err) => console.error('Audio playback failed:', err))
            }
            console.log('queue notifications Ticket', queue.notifications)

            // setTickets(queue.ticketlist)
            // setAllNotifications(queue.notifications)
            notification.onclick = (event, arg) => {
              window.electron_api.showMainWindow()
            }
          }      
        }

        if (queue?.queueData?.length>0){
          const data = queue.queueData.map((val)=>({
            id: val.id,
            empDetails: val.employeeDetails,
            flag: val.flag,
            status: val.status
          }))

          const filteredData = data.filter(
            (item)=>item.empDetails.length===1 && item.flag=== 'admin'
          )

          console.log('Filtered queue:', filteredData)
          setQueue(filteredData)
        }else{
          setQueue([])
        }
        
      }catch(err){
        console.error("Network Error.....",err)
      }
    }
  },[])

   

  return (
    <div className='text-center pt-7'>
      <Tables/>
    </div>
  )
}

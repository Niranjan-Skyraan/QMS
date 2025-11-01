import { Popover, Badge,Button, Popconfirm, Modal, Radio, Input,message as msg, Form } from 'antd'
import React, { useEffect, useState } from 'react'
import ServerURL from '../utils/MainUrl'
import { useAuth } from '../context/AuthContext'
import useNotification from 'antd/es/notification/useNotification'
import manager from '../assets/images/manager.svg'
import openImage from '../assets/images/open-sign.png'
import QueueImage from '../assets/images/queue.png'
import tl from '../assets/images/TL.svg'
import dayjs from 'dayjs'


import { formatTime } from '../utils/FormatTime'
import axios from '../config/AxiosConfig'
// import GsapButton from './GsapButton'


const UserPage = ({onTrigger}) => {
  
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState('%connected%')
  const [description, setDescription] = useState('');
  const [person, setPerson] = useState('tl')
  const [text, setText] = useState('')
  const [time, setTime] = useState(0);
  const [isRotating, setIsRotating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showModal4, setShowModal4] = useState(false)
  const {updateNotificationCount} = useNotification()
  const [visiblePopover, setVisiblePopover] = useState(null)
  const [data, setData] = useState([]);
  const [inTime, setIntime] = useState(null);
  const [outTime, setOutTime] = useState(null)
  const [loading, setLoading]  =useState(false)
  const [meetingData, setMeetingData] = useState([]);
  const [adminData, setAdminData] = useState([]);
  const [showModal2, setShowModal2] = useState(false)
  const [requestTo, setRequestTo] = useState('manager')
  const [error, setError] = useState('')
  const [priority, setPriority] = useState(0)
  const [requestPurpose, setRequestPurpose] = useState('work')
  const {auth} = useAuth()
  const [messageApi, messageContent] = msg.useMessage()
  
  // console.log('object');


  const getBackgroundColor = (item, auth) =>{
    if (item.postpone ===1) return '#FFE3E3'
    else if (item.status === 'inmeeting') return '#FFE9C8'    
    else if (item.flag === 'client') return '#BEFBFC'
    else if (item.flag === 'interviewer') return '#F3E6FF'
    else if (item.flag === 'admin' || item.flag === 'priority') return '#DAFFE4'
    else if (item.employeeDetails.length > 0 && item.employeeDetails[0].emp_id === auth.emp_id)
      return (item.requestTo === 'manager' ? '#C4D7F7':'rgb(255 193 7 / 26%)' )
  }

  let eventSource;

  useEffect(()=>{
    console.log(adminData);
  }, [adminData])

  const setupEventSource = ()=>{
    if (!auth.emp_id ) return

    eventSource = new EventSource(ServerURL(auth.emp_id))
    eventSource.onmessage = (event)=>{
      console.log('object', event.data);
      let queue;
      try{
        queue = typeof event.data ==="string" ? JSON.parse(event.data) : event.data
        // console.log(queue, "re");
        console.log('queueue received from SSE', queue);

        const filteredData = (queue.queueData || []).filter(
          (item)=> item.employeeDetails.length > 0 && item.employeeDetails[0].emp_id === auth.emp_id && item.status !== ticket
        )

        console.log(filteredData);
        console.log('Filtered');
        
        if(filteredData.length > 0){
          const totalNotifications = filteredData.reduce(
            (sum, item) => sum+ (Number(item.notification)||0),0
          )
          updateNotificationCount(totalNotifications)
        }else{
          updateNotificationCount(0)
        }

        if (queue.started !==undefined){
          const started = queue.started !==undefined ? queue.started : false
          const text = queue.text !== undefined ? queue.text :''
          const starttime = queue.starttime || 0;
          const timer = queue.timer || 0

          const start = new Date(starttime)
          const target = new Date(start.getTime() + parseInt(timer, 10) * 60000)
          const diff = (target-new Date())/1000

          setStarted(started);
          setText(text)
          setTime(parseInt(diff))

          localStorage.setItem('text', text)
          localStorage.setItem('started', started.toString())
          localStorage.setItem('timerTime', diff.toString())
          localStorage.setItem('timerTimestamp', Date.now().toString())
        }
      }catch(err){
        console.log(err);
      }


      if(
        (queue.message || queue.message ==='')&&
        queue.message !== '%connected%' &&
        queue.message !== 'started' &&
        queue.message !== 'req_task' &&
        queue.message !== 'new_task' &&
        queue.message !== 'new_task_admin' &&
        queue.message !== 'req_task_update' &&
        queue.message !== 'updated_task_admin' &&
        queue.message !== 'updated_task' &&
        queue.message !== 'req_task_deleted' &&
        queue.message !== 'delete_task_admin' &&
        queue.message !== 'ticket_raised' &&
        queue.message !== 'task_deleted' &&
        queue.message !== 'ticket_moved' &&
        queue.message !== 'user_ticket_solved' &&
        queue.message !== 'ticket_changed' &&
        queue.message !== 'returnpostpone' &&
        queue.message !== 'postpone'        
      ){
        if(queue.message !== "You are added to current meeting! Join now"){
          setShowModal(true)
        }
        setMessage(queue.message)
        setPerson(queue.person)
        console.log('asldflsf', queue);

        if (queue.apiType !== 'add-employee-without-metting'){
          if (window.Notification){
            const notification = new Notification('New Message',{
              body:queue.message
            })

            notification.onclick = (event)=>{
              window.electron_api.showMainWindow()
            }

            const playCustomSound = true;
            if(playCustomSound){
              const audio = new Audio(NotifyMessageAudio)
              audio.volume = 1.0
              audio.play().catch((err)=>console.error("Audio Playback Failed", err))
            }
          }
        }
      }

      if(queue.message ==='postpone' || queue.message == 'returnpostpone'){
        setShowModal4(true)
        setMessage(queue.message)

        if(window.Notification){
          const notification = new Notification ('Meeting Update',{
            body: queue.message ==='postpone' ? 'Your Meeting has been postponed' : "Your meeting is back in the queue. Please Be Ready"
          })

          notification.onclick= (event)=>{
            window.electron_api.showMainWindow()
          }

          const playCustomSound = true
          if (playCustomSound) {
            const audio = new Audio(NotifyMessageAudio)
            audio.volume = 1.0
            audio.play().catch((err) => console.error('Audio playback failed:', err))
          }
        }
      }

      if(queue.message ==='started'){
        if(window.Notification){
          const notification = new Notification('New Message',{
            body:"Your meeting is started !"
          })
          notification.onclick = (event)=>{
            window.electron_api.showMainWindow()
          }
        }
      }

      

      if (queue?.queueData?.length > 0) {
        const queueCopy = [...queue.queueData]

        const individualMeetings = queueCopy.filter(
          (item) => item.employeeDetails?.[0]?.emp_id === auth.emp_id
        )
        const userIndividualMeetings = individualMeetings.filter(
          (item) =>
            (item.flag === 'employee' || item.flag === 'tlpriority' || item.flag === 'priority') &&
            item.status !== 'ticket'
        )
        const adminIndividualMeetings = individualMeetings.filter((item) => item.flag === 'admin')

        const individualIds = new Set(individualMeetings.map((item) => item.id))

        const remainingQueue = queueCopy.filter((item) => !individualIds.has(item.id))

        // Step 6: Get team meetings (user is a member but not the primary)
        const teamMeetings = remainingQueue.filter((item) =>
          item.employeeDetails?.some((emp) => emp.emp_id === auth.emp_id)
        )
        console.log(
          'adminIndividualMeetings,teamMeetings,userIndividualMeetings',
          adminIndividualMeetings,
          teamMeetings,
          userIndividualMeetings
        )

        setData(userIndividualMeetings)
        setAdminData(adminIndividualMeetings)
        setMeetingData(teamMeetings)
      } else {
        setData([])
        setAdminData([])
        setMeetingData([])
        console.log('No queue data available or empty array.')
      }

    }

  }

  useEffect(()=>{
    console.log(requestTo,"llave");
  }, [requestTo])
  
  useEffect(()=>{
    setupEventSource()
  },[auth?.emp_id])
  const handleRefresh =()=>{
    setIsRotating(true)
    setTimeout(()=>setIsRotating(false), 1000)
  }


  const handleRevoke= async(id)=>{
    try{
      const emp_ids = [auth?.emp_id]
      const response = await axios.post('/meet/revoke-meeting', {id, emp_ids })

      if (response.status ===200){
        messageApi.success({
          content: "Revoked Successfully"
        })
      }else{
        messageApi.warning({
          content: response.data.message || "Revoke Failed"
        })
      }
    }catch(err){
      console.log(err);
      setError('Revoked failed. Please try again.')
      messageApi.error({content: "Revoke Failed. Please Try Again"})
    }
  }

  const infoContent = () => (
    <div className='bg-white rounded-lg p-4 space-y-3 font-serif'>
      <div className='flex items-center space-x-3'>
        <div className='w-5 h-5 bg-orange-100 rounded'></div>
        <div className='text-gray-800 font-medium'>Ongoinig Meeting</div>
      </div>

      <div className='border-t border-gray-300'></div>

      <div className='flex items-center space-x-3'>
        <div className='w-5 h-5 bg-green-100 rounded'></div>
        <div className='text-gray-800 font-medium'>Manager Request</div>
      </div>

      <div className='border-t border-gray-300'></div>

      <div className='flex items-center space-x-3'>
        <div className='w-5 h-5 bg-blue-200 rounded'></div>
        <div className='text-gray-800 font-medium'>Your Request</div>
      </div>

      <div className='border-t border-gray-300'></div>

      <div className='flex items-center space-x-3'>
        <div className='h-5 w-5 bg-pink-100 rounded'>Request Postponed</div>
      </div>
    </div>
  )

  const handleSubmit = async()=>{
    setLoading(true)
    console.log(requestTo, 'lclcl');

    let adjustedInTime = null
    let inFormatted = null
    const outFormatted = dayjs().format('YYYY-MM-DD HH:mm:ss')

    if(!description.trim()){
      messageApi.warning({content: "Please Enter Description "})
    }
    try{
      const payload = {
        emp_id: auth.emp_id,
        message: description,
        flag: priority,
        request_type: requestPurpose,
        in_time: inFormatted,
        out_time: outFormatted,
        requestTo: requestTo,
        team: auth.team
      }
      console.log(payload);

      const response = await axios.post('/meet/user-request', payload)
      if (response.status == 200){
        messageApi.success({
          content: "Meeting Request Sent"
        })
        setShowModal2(false)
      }else{
        messageApi.warning({
          content: response.data.message || "Request Failed Please Try again"
        })
      }
    }catch(err){
      console.error('Request failed. Please try again.', err)
      setError('Request failed. Please try again.')
      messageApi.error({
        content: 'Request failed! Check your internet connection.',
        className: `${theme.current !== 'light' ? theme.current : ''}`
      })    
    }finally{
      setDescription('')
      setLoading(false);
      setRequestTo('manager')
      setRequestPurpose('work')
    }
  }

  

  return (
    <div className='h-full '>
      {messageContent}
      <div className='bg-blue-500 w-[90%] h-14 mx-auto flex justify-around items-center mb-5'>
        
        <div className='text-lg text-white'>Queue Status</div>
        
        <div className="w-3/12 text-right">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1 text-white hover:opacity-80"
          >
            <svg
              viewBox="0 0 24 24"
              className={isRotating ? 'animate-spin-slow' : ''}
              width="25"
              height="25"
            >
              <path
                fill="none"
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        <div className='flex justify-between items-center '>
          
          <div className=" text-right">
            <button
              onClick={()=>setShowModal2(true)}
              className="inline-flex items-center gap-2 border border-white text-white px-3 py-1 rounded hover:bg-white/10 transition"
              style={{ minWidth: "fit-content" }}
            >
              <span>Send Request</span>
              <svg
                width="25"
                height="25"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="32" height="32" rx="10" fill="white" />
                <path
                  d="M24.3392 15.7906C24.377 15.7044 24.3965 15.6112 24.3965 15.517C24.3965 15.4229 24.377 15.3298 24.3392 15.2435C24.3065 15.1559 24.254 15.0771 24.1857 15.0132L19.3871 10.2146C19.3209 10.1467 19.2417 10.0927 19.1544 10.0558C19.067 10.019 18.9732 10 18.8784 10C18.7836 10 18.6897 10.019 18.6024 10.0558C18.515 10.0927 18.4359 10.1467 18.3697 10.2146C18.2349 10.3495 18.1592 10.5324 18.1592 10.7232C18.1592 10.9139 18.2349 11.0969 18.3697 11.2319L21.9399 14.802H12.1603C10.9512 14.802 9.79169 15.2823 8.93677 16.1372C8.08185 16.9922 7.60156 18.1517 7.60156 19.3607V21.2802C7.60156 21.4711 7.67739 21.6542 7.81238 21.7892C7.94737 21.9242 8.13046 22 8.32136 22C8.51226 22 8.69535 21.9242 8.83034 21.7892C8.96532 21.6542 9.04115 21.4711 9.04115 21.2802V19.3607C9.04369 18.5343 9.37314 17.7424 9.95754 17.158C10.5419 16.5736 11.3338 16.2442 12.1603 16.2416H21.9399L18.3697 19.8118C18.2349 19.9468 18.1592 20.1297 18.1592 20.3205C18.1592 20.5112 18.2349 20.6942 18.3697 20.8292C18.5068 20.9608 18.6883 21.0361 18.8784 21.0403C19.0688 21.0381 19.251 20.9625 19.3871 20.8292L24.1857 16.0305C24.2562 15.9647 24.3089 15.8822 24.3392 15.7906Z"
                  fill="#4285F4"
                />
              </svg>
            </button>
          </div>
          
          <div className="info-wrapper ml-5">
            <div className="info-container cursor-pointer">
              <Popover 
                content={infoContent} 
                // color={theme.backgroundColor}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="25px"
                  viewBox="0 -960 960 960"
                  width="25px"
                  fill="#ffffff"
                >
                  <path d="M448.67-280h66.66v-240h-66.66v240Zm31.32-316q15.01 0 25.18-9.97 10.16-9.96 10.16-24.7 0-15.3-10.15-25.65-10.16-10.35-25.17-10.35-15.01 0-25.18 10.35-10.16 10.35-10.16 25.65 0 14.74 10.15 24.7 10.16 9.97 25.17 9.97Zm.19 516q-82.83 0-155.67-31.5-72.84-31.5-127.18-85.83Q143-251.67 111.5-324.56T80-480.33q0-82.88 31.5-155.78Q143-709 197.33-763q54.34-54 127.23-85.5T480.33-880q82.88 0 155.78 31.5Q709-817 763-763t85.5 127Q880-563 880-480.18q0 82.83-31.5 155.67Q817-251.67 763-197.46q-54 54.21-127 85.84Q563-80 480.18-80Zm.15-66.67q139 0 236-97.33t97-236.33q0-139-96.87-236-96.88-97-236.46-97-138.67 0-236 96.87-97.33 96.88-97.33 236.46 0 138.67 97.33 236 97.33 97.33 236.33 97.33ZM480-480Z" />
                </svg>
              </Popover>
            </div>
          </div>

        </div>


      </div>

      {data.length >0 || meetingData.length>0 || adminData.length > 0 ? (
        <div className='scrollable-container max-h-[72vh] overflow-y-auto overflow-x-hidden'>
          {adminData.map((item, index)=>(
            <div className=''>
              <div className='container flex justify-around items-center py-[3px] px-[10px] mb-[1%] w-[90%] mx-auto'
                  style={{
                    backgroundColor: getBackgroundColor(item, auth),
                    color: item.flag === 'client' || item.flag === 'interviewer' ? 'black' : '#ffffff' 
                  }}
              >
                <Badge
                  count = {item.requestTo === 'manager' ? "Manager" : "Team Lead"}
                  style={{
                    backgroundColor : item.requestTo === 'manager' ? '#34A853 ': '#FBBC05 ',
                    fontSize: 12,
                  }}
                ></Badge>

                <div className='flex pl-[2%] basis-[20%] items-center'>
                  <div className='flex items-center text-[20px] mr-[10px] leading-normal' >
                    {item.flag ==='priority'?(
                        <svg
                          width="28"
                          height="28"
                          style={{ marginLeft: '5px' }}
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width={'48'} height={'48'} rx="24" fill='#F8184E'/>
                          <path
                            d="M15.9122 35C15.676 35 15.4494 34.9062 15.2824 34.7391C15.1153 34.5721 15.0215 34.3455 15.0215 34.1093V14.9592C15.0221 14.8179 15.0564 14.6787 15.1215 14.5533C15.1865 14.4278 15.2805 14.3197 15.3956 14.2377C18.4641 12.051 22.4722 13.2178 24.3917 14.2689C25.5331 14.7846 26.7733 15.0446 28.0257 15.0307C29.2781 15.0169 30.5123 14.7295 31.642 14.1887C31.7773 14.1106 31.9309 14.0694 32.0871 14.0694C32.2434 14.0693 32.3969 14.1104 32.5323 14.1885C32.6677 14.2666 32.7801 14.3789 32.8584 14.5141C32.9366 14.6494 32.9779 14.8029 32.9781 14.9592V27.0505C32.9799 27.0608 32.9799 27.0713 32.9781 27.0816C32.9852 27.2446 32.9474 27.4063 32.8688 27.5492C32.7903 27.6922 32.674 27.8108 32.5327 27.8922C31.0319 28.7428 27.478 29.7315 23.6257 28.0347L23.5544 27.9991C23.3941 27.91 19.7066 25.9104 16.794 27.6027V34.1004C16.7952 34.2174 16.7733 34.3334 16.7296 34.4419C16.6859 34.5504 16.6213 34.6493 16.5394 34.7328C16.4575 34.8164 16.36 34.883 16.2524 34.9288C16.1448 34.9746 16.0292 34.9988 15.9122 35Z"
                            fill="white"
                          />
                        </svg>
                      ): item.flag ==="client" ? (
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 48 48"
                          style={{ marginLeft: '5px' }}
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="48" height="48" rx="24" fill="#189C9F" />
                          <path
                            d="M35.3951 23.0198L30.5708 27.1826L32.0406 33.408C32.1217 33.746 32.1008 34.1004 31.9806 34.4265C31.8604 34.7525 31.6462 35.0357 31.3651 35.2401C31.0841 35.4445 30.7487 35.5611 30.4015 35.575C30.0542 35.589 29.7106 35.4997 29.4141 35.3184L24.0002 31.9865L18.5831 35.3184C18.2866 35.4986 17.9434 35.5871 17.5968 35.5726C17.2501 35.5582 16.9155 35.4415 16.635 35.2372C16.3545 35.033 16.1408 34.7503 16.0206 34.4248C15.9005 34.0993 15.8793 33.7455 15.9598 33.408L17.435 27.1826L12.6107 23.0198C12.3484 22.7931 12.1587 22.4941 12.0653 22.1602C11.9718 21.8263 11.9789 21.4723 12.0854 21.1423C12.192 20.8124 12.3935 20.5211 12.6646 20.305C12.9357 20.0889 13.2645 19.9574 13.6099 19.927L19.935 19.4167L22.375 13.5118C22.5071 13.19 22.7318 12.9147 23.0208 12.721C23.3097 12.5273 23.6497 12.4238 23.9975 12.4238C24.3454 12.4238 24.6854 12.5273 24.9743 12.721C25.2632 12.9147 25.488 13.19 25.6201 13.5118L28.059 19.4167L34.3841 19.927C34.7302 19.9562 35.0599 20.087 35.332 20.3028C35.6041 20.5187 35.8065 20.81 35.9138 21.1404C36.021 21.4707 36.0284 21.8254 35.935 22.1599C35.8416 22.4944 35.6515 22.7939 35.3886 23.0209L35.3951 23.0198Z"
                            fill="white"
                          />
                        </svg>
                      ) : item.flag === "interviewer" ? (
                        <svg
                          width="28"
                          height="28"
                          style={{ marginLeft: '5px' }}
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width={"48"} height={"48"} rx="24" fill='#855FA8'/>
                          <path
                            d="M20.6397 14.3765C20.5847 14.1598 20.6177 13.9301 20.7315 13.7375C20.8453 13.545 21.0306 13.4054 21.2471 13.3491C23.0517 12.8836 24.9448 12.8836 26.7494 13.3491C26.9493 13.4002 27.1236 13.5227 27.2396 13.6933C27.3556 13.864 27.4052 14.0711 27.3793 14.2758C27.3533 14.4805 27.2534 14.6686 27.0985 14.8049C26.9435 14.9411 26.7441 15.0161 26.5378 15.0157C26.4664 15.0153 26.3953 15.006 26.3262 14.9881C24.7993 14.5939 23.1972 14.5939 21.6703 14.9881C21.5625 15.0158 21.4503 15.0219 21.3401 15.0061C21.2299 14.9903 21.1239 14.9529 21.0281 14.8961C20.9324 14.8393 20.8488 14.7642 20.7822 14.675C20.7155 14.5859 20.6671 14.4844 20.6397 14.3765ZM13.9828 22.101C14.09 22.1308 14.2019 22.1392 14.3123 22.1256C14.4227 22.1121 14.5293 22.077 14.6261 22.0223C14.7229 21.9675 14.8079 21.8943 14.8764 21.8067C14.9449 21.719 14.9954 21.6188 15.0251 21.5116C15.4474 19.9927 16.2484 18.6059 17.3531 17.4811C17.5003 17.3192 17.5792 17.1065 17.573 16.8876C17.5668 16.6688 17.476 16.4609 17.3198 16.3075C17.1635 16.1541 16.954 16.0673 16.7351 16.0651C16.5161 16.063 16.3049 16.1457 16.1457 16.296C14.8406 17.625 13.894 19.2633 13.3945 21.0577C13.3646 21.1648 13.356 21.2768 13.3694 21.3873C13.3828 21.4977 13.4178 21.6044 13.4724 21.7013C13.5271 21.7982 13.6003 21.8834 13.6879 21.952C13.7754 22.0206 13.8757 22.0712 13.9828 22.101ZM32.9703 21.5127C33.0304 21.7291 33.1739 21.9127 33.3694 22.0233C33.5649 22.1338 33.7962 22.1622 34.0126 22.1021C34.229 22.042 34.4126 21.8985 34.5232 21.703C34.6337 21.5076 34.662 21.2762 34.602 21.0598C34.1027 19.2653 33.1561 17.627 31.8508 16.2981C31.7728 16.2189 31.68 16.1557 31.5777 16.1123C31.4753 16.0689 31.3654 16.0461 31.2542 16.0451C31.143 16.0442 31.0328 16.0652 30.9297 16.1069C30.8266 16.1485 30.7328 16.2101 30.6535 16.2881C30.5742 16.366 30.5111 16.4588 30.4677 16.5612C30.4243 16.6636 30.4014 16.7735 30.4005 16.8846C30.3996 16.9958 30.4205 17.1061 30.4622 17.2092C30.5039 17.3123 30.5655 17.4061 30.6434 17.4854C31.7474 18.6097 32.548 19.9957 32.9703 21.5138V21.5127ZM34.0147 25.9104C33.9075 25.8806 33.7955 25.8723 33.6851 25.8859C33.5746 25.8995 33.468 25.9347 33.3712 25.9896C33.2744 26.0444 33.1893 26.1178 33.1209 26.2055C33.0525 26.2932 33.002 26.3936 32.9724 26.5008C32.5929 27.8669 31.9051 29.1278 30.9619 30.1864C30.3448 29.2937 29.5612 28.5284 28.6541 27.9325C28.577 27.8814 28.4853 27.8569 28.393 27.8628C28.3007 27.8688 28.2129 27.9048 28.143 27.9653C26.9929 28.9605 25.5229 29.5082 24.002 29.5082C22.481 29.5082 21.011 28.9605 19.8609 27.9653C19.7909 27.9045 19.7029 27.8684 19.6103 27.8624C19.5178 27.8565 19.4259 27.8811 19.3487 27.9325C18.4358 28.5203 17.6453 29.2792 17.0208 30.1673C16.0866 29.1117 15.4052 27.857 15.0283 26.4987C14.9682 26.2823 14.8247 26.0987 14.6292 25.9882C14.4338 25.8776 14.2024 25.8493 13.986 25.9093C13.7696 25.9694 13.586 26.1129 13.4755 26.3084C13.3649 26.5039 13.3366 26.7352 13.3966 26.9516C14.0436 29.2669 15.4305 31.3069 17.3455 32.7601C19.2605 34.2133 21.5985 35 24.0025 35C26.4065 35 28.7444 34.2133 30.6594 32.7601C32.5745 31.3069 33.9613 29.2669 34.6083 26.9516C34.6379 26.8443 34.6459 26.7321 34.632 26.6217C34.6182 26.5112 34.5827 26.4046 34.5275 26.3079C34.4724 26.2111 34.3987 26.1262 34.3107 26.058C34.2227 25.9898 34.1221 25.9397 34.0147 25.9104ZM23.9982 27.8151C24.9191 27.8151 25.8193 27.542 26.5849 27.0304C27.3506 26.5188 27.9473 25.7917 28.2997 24.9409C28.6521 24.0902 28.7443 23.154 28.5647 22.2509C28.385 21.3477 27.9416 20.5181 27.2904 19.867C26.6393 19.2159 25.8097 18.7724 24.9066 18.5928C24.0034 18.4131 23.0673 18.5053 22.2165 18.8577C21.3658 19.2101 20.6386 19.8069 20.127 20.5725C19.6154 21.3382 19.3424 22.2383 19.3424 23.1592C19.3438 24.3936 19.8348 25.577 20.7076 26.4498C21.5804 27.3227 22.7639 27.8137 23.9982 27.8151Z"
                            fill="white"
                          />
                        </svg>
                      ) : item.flag === 'tlpriority' &&
                        auth.emp_id === item.employeeDetails[0].emp_id ? (
                        <svg
                          width="28"
                          height="28"
                          style={{ marginLeft: '5px' }}
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="48" height="48" rx="24" fill="#E6B31F" />
                          <path
                            d="M15.9122 35C15.676 35 15.4494 34.9062 15.2824 34.7391C15.1153 34.5721 15.0215 34.3455 15.0215 34.1093V14.9592C15.0221 14.8179 15.0564 14.6787 15.1215 14.5533C15.1865 14.4278 15.2805 14.3197 15.3956 14.2377C18.4641 12.051 22.4722 13.2178 24.3917 14.2689C25.5331 14.7846 26.7733 15.0446 28.0257 15.0307C29.2781 15.0169 30.5123 14.7295 31.642 14.1887C31.7773 14.1106 31.9309 14.0694 32.0871 14.0694C32.2434 14.0693 32.3969 14.1104 32.5323 14.1885C32.6677 14.2666 32.7801 14.3789 32.8584 14.5141C32.9366 14.6494 32.9779 14.8029 32.9781 14.9592V27.0505C32.9799 27.0608 32.9799 27.0713 32.9781 27.0816C32.9852 27.2446 32.9474 27.4063 32.8688 27.5492C32.7903 27.6922 32.674 27.8108 32.5327 27.8922C31.0319 28.7428 27.478 29.7315 23.6257 28.0347L23.5544 27.9991C23.3941 27.91 19.7066 25.9104 16.794 27.6027V34.1004C16.7952 34.2174 16.7733 34.3334 16.7296 34.4419C16.6859 34.5504 16.6213 34.6493 16.5394 34.7328C16.4575 34.8164 16.36 34.883 16.2524 34.9288C16.1448 34.9746 16.0292 34.9988 15.9122 35Z"
                            fill="white"
                          />
                        </svg>
                      ): item.requestTo ? (
                        <img
                          src={item.requestTo === 'manager' ? manager : tl}
                          alt=""
                          width={40}
                          style={{ borderRadius: '50%' }}
                        />
                      ) : (
                        <span style={{ marginLeft: '-15px' }}>
                          {/* {item.token}
                          {item.token ? '.' : ''} */}
                        </span>                    
                      )
                    }
                  </div>

                  <div key={item.id} className='flext items-center'>
                    <div className='text-base font-bold'>
                      <div className='items-center'>
                        {item.team?.length > 0 ?(
                          <div className='flext items-center'>
                            <span className='text-base'>{item.team.join(', ')}</span>
                          </div>
                          ) : item.employeeDetails.length > 1 ? (
                                item.all === true ? (
                                  'All'
                                ) : (
                                  <Popover
                                    content= {
                                      <div>
                                        {item.employeeDetails.slice(1).map((emp, index)=>(
                                          <div
                                            key={emp.id}
                                            className='flex items-center gap-[8px]'
                                          >
                                            <span className='text-black'>
                                              {index+1}. {emp.name}
                                            </span>

                                            {auth.role ==='admin' &&(
                                              <button className='text-white bg-red-600 border-none px-[4px] py-[8px] cursor-pointer'>Remove</button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    }

                                    title= "Employee Details"
                                    trigger={'click'}
                                    placement='right'
                                    open={visiblePopover === item.id}
                                    onOpenChange={(open) => !open && hidePopover()}
                                  >
                                    <div>
                                      <span className='text-black font-bold mr-[8px]'>
                                        {item.flag ==='client' ? "Client"
                                          : item.flag === 'interviewer' ? "Interview" : item.employeeDetails[0]?.name
                                        }
                                      </span>

                                      <Button
                                        onClick={()=> handlePopover(item.id)}
                                        className='bg-transparent text-[#4285F4] border-none p-0 shadow-none'
                                      >
                                        + {item.employeeDetails.length - 1} members
                                      </Button>
                                    </div>
                                  </Popover>
                                )
                              ):(
                                <div className='flext items-center'>
                                  <span className='text-base text-black text-opacity-70'>
                                    {item.flag === 'client' ? "Client": item.flag === 'interviewer' ? "Interview" : item.employeeDetails[0]?.name}
                                  </span>

                                  <p
                                    style={{
                                      fontSize:'14px',
                                      margin:0,
                                      fontWeight:'lighter',
                                      color:'#808080'
                                    }}
                                  >
                                    {item.flag === 'client' || item.flag === 'interviwer' ? "" : item.employeeDetails[0]?.team_name}
                                  </p>
                                </div>
                              )
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className='basis-[40%] text-center'>
                  {item.employeeDetails.length>0 &&
                    item.employeeDetails.some((emp)=>emp.emp_id === auth.emp_id) && (
                      <h5 className='text-[15px] text-black m-0'>{item.description}</h5>
                    )
                  }
                </div>

                <div className='flex justify-end items-center basis-[30%]'>
                  <p className='text-[12px] text-[#bdbdbd] pr-[20px] '>{formatTime(item.time)}</p>

                  {item.employeeDetails.length>0 &&
                    item.employeeDetails[0].emp_id === auth.emp_id &&
                    item.status !== 'inmeeting' &&
                    item.flag !== 'admin' &&
                    item.flag !== 'priority' &&
                    item.request_type !=='report' && (
                      <Popconfirm
                        title="Are you sure you want to revoke this meeting?"
                        onConfirm={() => handleRevoke(item.id)} // Call handleRevoke when confirmed
                        onCancel={() =>
                          msg.info({
                            conent: 'Revocation cancelled.',
                            className: `${theme.current !== 'light' ? theme.current : ''}`
                          })
                        }
                        okText='Ok'
                        cancelText="Cancel"
                        placement='topRight'
                      >
                        <Button className="bg-[#E6B31F] text-white ml-[10px] mr-[10px] px-3 py-1 rounded hover:bg-[#d49f17]"
                        >Revoke</Button>

                      </Popconfirm>
                    )
                  }
                </div>
              </div>
            </div>
          ))}

          {meetingData.map((item, index)=>(
            <div className=''>
              <div className='container flex justify-around items-center py-[3px] px-[10px] mb-[1%] w-[90%] mx-auto'
                  style={{
                    backgroundColor: getBackgroundColor(item, auth),
                    color: item.flag === 'client' || item.flag === 'interviewer' ? 'black' : '#ffffff' 
                  }}
              >
                <Badge
                  count = {item.requestTo === 'manager' ? "Manager" : "Team Lead"}
                  style={{
                    backgroundColor : item.requestTo === 'manager' ? '#34A853 ': '#FBBC05 ',
                    fontSize: 12,
                  }}
                ></Badge>

                <div className='flex pl-[2%] basis-[20%] items-center'>
                  <div className='flex items-center text-[20px] mr-[10px] leading-normal' >
                    {item.flag ==='priority'?(
                        <svg
                          width="28"
                          height="28"
                          style={{ marginLeft: '5px' }}
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width={'48'} height={'48'} rx="24" fill='#F8184E'/>
                          <path
                            d="M15.9122 35C15.676 35 15.4494 34.9062 15.2824 34.7391C15.1153 34.5721 15.0215 34.3455 15.0215 34.1093V14.9592C15.0221 14.8179 15.0564 14.6787 15.1215 14.5533C15.1865 14.4278 15.2805 14.3197 15.3956 14.2377C18.4641 12.051 22.4722 13.2178 24.3917 14.2689C25.5331 14.7846 26.7733 15.0446 28.0257 15.0307C29.2781 15.0169 30.5123 14.7295 31.642 14.1887C31.7773 14.1106 31.9309 14.0694 32.0871 14.0694C32.2434 14.0693 32.3969 14.1104 32.5323 14.1885C32.6677 14.2666 32.7801 14.3789 32.8584 14.5141C32.9366 14.6494 32.9779 14.8029 32.9781 14.9592V27.0505C32.9799 27.0608 32.9799 27.0713 32.9781 27.0816C32.9852 27.2446 32.9474 27.4063 32.8688 27.5492C32.7903 27.6922 32.674 27.8108 32.5327 27.8922C31.0319 28.7428 27.478 29.7315 23.6257 28.0347L23.5544 27.9991C23.3941 27.91 19.7066 25.9104 16.794 27.6027V34.1004C16.7952 34.2174 16.7733 34.3334 16.7296 34.4419C16.6859 34.5504 16.6213 34.6493 16.5394 34.7328C16.4575 34.8164 16.36 34.883 16.2524 34.9288C16.1448 34.9746 16.0292 34.9988 15.9122 35Z"
                            fill="white"
                          />
                        </svg>
                      ): item.flag ==="client" ? (
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 48 48"
                          style={{ marginLeft: '5px' }}
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="48" height="48" rx="24" fill="#189C9F" />
                          <path
                            d="M35.3951 23.0198L30.5708 27.1826L32.0406 33.408C32.1217 33.746 32.1008 34.1004 31.9806 34.4265C31.8604 34.7525 31.6462 35.0357 31.3651 35.2401C31.0841 35.4445 30.7487 35.5611 30.4015 35.575C30.0542 35.589 29.7106 35.4997 29.4141 35.3184L24.0002 31.9865L18.5831 35.3184C18.2866 35.4986 17.9434 35.5871 17.5968 35.5726C17.2501 35.5582 16.9155 35.4415 16.635 35.2372C16.3545 35.033 16.1408 34.7503 16.0206 34.4248C15.9005 34.0993 15.8793 33.7455 15.9598 33.408L17.435 27.1826L12.6107 23.0198C12.3484 22.7931 12.1587 22.4941 12.0653 22.1602C11.9718 21.8263 11.9789 21.4723 12.0854 21.1423C12.192 20.8124 12.3935 20.5211 12.6646 20.305C12.9357 20.0889 13.2645 19.9574 13.6099 19.927L19.935 19.4167L22.375 13.5118C22.5071 13.19 22.7318 12.9147 23.0208 12.721C23.3097 12.5273 23.6497 12.4238 23.9975 12.4238C24.3454 12.4238 24.6854 12.5273 24.9743 12.721C25.2632 12.9147 25.488 13.19 25.6201 13.5118L28.059 19.4167L34.3841 19.927C34.7302 19.9562 35.0599 20.087 35.332 20.3028C35.6041 20.5187 35.8065 20.81 35.9138 21.1404C36.021 21.4707 36.0284 21.8254 35.935 22.1599C35.8416 22.4944 35.6515 22.7939 35.3886 23.0209L35.3951 23.0198Z"
                            fill="white"
                          />
                        </svg>
                      ) : item.flag === "interviewer" ? (
                        <svg
                          width="28"
                          height="28"
                          style={{ marginLeft: '5px' }}
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width={"48"} height={"48"} rx="24" fill='#855FA8'/>
                          <path
                            d="M20.6397 14.3765C20.5847 14.1598 20.6177 13.9301 20.7315 13.7375C20.8453 13.545 21.0306 13.4054 21.2471 13.3491C23.0517 12.8836 24.9448 12.8836 26.7494 13.3491C26.9493 13.4002 27.1236 13.5227 27.2396 13.6933C27.3556 13.864 27.4052 14.0711 27.3793 14.2758C27.3533 14.4805 27.2534 14.6686 27.0985 14.8049C26.9435 14.9411 26.7441 15.0161 26.5378 15.0157C26.4664 15.0153 26.3953 15.006 26.3262 14.9881C24.7993 14.5939 23.1972 14.5939 21.6703 14.9881C21.5625 15.0158 21.4503 15.0219 21.3401 15.0061C21.2299 14.9903 21.1239 14.9529 21.0281 14.8961C20.9324 14.8393 20.8488 14.7642 20.7822 14.675C20.7155 14.5859 20.6671 14.4844 20.6397 14.3765ZM13.9828 22.101C14.09 22.1308 14.2019 22.1392 14.3123 22.1256C14.4227 22.1121 14.5293 22.077 14.6261 22.0223C14.7229 21.9675 14.8079 21.8943 14.8764 21.8067C14.9449 21.719 14.9954 21.6188 15.0251 21.5116C15.4474 19.9927 16.2484 18.6059 17.3531 17.4811C17.5003 17.3192 17.5792 17.1065 17.573 16.8876C17.5668 16.6688 17.476 16.4609 17.3198 16.3075C17.1635 16.1541 16.954 16.0673 16.7351 16.0651C16.5161 16.063 16.3049 16.1457 16.1457 16.296C14.8406 17.625 13.894 19.2633 13.3945 21.0577C13.3646 21.1648 13.356 21.2768 13.3694 21.3873C13.3828 21.4977 13.4178 21.6044 13.4724 21.7013C13.5271 21.7982 13.6003 21.8834 13.6879 21.952C13.7754 22.0206 13.8757 22.0712 13.9828 22.101ZM32.9703 21.5127C33.0304 21.7291 33.1739 21.9127 33.3694 22.0233C33.5649 22.1338 33.7962 22.1622 34.0126 22.1021C34.229 22.042 34.4126 21.8985 34.5232 21.703C34.6337 21.5076 34.662 21.2762 34.602 21.0598C34.1027 19.2653 33.1561 17.627 31.8508 16.2981C31.7728 16.2189 31.68 16.1557 31.5777 16.1123C31.4753 16.0689 31.3654 16.0461 31.2542 16.0451C31.143 16.0442 31.0328 16.0652 30.9297 16.1069C30.8266 16.1485 30.7328 16.2101 30.6535 16.2881C30.5742 16.366 30.5111 16.4588 30.4677 16.5612C30.4243 16.6636 30.4014 16.7735 30.4005 16.8846C30.3996 16.9958 30.4205 17.1061 30.4622 17.2092C30.5039 17.3123 30.5655 17.4061 30.6434 17.4854C31.7474 18.6097 32.548 19.9957 32.9703 21.5138V21.5127ZM34.0147 25.9104C33.9075 25.8806 33.7955 25.8723 33.6851 25.8859C33.5746 25.8995 33.468 25.9347 33.3712 25.9896C33.2744 26.0444 33.1893 26.1178 33.1209 26.2055C33.0525 26.2932 33.002 26.3936 32.9724 26.5008C32.5929 27.8669 31.9051 29.1278 30.9619 30.1864C30.3448 29.2937 29.5612 28.5284 28.6541 27.9325C28.577 27.8814 28.4853 27.8569 28.393 27.8628C28.3007 27.8688 28.2129 27.9048 28.143 27.9653C26.9929 28.9605 25.5229 29.5082 24.002 29.5082C22.481 29.5082 21.011 28.9605 19.8609 27.9653C19.7909 27.9045 19.7029 27.8684 19.6103 27.8624C19.5178 27.8565 19.4259 27.8811 19.3487 27.9325C18.4358 28.5203 17.6453 29.2792 17.0208 30.1673C16.0866 29.1117 15.4052 27.857 15.0283 26.4987C14.9682 26.2823 14.8247 26.0987 14.6292 25.9882C14.4338 25.8776 14.2024 25.8493 13.986 25.9093C13.7696 25.9694 13.586 26.1129 13.4755 26.3084C13.3649 26.5039 13.3366 26.7352 13.3966 26.9516C14.0436 29.2669 15.4305 31.3069 17.3455 32.7601C19.2605 34.2133 21.5985 35 24.0025 35C26.4065 35 28.7444 34.2133 30.6594 32.7601C32.5745 31.3069 33.9613 29.2669 34.6083 26.9516C34.6379 26.8443 34.6459 26.7321 34.632 26.6217C34.6182 26.5112 34.5827 26.4046 34.5275 26.3079C34.4724 26.2111 34.3987 26.1262 34.3107 26.058C34.2227 25.9898 34.1221 25.9397 34.0147 25.9104ZM23.9982 27.8151C24.9191 27.8151 25.8193 27.542 26.5849 27.0304C27.3506 26.5188 27.9473 25.7917 28.2997 24.9409C28.6521 24.0902 28.7443 23.154 28.5647 22.2509C28.385 21.3477 27.9416 20.5181 27.2904 19.867C26.6393 19.2159 25.8097 18.7724 24.9066 18.5928C24.0034 18.4131 23.0673 18.5053 22.2165 18.8577C21.3658 19.2101 20.6386 19.8069 20.127 20.5725C19.6154 21.3382 19.3424 22.2383 19.3424 23.1592C19.3438 24.3936 19.8348 25.577 20.7076 26.4498C21.5804 27.3227 22.7639 27.8137 23.9982 27.8151Z"
                            fill="white"
                          />
                        </svg>
                      ) : item.flag === 'tlpriority' &&
                        auth.emp_id === item.employeeDetails[0].emp_id ? (
                        <svg
                          width="28"
                          height="28"
                          style={{ marginLeft: '5px' }}
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="48" height="48" rx="24" fill="#E6B31F" />
                          <path
                            d="M15.9122 35C15.676 35 15.4494 34.9062 15.2824 34.7391C15.1153 34.5721 15.0215 34.3455 15.0215 34.1093V14.9592C15.0221 14.8179 15.0564 14.6787 15.1215 14.5533C15.1865 14.4278 15.2805 14.3197 15.3956 14.2377C18.4641 12.051 22.4722 13.2178 24.3917 14.2689C25.5331 14.7846 26.7733 15.0446 28.0257 15.0307C29.2781 15.0169 30.5123 14.7295 31.642 14.1887C31.7773 14.1106 31.9309 14.0694 32.0871 14.0694C32.2434 14.0693 32.3969 14.1104 32.5323 14.1885C32.6677 14.2666 32.7801 14.3789 32.8584 14.5141C32.9366 14.6494 32.9779 14.8029 32.9781 14.9592V27.0505C32.9799 27.0608 32.9799 27.0713 32.9781 27.0816C32.9852 27.2446 32.9474 27.4063 32.8688 27.5492C32.7903 27.6922 32.674 27.8108 32.5327 27.8922C31.0319 28.7428 27.478 29.7315 23.6257 28.0347L23.5544 27.9991C23.3941 27.91 19.7066 25.9104 16.794 27.6027V34.1004C16.7952 34.2174 16.7733 34.3334 16.7296 34.4419C16.6859 34.5504 16.6213 34.6493 16.5394 34.7328C16.4575 34.8164 16.36 34.883 16.2524 34.9288C16.1448 34.9746 16.0292 34.9988 15.9122 35Z"
                            fill="white"
                          />
                        </svg>
                      ): item.requestTo ? (
                        <img
                          src={item.requestTo === 'manager' ? manager : tl}
                          alt=""
                          width={40}
                          style={{ borderRadius: '50%' }}
                        />
                      ) : (
                        <span style={{ marginLeft: '-15px' }}>
                          {/* {item.token}
                          {item.token ? '.' : ''} */}
                        </span>                    
                      )
                    }
                  </div>

                  <div key={item.id} className='flext items-center'>
                    <div className='text-base font-bold'>
                      <div className='items-center'>
                        {item.team?.length > 0 ?(
                          <div className='flext items-center'>
                            <span className='text-base'>{item.team.join(', ')}</span>
                          </div>
                          ) : item.employeeDetails.length > 1 ? (
                                item.all === true ? (
                                  'All'
                                ) : (
                                  <Popover
                                    content= {
                                      <div>
                                        {item.employeeDetails.slice(1).map((emp, index)=>(
                                          <div
                                            key={emp.id}
                                            className='flex items-center gap-[8px]'
                                          >
                                            <span className='text-black'>
                                              {index+1}. {emp.name}
                                            </span>

                                            {auth.role ==='admin' &&(
                                              <button className='text-white bg-red-600 border-none px-[4px] py-[8px] cursor-pointer'>Remove</button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    }

                                    title= "Employee Details"
                                    trigger={'click'}
                                    placement='right'
                                    open={visiblePopover === item.id}
                                    onOpenChange={(open) => !open && hidePopover()}
                                  >
                                    <div>
                                      <span className='text-black font-bold mr-[8px]'>
                                        {item.flag ==='client' ? "Client"
                                          : item.flag === 'interviewer' ? "Interview" : item.employeeDetails[0]?.name
                                        }
                                      </span>

                                      <Button
                                        onClick={()=> handlePopover(item.id)}
                                        className='bg-transparent text-[#4285F4] border-none p-0 shadow-none'
                                      >
                                        + {item.employeeDetails.length - 1} members
                                      </Button>
                                    </div>
                                  </Popover>
                                )
                              ):(
                                <div className='flext items-center'>
                                  <span className='text-base text-black text-opacity-70'>
                                    {item.flag === 'client' ? "Client": item.flag === 'interviewer' ? "Interview" : item.employeeDetails[0]?.name}
                                  </span>

                                  <p
                                    style={{
                                      fontSize:'14px',
                                      margin:0,
                                      fontWeight:'lighter',
                                      color:'#808080'
                                    }}
                                  >
                                    {item.flag === 'client' || item.flag === 'interviwer' ? "" : item.employeeDetails[0]?.team_name}
                                  </p>
                                </div>
                              )
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className='basis-[40%] text-center'>
                  {item.employeeDetails.length>0 &&
                    item.employeeDetails.some((emp)=>emp.emp_id === auth.emp_id) && (
                      <h5 className='text-[15px] text-black m-0'>{item.description}</h5>
                    )
                  }
                </div>

                <div className='flex justify-end items-center basis-[30%]'>
                  <p className='text-[12px] text-[#bdbdbd] pr-[20px] '>{formatTime(item.time)}</p>

                  {item.employeeDetails.length>0 &&
                    item.employeeDetails[0].emp_id === auth.emp_id &&
                    item.status !== 'inmeeting' &&
                    item.flag !== 'admin' &&
                    item.flag !== 'priority' &&
                    item.request_type !=='report' && (
                      <Popconfirm
                        title="Are you sure you want to revoke this meeting?"
                        onConfirm={() => handleRevoke(item.id)} // Call handleRevoke when confirmed
                        onCancel={() =>
                          msg.info({
                            conent: 'Revocation cancelled.',
                            className: `${theme.current !== 'light' ? theme.current : ''}`
                          })
                        }
                        okText='Ok'
                        cancelText="Cancel"
                        placement='topRight'
                      >
                        <Button className="bg-[#E6B31F] text-white ml-[10px] mr-[10px] px-3 py-1 rounded hover:bg-[#d49f17]"
                        >Revoke</Button>

                      </Popconfirm>
                    )
                  }
                </div>
              </div>
            </div>
          ))}

        
          <div className='m-10'>
            <div className="flex justify-center">
              <img src={QueueImage} alt="" width="50%" />
            </div>
            <div className="mt-5">
              <div className="text-center">
                <h6>
                  {meetingData.length !== 0 && adminData.length !== 0 ? (
                    <b>Your request has been raised .</b>
                  ) : (
                    ''
                  )}
                </h6>
                {meetingData.length === 0 && adminData.length === 0 ? (
                  <p>Hang in there! Your turn is coming right up.</p>
                ) : (
                  <b>You are being called to the meeting!</b>
                )}
              </div>
            </div>
          </div>

          {data.map((item, index)=>(
            <div className=''>
              <div className='container flex justify-around items-center py-[3px] px-[10px] mb-[1%] w-[90%] mx-auto'
                  style={{
                    backgroundColor: getBackgroundColor(item, auth),
                    color: item.flag === 'client' || item.flag === 'interviewer' ? 'black' : '#ffffff' 
                  }}
              >
                <Badge
                  count = {item.requestTo === 'manager' ? "Manager" : "Team Lead"}
                  style={{
                    backgroundColor : item.requestTo === 'manager' ? '#34A853 ': '#FBBC05 ',
                    fontSize: 12,
                  }}
                ></Badge>

                <div className='flex pl-[2%] basis-[20%] items-center'>
                  <div className='flex items-center text-[20px] mr-[10px] leading-normal' >
                    {item.flag ==='priority'?(
                        <svg
                          width="28"
                          height="28"
                          style={{ marginLeft: '5px' }}
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width={'48'} height={'48'} rx="24" fill='#F8184E'/>
                          <path
                            d="M15.9122 35C15.676 35 15.4494 34.9062 15.2824 34.7391C15.1153 34.5721 15.0215 34.3455 15.0215 34.1093V14.9592C15.0221 14.8179 15.0564 14.6787 15.1215 14.5533C15.1865 14.4278 15.2805 14.3197 15.3956 14.2377C18.4641 12.051 22.4722 13.2178 24.3917 14.2689C25.5331 14.7846 26.7733 15.0446 28.0257 15.0307C29.2781 15.0169 30.5123 14.7295 31.642 14.1887C31.7773 14.1106 31.9309 14.0694 32.0871 14.0694C32.2434 14.0693 32.3969 14.1104 32.5323 14.1885C32.6677 14.2666 32.7801 14.3789 32.8584 14.5141C32.9366 14.6494 32.9779 14.8029 32.9781 14.9592V27.0505C32.9799 27.0608 32.9799 27.0713 32.9781 27.0816C32.9852 27.2446 32.9474 27.4063 32.8688 27.5492C32.7903 27.6922 32.674 27.8108 32.5327 27.8922C31.0319 28.7428 27.478 29.7315 23.6257 28.0347L23.5544 27.9991C23.3941 27.91 19.7066 25.9104 16.794 27.6027V34.1004C16.7952 34.2174 16.7733 34.3334 16.7296 34.4419C16.6859 34.5504 16.6213 34.6493 16.5394 34.7328C16.4575 34.8164 16.36 34.883 16.2524 34.9288C16.1448 34.9746 16.0292 34.9988 15.9122 35Z"
                            fill="white"
                          />
                        </svg>
                      ): item.flag ==="client" ? (
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 48 48"
                          style={{ marginLeft: '5px' }}
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="48" height="48" rx="24" fill="#189C9F" />
                          <path
                            d="M35.3951 23.0198L30.5708 27.1826L32.0406 33.408C32.1217 33.746 32.1008 34.1004 31.9806 34.4265C31.8604 34.7525 31.6462 35.0357 31.3651 35.2401C31.0841 35.4445 30.7487 35.5611 30.4015 35.575C30.0542 35.589 29.7106 35.4997 29.4141 35.3184L24.0002 31.9865L18.5831 35.3184C18.2866 35.4986 17.9434 35.5871 17.5968 35.5726C17.2501 35.5582 16.9155 35.4415 16.635 35.2372C16.3545 35.033 16.1408 34.7503 16.0206 34.4248C15.9005 34.0993 15.8793 33.7455 15.9598 33.408L17.435 27.1826L12.6107 23.0198C12.3484 22.7931 12.1587 22.4941 12.0653 22.1602C11.9718 21.8263 11.9789 21.4723 12.0854 21.1423C12.192 20.8124 12.3935 20.5211 12.6646 20.305C12.9357 20.0889 13.2645 19.9574 13.6099 19.927L19.935 19.4167L22.375 13.5118C22.5071 13.19 22.7318 12.9147 23.0208 12.721C23.3097 12.5273 23.6497 12.4238 23.9975 12.4238C24.3454 12.4238 24.6854 12.5273 24.9743 12.721C25.2632 12.9147 25.488 13.19 25.6201 13.5118L28.059 19.4167L34.3841 19.927C34.7302 19.9562 35.0599 20.087 35.332 20.3028C35.6041 20.5187 35.8065 20.81 35.9138 21.1404C36.021 21.4707 36.0284 21.8254 35.935 22.1599C35.8416 22.4944 35.6515 22.7939 35.3886 23.0209L35.3951 23.0198Z"
                            fill="white"
                          />
                        </svg>
                      ) : item.flag === "interviewer" ? (
                        <svg
                          width="28"
                          height="28"
                          style={{ marginLeft: '5px' }}
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width={"48"} height={"48"} rx="24" fill='#855FA8'/>
                          <path
                            d="M20.6397 14.3765C20.5847 14.1598 20.6177 13.9301 20.7315 13.7375C20.8453 13.545 21.0306 13.4054 21.2471 13.3491C23.0517 12.8836 24.9448 12.8836 26.7494 13.3491C26.9493 13.4002 27.1236 13.5227 27.2396 13.6933C27.3556 13.864 27.4052 14.0711 27.3793 14.2758C27.3533 14.4805 27.2534 14.6686 27.0985 14.8049C26.9435 14.9411 26.7441 15.0161 26.5378 15.0157C26.4664 15.0153 26.3953 15.006 26.3262 14.9881C24.7993 14.5939 23.1972 14.5939 21.6703 14.9881C21.5625 15.0158 21.4503 15.0219 21.3401 15.0061C21.2299 14.9903 21.1239 14.9529 21.0281 14.8961C20.9324 14.8393 20.8488 14.7642 20.7822 14.675C20.7155 14.5859 20.6671 14.4844 20.6397 14.3765ZM13.9828 22.101C14.09 22.1308 14.2019 22.1392 14.3123 22.1256C14.4227 22.1121 14.5293 22.077 14.6261 22.0223C14.7229 21.9675 14.8079 21.8943 14.8764 21.8067C14.9449 21.719 14.9954 21.6188 15.0251 21.5116C15.4474 19.9927 16.2484 18.6059 17.3531 17.4811C17.5003 17.3192 17.5792 17.1065 17.573 16.8876C17.5668 16.6688 17.476 16.4609 17.3198 16.3075C17.1635 16.1541 16.954 16.0673 16.7351 16.0651C16.5161 16.063 16.3049 16.1457 16.1457 16.296C14.8406 17.625 13.894 19.2633 13.3945 21.0577C13.3646 21.1648 13.356 21.2768 13.3694 21.3873C13.3828 21.4977 13.4178 21.6044 13.4724 21.7013C13.5271 21.7982 13.6003 21.8834 13.6879 21.952C13.7754 22.0206 13.8757 22.0712 13.9828 22.101ZM32.9703 21.5127C33.0304 21.7291 33.1739 21.9127 33.3694 22.0233C33.5649 22.1338 33.7962 22.1622 34.0126 22.1021C34.229 22.042 34.4126 21.8985 34.5232 21.703C34.6337 21.5076 34.662 21.2762 34.602 21.0598C34.1027 19.2653 33.1561 17.627 31.8508 16.2981C31.7728 16.2189 31.68 16.1557 31.5777 16.1123C31.4753 16.0689 31.3654 16.0461 31.2542 16.0451C31.143 16.0442 31.0328 16.0652 30.9297 16.1069C30.8266 16.1485 30.7328 16.2101 30.6535 16.2881C30.5742 16.366 30.5111 16.4588 30.4677 16.5612C30.4243 16.6636 30.4014 16.7735 30.4005 16.8846C30.3996 16.9958 30.4205 17.1061 30.4622 17.2092C30.5039 17.3123 30.5655 17.4061 30.6434 17.4854C31.7474 18.6097 32.548 19.9957 32.9703 21.5138V21.5127ZM34.0147 25.9104C33.9075 25.8806 33.7955 25.8723 33.6851 25.8859C33.5746 25.8995 33.468 25.9347 33.3712 25.9896C33.2744 26.0444 33.1893 26.1178 33.1209 26.2055C33.0525 26.2932 33.002 26.3936 32.9724 26.5008C32.5929 27.8669 31.9051 29.1278 30.9619 30.1864C30.3448 29.2937 29.5612 28.5284 28.6541 27.9325C28.577 27.8814 28.4853 27.8569 28.393 27.8628C28.3007 27.8688 28.2129 27.9048 28.143 27.9653C26.9929 28.9605 25.5229 29.5082 24.002 29.5082C22.481 29.5082 21.011 28.9605 19.8609 27.9653C19.7909 27.9045 19.7029 27.8684 19.6103 27.8624C19.5178 27.8565 19.4259 27.8811 19.3487 27.9325C18.4358 28.5203 17.6453 29.2792 17.0208 30.1673C16.0866 29.1117 15.4052 27.857 15.0283 26.4987C14.9682 26.2823 14.8247 26.0987 14.6292 25.9882C14.4338 25.8776 14.2024 25.8493 13.986 25.9093C13.7696 25.9694 13.586 26.1129 13.4755 26.3084C13.3649 26.5039 13.3366 26.7352 13.3966 26.9516C14.0436 29.2669 15.4305 31.3069 17.3455 32.7601C19.2605 34.2133 21.5985 35 24.0025 35C26.4065 35 28.7444 34.2133 30.6594 32.7601C32.5745 31.3069 33.9613 29.2669 34.6083 26.9516C34.6379 26.8443 34.6459 26.7321 34.632 26.6217C34.6182 26.5112 34.5827 26.4046 34.5275 26.3079C34.4724 26.2111 34.3987 26.1262 34.3107 26.058C34.2227 25.9898 34.1221 25.9397 34.0147 25.9104ZM23.9982 27.8151C24.9191 27.8151 25.8193 27.542 26.5849 27.0304C27.3506 26.5188 27.9473 25.7917 28.2997 24.9409C28.6521 24.0902 28.7443 23.154 28.5647 22.2509C28.385 21.3477 27.9416 20.5181 27.2904 19.867C26.6393 19.2159 25.8097 18.7724 24.9066 18.5928C24.0034 18.4131 23.0673 18.5053 22.2165 18.8577C21.3658 19.2101 20.6386 19.8069 20.127 20.5725C19.6154 21.3382 19.3424 22.2383 19.3424 23.1592C19.3438 24.3936 19.8348 25.577 20.7076 26.4498C21.5804 27.3227 22.7639 27.8137 23.9982 27.8151Z"
                            fill="white"
                          />
                        </svg>
                      ) : item.flag === 'tlpriority' &&
                        auth.emp_id === item.employeeDetails[0].emp_id ? (
                        <svg
                          width="28"
                          height="28"
                          style={{ marginLeft: '5px' }}
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="48" height="48" rx="24" fill="#E6B31F" />
                          <path
                            d="M15.9122 35C15.676 35 15.4494 34.9062 15.2824 34.7391C15.1153 34.5721 15.0215 34.3455 15.0215 34.1093V14.9592C15.0221 14.8179 15.0564 14.6787 15.1215 14.5533C15.1865 14.4278 15.2805 14.3197 15.3956 14.2377C18.4641 12.051 22.4722 13.2178 24.3917 14.2689C25.5331 14.7846 26.7733 15.0446 28.0257 15.0307C29.2781 15.0169 30.5123 14.7295 31.642 14.1887C31.7773 14.1106 31.9309 14.0694 32.0871 14.0694C32.2434 14.0693 32.3969 14.1104 32.5323 14.1885C32.6677 14.2666 32.7801 14.3789 32.8584 14.5141C32.9366 14.6494 32.9779 14.8029 32.9781 14.9592V27.0505C32.9799 27.0608 32.9799 27.0713 32.9781 27.0816C32.9852 27.2446 32.9474 27.4063 32.8688 27.5492C32.7903 27.6922 32.674 27.8108 32.5327 27.8922C31.0319 28.7428 27.478 29.7315 23.6257 28.0347L23.5544 27.9991C23.3941 27.91 19.7066 25.9104 16.794 27.6027V34.1004C16.7952 34.2174 16.7733 34.3334 16.7296 34.4419C16.6859 34.5504 16.6213 34.6493 16.5394 34.7328C16.4575 34.8164 16.36 34.883 16.2524 34.9288C16.1448 34.9746 16.0292 34.9988 15.9122 35Z"
                            fill="white"
                          />
                        </svg>
                      ): item.requestTo ? (
                        <img
                          src={item.requestTo === 'manager' ? manager : tl}
                          alt=""
                          width={40}
                          style={{ borderRadius: '50%' }}
                        />
                      ) : (
                        <span style={{ marginLeft: '-15px' }}>
                          {/* {item.token}
                          {item.token ? '.' : ''} */}
                        </span>                    
                      )
                    }
                  </div>

                  <div key={item.id} className='flext items-center'>
                    <div className='text-base font-bold'>
                      <div className='items-center'>
                        {item.team?.length > 0 ?(
                          <div className='flext items-center'>
                            <span className='text-base'>{item.team.join(', ')}</span>
                          </div>
                          ) : item.employeeDetails.length > 1 ? (
                                item.all === true ? (
                                  'All'
                                ) : (
                                  <Popover
                                    content= {
                                      <div>
                                        {item.employeeDetails.slice(1).map((emp, index)=>(
                                          <div
                                            key={emp.id}
                                            className='flex items-center gap-[8px]'
                                          >
                                            <span className='text-black'>
                                              {index+1}. {emp.name}
                                            </span>

                                            {auth.role ==='admin' &&(
                                              <button className='text-white bg-red-600 border-none px-[4px] py-[8px] cursor-pointer'>Remove</button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    }

                                    title= "Employee Details"
                                    trigger={'click'}
                                    placement='right'
                                    open={visiblePopover === item.id}
                                    onOpenChange={(open) => !open && hidePopover()}
                                  >
                                    <div>
                                      <span className='text-black font-bold mr-[8px]'>
                                        {item.flag ==='client' ? "Client"
                                          : item.flag === 'interviewer' ? "Interview" : item.employeeDetails[0]?.name
                                        }
                                      </span>

                                      <Button
                                        onClick={()=> handlePopover(item.id)}
                                        className='bg-transparent text-[#4285F4] border-none p-0 shadow-none'
                                      >
                                        + {item.employeeDetails.length - 1} members
                                      </Button>
                                    </div>
                                  </Popover>
                                )
                              ):(
                                <div className='flext items-center'>
                                  <span className='text-base text-black text-opacity-70'>
                                    {item.flag === 'client' ? "Client": item.flag === 'interviewer' ? "Interview" : item.employeeDetails[0]?.name}
                                  </span>

                                  <p
                                    style={{
                                      fontSize:'14px',
                                      margin:0,
                                      fontWeight:'lighter',
                                      color:'#808080'
                                    }}
                                  >
                                    {item.flag === 'client' || item.flag === 'interviwer' ? "" : item.employeeDetails[0]?.team_name}
                                  </p>
                                </div>
                              )
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className='basis-[40%] text-center'>
                  {item.employeeDetails.length>0 &&
                    item.employeeDetails.some((emp)=>emp.emp_id === auth.emp_id) && (
                      <h5 className='text-[15px] text-black m-0'>{item.description}</h5>
                    )
                  }
                </div>

                <div className='flex justify-end items-center basis-[30%]'>
                  <p className='text-[12px] text-[#bdbdbd] pr-[20px] '>{formatTime(item.time)}</p>

                  {item.employeeDetails.length>0 &&
                    item.employeeDetails[0].emp_id === auth.emp_id &&
                    item.status !== 'inmeeting' &&
                    item.flag !== 'admin' &&
                    item.flag !== 'priority' &&
                    item.request_type !=='report' && (
                      <Popconfirm
                        title="Are you sure you want to revoke this meeting?"
                        onConfirm={() => handleRevoke(item.id)} // Call handleRevoke when confirmed
                        onCancel={() =>
                          messageApi.info({
                            conent: 'Revocation cancelled.',
                          })
                        }
                        okText='Ok'
                        cancelText="Cancel"
                        placement='topRight'
                      >
                        <Button className="bg-[#E6B31F] text-white ml-[10px] mr-[10px] px-3 py-1 rounded hover:bg-[#d49f17]"
                        >Revoke</Button>

                      </Popconfirm>
                    )
                  }
                </div>
              </div>
            </div>
          ))}
        </div>  
      ):(
        <div className=' max-w-screen-xl mx-auto flex items-center justify-center mt-[8%]'>
          <div className='flex flex-col justify-center items-center gap-6 '>
            <img src={openImage} alt="" className='w-[80%] h-[80%]' />
            <div>
              <p className='text-center mb-5'>Raise a request</p>
              <button className='bg-green-700 text-white font-bold py-3 px-5 rounded-full'>Send A Request</button>
            </div>
          </div>
        </div>
        )
      }

      <Modal
        title={<div className='w-full text-center text-blue-400'>Send Request to Admin</div>}
        open={showModal2}
        footer={null}
        centered
        width={'700px'}
        onCancel={()=>setShowModal2(false)}
      > 
    
        <div className='mb-10'>
          <p className='font-semibold mb-2 font-serif text-[17px]'>{auth.name}</p>
          <p>{auth.team_name}</p>
        </div>

        <div className='mb-10'>
          <p className='font-semibold text-[17px] mb-3'>Queue Raised to</p>
          <Radio.Group
            name='radioGroup'
            defaultValue={requestTo}
            onChange={(e)=>setRequestTo(e.target.value)}
            options={[
              {value:'manager', label: "Manager"},
              {value:'tl', label: "Team Leader"}
            ]}
            >
          </Radio.Group>
        </div>

        <div className='mb-10'>
          <p className='font-semibold text-[17px] mb-3'>Purpose of Request</p>
          <Radio.Group
            name='radioGroup'
            defaultValue={requestPurpose}
            onChange={(e)=>setRequestPurpose(e.target.value)}
            options={[
              {value:'work', label: "Work"},
              {value:'report', label: "Report"}
            ]}
            >
            
          </Radio.Group>
        </div>

        <Input.TextArea
          showCount
          required
          maxLength={300}
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
          placeholder='What do you wanna ask?'
          className='!h-[150px] !bg-slate-100'
          >
        </Input.TextArea>

        <div className='w-full flex justify-center mt-4'>
          <button className='bg-green-600 font-semibold py-2 px-7 text-white rounded-md tracking-normal' onClick={()=>handleSubmit()}>
            Send
          </button>
        </div>
      
      </Modal>

      <Modal
        title=""
        open= {showModal && message !== '%connected%'}
        onOk={()=>(setShowModal(false))}
        className="custom-modal top-[30%] rounded-[10px] overflow-hidden w-[60%]"
        footer={null} // Hide Ok and Cancel buttons
        closable={false} // Hide the X button
        okText="Close"
      >
        <div className={`${message ==='revoked'? 'bg-[#E6B31F]': person==='admin' ? 'bg-[#34A853]':'bg-[#2768D5]' }`}>
          <div className='flex pt-5 pb-2 items-center justify-center'>
            {person ==='admin'?(
              <img src={manager} alt="" className='w-[150px] h-[150px]' />
              ):(
                  <img src={tl} alt=""  className='w-[150px] h-[150px]'/>
              )
            }
          </div>
        </div>

        <div className='h-[130px]'>
          <div className='text-center pt-3 font-bold'>
            <div>
              {message === 'revoked'?(
                <p className='mb-2'>Your meeting call was Revoked.</p>
              ): person ==='admin'?(
                <>
                  <p className="mb-2">You received a meeting call from Manager.</p>
                  {/* <p style={{ marginTop: '-20px' }}>Check the Queue and be ready</p> */}
                </>
              ): (
                  <p className="mb-2">You received a meeting call from Team Lead.</p>

              )
              }
            </div>
          </div>

          <div className='flex justify-center'>
            <Button className='bg-blue-500 text-white px-15 py-5' onClick={()=>setShowModal(false)}>
              OK
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UserPage
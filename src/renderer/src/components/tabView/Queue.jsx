import React, { useContext, useEffect, useState } from 'react'
import { Button, message as msg, Popover, Select, Popconfirm,Tooltip, Dropdown, Menu } from 'antd'
import ServerURL from '../../utils/MainUrl'
import { useAuth } from '../../context/AuthContext'
import axios from '../../config/AxiosConfig'
import NotifyMessageAudio from '../../assets/audio/NotifyMessage.mp3'
import { searchContext } from '../../context/SearchContext'
import BellIcon from '../../assets/images/bell.webp'
import dayjs from 'dayjs'
import DeleteSvg from '../../assets/svg/DeleteSvg'
import { CheckOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, InfoCircleOutlined, MoreOutlined } from '@ant-design/icons'
import { formatDuration } from '../../utils/FormatDuration'
import { formatTime } from '../../utils/FormatTime'
import getDuration from '../../utils/GetDuration'

const Queue = () => {
  const { auth } = useAuth()

  const [currentMeeting, setCurrentMeeting] = useState('')
  const [data, setData] = useState([])
  const [teams, setTeams] = useState([])
  const [employees, setEmployees] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const { search, setSearch, setCurrentTeam, currentTeam } = useContext(searchContext)
  const [pauseAllMeetings, setPauseAllMeetings] = useState(
    localStorage.getItem('Timer') ? true : false
  )
  const [selectAll, setSelectAll] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])

  const [meetingId, setMeetingId] = useState('')
  const [meetingData, setMeetingData] = useState([])


  const [pauseIndex, setPauseIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showModal3, setShowModal3] = useState(false)

  const [visiblePopover, setVisiblePopover] = useState(false)
  const [loading, setLoading] = useState({
    accept: false,
    revoke: false,
    start: false,
    join: false,
    end: false
  })

  const [bulkPostponeModalVisible, setIsBulkPostponeModalVisible] = useState(false)
  const [isBulkdeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false)

  const [messageApi, messageContent] = msg.useMessage()
  

  const [displayedData, setDisplayedData] = useState([])
  const [filterStatus, setFilterStatus] = useState(null)
  const [filteredData, setFilteredData] = useState([])
  const [requestFilter, setRequestFilter] = useState(null)

  let eventSource
  let reconnectInterval
  let reconnectTimeout = 5000

  const createEventSourceConnection = () => {
    eventSource = new EventSource(ServerURL(auth.emp_id))
    eventSource.onmessage = (event) => {
      if (reconnectInterval) clearInterval(reconnectInterval)
      console.log('HI Queue is Empty')
      let queue

      try {
        if (event?.data) {
          queue = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
          const accept  = queue?.queueData?.filter((item)=>item.status === 'accepted' && item.queuedEmpId==auth.emp_id)
          console.log(accept.length, 'accepted');
        }
      } catch (err) {
        console.error('Failed to parse JSON:', err)
        return
      }

      // console.log('queue', queue.me ssage)

      const notification = localStorage.getItem('notificationState')
      console.log('notififcaiton', notification)

      if (window.Notification && notification == 'on') {
        if (queue?.message === 'new') {
          const notification = new Notification('New Request', {
            body: 'Peoples are on the Queue Now !!!!'
          })

          const playCustomSound = true
          if (playCustomSound) {
            const audio = new Audio(NotifyMessageAudio)
            audio.volume = 1.0
            audio.play().catch((err) => console.error('Audio playback failed:', err))
          }

          notification.onclick = (event, arg) => {
            window.electron_api.showMainWindow()
          }
        }
      }

      if (queue?.queueData?.length > 0) {
        const flagData = queue?.queueData?.filter((item)=>item.flag==='employee')
        console.log(flagData, 'flaggieen');
        const current = queue.queueData
          .filter((data) => data.status === 'inmeeting')
          .map((val) => val.id)
        console.log('current', current)
        setCurrentMeeting(current[0] ?? '')
        setData(queue.queueData)
        const index = queue.queueData.filter(
          (data) =>
            data.status === 'inmeeting' ||
            data.status === 'paused' ||
            data.status === 'meeting_remainder'
        ).length
        console.log('index', index)
        setPauseIndex(index)
        setLoading({
          accept: false,
          revoke: false,
          start: false,
          end: false
        })
      } else {
        setCurrentMeeting('')
        setData([])
        setLoading({
          accept: false,
          revoke: false,
          start: false,
          end: false
        })
      }
    }

    eventSource.onerror = (err) => {
      console.error('EventSource connection error:', err)

      eventSource.close()
      reconnectInterval = setInterval(() => {
        createEventSourceConnection()
      }, reconnectTimeout)
    }
  }

  const retryConnection = () => {
    message.loading({ content: 'Slow internet Connection. Try to refresh' })
    createEventSourceConnection()
  }

  const handleBulkPostpone = () => {
    setIsBulkPostponeModalVisible(true)
  }

  const handleBulkDelete = () => {
    setIsBulkDeleteModalVisible(true)
  }

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id))
    } else {
      setSelectedItems(...selectedItems, id)
    }
  }

  useEffect(() => {
    if (displayedData.length > 0 && selectedItems.length === displayedData.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedItems, displayedData])

  useEffect(() => {
    setSearch('')
    setCurrentTeam('')
    fetchData()
    // console.log("Fethe d");
    let interval
    if (pauseAllMeetings) {
      interval = setInterval(() => {})
    }
    createEventSourceConnection()

    return () => {
      eventSource.close()
      console.log('close');
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    console.log('3')
    let newData
    if (currentTeam) {
      newData = data.filter(
        (record) =>
          record.employeeDetails.filter((val) => val.team === parseInt(currentTeam)).length > 0
      )
    } else {
      newData = data
    }

    if (search) {
      newData = newData.filter(
        (record) =>
          record.employeeDetails.filter((val) =>
            val.name.toLowerCase().includes(search.toLowerCase())
          ).length > 0
      )
    }

    if (!currentTeam && !search) newData = data
    console.log('New Data', newData)
    console.log(auth.emp_id)
    const filtered = newData.filter((item) => item.queuedEmpId == auth.emp_id)
    console.log('FIlterded Data', filtered)
    setFilteredData(filtered)
  }, [search, currentTeam, data])

  // useEffect(() => {
  //   displayedData.forEach((item)=>{
  //     console.log(item.flag, item.employeeDetails, 'Displaued Data')

  //   })
  // }, [displayedData])

  useEffect(() => {
    console.log('object :lkj;l', filteredData)
    const data = filteredData.filter((item) => {
      let meetingMatch = true
      let requestMatch = true

      if (filterStatus === 'postpone') meetingMatch = item.postpone === 1
      if (filterStatus === 'active') meetingMatch = item.postpone === 0

      if (requestFilter === 'work') requestMatch = item.request_type === 'work'
      if (requestFilter === 'report') requestMatch = item.request_type === 'report'

      return meetingMatch && requestMatch
    })
    let arr = data.filter(item=> item.status === "accepted")
    console.log(arr, 'displayed Datat');
    setDisplayedData(data)
  }, [filteredData, filterStatus, requestFilter])

  const fetchMeetings = async () => {
    try {
      const date = dayjs.format('YYYY-MM-DD')
      const response = await axios.post('/meeting-remainder', { date })
    } catch (err) {
      console.log(err)
      message.error({ content: 'Please refresh the page', duration: 2 })
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/team/teams')
      if (response.status == 200) {
        const data = response.data.map((team) => ({
          value: team.id,
          label: team.name
        }))
        console.log(data)
        setTeams(data)
      }
    } catch (err) {
      console.log(err)
      message.error({ content: 'Please refresh the page', duration: 2 })
    }
  }

  // const filterData

  const fetchData = async () => {
    try {
      console.log('callled')
      // await fetchMeetings()
      const teams = await fetchTeams()
      // const response = await axios.get('user/users')
      // const teamMap = new Map(teams.map((team)=>[team.id, team.name]))
      // const data = response.data.map((val)=>({...val, team_name: teamMap.get(val.team)}))

      // setEmployees(data)
    } catch (err) {
      console.log(err)
      messageApi.error({ content: 'Network Error! Please reload the page', duration: 2 })
    }
  }

  const handleStart = async (item)=>{
    const token = item.token
    const team = item.team?.length > 0 ? item.team : item.employeeDetails.map((val) => val.team_name)
    setLoading((prev) => ({ ...prev, start: item.id }))

    try{
      await axios.post('/meet/start-meeting', {
        id: item.id,
        token,
        intervals:[],
        starttime: new Date().toISOString(),
        team
      })
      messageApi.success({content:"Meeting Started SuccessFully"})

    }catch(err){
      console.log(err);
      messageApi.error({content:"Unable To Start Meeting"})
    }finally{
      setLoading((prev)=>({...prev, start:null}))
    }
  }

  const handleAccept = async(id)=>{
    setLoading({ ...loading, accept: id })
    let timeOut;
    try{
      timeOut = setTimeout(()=>{
        retryConnection()
      }, 5000)
      const response = await axios.post('/meet/accept-request', {id:id})
      if(response.status ===200){
        setData(response.data.queueData)
      }else{
        messageApi.warning({content:"Unable to Accept"})
      }
    }catch(err){
      console.log(err);
      messageApi.error({content: "Unable to Accept"})
    }finally{
      setLoading(false)
      clearTimeout(timeOut)
    }
  }

  const handleNotify = async(id)=>{
    try{
      const response = await axios.post('/meet/notify-employee', {id: id, role: auth.role})
      if(response.status === 200){
        messageApi.success({content: "User was successfully Notified"})
      }else{
        messageApi.warning({content: "Unable to Notify"})
      }
    }catch(err){
      console.log(err);
      messageApi.error({content: "Unable to Notify"})
    }
  }

  const handleDelete = async(id)=>{
    try{
      const response = await axios.post('meet/delete-meeting', {id})

      if(response.status ===200){
        createEventSourceConnection()
        setData(response.data.queueData)
      }else{
        messageApi.warning({content:response.data.message || "unable to delete"})
      }
    }catch(err){
      console.log(err);
      messageApi.error({content: "Unable To Delete"})
    }
  }

  const handleJoin = async(id)=>{
    setLoading({...loading, join:id})
    try{
      const response = await axios.post('/meet/join-meeting', {id:id});

      if(response.status===200){
        messageApi.success({content:"Successfully Joined"})
        setData(response.data.queueData)
      }else{
        messageApi.warning({content: "Unable to Join"})
      }
    }catch(err){
      console.log(err)
      messageApi.error({content:'Unable to Join the meeting !!!'})
    }finally{
      setLoading({...loading, join:null})
    }
  }

  const handleEnd = async(item)=>{
    const id = item.id
    const emp_ids = item.employeeDetails.map((val)=>val.emp_id)

    setLoading((prev)=>({...prev, end:id}))

    try{
      const response = await axios.post('/meet/meeting-data',{id})
      const [meetingData] = response.data
      console.log(meetingData, "meeting Data");
      let newIntervals = []
      if(meetingData.paused ===1){
        newIntervals = [...JSON.parse(meetingData.intervals)]
      }else{
        console.log('obhenct before', meetingData.intervals);
        newIntervals=[
          ...JSON.parse(meetingData.intervals), {start: meetingData.starttime, end: new Date()}
        ]
        console.log('object after');
      }

      const duration = getDuration(newIntervals)

      const endResponse = await axios.post('/meet/end-meeting',{id,duration, emp_ids })
      if(endResponse.status === 200){
        messageApi.success({content:"Meeting Ended SuccessFully"})
        setData(endResponse.data.queueData)
      }
    }catch(err){
      console.log(err);
      messageApi.error({content:"Unable to End Meeting", duration:2})
    }finally{
      setLoading((prev)=> ({...prev, end:null}))
    }
  }

  const handleRevoke = async(id)=>{
    setLoading({...loading, revoke:id})

    try{
      const response = await axios.post('/meet/revoke-request', {id});
      if (response.status === 200){
        messageApi.success({content:"Revoked SuccessFully"})
        console.log(response.data);
        setData(response.data.queueData);
      }else{
        messageApi.warning({message: "Unable to Revoke Successfully"})
      }
    }catch(err){  
      console.log(err);
      messageApi.error({message: "Unable to Revoke Successfully"})
    }finally{
      setLoading(false)
    }
  }

  const hidePopover = ()=>{
    setVisiblePopover(null);
  }

  const handlePopover = (id)=>{
    setVisiblePopover((prevId=> prevId === id? null: id))
  }
  const handleRemove = async(id, emp_id)=>{
    try{
      // const response = await axios.post('/meet/remove-employee', {meeting_id: id, emp_id: emp_id})
      // setData(response.data.queueData)
    }catch(err){
      console.log(err);
    }
  }
  return (
    <div className="w-[97%] mx-auto">
      {messageContent}
      <div className="w-full flex items-center justify-around mt-8 gap-10">
        <div className="flex w-1/2 items-center justify-between gap-5">
          <div className="w-1/2 flex justify-start ml-5">
            <Select
              className="w-full text-start"
              placeholder="Select Team"
              options={teams}
              showSearch
              size="large"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          <div className="w-1/2 flex border rounded-md p-2 pl-4 mr-5">
            <input
              type="text"
              placeholder="Search By Name"
              className="w-full mr-5 border-none focus:outline-none focus:ring-0"
              onChange={(e) => fileterData(e.target.value)}
            />
          </div>
        </div>

        <div className="flex w-1/2 items-center justify-between gap-3">
          <div className="w-1/2 flex justify-start">
            <Select
              className="w-full text-start"
              placeholder="Select Meeting Type"
              size="large"
              options={[
                { value: 'all', label: 'All Meetings' },
                { value: 'postpone', label: 'Postponed' },
                { value: 'active', label: 'Active Meetings' }
              ]}
            />
          </div>
          <div className="w-1/2 flex justify-start">
            <Select
              className="w-full text-start"
              placeholder="Select Meeting Type"
              size="large"
              options={[
                { value: 'all', label: 'All' },
                { value: 'report', label: 'Report' },
                { value: 'work', label: 'Work' }
              ]}
            />
          </div>

          <div></div>
        </div>
      </div>

      <div
        className="table-container w-full h-[65vh] mt-8  mx-auto"
        style={{ justifyItems: 'center' }}
      >
        <table>
          <thead className={`z-[3] bg-blue-500 text-white`}>
            <tr className="">
              {auth.role === 'admin' ? (
                <th className="w-[40px] pl-[8px] py-5">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    // onChange={handleSelectAll}
                    disabled={displayedData.length === 0}
                  />
                </th>
              ) : (
                ''
              )}

              <th className="min-w-[10vw]">Token</th>
              <th className="min-w-[15vw]">Name</th>
              <th className="min-w-[10vw]">Request Type</th>
              <th className="min-w-[20vw] w-[22vw]">Description</th>
              <th className="min-w-[10vw]">Time</th>
              <th className="w-[15rem]">Action</th>
            </tr>

            {selectedItems.length > 0 && (
              <tr>
                <td className="bg-[#e6f7ff] p-2 border-b border-[#f0f0f0]" colSpan={'7'}>
                  <div className="flex justify-between ">
                    <span className="flex items-center">
                      <CheckOutlined className="mr-[8px] text-[#1890ff]" />
                      <Button
                        type="link"
                        onClick={() => setSelectedItems([])}
                        className="ml-[12px] py-[4px]"
                      >
                        Clear
                      </Button>
                    </span>

                    <div>
                      <Button
                        icon={<ClockCircleOutlined />}
                        onClick={handleBulkPostpone}
                        className="!mr-[8px]"
                      >
                        {filterStatus === 'postpone' ? 'Return to the Queue' : 'Postpone Selected'}
                      </Button>
                      <Button icon={<DeleteOutlined />} onClick={handleBulkDelete} danger>
                        Deleted Selected
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </thead>

          <tbody className="relative">
            {displayedData?.map((item, index) => (
              <>
                {/* {pauseIndex === index && auth.role ==='admin' &&(
                  <tr className={`${pauseAllMeetings} ? bg-[#022E4A] : transparent shadow-none`}>
                    {pauseAllMeetings ? (
                      <>
                        <td colSpan={'6'}>
                          <div>
                            <span>
                              {timer}
                            </span>
                          </div>
                        </td>
                      </>
                    ):()}
                  </tr>
                )}   */}

                <tr
                  key={index}
                  className={`
                     shadow-xl p-10 
                    ${
                      item.status === 'ticket'
                        ? 'bg-[linear-gradient(135deg,#ffe0b2,#fff3e0,#ffe0b2)] animate-[shimmer_3s_ease-in-out_infinite]'
                        : item.status === 'meeting_remainder'
                          ? 'bg-[linear-gradient(135deg,#91e5f6,#d0f2ff,#91e5f6)] animate-[shimmer_3s_ease-in-out_infinite]'
                          : item.request_type === 'report' &&
                              item.employeeDetails[0]?.gender === 'female'
                            ? 'bg-[#FFEDFD]'
                            : item.request_type === 'report' &&
                                item.employeeDetails[0]?.gender === 'male'
                              ? 'bg-[#E6F3FF]'
                              : item.postpone === 1
                                ? 'bg-[#FFE3E3]'
                                : item.status === 'inmeeting'
                                  ? 'bg-[#FFE9C8]'
                                  : item.status === 'paused'
                                    ? 'bg-[rgb(211,200,200)]'
                                    : item.flag === 'interviewer'
                                      ? 'bg-[#F3E6FF]'
                                      : item.flag === 'client'
                                        ? 'bg-[#BEFBFC]'
                                        : item.flag === 'employee'
                                          ? 'bg-green-100'
                                          : 'bg-[#DAFFE4]'
                    }
                  `}
                >
                  {auth.role === 'admin' ? (
                    <td className='pl-4'>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                      />
                    </td>
                  ) : (
                    ''
                  )}

                  <td>
                    {item.flag &&
                      ((item.flag === 'priority' && (
                        <svg
                          className="w-7 h-7"
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="48" height="48" rx="24" className="fill-[#F8184E]" />
                          <path
                            d="M15.9141 35C15.6779 35 15.4514 34.9062 15.2843 34.7391C15.1173 34.5721 15.0234 34.3455 15.0234 34.1093V14.9592C15.0241 14.8179 15.0584 14.6787 15.1234 14.5533C15.1885 14.4278 15.2824 14.3197 15.3975 14.2377C18.466 12.051 22.4742 13.2178 24.3936 14.2689C25.535 14.7846 26.7753 15.0446 28.0277 15.0307C29.2801 15.0169 30.5143 14.7295 31.644 14.1887C31.7793 14.1106 31.9328 14.0694 32.0891 14.0694C32.2454 14.0693 32.3989 14.1104 32.5343 14.1885C32.6697 14.2666 32.7821 14.3789 32.8603 14.5141C32.9386 14.6494 32.9799 14.8029 32.98 14.9592V27.0505C32.9819 27.0608 32.9819 27.0713 32.98 27.0816C32.9871 27.2446 32.9493 27.4063 32.8708 27.5492C32.7923 27.6922 32.676 27.8108 32.5347 27.8922C31.0338 28.7428 27.4799 29.7315 23.6276 28.0347L23.5564 27.9991C23.3961 27.91 19.7085 25.9104 16.7959 27.6027V34.1004C16.7971 34.2174 16.7752 34.3334 16.7316 34.4419C16.6879 34.5504 16.6233 34.6493 16.5414 34.7328C16.4595 34.8164 16.3619 34.883 16.2543 34.9288C16.1467 34.9746 16.0311 34.9988 15.9141 35Z"
                            className="fill-white"
                          />
                        </svg>
                      )) ||
                        (item.flag === 'client' && (
                          <svg
                            className="w-[28px] h-[28px]"
                            viewBox="0 0 48 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect width="48" height="48" rx="24" className="fill-[#189C9F]" />
                            <path
                              d="M35.3951 23.0198L30.5708 27.1826L32.0406 33.408C32.1217 33.746 32.1008 34.1004 31.9806 34.4265C31.8604 34.7525 31.6462 35.0357 31.3651 35.2401C31.0841 35.4445 30.7487 35.5611 30.4015 35.575C30.0542 35.589 29.7106 35.4997 29.4141 35.3184L24.0002 31.9865L18.5831 35.3184C18.2866 35.4986 17.9434 35.5871 17.5968 35.5726C17.2501 35.5582 16.9155 35.4415 16.635 35.2372C16.3545 35.033 16.1408 34.7503 16.0206 34.4248C15.9005 34.0993 15.8793 33.7455 15.9598 33.408L17.435 27.1826L12.6107 23.0198C12.3484 22.7931 12.1587 22.4941 12.0653 22.1602C11.9718 21.8263 11.9789 21.4723 12.0854 21.1423C12.192 20.8124 12.3935 20.5211 12.6646 20.305C12.9357 20.0889 13.2645 19.9574 13.6099 19.927L19.935 19.4167L22.375 13.5118C22.5071 13.19 22.7318 12.9147 23.0208 12.721C23.3097 12.5273 23.6497 12.4238 23.9975 12.4238C24.3454 12.4238 24.6854 12.5273 24.9743 12.721C25.2632 12.9147 25.488 13.19 25.6201 13.5118L28.059 19.4167L34.3841 19.927C34.7302 19.9562 35.0599 20.087 35.332 20.3028C35.6041 20.5187 35.8065 20.81 35.9138 21.1404C36.021 21.4707 36.0284 21.8254 35.935 22.1599C35.8416 22.4944 35.6515 22.7939 35.3886 23.0209L35.3951 23.0198Z"
                              className="fill-white"
                            />
                          </svg>
                        )) ||
                        (item.flag === 'interviewer' && (
                          <svg
                            className="w-7 h-7"
                            viewBox="0 0 48 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect width="48" height="48" rx="24" className="fill-[#855FA8]" />
                            <path
                              d="M20.6358 14.3765C20.5808 14.1598 20.6138 13.9301 20.7276 13.7375C20.8414 13.545 21.0267 13.4054 21.2431 13.3491C23.0478 12.8836 24.9409 12.8836 26.7455 13.3491C26.9454 13.4002 27.1197 13.5227 27.2357 13.6933C27.3517 13.864 27.4013 14.0711 27.3753 14.2758C27.3494 14.4805 27.2495 14.6686 27.0946 14.8049C26.9396 14.9411 26.7402 15.0161 26.5339 15.0157C26.4625 15.0153 26.3914 15.006 26.3223 14.9881C24.7954 14.5939 23.1933 14.5939 21.6664 14.9881C21.5586 15.0158 21.4463 15.0219 21.3362 15.0061C21.226 14.9903 21.12 14.9529 21.0242 14.8961C20.9285 14.8393 20.8449 14.7642 20.7782 14.675C20.7116 14.5859 20.6632 14.4844 20.6358 14.3765ZM13.9789 22.101C14.0861 22.1308 14.198 22.1392 14.3084 22.1256C14.4188 22.1121 14.5254 22.077 14.6222 22.0223C14.719 21.9675 14.804 21.8943 14.8725 21.8067C14.941 21.719 14.9915 21.6188 15.0212 21.5116C15.4435 19.9927 16.2445 18.6059 17.3491 17.4811C17.4964 17.3192 17.5753 17.1065 17.5691 16.8876C17.5628 16.6688 17.4721 16.4609 17.3159 16.3075C17.1596 16.1541 16.9501 16.0673 16.7311 16.0651C16.5122 16.063 16.301 16.1457 16.1418 16.296C14.8367 17.625 13.8901 19.2633 13.3906 21.0577C13.3607 21.1648 13.3521 21.2768 13.3655 21.3873C13.3789 21.4977 13.4139 21.6044 13.4685 21.7013C13.5232 21.7982 13.5964 21.8834 13.6839 21.952C13.7715 22.0206 13.8718 22.0712 13.9789 22.101ZM32.9664 21.5127C33.0265 21.7291 33.17 21.9127 33.3655 22.0233C33.5609 22.1338 33.7923 22.1622 34.0087 22.1021C34.2251 22.042 34.4087 21.8985 34.5192 21.703C34.6298 21.5076 34.6581 21.2762 34.5981 21.0598C34.0988 19.2653 33.1521 17.627 31.8469 16.2981C31.7689 16.2189 31.6761 16.1557 31.5738 16.1123C31.4714 16.0689 31.3615 16.0461 31.2503 16.0451C31.1391 16.0442 31.0289 16.0652 30.9258 16.1069C30.8227 16.1485 30.7289 16.2101 30.6496 16.2881C30.5703 16.366 30.5072 16.4588 30.4638 16.5612C30.4203 16.6636 30.3975 16.7735 30.3966 16.8846C30.3957 16.9958 30.4166 17.1061 30.4583 17.2092C30.5 17.3123 30.5616 17.4061 30.6395 17.4854C31.7435 18.6097 32.5441 19.9957 32.9664 21.5138V21.5127ZM34.0108 25.9104C33.9036 25.8806 33.7916 25.8723 33.6812 25.8859C33.5707 25.8995 33.4641 25.9347 33.3673 25.9896C33.2705 26.0444 33.1854 26.1178 33.117 26.2055C33.0486 26.2932 32.9981 26.3936 32.9685 26.5008C32.589 27.8669 31.9012 29.1278 30.958 30.1864C30.3408 29.2937 29.5573 28.5284 28.6502 27.9325C28.5731 27.8814 28.4814 27.8569 28.3891 27.8628C28.2968 27.8688 28.209 27.9048 28.1391 27.9653C26.989 28.9605 25.5189 29.5082 23.998 29.5082C22.4771 29.5082 21.0071 28.9605 19.857 27.9653C19.787 27.9045 19.699 27.8684 19.6064 27.8624C19.5139 27.8565 19.422 27.8811 19.3448 27.9325C18.4319 28.5203 17.6414 29.2792 17.0169 30.1673C16.0827 29.1117 15.4013 27.857 15.0244 26.4987C14.9643 26.2823 14.8208 26.0987 14.6253 25.9882C14.4299 25.8776 14.1985 25.8493 13.9821 25.9093C13.7657 25.9694 13.5821 26.1129 13.4716 26.3084C13.361 26.5039 13.3327 26.7352 13.3927 26.9516C14.0397 29.2669 15.4266 31.3069 17.3416 32.7601C19.2566 34.2133 21.5946 35 23.9986 35C26.4026 35 28.7405 34.2133 30.6555 32.7601C32.5706 31.3069 33.9574 29.2669 34.6044 26.9516C34.634 26.8443 34.642 26.7321 34.6281 26.6217C34.6143 26.5112 34.5788 26.4046 34.5236 26.3079C34.4685 26.2111 34.3948 26.1262 34.3068 26.058C34.2188 25.9898 34.1182 25.9397 34.0108 25.9104ZM23.9943 27.8151C24.9152 27.8151 25.8153 27.542 26.581 27.0304C27.3467 26.5188 27.9434 25.7917 28.2958 24.9409C28.6482 24.0902 28.7404 23.154 28.5607 22.2509C28.3811 21.3477 27.9377 20.5181 27.2865 19.867C26.6354 19.2159 25.8058 18.7724 24.9027 18.5928C23.9995 18.4131 23.0634 18.5053 22.2126 18.8577C21.3619 19.2101 20.6347 19.8069 20.1231 20.5725C19.6115 21.3382 19.3385 22.2383 19.3385 23.1592C19.3399 24.3936 19.8309 25.577 20.7037 26.4498C21.5765 27.3227 22.76 27.8137 23.9943 27.8151Z"
                              className="fill-white"
                            />
                          </svg>
                        )) ||
                        (item.flag === 'employee' && (
                          <p className="w-full text-center font-bold">{item.token}</p>
                        )) ||
                        (item.flag === 'tlpriority' && (
                          <svg
                            className="w-[28px] h-[28px] "
                            viewBox="0 0 48 48"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect width="48" height="48" rx="24" className="fill-#E6B31F" />
                            <path
                              d="M15.9122 35C15.676 35 15.4494 34.9062 15.2824 34.7391C15.1153 34.5721 15.0215 34.3455 15.0215 34.1093V14.9592C15.0221 14.8179 15.0564 14.6787 15.1215 14.5533C15.1865 14.4278 15.2805 14.3197 15.3956 14.2377C18.4641 12.051 22.4722 13.2178 24.3917 14.2689C25.5331 14.7846 26.7733 15.0446 28.0257 15.0307C29.2781 15.0169 30.5123 14.7295 31.642 14.1887C31.7773 14.1106 31.9309 14.0694 32.0871 14.0694C32.2434 14.0693 32.3969 14.1104 32.5323 14.1885C32.6677 14.2666 32.7801 14.3789 32.8584 14.5141C32.9366 14.6494 32.9779 14.8029 32.9781 14.9592V27.0505C32.9799 27.0608 32.9799 27.0713 32.9781 27.0816C32.9852 27.2446 32.9474 27.4063 32.8688 27.5492C32.7903 27.6922 32.674 27.8108 32.5327 27.8922C31.0319 28.7428 27.478 29.7315 23.6257 28.0347L23.5544 27.9991C23.3941 27.91 19.7066 25.9104 16.794 27.6027V34.1004C16.7952 34.2174 16.7733 34.3334 16.7296 34.4419C16.6859 34.5504 16.6213 34.6493 16.5394 34.7328C16.4575 34.8164 16.36 34.883 16.2524 34.9288C16.1448 34.9746 16.0292 34.9988 15.9122 35Z"
                              className="fill-white"
                            />
                          </svg>
                        )))}
                  </td>

                  <td>
                    <div className='text-[16px] font-bold'>
                      {item.team?.length ? (
                          <div className='flex items-center'>
                            <span className='text-[16px]'>{item.team.join(', ')}</span>
                          </div>
                        ): item.all ?(
                          "All Members "
                        ): item.employeeDetails.length>1 ?(
                          <Popover
                            content={
                              <div>
                                {item.employeeDetails.map((emp, index)=>(
                                  <div
                                    key = {emp.id}
                                    className='flex items-center gap-4 px-[4px]'
                                  >
                                    <span>{index+1}.{emp.name}</span>
                                    <button
                                      onClick={()=>handleRemove(item.id, emp.emp_id)}
                                      className='bg-transparent text-white border-none p-[4px] cursor-pointer outline-none transition ease-in-out duration-200'
                                      aria-label='Remove Employee'
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox='0 0 48 48'
                                        className='w-[18px] h-[18px]'
                                        role='button'
                                      >
                                        <path
                                          className="fill-[#f44336] pointer-events-none"
                                          d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z"
                                        />
                                        <path
                                          className="fill-[#fff] pointer-events-none"
                                          d="M29.656,15.516l2.828,2.828l-14.14,14.14l-2.828-2.828L29.656,15.516z"
                                        />
                                        <path
                                          className="fill-[#fff] pointer-events-none"
                                          d="M32.484,29.656l-2.828,2.828l-14.14-14.14l2.828-2.828L32.484,29.656z"
                                          
                                        />
                                      </svg>
                                    </button>

                                  </div>
                                ))}
                              </div>
                            }
                            title="Employee Details"
                            className=''
                            trigger={'click'}
                            placement='right'
                            open = {visiblePopover===item.id}
                            onOpenChange={(open) => !open && hidePopover()}
                          >
                            <span className='text-black font-bold mr-[8px]'>
                              {item.flag ==='client'
                                ? 'Client'
                                : item.flag === 'interviewer'
                                  ? 'Interview'
                                  : item.employeeDetails[0].name
                              }
                            </span>
                            <Button
                              onClick={()=>handlePopover(item.id)}
                              className='bg-transparent text-[#4285F4] border=none shadow-none'
                            >
                              + {item.employeeDetails.length} Members
                            </Button>
                          </Popover>
                        ):(
                          <div className='flex'>
                            <div className='p-2'>
                              {item.request_type ==='report' && item.employeeDetails[0]?.gender &&(
                                <>
                                  {item.employeeDetails[0].gender==='male'&&(
                                    <svg
                                      className='w-[28px] h-[28px] fill-none'
                                      viewBox='0 0 48 48'
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <rect width="48" height="48" rx="24" className="fill-[#1A8CF7]" />
                                      <path
                                        d="M25.8041 35.0001H22.193C21.575 34.9997 20.9788 34.7719 20.5179 34.3602C20.0571 33.9485 19.7639 33.3816 19.6942 32.7676L16.7794 24.5016C16.7367 24.1482 16.7695 23.7898 16.8756 23.45C16.9817 23.1102 17.1587 22.7968 17.3948 22.5305C17.631 22.2641 17.921 22.0509 18.2456 21.905C18.5703 21.759 18.9222 21.6835 19.2782 21.6836H28.7208C29.0761 21.6837 29.4273 21.759 29.7515 21.9045C30.0756 22.05 30.3653 22.2624 30.6015 22.5278C30.8377 22.7932 31.015 23.1056 31.1219 23.4444C31.2288 23.7833 31.2627 24.1409 31.2216 24.4938L28.3068 32.7598C28.2379 33.3755 27.9447 33.9444 27.483 34.3576C27.0214 34.7709 26.4237 34.9996 25.8041 35.0001Z"
                                        className="fill-white"
                                      />
                                      <path
                                        d="M24.0012 20.8998C26.1826 20.8998 27.9511 19.1314 27.9511 16.9499C27.9511 14.7684 26.1826 13 24.0012 13C21.8197 13 20.0513 14.7684 20.0513 16.9499C20.0513 19.1314 21.8197 20.8998 24.0012 20.8998Z"
                                        className="fill-white"
                                      />
                                    </svg>
                                  )}
                                    {item.employeeDetails[0].gender === 'female' && (
                                    <svg className='w-[28px] h-[28px] fill-none'
                                      viewBox="0 0 48 48"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <rect width="48" height="48" rx="24" className="fill-[#F338DD]" />
                                      <path
                                        d="M25.8041 21.6835H22.193C21.575 21.6839 20.9788 21.9116 20.5179 22.3234C20.0571 22.7351 19.7639 23.302 19.6942 23.916L16.7794 32.182C16.7367 32.5354 16.7695 32.8938 16.8756 33.2336C16.9817 33.5734 17.1587 33.8868 17.3948 34.1531C17.631 34.4195 17.921 34.6327 18.2456 34.7786C18.5703 34.9246 18.9222 35.0001 19.2782 35H28.7208C29.0761 34.9999 29.4273 34.9246 29.7515 34.7791C30.0756 34.6336 30.3653 34.4212 30.6015 34.1558C30.8377 33.8904 31.015 33.578 31.1219 33.2392C31.2288 32.9003 31.2627 32.5427 31.2216 32.1898L28.3068 23.9238C28.2379 23.3081 27.9447 22.7392 27.483 22.326C27.0214 21.9127 26.4237 21.684 25.8041 21.6835Z"
                                        className="fill-white"
                                      />
                                      <path
                                        d="M24.0012 20.8998C26.1826 20.8998 27.9511 19.1314 27.9511 16.9499C27.9511 14.7684 26.1826 13 24.0012 13C21.8197 13 20.0513 14.7684 20.0513 16.9499C20.0513 19.1314 21.8197 20.8998 24.0012 20.8998Z"
                                        className="fill-white"
                                      />
                                    </svg>
                                  )}
                                </>
                              )}
                            </div>
                            <div className='flex items-center flex-col'>
                              <span className='text-[16px]'>
                                {item.flag ==='client'
                                  ? "Client"
                                  : item.flag === 'interviewer'
                                   ? "Interview"
                                   : item.employeeDetails[0].name
                                }
                              </span>
                              <p className={`text-[ 14px] font-light ${item.status ==='paused' ?'black' :'#808080'}`}>
                                {item.employeeDetails[0].team_name}
                                {item.flag ==='client'|| item.flag ==='interviewer'
                                  ? `(${item.employeeDetails[0].name})` : ''}
                              </p>
                            </div>
                          </div>)
                      }
                    </div>
                  </td>

                  <td className='flex h-full mt-6 justify-center '>
                    <div>
                      {item.request_type.charAt(0).toUpperCase() + item.request_type.slice(1)}
                    </div>

                    {item.request_type === 'report' && item.in_time && item.out_time && (
                      <Tooltip
                        title={
                          <div>
                            <div>
                              <strong>In-Time:</strong> {dayjs(item.in_time).format('hh:mm A')}
                            </div>
                            <div>
                              <strong>Out-Time:</strong> {dayjs(item.out_time).format('hh:mm A')}
                            </div>
                            <div>
                              <strong>Duration:</strong>{' '}
                              {formatDuration(item.in_time, item.out_time)}
                            </div>
                          </div>
                        }
                        placement="top"
                      >
                        <InfoCircleOutlined style={{ marginLeft: 6, color: '#1890ff' }} />
                      </Tooltip>
                    )}
                    {item.entry_flag === 'leave' && (
                      <ExclamationCircleOutlined  
                        className='text-[#faad14] ml-8'
                        title="Marked as Leave"
                      />
                    )}
                    {item.entry_flag === 'permission' && (
                      <ClockCircleOutlined
                        style={{ color: '#faad14', marginLeft: 8 }}
                        title="Marked as Permission"
                      />
                    )}
                  </td>

                  <td className="max-w-[200px]">
                    {item.description ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="">
                          {item.description}
                        </span>

                        {/* Badge for tickets */}
                        {item.request_type === 'ticket' && item.ticketType && (
                          <Badge
                            count={item.ticketType}
                            className="bg-[#1890ff] text-white text-[12px] px-2"
                          />
                        )}

                        {/* Show info icon only if text is long */}
                        {item.description.length > 30 && (
                          <Tooltip title={item.description}>
                            <InfoCircleOutlined className="ml-[6px] text-[#1890ff] cursor-pointer shrink-0" />
                          </Tooltip>
                        )}
                      </div>
                    ) : (
                      ''
                    )}
                  </td>

                  <td>
                    <div className='flex items-center justify-center'>
                      <p className={`text-[12px] ${item.status === 'inmeeting' ? 'text-[#0F9633]' : 'text-black'}`}>
                        {formatTime(item.time, item.status)}
                      </p>
                    </div>
                  </td>

                  <td>
                    {item.status === 'requested' && auth.role === 'admin' &&(
                      <div className='flex gap-2 mb-1 mt-1'>
                        <Button
                          disabled= {pauseAllMeetings}
                          className=''
                          onClick={()=>handleAccept(item.id)}
                          loading = {loading.accept === item.id}
                          >
                          Accept
                        </Button>
                      </div>
                    )}
                    {item.status === 'accepted' &&(
                      <div className='flex gap-2 mb-1'>
                        <Button
                          type='primary'
                          disabled= {pauseAllMeetings || item.postpone === 1}
                          className='bg-[#e6b31f] text-white px-10 py-3 rounded-[5px]'
                          onClick={()=>handleRevoke(item.id)}
                          loading = {loading.revoke=== item.id}
                        >
                          Revoke
                        </Button>
                        <Button 
                          className='relative bg-white' 
                          onClick={()=>handleNotify(item.id)}
                        >
                            <img className='h-8 w-6' src={BellIcon} alt="" />
                            {item.notification !== 0 &&(
                              <p className='absolute z-[2] bg-red-500 text-white rounded-full w-[15px] h-[15px] text-center p-0 text-[10px] translate-x-[140%] -translate-y-[55%]'>
                                {item.notification}
                              </p>
                            )}
                        </Button>
                      </div>
                    )}
                    {auth.is_team_lead == 1 && auth.role !=='admin' &&(
                      <Button 
                        className='relative' 
                        onClick={()=>handleNotify(item.id)}
                      >
                        <img className='h-100 aspect-square' src={BellIcon} alt="" />
                        {item.notification !== 0 &&(
                          <p className='absolute z-[2] bg-red-500 text-white rounded-full w-[15px] h-[15px] text-center p-0 text-[10px] translate-x-[150%] -translate-y-[30%]'>
                            {item.notification}
                          </p>
                        )}
                      </Button>
                    )}

                    <div className='flex items-center mb-1 gap-2 '>
                      {item.flag === 'admin' && item.status !== 'meeting_remainder' && (
                        <div>
                          <Button 
                            className='bg-white'
                            // onClick={() => onHandleEdit(item.id, item.description)}
                            >
                            <EditOutlined className='cursor-pointer text-[#1890ff]'  />
                          </Button>
                        </div>
                      )}
                      {item.status === 'meeting_remainder' && (
                        <div>
                          <Button
                            className="ml-3"
                            // type='primary'
                            // onClick={() => handleCompleted(item.id, item.discussion_id)}
                            >
                            Completed
                          </Button>
                        </div>
                      )}
                      {item.status === 'accepted' &&
                        auth.role === 'admin' &&
                        (currentMeeting === '' ||
                          displayedData.filter((data) => data.status === 'inmeeting').length === 0) ? (
                          <Button
                            disabled={pauseAllMeetings || item.postpone === 1}
                            className="action-button meet bg-green-700 px-10 py-3 text-white rounded-[5px]"
                            onClick={() => handleStart(item)}
                            loading={loading.start === item.id}
                          >
                            Start
                          </Button>
                        ) :(
                          index !== 0 &&
                          item.flag !== 'client' &&
                          item.flag !== 'interviewer' &&
                          item.status !== 'paused' &&
                          displayedData[0].status === 'inmeeting' && (
                            <Button
                              disabled={pauseAllMeetings}
                              className="bg-[#4285f4] text-white px-10 py-3"
                              onClick={() => handleJoin(item.id)}
                              loading={loading.join === item.id}
                            >
                              Join
                            </Button>
                          )
                        )
                      }
                    
                      {item.status === 'inmeeting' &&
                        item.flag !== 'client' &&
                        item.flag !== 'interviwer' && (
                          <div
                            className="text-[inherit] border-none no-underline text-sm cursor-pointer "
                            onClick={() => {
                              setShowModal3(true)
                              setVisiblePopover(null)
                              setMeetingId(item.id)
                              setMeetingData(item)
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 40 41"
                              fill="none"
                              className="w-[25px] h-[25px]"
                            >

                              <rect
                                x="0.5"
                                y="1.48047"
                                width="39"
                                height="39"
                                rx="7.5"
                                className="fill-white"
                              />
                              <rect
                                x="0.5"
                                y="1.48047"
                                width="39"
                                height="39"
                                rx="7.5"
                                stroke="#4285F4"
                              />
                              <path
                                d="M23.9484 24.3825C22.6095 23.2026 20.9587 22.4341 19.1939 22.1692C17.4291 21.9042 15.6254 22.1542 13.9991 22.889C12.3729 23.6238 10.9932 24.8123 10.0257 26.3118C9.05814 27.8113 8.5438 29.5581 8.54443 31.3426C8.54443 31.4873 8.60188 31.626 8.70417 31.7283C8.80647 31.8306 8.94523 31.8881 9.0899 31.8881C9.23457 31.8881 9.37333 31.8306 9.47563 31.7283C9.57792 31.626 9.63536 31.4873 9.63536 31.3426C9.63656 29.7687 10.0917 28.2284 10.9463 26.9066C11.8008 25.5849 13.0185 24.5376 14.4533 23.8904C15.888 23.2433 17.4791 23.0237 19.0355 23.2581C20.5919 23.4924 22.0477 24.1707 23.2284 25.2116C23.3383 25.3071 23.4817 25.355 23.6269 25.3448C23.7722 25.3345 23.9074 25.267 24.0029 25.1571C24.0984 25.0471 24.1463 24.9037 24.1361 24.7585C24.1258 24.6132 24.0583 24.478 23.9484 24.3825Z"
                                fill="black"
                              />
                              <path
                                d="M17.8175 20.9807C19.0042 20.9807 20.1643 20.6288 21.151 19.9695C22.1377 19.3102 22.9068 18.3731 23.3609 17.2767C23.815 16.1804 23.9339 14.9739 23.7023 13.81C23.4708 12.6461 22.8994 11.577 22.0602 10.7378C21.2211 9.89872 20.152 9.32728 18.9881 9.09576C17.8242 8.86424 16.6178 8.98307 15.5214 9.43721C14.425 9.89134 13.4879 10.6604 12.8286 11.6471C12.1693 12.6338 11.8174 13.7939 11.8174 14.9806C11.8203 16.571 12.4533 18.0955 13.578 19.2201C14.7026 20.3447 16.2271 20.9778 17.8175 20.9807ZM17.8175 10.0714C18.7884 10.0714 19.7376 10.3593 20.5449 10.8988C21.3522 11.4382 21.9814 12.2049 22.353 13.1019C22.7246 13.999 22.8217 14.986 22.6323 15.9383C22.4429 16.8906 21.9754 17.7653 21.2888 18.4519C20.6023 19.1385 19.7275 19.606 18.7753 19.7954C17.823 19.9849 16.8359 19.8877 15.9389 19.5161C15.0418 19.1445 14.2751 18.5153 13.7356 17.708C13.1962 16.9007 12.9083 15.9515 12.9083 14.9806C12.9112 13.6795 13.4293 12.4325 14.3493 11.5124C15.2694 10.5924 16.5164 10.0743 17.8175 10.0714Z"
                                fill="black"
                              />
                              <path
                                d="M30.9099 28.6165H28.1826V25.8892C28.1826 25.7445 28.1251 25.6058 28.0228 25.5035C27.9205 25.4012 27.7818 25.3438 27.6371 25.3438C27.4924 25.3438 27.3537 25.4012 27.2514 25.5035C27.1491 25.6058 27.0916 25.7445 27.0916 25.8892V28.6165H24.3643C24.2196 28.6165 24.0809 28.674 23.9786 28.7763C23.8763 28.8786 23.8188 29.0173 23.8188 29.162C23.8188 29.3067 23.8763 29.4454 23.9786 29.5477C24.0809 29.65 24.2196 29.7075 24.3643 29.7075H27.0916V32.4348C27.0916 32.5795 27.1491 32.7182 27.2514 32.8205C27.3537 32.9228 27.4924 32.9803 27.6371 32.9803C27.7818 32.9803 27.9205 32.9228 28.0228 32.8205C28.1251 32.7182 28.1826 32.5795 28.1826 32.4348V29.7075H30.9099C31.0546 29.7075 31.1933 29.65 31.2956 29.5477C31.3979 29.4454 31.4554 29.3067 31.4554 29.162C31.4554 29.0173 31.3979 28.8786 31.2956 28.7763C31.1933 28.674 31.0546 28.6165 30.9099 28.6165Z"
                                fill="black"
                              />
                            </svg>
                          </div>
                        )
                      }
                    
                      
                      {item.status !== 'inmeeting' && 
                        item.flag !== 'client' &&
                        item.flag !== 'interviewer' && (
                          <div
                            className="text-[inherit] border-none no-underline text-sm cursor-pointer"
                            onClick={()=>{
                              setShowModal3(true)
                              setVisiblePopover(null)
                              setMeetingId(item.id)
                              setMeetingData(item)
                            }}
                          >
                            <svg
                              width="25"
                              height="25"
                              viewBox="0 0 40 41"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className=""
                            >
                              <rect
                                x="0.5"
                                y="1.48047"
                                width="39"
                                height="39"
                                rx="7.5"
                                fill="white"
                              />
                              <rect
                                x="0.5"
                                y="1.48047"
                                width="39"
                                height="39"
                                rx="7.5"
                                stroke="#4285F4"
                              />
                              <path
                                d="M23.9484 24.3825C22.6095 23.2026 20.9587 22.4341 19.1939 22.1692C17.4291 21.9042 15.6254 22.1542 13.9991 22.889C12.3729 23.6238 10.9932 24.8123 10.0257 26.3118C9.05814 27.8113 8.5438 29.5581 8.54443 31.3426C8.54443 31.4873 8.60188 31.626 8.70417 31.7283C8.80647 31.8306 8.94523 31.8881 9.0899 31.8881C9.23457 31.8881 9.37333 31.8306 9.47563 31.7283C9.57792 31.626 9.63536 31.4873 9.63536 31.3426C9.63656 29.7687 10.0917 28.2284 10.9463 26.9066C11.8008 25.5849 13.0185 24.5376 14.4533 23.8904C15.888 23.2433 17.4791 23.0237 19.0355 23.2581C20.5919 23.4924 22.0477 24.1707 23.2284 25.2116C23.3383 25.3071 23.4817 25.355 23.6269 25.3448C23.7722 25.3345 23.9074 25.267 24.0029 25.1571C24.0984 25.0471 24.1463 24.9037 24.1361 24.7585C24.1258 24.6132 24.0583 24.478 23.9484 24.3825Z"
                                fill="black"
                              />
                              <path
                                d="M17.8175 20.9807C19.0042 20.9807 20.1643 20.6288 21.151 19.9695C22.1377 19.3102 22.9068 18.3731 23.3609 17.2767C23.815 16.1804 23.9339 14.9739 23.7023 13.81C23.4708 12.6461 22.8994 11.577 22.0602 10.7378C21.2211 9.89872 20.152 9.32728 18.9881 9.09576C17.8242 8.86424 16.6178 8.98307 15.5214 9.43721C14.425 9.89134 13.4879 10.6604 12.8286 11.6471C12.1693 12.6338 11.8174 13.7939 11.8174 14.9806C11.8203 16.571 12.4533 18.0955 13.578 19.2201C14.7026 20.3447 16.2271 20.9778 17.8175 20.9807ZM17.8175 10.0714C18.7884 10.0714 19.7376 10.3593 20.5449 10.8988C21.3522 11.4382 21.9814 12.2049 22.353 13.1019C22.7246 13.999 22.8217 14.986 22.6323 15.9383C22.4429 16.8906 21.9754 17.7653 21.2888 18.4519C20.6023 19.1385 19.7275 19.606 18.7753 19.7954C17.823 19.9849 16.8359 19.8877 15.9389 19.5161C15.0418 19.1445 14.2751 18.5153 13.7356 17.708C13.1962 16.9007 12.9083 15.9515 12.9083 14.9806C12.9112 13.6795 13.4293 12.4325 14.3493 11.5124C15.2694 10.5924 16.5164 10.0743 17.8175 10.0714Z"
                                fill="black"
                              />
                              <path
                                d="M30.9099 28.6165H28.1826V25.8892C28.1826 25.7445 28.1251 25.6058 28.0228 25.5035C27.9205 25.4012 27.7818 25.3438 27.6371 25.3438C27.4924 25.3438 27.3537 25.4012 27.2514 25.5035C27.1491 25.6058 27.0916 25.7445 27.0916 25.8892V28.6165H24.3643C24.2196 28.6165 24.0809 28.674 23.9786 28.7763C23.8763 28.8786 23.8188 29.0173 23.8188 29.162C23.8188 29.3067 23.8763 29.4454 23.9786 29.5477C24.0809 29.65 24.2196 29.7075 24.3643 29.7075H27.0916V32.4348C27.0916 32.5795 27.1491 32.7182 27.2514 32.8205C27.3537 32.9228 27.4924 32.9803 27.6371 32.9803C27.7818 32.9803 27.9205 32.9228 28.0228 32.8205C28.1251 32.7182 28.1826 32.5795 28.1826 32.4348V29.7075H30.9099C31.0546 29.7075 31.1933 29.65 31.2956 29.5477C31.3979 29.4454 31.4554 29.3067 31.4554 29.162C31.4554 29.0173 31.3979 28.8786 31.2956 28.7763C31.1933 28.674 31.0546 28.6165 30.9099 28.6165Z"
                                fill="black"
                              />
                            </svg>
                          </div>
                        )
                      }
                    </div>
                      {(item.status === 'inmeeting' || item.status === 'paused') &&
                        auth.role === 'admin' && (
                          <>
                            {item.status === 'paused' ? (
                              <>
                                {/* Resume Button */}
                                <Button
                                  className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded-md mr-2"
                                  onClick={() => handleResume(item.id)}
                                  loading={loading.end === item.id}
                                  disabled={item.postpone === 1}
                                >
                                  Resume
                                </Button>

                                {/* Notify Button */}
                                <Button
                                  className="relative flex items-center justify-center p-1"
                                  onClick={() => handleNotify(item.id)}
                                >
                                  <img src={BellIcon} className="h-full aspect-square" alt="bell" />
                                  {item.notification !== 0 && (
                                    <p className="absolute z-[2] bg-red-500 text-white rounded-full w-[15px] h-[15px] text-[10px] flex items-center justify-center translate-x-[150%] -translate-y-[30%]">
                                      {item.notification}
                                    </p>
                                  )}
                                </Button>
                              </>
                            ) : (
                              /* Pause Button */
                              <Button
                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-1 rounded-md mr-2"
                                onClick={() => handlePause(item.id)}
                                loading={loading.end === item.id}
                              >
                                Pause
                              </Button>
                            )}

                            {/* End Meeting Button */}
                            <Button
                              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded-md"
                              onClick={() => handleEnd(item)}
                              loading={loading.end === item.id}
                            >
                              End Meeting
                            </Button>
                          </>
                        )
                      }


                      <div className='flex gap-2'>
                        {item.status !== 'inmeeting' &&
                          item.status !== 'paused' &&
                          item.status !== 'meeting_remainder' && (
                            <Popconfirm
                              title="Are you sure you want to remove this meeting?"
                              onConfirm={() => handleDelete(item.id)}
                              onCancel={() =>
                                message.warning({
                                  content: 'Delete cancelled.',
                                })
                              }
                              okText="OK"
                              cancelText="Cancel"
                              placement="topRight"
                            >
                              <Button className="!flex !items-center !justify-center !p-1 !rounded-md bg-white !px-4 py-1  hover:bg-gray-100">
                                <DeleteSvg/>
                              </Button>
                            </Popconfirm>
                          )
                        }
                        {item.status !== 'inmeeting' &&
                          item.status !== 'meeting_remainder' &&
                          item.status !== 'ticket' &&
                          auth.role === 'admin' && (
                            <Dropdown
                              placement="bottomRight"
                              trigger={['click']}
                              overlay={
                                <Menu
                                  items={[
                                    {
                                      key: 'postpone',
                                      icon: <ClockCircleOutlined />,
                                      label:
                                        item.postpone === 0 ? 'Postpone' : 'Return to Queue',
                                      onClick: () =>
                                        openPostponeModal(item.id, item?.employeeDetails, item.postpone),
                                    },
                                  ]}
                                />
                              }
                            >
                              <Button
                                type="text"
                                className="text-gray-600 hover:text-gray-800 p-1 rounded-md hover:bg-gray-100 transition duration-200"
                                icon={<MoreOutlined className="text-[18px]" />}
                              />
                            </Dropdown>
                          )
                        }
                      </div>
                  </td>

                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Queue

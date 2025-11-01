import React, { useState, useEffect } from 'react'
import axios from '../../config/AxiosConfig'
import dayjs from 'dayjs'
import { message, Select, Button, Table, Tag, Modal, Form, Input, TimePicker } from 'antd'

const Tables = () => {
  const [teamList, setTeamList] = useState([])
  const [data, setData] = useState([])
  const [originalData, setOriginalData] = useState([])
  const [wantedData, setWantedData] = useState('')
  const [selectedNames, setSelectedNames] = useState([])
  const [priority, setPriority] = useState(0)
  const [meetingDescription, SetMeetingDescription] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false);
  const [meetingTime, setMeetingTime] = useState(dayjs('09:30', 'HH:mm'))

  const [messageApi, messageContent] = message.useMessage()

  const fetchTeams = async () => {
    try {
      const response = await axios.get('team/teams')
      if (response.status === 200) {
        const data = response.data.map((team) => ({
          value: team.id,
          label: team.name
        }))

        setTeamList(data)
      }
    } catch (error) {
      messageApi.error({ content: 'Unable to Get Team List' })
    }
  }

  const fetchData = async () => {
    try {
      const response = await axios.get('user/users')
      if (response.status === 200) {
        setOriginalData(response.data)
        setData(response.data)
      }
    } catch (err) {
      console.log(err)
      messageApi.error({ content: 'Unable to Fetch' })
    }
  }

  const filterData = (val) => {
    console.log(val)
    if (!val) {
      setData(originalData)
    } else {
      const filteredRecord = data.filter((item) =>
        item.name.toLowerCase().includes(val.toLowerCase())
      )
      setData(filteredRecord)
    }
  }

  // useEffect(()=>{
  //   console.log(selectedNames);
  // },[selectedNames])

  const handleMeet = (record)=>{
    console.log(record);
    if (Array.isArray(record)){
      const selectedEmployees = originalData.filter((data)=>record.includes(data.emp_id))
      setSelectedNames(selectedEmployees)
    }else{
      setSelectedNames(record)
    }
    setShowModal(true);
  }   

  // useEffect(()=>{
  //   console.log("Debug", meetingTime);
  // }, [meetingTime])

  const sendInvitation = async ()=>{
    let startTimeFormatted = null;
    if(!meetingTime){
      console.log('object');
      messageApi.error({content:"Please Select Meeting Time"})
      return
    }else{
      startTimeFormatted = meetingTime?.format("HH:mm:ss") || null
    }

    if (!selectedNames || selectedNames.length === 0) {
      messageApi.error('Please select at least one person to invite');
      return;
    }

    try{
      const response = await axios.post ('/meet/meeting-request', {
        emp_ids: Array.isArray(selectedNames) ? selectedNames.map(emp => emp.emp_id) : [selectedNames.emp_id],
        message : meetingDescription,
        flag: priority,
        team: 1,
        meeting_time : startTimeFormatted
      })
      console.log(' HI');
      if (response.status === 200){
        console.log('success');
        messageApi.success({content: "Meeting Request Sent",
                          duration:2
                        })
      }else{
        throw new Error(response.data.message)
      }
    }catch(err){
      console.log(err);
      messageApi.error({content: "Unable To Send Meeting Request", duration:2})
    }finally{
      setSelectedNames([])
      setShowModal(false)
      setPriority(0);
      SetMeetingDescription('')
      setMeetingTime(dayjs('09:30', 'HH:mm'))
    }
  }
  const handleCancel= ()=>{
    setShowModal(false)
    setSelectedNames([])
    setPriority(0);
    SetMeetingDescription('');
    setMeetingTime(dayjs('09:30', 'HH:mm'))
  }

  const handleOk = ()=>{
    console.log("Meeting sent to Everyone");
    console.log(selectedNames);
  }

  const rowSelection = {
    selectedNames,
    onChange: (newSelectedName) => setSelectedNames(newSelectedName)
  }

  useEffect(() => {
    fetchTeams()
    fetchData()
  }, [])

  useEffect(() => {
    filterData(wantedData)
  }, [wantedData])

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'emp_id',
      key: 'emp_id',
      headerClassName: 'bg-blue-600 text-white'
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      headerClassName: 'bg-blue-600 text-white'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      headerClassName: 'bg-blue-600 text-white',
      render: (_, record) => {
        const statuses = Array.isArray(record.status) ? record.status : [record.status]

        return (
          <>
            {statuses.map((sts) => {
              let isActive = sts === 1 ? 'Active' : 'In-Active'
              let color = sts === 1 ? 'green' : 'red'
              return (
                <Tag color={color} key={sts}>
                  {isActive}
                </Tag>
              )
            })}
          </>
        )
      }
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      headerClassName: 'bg-blue-600 text-white'
    },
    {
      title: 'Team ID',
      dataIndex: 'team_id',
      key: 'team_id',
      headerClassName: 'bg-blue-600 text-white'
    },
    {
      title: 'Team Name',
      dataIndex: 'team_name',
      key: 'team_name',
      headerClassName: 'bg-blue-600 text-white'
    },
    {
      title: 'Action',
      key: 'action',
      headerClassName: 'bg-blue-600 text-white',
      render: (_, record) => (
        <Button
          type="primary"
          style={{ backgroundColor: 'green', borderColor: 'green', borderRadius: '5px' }}
          disabled={selectedNames.length > 0}
          onClick={() => handleMeet(record)}
        >
          Meet
        </Button>
      )
    }
  ]

  return (
    <div>
      {messageContent}
      <div className="flex  m-5 gap-5">
        <div className="w-1/2 flex justify-start ml-5 ">
          <Select
            className="w-full text-start "
            placeholder={'Select Team'}
            options={teamList}
            showSearch
            size="large"
            filterOption
          />
        </div>
        <div className="w-1/2 flex border rounded-md p-2 pl-4 mr-5">
          <input
            type="text"
            placeholder="Search By Name"
            className="w-full mr-5 border-none focus:outline-none focus:ring-0"
            onChange={(e) => setWantedData(e.target.value)}
          />
        </div>
      </div>

      {selectedNames?.length > 0 && (<div className="flex justify-center m-5">
        <Button className='!bg-blue-700 text-cyan-50 hover:!text-cyan-50 hover:p-4' onClick={()=>handleMeet(selectedNames)}>
          Meet
        </Button>
      </div>)}

      {<div className="table-container px-10 bordered">
        <Table
          rowSelection={rowSelection}
          dataSource={data}
          columns={columns}
          bordered
          pagination= {false}
          rowKey={'emp_id'}
        />
      </div>
      }
      <Modal
        title= "Inviting  "
        open={showModal}
        centered
        onCancel={()=>handleCancel()}
        onOk={handleOk}
        width={1000}
        // onCancel={()=>setShowModal(false)}
        footer={
          <div className='flex justify-between'>            
            <div>
              <p className='inline mr-3'>Meeting Time : </p>
              <TimePicker
                value={meetingTime}
                onChange={(time)=>setMeetingTime(time)}
                format="h:mm a"
                placeholder='9:30 am'
                minuteStep={5}
                showNow={false}
                style={{width:100}}
                defaultOpenValue={dayjs('09:30', 'HH:mm')}
                inputReadOnly 
              />


            </div>
            <div className="flex justify-end space-x-3">
              <Button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                loading={loading}
                onClick={()=>sendInvitation()}
              >
                Invite For Meet
              </Button>
            </div>

          </div>
        }
      >
        <div className='flex justify-center text-blue-500 text-2xl tracking-wide font-mono mb-4 font-bold underline underline-offset-5'>INVITE</div>
        <div><Button  className={`text-white font-semibold my-5 ${
                                          priority? "bg-green-500 hover:bg-green-400" : "bg-red-500 hover:bg-red-600" 
                                         }`} 
                                         onClick={()=>{priority ? setPriority(0): setPriority(1)}}> {priority? 'PRIORITIZED' : 'SET-AS-PRIORITY'}</Button></div>
        <div className="border border-gray-300 rounded-md p-2 mb-4">
          {!Array.isArray(selectedNames) ? (
            <div className="w-full bg-slate-200 flex p-2 rounded-lg mb-5">
              <p>
                <span className="font-bold">Name:</span>{" "}
                <span className="text-blue-400">{selectedNames.name}</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-5">
              {selectedNames.map((emp) => (
                <Tag key={emp.emp_id} color="blue">
                  {emp.name}
                </Tag>
              ))}
            </div>
          )}
        </div>

        <Input.TextArea 
          rows={10}
          placeholder='Enter meeting agenda, topics to discuss, and any important notes...'
          className='bg-gray-200 p-2 rounded w-full'
          onChange={(e)=>SetMeetingDescription(e.target.value)}
          maxLength={1000}
          showCount
        >

        </Input.TextArea>
      </Modal>
    </div>
  )
}

export default Tables

import React from 'react'
import Logo from '../assets/images/logo.svg'
import Profile from '../assets/images/profile.png'
import { useAuth } from '../context/AuthContext'
import { ProfileURL } from '../utils/MainUrl'
import axios from '../config/AxiosConfig';
import { useNavigate } from 'react-router-dom'
import { Dropdown, message} from 'antd'

const Header = ({onPageChange, onCurrentPage}) => {
  const {setAuth, auth} = useAuth();
  const navigate = useNavigate()

  const handleLogout = async()=>{
    console.log('hellow');
    try{
      const data = JSON.parse(localStorage.getItem('auth_token'))
      const response = await axios.post('/auth/logout', { emp_id: data.emp_id })

      if (response.status ===200){
        localStorage.clear()
        sessionStorage.clear()
        navigate('/login', {state:{message:"loggedout"}})
        setAuth(null)
        sessionStorage.setItem('logoutMessage', 'true')
        sessionStorage.setItem('employee_id', data.emp_id)
      }else {
        throw new Error(response.data.error || 'Logout failed')
      }
    }catch (err) {
      console.error(err)
      message.error({
        content: 'Unable to logout! Please try again',
        duration: 2
      })
    }
  }

  const items = [
    {
      key:'logout',
      label:(
        <button onClick={handleLogout}>Log-Out</button>
      )
    }
  ]
  const profileImageUrl = auth?.profile_pic ? ProfileURL(auth.profile_pic) : Profile
  return (
    <div className='flex w-[90%] mx-auto my-2 align-middle justify-between'>
      <div className='lg:w-30 md:w-40 h-full'>
        <img src={Logo} alt="" />
      </div>

      <div className='flex'>
        <div className='flex justify-center items-center'>
          <img className='w-10'src={profileImageUrl} alt="" />
        </div>
        <div>
          <Dropdown menu={{items}} trigger={['click']} placement='bottomLeft' className='cursor-pointer'>
            <div className='pt-1 pl-1 cursor-pointer'>
              <p className='font-thin'>
                {auth.name.toUpperCase()}
              </p>
              <p className='text-xs'>
                {auth.emp_id}
              </p>
            </div>
          </Dropdown>

        </div>
      </div>
    </div>
  )
}

export default Header
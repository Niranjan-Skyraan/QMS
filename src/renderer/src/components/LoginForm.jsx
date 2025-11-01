import React, {useState, useEffect} from "react";
import axios from '../config/AxiosConfig';
// import axios from 'axios'
import { useLocation, useNavigate } from "react-router-dom";
import {useAuth} from '../context/AuthContext'
import loginimg from '../assets/images/loginimg.png'
import logo from '../assets/images/logo.png'
import forgetpassword from '../assets/images/forgetpassword.png'
import logout from '../assets/images/logout.png'

import {Button, Modal} from 'antd'

const LoginForm = () =>{
  const [emp_id, setEmployeeId] = useState('');
  const [password, setPassword]  = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const {setAuth} = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const [logoutemp_id, setEmp_id] = useState('');

  useEffect(() => {
    console.log('Location object:', location);
  }, [location]);
  
  const handleSubmit= async (e)=>{
    e.preventDefault()
    setError('')
    setLoading(true)

    try{
      console.log(axios);
      const response = await axios.post(`/auth/login`, {emp_id, password});
      console.log('response', response);

      if (response.status == 200){
        console.log( response.data.data[0].role);
        const data = response.data.data[0]
        const role = data.role
        console.log(role);
        setAuth({
          isAuthenticated : true,
          ...data
        })

        if (role === 'admin'){

          navigate('/admin')
        }else{
          console.log('No Route');
        }
      }else{
        setError('Invalid email or password')
        navigate('/home')
      }
    }catch(err){
      setError('Login failed. Please try again. ') 
    }finally{
      setLoading(false)
    }
  }

  const handleForgotPassword = ()=>{
    setShowModal(true)
  }

  const closeModal=()=>{
    setShowModal(false)
  }

  const closelogoutModal=()=>{
    setShowLogoutModal(false)
  }
  
  console.log('import.meta.env.BaseURL :>> ', import.meta.env.VITE_BaseURL);

  return(
    <>
      <div className="flex  ">
        <div className="w-1/2 h-screen">
          <div className="flex justify-center items-center h-screen ">
            <img src={loginimg} alt="" className=" h-[450px] "/>
          </div>
        </div>

        <div className="w-1/2 h-screen flex flex-col justify-start items-center p-20 gap-10">
          <div className="flex justify-center mt-10">
            <img className="w-45 h-45" src={logo} alt="" />
          </div>
          
          <div className="w-full">
            <form action="" onSubmit={handleSubmit}>
              <label htmlFor="employeeId" className=" text-blue-400 block">Employee ID</label>
              <input type= "text" 
                      id="employeeId"
                      placeholder="Enter Employee id" 
                      className="border rounded p-2 my-2 w-full focus:outline- focus:outline-offset-2 focus:outline-blue-400 " 
                      onChange={(e)=>{setEmployeeId(e.target.value)}}
                      disabled= {loading}
              />
                
              <div className="relative">
                <label htmlFor="password" className="text-blue-400 block mt-2">Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password"
                  placeholder="Enter Password" 
                  onChange={(e)=>setPassword(e.target.value)}
                  className="border rounded p-2 my-2 w-full focus:outline-blue-400 focus:outline-offset-2 pr-10" 
                />
                <button 
                  type="button"
                  className="absolute right-3 top-11  text-gray-500 hover:text-blue-400 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="flex justify-end text-blue-400 underline text-sm mt-2">
                <button onClick={handleForgotPassword}>Forgot Password ?</button>
              </div>
              
              <div className="flex justify-center m-4">
                <button className="bg-blue-500 px-16 py-2 rounded-md text-white hover:bg-blue-300" >Login</button>
              </div>
            
            </form>

          </div>
        </div>
      </div>
    </>
  )
}


export default LoginForm;
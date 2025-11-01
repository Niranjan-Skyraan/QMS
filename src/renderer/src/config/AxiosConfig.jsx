// axiosConfig.js

import axios from 'axios'

// const baseURL = 'https://queue.skyraantech.com/dev';
const baseURL = 'http://localhost:5000';
// const baseURL = 'https://queue.skyraantech.com/backend';

const axiosInstance = axios.create({
  baseURL
})  
 
export default axiosInstance
   
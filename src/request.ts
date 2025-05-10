import axios from 'axios'
import { baseURL } from '@/constants/baseURL.ts'

const request = axios.create({
  baseURL: baseURL,
  timeout: 60000,
  withCredentials: true,
})
request.interceptors.request.use(
  (config) => {
    // config.headers['satoken'] = 'Bearer ' + sessionStorage.getItem('satoken')
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

request.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    // if (error.response.status === 401) {
    //   localStorage.removeItem('loginUser')
    // } else {
    //   message.error(error.response.data.msg)
    //   return Promise.reject(error)
    // }
  },
)

export default request

import axios from 'axios'

const client = axios.create({
  baseURL: 'https://api.anisbhandari.com.np',
  timeout: 30000,
})

// Attach token to every request automatically
client.interceptors.request.use(config => {
  const token = localStorage.getItem('agrixel_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — clear token and redirect to login
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agrixel_token')
      localStorage.removeItem('agrixel_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client

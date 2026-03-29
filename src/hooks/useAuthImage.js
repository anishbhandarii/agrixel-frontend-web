// useAuthImage.js — fetches an image via axios (with Bearer auth) and returns a blob object URL
import { useState, useEffect } from 'react'
import client from '../api/client'

const useAuthImage = (filename) => {
  const [src, setSrc] = useState(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(!!filename)

  useEffect(() => {
    if (!filename) {
      setLoading(false)
      return
    }

    let objectUrl = null
    let cancelled = false

    const fetchImage = async () => {
      try {
        const response = await client.get(`/images/${filename}`, { responseType: 'blob' })
        if (cancelled) return
        objectUrl = URL.createObjectURL(response.data)
        setSrc(objectUrl)
        setError(false)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchImage()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [filename])

  return { src, error, loading }
}

export default useAuthImage

// PlantImage.jsx — authenticated image component that fetches via axios with Bearer token
import useAuthImage from '../../hooks/useAuthImage'

const PlantImage = ({ filename, width = 64, height = 64, borderRadius = '8px', style = {} }) => {
  const { src, error, loading } = useAuthImage(filename)

  const containerStyle = {
    width,
    height,
    borderRadius,
    flexShrink: 0,
    ...style,
  }

  if (!filename || error) {
    return (
      <div style={{
        ...containerStyle,
        background: 'var(--primary-dim)',
        border: '1px solid rgba(74,222,128,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(Math.min(width, height) * 0.38),
      }}>
        🌿
      </div>
    )
  }

  if (loading) {
    return <div style={{ ...containerStyle, background: 'var(--border)' }} />
  }

  return (
    <img
      src={src}
      alt="Plant"
      style={{ ...containerStyle, objectFit: 'cover', display: 'block' }}
    />
  )
}

export default PlantImage

export const getHealthScore = (scan) => {
  // Priority 1: use stored health_score if valid and > 0
  const stored = scan?.health_score ?? scan?.data?.health_score
  if (stored !== null && stored !== undefined && !isNaN(Number(stored)) && Number(stored) > 0) {
    return Math.round(Number(stored))
  }

  // Priority 2: vision corrected scans use urgency mapping
  if (scan?.result_type === 'model_plus_vision_review' && scan?.verified === false) {
    const urgency = scan?.urgency || scan?.advice?.urgency
    if (urgency === 'high')   return 20
    if (urgency === 'medium') return 45
    if (urgency === 'low')    return 75
    return 50
  }

  // Priority 3: calculate from confidence
  const conf = parseFloat(scan?.confidence)
  if (!isNaN(conf)) {
    const isHealthy = scan?.is_healthy === true || scan?.is_healthy === 1
    if (isHealthy) {
      return Math.max(Math.round(conf), 70) // healthy minimum 70
    } else {
      return Math.max(Math.round(100 - conf), 5) // diseased minimum 5
    }
  }

  return null
}

export const getScoreColor = (score) => {
  if (score == null) return 'var(--muted)'
  if (score >= 70)   return 'var(--success)'
  if (score >= 40)   return 'var(--warning)'
  return 'var(--danger)'
}

const KNOWN_CROPS = [
  'Apple', 'Grape', 'Tomato', 'Potato', 'Corn', 'Rice',
  'Strawberry', 'Peach', 'Cherry', 'Orange', 'Pepper',
  'Blueberry', 'Raspberry', 'Soybean', 'Squash',
]

export const getDisplayNames = (scan) => {
  const isCorrected =
    scan?.result_type === 'model_plus_vision_review' &&
    scan?.verified === false

  if (!isCorrected) {
    return { crop: scan?.crop || '', disease: scan?.disease || '', isCorrected: false }
  }

  if (scan?.confirmed_crop && scan?.confirmed_disease) {
    return { crop: scan.confirmed_crop, disease: scan.confirmed_disease, isCorrected: true }
  }

  const diag = scan?.confirmed_diagnosis || ''

  if (diag.includes(' on ')) {
    const parts = diag.split(' on ')
    return {
      crop: parts[1].trim(),
      disease: parts[0].replace(/\(.*\)/g, '').trim(),
      isCorrected: true,
    }
  }

  const firstWord = diag.split(' ')[0]
  if (KNOWN_CROPS.includes(firstWord)) {
    return {
      crop: firstWord,
      disease: diag.replace(firstWord, '').replace(/\(.*\)/g, '').trim(),
      isCorrected: true,
    }
  }

  return {
    crop: scan?.crop || '',
    disease: diag.replace(/\(.*\)/g, '').trim() || scan?.disease || '',
    isCorrected: true,
  }
}

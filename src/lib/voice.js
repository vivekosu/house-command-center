export function startVoiceRecognition({ onResult, onEnd, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { onError('Use Chrome or Safari'); return null }
  const r = new SR()
  r.lang = 'hi-IN'
  r.interimResults = false
  r.maxAlternatives = 1
  r.onresult = (e) => onResult(e.results[0][0].transcript)
  r.onend = onEnd
  r.onerror = (e) => onError(e.error)
  r.start()
  return r
}

export function parseTranscriptToTask(transcript) {
  const lower = transcript.toLowerCase()
  let floor = 'Ground Floor'
  if (lower.includes('basement')) floor = 'Basement'
  else if (lower.includes('first floor') || lower.includes('pehli') || lower.includes('1st')) floor = '1st Floor'
  else if (lower.includes('terrace') || lower.includes('chhat')) floor = 'Terrace'
  else if (lower.includes('exterior') || lower.includes('bahar')) floor = 'Exterior'
  let category = 'Others'
  if (lower.includes('pop') || lower.includes('ceiling')) category = 'POP'
  else if (lower.includes('paint') || lower.includes('rang')) category = 'Paint'
  else if (lower.includes('electric') || lower.includes('bijli')) category = 'Electrical'
  else if (lower.includes('hvac') || lower.includes(' ac ') || lower.includes('duct')) category = 'HVAC'
  else if (lower.includes('stone') || lower.includes('marble')) category = 'Stone'
  else if (lower.includes('kitchen') || lower.includes('rasoi')) category = 'Kitchen'
  else if (lower.includes('carpenter') || lower.includes('wood')) category = 'Carpenter'
  else if (lower.includes('gate') || lower.includes('darwaza')) category = 'Gate'
  let priority = 'normal'
  if (lower.includes('urgent') || lower.includes('jaldi') || lower.includes('critical')) priority = 'critical'
  return { title: transcript.charAt(0).toUpperCase() + transcript.slice(1), floor, category, priority }
}
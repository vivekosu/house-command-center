// Default to English. Pass { lang: 'hi-IN' } to override.
export function startVoiceRecognition({ onResult, onEnd, onError, lang = 'en-IN' }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { onError('Use Chrome or Safari'); return null }
  const r = new SR()
  r.lang = lang
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
  if (lower.includes('basement') || lower.includes('stilt')) floor = 'Basement'
  else if (lower.includes('first floor') || lower.includes('pehli') || lower.includes('1st')) floor = '1st Floor'
  else if (lower.includes('second floor') || lower.includes('2nd') || lower.includes('doosri')) floor = '2nd Floor'
  else if (lower.includes('third floor') || lower.includes('3rd') || lower.includes('teesri')) floor = '3rd Floor'
  else if (lower.includes('terrace') || lower.includes('chhat')) floor = 'Terrace'
  else if (lower.includes('exterior') || lower.includes('bahar') || lower.includes('outside')) floor = 'Exterior'
  let category = 'Others'
  if (lower.includes('pop') || lower.includes('ceiling')) category = 'POP'
  else if (lower.includes('paint') || lower.includes('rang')) category = 'Paint'
  else if (lower.includes('electric') || lower.includes('bijli')) category = 'Electrical'
  else if (lower.includes('hvac') || lower.includes(' ac ') || lower.includes('duct')) category = 'HVAC'
  else if (lower.includes('stone') || lower.includes('marble')) category = 'Stone'
  else if (lower.includes('kitchen') || lower.includes('rasoi')) category = 'Kitchen'
  else if (lower.includes('carpenter') || lower.includes('wood')) category = 'Carpenter'
  else if (lower.includes('gate') || lower.includes('darwaza')) category = 'Gate'
  else if (lower.includes('wardrobe') || lower.includes('almari')) category = 'Wardrobe'
  else if (lower.includes('lighting') || lower.includes('light') || lower.includes('roshni')) category = 'Lighting'
  else if (lower.includes('automation')) category = 'Automation'
  else if (lower.includes('facade')) category = 'Facade'
  else if (lower.includes('steel')) category = 'Steel'
  let priority = 'normal'
  if (lower.includes('urgent') || lower.includes('jaldi') || lower.includes('critical') || lower.includes('asap')) priority = 'critical'
  else if (lower.includes('low priority') || lower.includes('whenever')) priority = 'low'
  return { title: transcript.charAt(0).toUpperCase() + transcript.slice(1), floor, category, priority }
}

import { useState } from 'react'

/**
 * ContactPicker — opens phone's native contact picker on Android Chrome (HTTPS).
 * Falls back to manual entry on iOS / desktop / unsupported browsers.
 *
 * Props:
 *   onPick({ name, phone })  — called when user confirms a contact
 *   onClose()                — close the modal
 */
export default function ContactPicker({ onPick, onClose }) {
  const [manualName, setManualName] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [error, setError] = useState('')
  const [picking, setPicking] = useState(false)

  const supported = 'contacts' in navigator && 'ContactsManager' in window

  async function pickFromPhone() {
    setError('')
    setPicking(true)
    try {
      const props = ['name', 'tel']
      const opts = { multiple: false }
      const contacts = await navigator.contacts.select(props, opts)
      if (contacts && contacts.length > 0) {
        const c = contacts[0]
        const name = (c.name && c.name[0]) || ''
        const phone = (c.tel && c.tel[0]) || ''
        if (!name && !phone) {
          setError('No name or phone found in selected contact.')
        } else {
          onPick({ name: name.trim(), phone: phone.trim() })
        }
      }
    } catch (e) {
      // User cancelled or permission denied — silent unless real error
      if (e.name !== 'AbortError') {
        setError('Could not open contacts: ' + (e.message || e.name))
      }
    }
    setPicking(false)
  }

  function submitManual() {
    if (!manualName.trim() || !manualPhone.trim()) {
      setError('Please enter both name and phone.')
      return
    }
    onPick({ name: manualName.trim(), phone: manualPhone.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-md p-5 pb-8" onClick={e => e.stopPropagation()}>
        <div className="w-8 h-1 bg-gray-200 rounded mx-auto mb-4" />
        <div className="font-bold text-gray-900 mb-1">Add contact</div>
        <div className="text-xs text-gray-500 mb-4">
          {supported
            ? 'Pick from your phone book or type manually'
            : 'Contact picker not available on this device. Type manually below.'}
        </div>

        {supported && (
          <>
            <button
              onClick={pickFromPhone}
              disabled={picking}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm mb-3 disabled:opacity-60"
            >
              {picking ? 'Opening contacts…' : '📱 Pick from phone book'}
            </button>
            <div className="text-center text-xs text-gray-400 mb-3">— or —</div>
          </>
        )}

        <div className="space-y-2">
          <input
            value={manualName}
            onChange={e => setManualName(e.target.value)}
            placeholder="Name"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
          />
          <input
            value={manualPhone}
            onChange={e => setManualPhone(e.target.value)}
            placeholder="Phone (e.g. +919810000000)"
            type="tel"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
          />
        </div>

        {error && <div className="text-xs text-red-600 mt-2">{error}</div>}

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">
            Cancel
          </button>
          <button onClick={submitManual} className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold">
            Use entered details
          </button>
        </div>

        {!supported && (
          <div className="text-[11px] text-gray-400 mt-3 leading-relaxed">
            Tip: phone-book picker works on Chrome for Android over HTTPS. On iPhone, type the name and phone manually.
          </div>
        )}
      </div>
    </div>
  )
}

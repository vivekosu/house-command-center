export const TEMPLATES = {
  reminder: {
    name: 'Daily reminder',
    build: ({ vendor, task, area, floor, date }) => ({
      en: `Dear ${vendor} ji,\n\nReminder for today's work:\n\nFloor: ${floor}\nArea: ${area}\nPending: ${task}\nBy: ${date}\n\nPlease confirm:\n1. What time will your team arrive?\n2. How many workers are coming?\n3. What work will be done today?\n\nThis is urgent. Please reply.`,
      hi: `\u092a\u094d\u0930\u093f\u092f ${vendor} \u091c\u0940,\n\n\u0906\u091c \u0915\u0947 \u0915\u093e\u092e \u0915\u0940 \u092f\u093e\u0926 \u0926\u093f\u0932\u093e\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f:\n\n\u092e\u0902\u091c\u093f\u0932: ${floor}\n\u0915\u094d\u0937\u0947\u0924\u094d\u0930: ${area}\n\u092c\u093e\u0915\u0940 \u0915\u093e\u092e: ${task}\n\u0924\u093e\u0930\u0940\u0916: ${date}\n\n\u0915\u0943\u092a\u092f\u093e \u092c\u0924\u093e\u090f\u0902:\n1. \u0906\u092a\u0915\u0940 \u091f\u0940\u092e \u0915\u093f\u0924\u0928\u0947 \u092c\u091c\u0947 \u0906\u090f\u0917\u0940?\n2. \u0915\u093f\u0924\u0928\u0947 \u092e\u091c\u0926\u0942\u0930 \u0906\u090f\u0902\u0917\u0947?\n3. \u0906\u091c \u0915\u094c\u0928 \u0938\u093e \u0915\u093e\u092e \u092a\u0942\u0930\u093e \u0939\u094b\u0917\u093e?\n\n\u092f\u0939 \u091c\u0930\u0942\u0930\u0940 \u0939\u0948\u0964 \u0915\u0943\u092a\u092f\u093e \u091c\u0935\u093e\u092c \u0926\u0947\u0902\u0964`
    })
  },
  confirmation: {
    name: 'After-call confirmation',
    build: ({ vendor, task, area, floor, date, time, workers }) => ({
      en: `Dear ${vendor} ji,\n\nAs discussed on call — confirming your commitment:\n\nFloor: ${floor} | Area: ${area}\nWork: ${task}\nDate: ${date} | Time: ${time}\nWorkers: ${workers}\n\nPlease reply YES to confirm.`,
      hi: `\u092a\u094d\u0930\u093f\u092f ${vendor} \u091c\u0940,\n\n\u092b\u094b\u0928 \u092a\u0930 \u0939\u0941\u0908 \u092c\u093e\u0924 \u0915\u0947 \u0905\u0928\u0941\u0938\u093e\u0930:\n\n\u092e\u0902\u091c\u093f\u0932: ${floor} | \u0915\u094d\u0937\u0947\u0924\u094d\u0930: ${area}\n\u0915\u093e\u092e: ${task}\n\u0924\u093e\u0930\u0940\u0916: ${date} | \u0938\u092e\u092f: ${time}\n\u092e\u091c\u0926\u0942\u0930: ${workers}\n\n\u092a\u0941\u0937\u094d\u091f\u093f \u0915\u0947 \u0932\u093f\u090f YES \u0932\u093f\u0916\u0915\u0930 \u091c\u0935\u093e\u092c \u0926\u0947\u0902\u0964`
    })
  },
  escalation: {
    name: 'Escalation warning',
    build: ({ vendor, task, area, floor, daysLate, missCount }) => ({
      en: `Dear ${vendor} ji,\n\nThis work is now ${daysLate} days overdue and blocking other vendors.\n\nArea: ${area}, ${floor}\nPending: ${task}\nMissed commitments: ${missCount}\n\nPlease confirm FINAL completion date today.\nPayment is on hold until work is done.\nIf not resolved we will arrange another team.\n\nPlease respond urgently.`,
      hi: `\u092a\u094d\u0930\u093f\u092f ${vendor} \u091c\u0940,\n\n\u092f\u0939 \u0915\u093e\u092e \u0905\u092c ${daysLate} \u0926\u093f\u0928 \u0926\u0947\u0930\u0940 \u0938\u0947 \u0939\u0948\u0964\n\n\u0915\u094d\u0937\u0947\u0924\u094d\u0930: ${area}, ${floor}\n\u092c\u093e\u0915\u0940 \u0915\u093e\u092e: ${task}\n\u092e\u093f\u0938 \u092a\u094d\u0930\u0924\u093f\u092c\u0926\u094d\u0927\u0924\u093e\u090f\u0902: ${missCount}\n\n\u0906\u091c \u0939\u0940 \u0905\u0902\u0924\u093f\u092e \u0924\u093e\u0930\u0940\u0916 \u092c\u0924\u093e\u090f\u0902\u0964\n\u0915\u093e\u092e \u092a\u0942\u0930\u093e \u0939\u094b\u0928\u0947 \u0924\u0915 \u092d\u0941\u0917\u0924\u093e\u0928 \u0930\u094b\u0915\u093e \u0917\u092f\u093e \u0939\u0948\u0964\n\n\u0915\u0943\u092a\u092f\u093e \u0924\u0941\u0930\u0902\u0924 \u091c\u0935\u093e\u092c \u0926\u0947\u0902\u0964`
    })
  },
  payment_hold: {
    name: 'Payment hold notice',
    build: ({ vendor, task, area, floor }) => ({
      en: `Dear ${vendor} ji,\n\nPayment for "${task}" (${area}, ${floor}) is now ON HOLD.\n\nReason: Committed dates missed multiple times.\n\nPayment releases only when:\n✓ Work fully completed\n✓ Site photos submitted\n✓ Supervisor verified`,
      hi: `\u092a\u094d\u0930\u093f\u092f ${vendor} \u091c\u0940,\n\n"${task}" (${area}, ${floor}) \u0915\u093e \u092d\u0941\u0917\u0924\u093e\u0928 \u0905\u092c \u0930\u094b\u0915\u093e \u0917\u092f\u093e \u0939\u0948\u0964\n\n\u0915\u093e\u0930\u0923: \u0915\u0908 \u092c\u093e\u0930 \u092a\u094d\u0930\u0924\u093f\u092c\u0926\u094d\u0927 \u0924\u093e\u0930\u0940\u0916 \u091a\u0942\u0915\u0928\u093e\u0964\n\n\u092d\u0941\u0917\u0924\u093e\u0928 \u0924\u092d\u0940 \u092e\u093f\u0932\u0947\u0917\u093e \u091c\u092c:\n\u2713 \u0915\u093e\u092e \u092a\u0942\u0930\u0940 \u0924\u0930\u0939 \u0938\u0947 \u0916\u0924\u094d\u092e \u0939\u094b\n\u2713 \u0938\u093e\u0907\u091f \u0915\u0940 \u092b\u094b\u091f\u094b \u091c\u092e\u093e \u0939\u094b\n\u2713 \u0938\u0941\u092a\u0930\u0935\u093e\u0907\u091c\u0930 \u0928\u0947 \u091c\u093e\u0902\u091a \u0915\u0940 \u0939\u094b`
    })
  },
  photo_request: {
    name: 'Photo request',
    build: ({ vendor, task, area, floor }) => ({
      en: `Dear ${vendor} ji,\n\nPlease send today's progress photos for:\n\nArea: ${area}, ${floor}\nWork: ${task}\n\nSend: 1 before, 1 during, 1 end of day. Thank you.`,
      hi: `\u092a\u094d\u0930\u093f\u092f ${vendor} \u091c\u0940,\n\n\u0906\u091c \u0915\u0947 \u0915\u093e\u092e \u0915\u0940 \u092b\u094b\u091f\u094b \u092d\u0947\u091c\u0947\u0902:\n\n\u0915\u094d\u0937\u0947\u0924\u094d\u0930: ${area}, ${floor}\n\u0915\u093e\u092e: ${task}\n\n\u092d\u0947\u091c\u0947\u0902: \u0936\u0941\u0930\u0941\u0906\u0924 \u0915\u0940, \u092c\u0940\u091a \u0915\u0940, \u0926\u093f\u0928 \u0915\u0947 \u0905\u0902\u0924 \u0915\u0940\u0964 \u0927\u0928\u094d\u092f\u0935\u093e\u0926\u0964`
    })
  },
  weekly_plan: {
    name: 'Weekly plan',
    build: ({ vendor, tasks, weekLabel }) => ({
      en: `Dear ${vendor} ji,\n\nHere is your planned work for ${weekLabel}:\n\n${tasks.map((t, i) => `${i + 1}. ${t.title} — ${t.area} (${t.date})`).join('\n')}\n\nPlease confirm receipt and availability. Thank you.`,
      hi: `\u092a\u094d\u0930\u093f\u092f ${vendor} \u091c\u0940,\n\n${weekLabel} \u0915\u0947 \u0932\u093f\u090f \u0906\u092a\u0915\u093e \u0928\u093f\u092f\u094b\u091c\u093f\u0924 \u0915\u093e\u092e:\n\n${tasks.map((t, i) => `${i + 1}. ${t.title} — ${t.area} (${t.date})`).join('\n')}\n\n\u0915\u0943\u092a\u092f\u093e \u092a\u0941\u0937\u094d\u091f\u093f \u0915\u0930\u0947\u0902\u0964 \u0927\u0928\u094d\u092f\u0935\u093e\u0926\u0964`
    })
  }
}

export function buildMessage(templateKey, params, vendorLanguage = 'bilingual') {
  const tpl = TEMPLATES[templateKey]
  if (!tpl) return ''
  const { en, hi } = tpl.build(params)
  if (vendorLanguage === 'english') return en
  return `${en}\n\n---\n\n${hi}`
}

export function openWhatsApp(phone, message) {
  const clean = phone.replace(/\D/g, '')
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, '_blank')
}
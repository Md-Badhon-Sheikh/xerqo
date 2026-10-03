/*
 * SMS part counter — mirrors backend/app/Support/SmsSegments.php so the editor shows what Reve will bill.
 * Plain English (GSM-7): 160 characters in one SMS, 153 per part when longer; ^{}[]~|\€ count double.
 * Anything else (Bangla, ৳, curly quotes, emoji) is Unicode: 70 in one SMS, 67 per part when longer.
 */
const GSM_BASIC = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
const GSM_EXTENDED = ['^', '{', '}', '[', '~', ']', '|', '€', '\f', '\\']

export function smsParts(text = '') {
  let length = 0
  let gsm = true
  let firstNonGsm = null
  for (const ch of text) {
    if (GSM_EXTENDED.includes(ch)) length += 2
    else if (GSM_BASIC.includes(ch)) length += 1
    else { gsm = false; firstNonGsm = ch; break }
  }
  if (!gsm) length = text.length // UTF-16 code units, like UCS-2
  const [single, part] = gsm ? [160, 153] : [70, 67]
  const segments = length === 0 ? 1 : length <= single ? 1 : Math.ceil(length / part)
  return { encoding: gsm ? 'gsm' : 'unicode', length, segments, perSegment: segments > 1 ? part : single, firstNonGsm }
}

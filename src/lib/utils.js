export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export const fmtM = (n) => {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export const fmtD = (d) => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d + 'T12:00:00') : new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const fmtDShort = (d) => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d + 'T12:00:00') : new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const today = () => new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

export const numToWords = (n) => {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  const below1000 = (num) => {
    if (num === 0) return ''
    if (num < 20) return ones[num] + ' '
    if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? ' ' + ones[num%10] : '') + ' '
    return ones[Math.floor(num/100)] + ' Hundred ' + (num%100 ? below1000(num%100) : '')
  }
  const int = Math.floor(Math.abs(n || 0))
  if (int === 0) return 'Zero'
  let result = ''
  if (int >= 1000000) result += below1000(Math.floor(int/1000000)) + 'Million '
  if (int >= 1000) result += below1000(Math.floor((int%1000000)/1000)) + 'Thousand '
  result += below1000(int % 1000)
  return result.trim()
}

export const dollarWords = (amount) => {
  const int = Math.floor(amount || 0)
  const cents = Math.round(((amount || 0) - int) * 100)
  return numToWords(int) + ' and ' + String(cents).padStart(2, '0') + '/100 Dollars'
}

export const STATES = { SC: 'South Carolina', NC: 'North Carolina', GA: 'Georgia', TN: 'Tennessee', VA: 'Virginia' }

export const LIEN_NOTICES = {
  SC: `This project is located in the State of South Carolina. Under S.C. Code Ann. § 29-5-10 et seq., any person who performs labor or furnishes materials for the improvement of real property has a lien upon such property for the unpaid value of such labor and materials. A Notice of Mechanic's Lien must be filed within ninety (90) days after the last furnishing of labor or materials. Contractor shall provide a Final Lien Waiver upon receipt of full final payment.`,
  NC: `This project is located in the State of North Carolina. Under N.C. Gen. Stat. § 44A-7 et seq., Contractor has lien rights upon the real property for labor performed and materials furnished. A Claim of Lien on Real Property must be filed within 120 days after the last furnishing of labor or materials. Contractor shall provide a Final Lien Waiver upon receipt of full final payment.`,
  GA: `This project is located in the State of Georgia. Under O.C.G.A. § 44-14-361 et seq., Contractor has a lien upon the real property for work performed and materials furnished. A Claim of Lien must be filed within 90 days after the completion of the work or the last furnishing of materials. Contractor shall provide a Final Lien Waiver upon receipt of full final payment.`,
  TN: `This project is located in the State of Tennessee. Under T.C.A. § 66-11-101 et seq., Contractor has lien rights upon the real property improved. A Notice of Lien must be filed within 90 days after the last day of work or furnishing of materials. Contractor shall provide a Final Lien Waiver upon receipt of full final payment.`,
  VA: `This project is located in the State of Virginia. Under Va. Code Ann. § 43-1 et seq., Contractor has a lien upon the real property for the value of labor performed and materials furnished. A Memorandum of Mechanic's Lien must be recorded within 90 days after the last day of the month in which work was last performed or materials last furnished. Contractor shall provide a Final Lien Waiver upon receipt of full final payment.`,
}

export const statusColor = (s) => {
  const map = {
    active: 'badge-green', complete: 'badge-blue', pending: 'badge-amber',
    invoiced: 'badge-amber', draft: 'badge-gray', signed: 'badge-green',
    void: 'badge-red', approved: 'badge-green', declined: 'badge-red',
  }
  return map[s?.toLowerCase()] || 'badge-gray'
}

export const cn = (...classes) => classes.filter(Boolean).join(' ')

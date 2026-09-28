export const formatPhoneNumber = (value: string) => {
  if (!value) return value;
  
  // Clean the input for any non-digit values
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  
  // Return early if less than 4 digits
  if (phoneNumberLength < 4) return phoneNumber;
  
  // Format as (XXX) XXX
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  
  // Format as (XXX) XXX-XXXX
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

export function parseLastConnection(skypeId?: any) {
  if (!skypeId || typeof skypeId !== 'string') return null;
  const parts = skypeId.split('|').map(s => s.trim());
  if (parts.length < 2) return { type: 'Unknown', date: skypeId, icon: '\uD83D\uDCC5' };
  const type = parts[0];
  const date = parts[1];
  let icon = '\uD83D\uDCC5';
  if (type.toLowerCase().includes('phone')) icon = '\uD83D\uDCDE';
  if (type.toLowerCase().includes('email')) icon = '\u2709\uFE0F';
  if (type.toLowerCase().includes('text')) icon = '\uD83D\uDCAC';
  if (type.toLowerCase().includes('meet')) icon = '\uD83E\uDD1D';
  if (type.toLowerCase().includes('social')) icon = '\uD83D\uDD17';
  return { type, date, icon };
}

export function getConnectionStatusInfo(dateString?: string | null) {
  if (!dateString) {
    return { colorClass: 'bg-red-500', pillClass: 'bg-red-500 text-white', text: 'Never', isRed: true };
  }
  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return { colorClass: 'bg-red-500', pillClass: 'bg-red-500 text-white', text: 'Never', isRed: true };
  }
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  let text = '';
  if (diffDays < 0) text = 'In the future';
  else if (diffDays === 0) text = 'Today';
  else if (diffDays === 1) text = '1 day ago';
  else if (diffDays < 30) text = diffDays + ' days ago';
  else {
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) text = '1 mo ago';
    else if (diffMonths < 12) text = diffMonths + ' mos ago';
    else {
      const diffYears = Math.floor(diffDays / 365);
      if (diffYears === 1) text = '1 yr ago';
      else text = diffYears + ' yrs ago';
    }
  }

  if (diffDays > 60) {
    return { colorClass: 'bg-red-500', pillClass: 'bg-red-500 text-white', text, isRed: true };
  } else if (diffDays > 30) {
    return { colorClass: 'bg-amber-500', pillClass: 'bg-amber-400 text-amber-900', text, isRed: false };
  } else {
    return { colorClass: 'bg-green-500', pillClass: 'bg-green-200 text-green-900', text, isRed: false };
  }
}

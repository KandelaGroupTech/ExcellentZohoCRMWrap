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

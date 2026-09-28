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

export function parseLastConnection(skypeId?: string) {
  if (!skypeId) return null;
  const parts = skypeId.split('|').map(s => s.trim());
  if (parts.length < 2) return { type: 'Unknown', date: skypeId, icon: '???' };
  const type = parts[0];
  const date = parts[1];
  let icon = '???';
  if (type.toLowerCase().includes('phone')) icon = '??';
  if (type.toLowerCase().includes('email')) icon = '??';
  if (type.toLowerCase().includes('text')) icon = '??';
  if (type.toLowerCase().includes('meet')) icon = '??';
  if (type.toLowerCase().includes('social')) icon = '??';
  return { type, date, icon };
}

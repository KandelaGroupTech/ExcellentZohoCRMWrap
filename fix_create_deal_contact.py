import os

with open(r'src/app/(dashboard)/components/CreateDealModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target_state = '''  const [formData, setFormData] = useState({
    Deal_Name: defaultName || '',
    Account_Name: '',
    Amount: '',
    Stage: 'Qualification',
    Closing_Date: new Date().toISOString().split('T')[0]
  });'''
replacement_state = '''  const [formData, setFormData] = useState({
    Deal_Name: defaultName || '',
    Account_Name: '',
    Contact_Name: '',
    Amount: '',
    Stage: 'Qualification',
    Closing_Date: new Date().toISOString().split('T')[0]
  });'''
text = text.replace(target_state, replacement_state)

target_query = '''  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !accountId
  });'''
replacement_query = '''  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !accountId
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/contacts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !contactId
  });'''
text = text.replace(target_query, replacement_query)

target_payload = '''      if (contactId) payload.Contact_Name = contactId;'''
replacement_payload = '''      if (contactId) {
        payload.Contact_Name = contactId;
      } else if (data.Contact_Name.trim()) {
        const matchingContact = contacts?.find((c: any) => `${c.First_Name || ''} ${c.Last_Name || ''}`.trim() === data.Contact_Name.trim());
        if (matchingContact) {
          payload.Contact_Name = matchingContact.id;
        } else {
          payload.Contact_Name = data.Contact_Name.trim();
        }
      }'''
text = text.replace(target_payload, replacement_payload)

target_reset = '''      setFormData({
        Deal_Name: defaultName || '',
        Account_Name: '',
        Amount: '',
        Stage: 'Qualification',
        Closing_Date: new Date().toISOString().split('T')[0]
      });'''
replacement_reset = '''      setFormData({
        Deal_Name: defaultName || '',
        Account_Name: '',
        Contact_Name: '',
        Amount: '',
        Stage: 'Qualification',
        Closing_Date: new Date().toISOString().split('T')[0]
      });'''
text = text.replace(target_reset, replacement_reset)

target_form = '''        {!accountId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Account (Optional)</label>
            <input 
              type="text" 
              list="accounts-list"
              value={formData.Account_Name} 
              onChange={e => setFormData({...formData, Account_Name: e.target.value})} 
              placeholder="Select or type a new account..."
              className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" 
            />
            <datalist id="accounts-list">
              {accounts?.map((acc: any) => (
                <option key={acc.id} value={acc.Account_Name} />
              ))}
            </datalist>
          </div>
        )}'''
replacement_form = '''        {!accountId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Account (Optional)</label>
            <input 
              type="text" 
              list="accounts-list"
              value={formData.Account_Name} 
              onChange={e => setFormData({...formData, Account_Name: e.target.value})} 
              placeholder="Select or type a new account..."
              className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" 
            />
            <datalist id="accounts-list">
              {accounts?.map((acc: any) => (
                <option key={acc.id} value={acc.Account_Name} />
              ))}
            </datalist>
          </div>
        )}
        
        {!contactId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact (Optional)</label>
            <input 
              type="text" 
              list="contacts-list"
              value={formData.Contact_Name} 
              onChange={e => setFormData({...formData, Contact_Name: e.target.value})} 
              placeholder="Select or type a new contact..."
              className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" 
            />
            <datalist id="contacts-list">
              {contacts?.map((c: any) => (
                <option key={c.id} value={`${c.First_Name || ''} ${c.Last_Name || ''}`.trim()} />
              ))}
            </datalist>
          </div>
        )}'''
text = text.replace(target_form, replacement_form)

with open(r'src/app/(dashboard)/components/CreateDealModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

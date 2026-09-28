import os

with open(r'src/app/(dashboard)/components/CreateDealModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { useMutation, useQueryClient } from '@tanstack/react-query';", "import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';")

target_state = '''  const [formData, setFormData] = useState({
    Deal_Name: defaultName || '',
    Amount: '',
    Stage: 'Qualification',
    Closing_Date: new Date().toISOString().split('T')[0]
  });'''

replacement_state = '''  const [formData, setFormData] = useState({
    Deal_Name: defaultName || '',
    Account_Name: '',
    Amount: '',
    Stage: 'Qualification',
    Closing_Date: new Date().toISOString().split('T')[0]
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !accountId
  });'''
text = text.replace(target_state, replacement_state)

target_payload = '''      if (accountId) payload.Account_Name = accountId;'''
replacement_payload = '''      if (accountId) {
        payload.Account_Name = accountId;
      } else if (data.Account_Name.trim()) {
        const matchingAccount = accounts?.find((a: any) => a.Account_Name === data.Account_Name.trim());
        if (matchingAccount) {
          payload.Account_Name = matchingAccount.id;
        } else {
          payload.Account_Name = data.Account_Name.trim();
        }
      }'''
text = text.replace(target_payload, replacement_payload)

target_reset = '''      setFormData({
        Deal_Name: defaultName || '',
        Amount: '',
        Stage: 'Qualification',
        Closing_Date: new Date().toISOString().split('T')[0]
      });'''
replacement_reset = '''      setFormData({
        Deal_Name: defaultName || '',
        Account_Name: '',
        Amount: '',
        Stage: 'Qualification',
        Closing_Date: new Date().toISOString().split('T')[0]
      });'''
text = text.replace(target_reset, replacement_reset)

target_form = '''        <div>
          <label className="block text-sm font-medium text-gray-700">Deal Name</label>
          <input required type="text" value={formData.Deal_Name} onChange={e => setFormData({...formData, Deal_Name: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>'''

replacement_form = '''        <div>
          <label className="block text-sm font-medium text-gray-700">Deal Name</label>
          <input required type="text" value={formData.Deal_Name} onChange={e => setFormData({...formData, Deal_Name: e.target.value})} className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border" />
        </div>

        {!accountId && (
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

text = text.replace(target_form, replacement_form)

with open(r'src/app/(dashboard)/components/CreateDealModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

import os
import re

with open(r'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target_state = '''  const [editingAmount, setEditingAmount] = useState(false);
  const [editAmountValue, setEditAmountValue] = useState('');'''

replacement_state = '''  const [editingAmount, setEditingAmount] = useState(false);
  const [editAmountValue, setEditAmountValue] = useState('');
  const [editingAccount, setEditingAccount] = useState(false);
  const [editAccountValue, setEditAccountValue] = useState('');

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !!deal
  });'''
text = text.replace(target_state, replacement_state)

target_mut = '''  const updateAmountMutation = useMutation({'''
replacement_mut = '''  const updateAccountMutation = useMutation({
    mutationFn: async (accountIdentifier: string) => {
      let finalAccountValue = accountIdentifier;
      const matchingAccount = accounts?.find((a: any) => a.Account_Name === accountIdentifier);
      if (matchingAccount) {
        finalAccountValue = matchingAccount.id;
      }
      
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Account_Name: finalAccountValue })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update account');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setEditingAccount(false);
      toast.success('Account updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update account');
    }
  });

  const handleAccountSave = () => {
    if (!editAccountValue.trim()) return;
    updateAccountMutation.mutate(editAccountValue.trim());
  };

  const updateAmountMutation = useMutation({'''
text = text.replace(target_mut, replacement_mut)

target_ui = '''            {deal.Account_Name?.name && (
              <div className="col-span-2">
                <span className="block text-gray-500 mb-1">Account</span>
                <span className="font-medium text-gray-900">{deal.Account_Name.name}</span>
              </div>
            )}'''

replacement_ui = '''            {(deal.Account_Name?.name || isAdmin) && (
              <div className="col-span-2">
                <span className="block text-gray-500 mb-1">Account</span>
                {isAdmin && editingAccount ? (
                  <div className="flex items-center gap-1 max-w-sm">
                    <input
                      type="text"
                      list="accounts-edit-list"
                      value={editAccountValue}
                      onChange={(e) => setEditAccountValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAccountSave();
                        if (e.key === 'Escape') setEditingAccount(false);
                      }}
                      placeholder="Select or type account..."
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm border border-brand-red rounded-md focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                    <datalist id="accounts-edit-list">
                      {accounts?.map((acc: any) => (
                        <option key={acc.id} value={acc.Account_Name} />
                      ))}
                    </datalist>
                    <button
                      onClick={handleAccountSave}
                      disabled={updateAccountMutation.isPending || !editAccountValue.trim()}
                      className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                      title="Save"
                    >
                      {updateAccountMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setEditingAccount(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {deal.Account_Name?.name || <span className="text-gray-400 italic">No account linked</span>}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setEditAccountValue(deal.Account_Name?.name || '');
                          setEditingAccount(true);
                        }}
                        className="p-0.5 text-gray-400 hover:text-brand-red transition-colors"
                        title="Edit account"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}'''
text = text.replace(target_ui, replacement_ui)

with open(r'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

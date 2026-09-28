import os

with open(r'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target_state = '''  const [editingAccount, setEditingAccount] = useState(false);
  const [editAccountValue, setEditAccountValue] = useState('');'''

replacement_state = '''  const [editingAccount, setEditingAccount] = useState(false);
  const [editAccountValue, setEditAccountValue] = useState('');
  const [editingContact, setEditingContact] = useState(false);
  const [editContactValue, setEditContactValue] = useState('');'''
text = text.replace(target_state, replacement_state)

target_query = '''  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !!deal
  });'''
replacement_query = '''  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/accounts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !!deal
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/website-demos/excellentzohocrm/api/contacts');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !!deal
  });'''
text = text.replace(target_query, replacement_query)

target_mut = '''  const updateAccountMutation = useMutation({'''
replacement_mut = '''  const updateContactMutation = useMutation({
    mutationFn: async (contactIdentifier: string) => {
      let finalContactValue = contactIdentifier;
      const matchingContact = contacts?.find((c: any) => `${c.First_Name || ''} ${c.Last_Name || ''}`.trim() === contactIdentifier);
      if (matchingContact) {
        finalContactValue = matchingContact.id;
      }
      
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Contact_Name: finalContactValue })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update contact');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setEditingContact(false);
      toast.success('Contact updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update contact');
    }
  });

  const handleContactSave = () => {
    if (!editContactValue.trim()) return;
    updateContactMutation.mutate(editContactValue.trim());
  };

  const updateAccountMutation = useMutation({'''
text = text.replace(target_mut, replacement_mut)

target_ui = '''            {(deal.Contact_Name?.name || contactDetails) && (
              <div className="col-span-2 pt-2 border-t border-gray-200 mt-2">
                <span className="block text-gray-500 mb-1">Contact</span>
                {isLoadingContact ? (
                  <div className="flex items-center text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Loading contact details...
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{deal.Contact_Name?.name}</div>
                    {contactDetails?.Phone && (
                      <div className="text-gray-600">
                        <a 
                          href={`tel:${contactDetails.Phone}`} 
                          onClick={() => registerCallClick({ entityId: contactDetails.id, entityType: 'Contacts', name: deal.Contact_Name?.name })}
                          className="hover:text-brand-red transition-colors"
                        >
                          {contactDetails.Phone}
                        </a>
                      </div>
                    )}
                    {contactDetails?.Email && (
                      <div className="text-gray-600">
                        <a href={`mailto:${contactDetails.Email}`} className="hover:text-brand-red transition-colors">{contactDetails.Email}</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}'''
replacement_ui = '''            {(deal.Contact_Name?.name || contactDetails || isAdmin) && (
              <div className="col-span-2 pt-2 border-t border-gray-200 mt-2">
                <span className="block text-gray-500 mb-1">Contact</span>
                {isAdmin && editingContact ? (
                  <div className="flex items-center gap-1 max-w-sm">
                    <input
                      type="text"
                      list="contacts-edit-list"
                      value={editContactValue}
                      onChange={(e) => setEditContactValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleContactSave();
                        if (e.key === 'Escape') setEditingContact(false);
                      }}
                      placeholder="Select or type contact..."
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm border border-brand-red rounded-md focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                    <datalist id="contacts-edit-list">
                      {contacts?.map((c: any) => (
                        <option key={c.id} value={`${c.First_Name || ''} ${c.Last_Name || ''}`.trim()} />
                      ))}
                    </datalist>
                    <button
                      onClick={handleContactSave}
                      disabled={updateContactMutation.isPending || !editContactValue.trim()}
                      className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                      title="Save"
                    >
                      {updateContactMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setEditingContact(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : isLoadingContact ? (
                  <div className="flex items-center text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Loading contact details...
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        {deal.Contact_Name?.name || <span className="text-gray-400 italic font-normal">No contact linked</span>}
                      </div>
                      {contactDetails?.Phone && (
                        <div className="text-gray-600 text-sm">
                          <a 
                            href={`tel:${contactDetails.Phone}`} 
                            onClick={() => registerCallClick({ entityId: contactDetails.id, entityType: 'Contacts', name: deal.Contact_Name?.name })}
                            className="hover:text-brand-red transition-colors"
                          >
                            {contactDetails.Phone}
                          </a>
                        </div>
                      )}
                      {contactDetails?.Email && (
                        <div className="text-gray-600 text-sm">
                          <a href={`mailto:${contactDetails.Email}`} className="hover:text-brand-red transition-colors">{contactDetails.Email}</a>
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setEditContactValue(deal.Contact_Name?.name || '');
                          setEditingContact(true);
                        }}
                        className="p-0.5 text-gray-400 hover:text-brand-red transition-colors"
                        title="Edit contact"
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

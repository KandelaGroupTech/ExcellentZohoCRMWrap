import os

with open(r'src/app/(dashboard)/dashboard/contacts/components/ContactSidePanel.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import_str = "import { useState } from 'react';\nimport CreateDealModal from '../../../components/CreateDealModal';\nimport { useQuery } from '@tanstack/react-query';\n"
text = text.replace("import { formatPhoneNumber", import_str + "import { formatPhoneNumber")

text = text.replace('export default function ContactSidePanel({ contact, isOpen, onClose, onEdit, onDelete }: ContactSidePanelProps) {', 'export default function ContactSidePanel({ contact, isOpen, onClose, onEdit, onDelete }: ContactSidePanelProps) {\n  const [isDealModalOpen, setIsDealModalOpen] = useState(false);\n  const { data: deals, isLoading: dealsLoading } = useQuery({\n    queryKey: [\'contact-deals\', contact?.id],\n    queryFn: async () => {\n      if (!contact?.id) return [];\n      const res = await fetch(`/website-demos/excellentzohocrm/api/contacts/${contact.id}/deals`);\n      if (!res.ok) throw new Error(\'Failed to fetch deals\');\n      return res.json();\n    },\n    enabled: !!contact?.id && isOpen,\n  });\n')

target = '''        {/* Action Bar (Edit / Delete) */}'''

replacement = '''        {/* Linked Deals Section */}
        <section className="px-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pipeline Deals</h3>
            <button onClick={() => setIsDealModalOpen(true)} className="inline-flex items-center text-xs font-medium text-brand-red hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors">
              <Plus className="h-3 w-3 mr-1" /> New Deal
            </button>
          </div>
          {dealsLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : deals?.length > 0 ? (
            <div className="space-y-3">
              {deals.map((deal: any) => (
                <div key={deal.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{deal.Deal_Name}</p>
                    <p className="text-xs text-gray-500">${deal.Amount?.toLocaleString() || '0'}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {deal.Stage}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No deals linked to this contact.</p>
          )}
        </section>

        {/* Action Bar (Edit / Delete) */}'''
text = text.replace(target, replacement)

target2 = '''      </div>
    </div>
  );
}'''
replacement2 = '''      </div>
      {contact && (
        <CreateDealModal 
          isOpen={isDealModalOpen} 
          onClose={() => setIsDealModalOpen(false)} 
          contactId={contact.id}
          defaultName={`${contact.First_Name || ''} ${contact.Last_Name || ''} Deal`.trim()}
        />
      )}
    </div>
  );
}'''
text = text.replace(target2, replacement2)

with open(r'src/app/(dashboard)/dashboard/contacts/components/ContactSidePanel.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

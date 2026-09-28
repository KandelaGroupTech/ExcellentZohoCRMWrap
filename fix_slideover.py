import os

with open(r'src/app/(dashboard)/dashboard/accounts/components/AccountSlideOver.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import_str = "import { useState } from 'react';\nimport CreateDealModal from '../../../components/CreateDealModal';\n"
text = text.replace("import { useQuery } from '@tanstack/react-query';", import_str + "import { useQuery } from '@tanstack/react-query';")
text = text.replace('X, Loader2, Building, Phone, Globe, DollarSign, MapPin', 'X, Loader2, Building, Phone, Globe, DollarSign, MapPin, Plus')

text = text.replace('export default function AccountSlideOver({ isOpen, onClose, accountName }: AccountSlideOverProps) {', 'export default function AccountSlideOver({ isOpen, onClose, accountName }: AccountSlideOverProps) {\n  const [isDealModalOpen, setIsDealModalOpen] = useState(false);')

target = '''            <section>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Pipeline Deals</h3>'''
replacement = '''            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pipeline Deals</h3>
                <button onClick={() => setIsDealModalOpen(true)} className="inline-flex items-center text-xs font-medium text-brand-red hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors">
                  <Plus className="h-3 w-3 mr-1" /> New Deal
                </button>
              </div>'''
text = text.replace(target, replacement)

target2 = '''          </div>
        </div>
      </div>
    </div>
  );
}'''
replacement2 = '''          </div>
        </div>
      </div>
      {accountName && (
        <CreateDealModal 
          isOpen={isDealModalOpen} 
          onClose={() => setIsDealModalOpen(false)} 
          accountId={accountName}
          defaultName={`${accountName} Deal`}
        />
      )}
    </div>
  );
}'''
text = text.replace(target2, replacement2)

with open(r'src/app/(dashboard)/dashboard/accounts/components/AccountSlideOver.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

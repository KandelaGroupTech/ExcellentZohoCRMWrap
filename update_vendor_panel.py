import os

path = r'src/app/(dashboard)/dashboard/vendors/components/VendorEditPanel.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add states
state_target = """  const [accountName, setAccountName] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');"""
state_repl = """  const [accountName, setAccountName] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCode, setBillingCode] = useState('');
  const [billingCountry, setBillingCountry] = useState('');
  const [website, setWebsite] = useState('');"""
text = text.replace(state_target, state_repl)

# Add to useEffect
effect_target = """      setBillingCity(vendor.Billing_City || '');
      setBillingState(vendor.Billing_State || '');"""
effect_repl = """      setBillingCity(vendor.Billing_City || '');
      setBillingState(vendor.Billing_State || '');
      setBillingStreet(vendor.Billing_Street || '');
      setBillingCode(vendor.Billing_Code || '');
      setBillingCountry(vendor.Billing_Country || '');
      setWebsite(vendor.Website || '');"""
text = text.replace(effect_target, effect_repl)

# Add to handleSave
save_target = """      Billing_City: billingCity,
      Billing_State: billingState"""
save_repl = """      Billing_City: billingCity,
      Billing_State: billingState,
      Billing_Street: billingStreet,
      Billing_Code: billingCode,
      Billing_Country: billingCountry,
      Website: website"""
text = text.replace(save_target, save_repl)

# Update Location UI
loc_target = """            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={billingCity}
                  onChange={(e) => setBillingCity(e.target.value)}
                  disabled={!isAdmin || updateMutation.isPending}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={billingState}
                  onChange={(e) => setBillingState(e.target.value)}
                  disabled={!isAdmin || updateMutation.isPending}
                  className={inputClass}
                />
              </div>
            </div>"""
loc_repl = """            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={billingStreet}
                  onChange={(e) => setBillingStreet(e.target.value)}
                  disabled={!isAdmin || updateMutation.isPending}
                  placeholder="123 Main St"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={billingState}
                    onChange={(e) => setBillingState(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip / Postal Code</label>
                  <input
                    type="text"
                    value={billingCode}
                    onChange={(e) => setBillingCode(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={billingCountry}
                    onChange={(e) => setBillingCountry(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>"""
text = text.replace(loc_target, loc_repl)

# Update Company Info UI
comp_target = """              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    disabled={!isAdmin || updateMutation.isPending}
                    placeholder="(555) 123-4567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    placeholder="contact@..."
                    className={inputClass}
                  />
                </div>
              </div>"""
comp_repl = """              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    disabled={!isAdmin || updateMutation.isPending}
                    placeholder="(555) 123-4567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isAdmin || updateMutation.isPending}
                    placeholder="contact@..."
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={!isAdmin || updateMutation.isPending}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>"""
text = text.replace(comp_target, comp_repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

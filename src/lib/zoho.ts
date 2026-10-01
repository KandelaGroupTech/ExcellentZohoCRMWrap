let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  
  // Return cached token if valid (buffer of 30 seconds)
  if (cachedAccessToken && tokenExpiresAt > now + 30000) {
    return cachedAccessToken;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Zoho API credentials in environment variables.');
  }

  const tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('refresh_token', refreshToken);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    body: params,
    // Add cache: 'no-store' to ensure Next.js doesn't cache this fetch call statically
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to refresh Zoho token:', errorText);
    throw new Error('Failed to refresh Zoho token');
  }

  const data = await response.json();
  
  if (data.error) {
    console.error('Zoho API error:', data);
    throw new Error(`Zoho API error: ${data.error}`);
  }

  cachedAccessToken = data.access_token;
  // data.expires_in is usually in seconds (e.g. 3600)
  tokenExpiresAt = now + (data.expires_in * 1000);

  return data.access_token;
}

export async function fetchDeals() {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  const fields = 'Deal_Name,Amount,Stage,Account_Name,Contact_Name,Closing_Date,Probability,Expected_Revenue,Next_Step,Lead_Source,Type,Description,Reason_For_Loss__s,Modified_Time';
  const response = await fetch(`${domain}/crm/v6/Deals?fields=${fields}`, {
    method: 'GET',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
    },
    cache: 'no-store'
  });

  if (response.status === 204) return [];
  if (!response.ok) throw new Error('Failed to fetch deals from Zoho');

  const data = await response.json();
  const deals = data.data || [];

  try {
    const attRes = await fetch(`${domain}/crm/v6/Attachments?fields=Parent_Id`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
      cache: 'no-store'
    });
    if (attRes.ok && attRes.status !== 204) {
      const attData = await attRes.json();
      if (attData.data) {
        const dealsWithAtts = new Set(
          attData.data
            .filter((a: any) => a.Parent_Id?.module?.api_name === 'Deals')
            .map((a: any) => a.Parent_Id?.id)
        );
        deals.forEach((d: any) => {
          d._has_attachments = dealsWithAtts.has(d.id);
        });
      }
    }
  } catch (e) {
    console.error('Failed to augment deals with attachment info:', e);
  }

  return deals;
}

export async function fetchLeads() {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const fields = 'First_Name,Last_Name,Company,Email,Phone,Lead_Source,Lead_Status';
  const response = await fetch(`${domain}/crm/v6/Leads?fields=${fields}`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });

  if (response.status === 204) return [];
  if (!response.ok) throw new Error('Failed to fetch leads from Zoho');
  const data = await response.json();
  return data.data || [];
}

export async function fetchContacts() {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const fields = 'First_Name,Last_Name,Account_Name,Email,Phone,Title,Skype_ID';
  const response = await fetch(`${domain}/crm/v6/Contacts?fields=${fields}`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });

  if (response.status === 204) return [];
  if (!response.ok) throw new Error('Failed to fetch contacts from Zoho');
  const data = await response.json();
  return data.data || [];
}

export async function fetchContact(id: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const fields = 'First_Name,Last_Name,Account_Name,Email,Phone,Title,Skype_ID';
  const response = await fetch(`${domain}/crm/v6/Contacts/${id}?fields=${fields}`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });

  if (!response.ok) throw new Error('Failed to fetch contact from Zoho');
  const data = await response.json();
  return data.data?.[0] || null;
}

export async function fetchAccounts() {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  const fields = 'Account_Name,Industry,Website,Phone';
  let allAccounts: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${domain}/crm/v6/Accounts/search?criteria=(Account_Type:not_equal:Vendor)&fields=${fields}&per_page=200&page=${page}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
        cache: 'no-store'
      }
    );

    if (response.status === 204) break;
    if (!response.ok) throw new Error('Failed to fetch accounts from Zoho');
    
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      allAccounts = allAccounts.concat(data.data);
      if (data.info && data.info.more_records) {
        page++;
      } else {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return allAccounts;
}

export async function createAccount(accountData: any) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  const response = await fetch(`${domain}/crm/v6/Accounts`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: [{ ...accountData, Account_Type: 'Customer' }] })
  });

  const responseText = await response.text();
  console.log('Zoho Create Account Response:', responseText);

  if (!response.ok) throw new Error(`Failed to create account: ${responseText}`);
  const data = JSON.parse(responseText);
  
  if (data.data && data.data[0].status === 'success') {
    return data.data[0].details;
  } else {
    throw new Error(`Failed to create account: ${data.data?.[0]?.message || 'Unknown error'}`);
  }
}

export async function fetchVendors() {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  let allVendors: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    // We omit &fields= so that newly added custom fields (like POC_Name) are automatically included without crashing if they don't exist yet
    const response = await fetch(
      `${domain}/crm/v6/Accounts/search?criteria=(Account_Type:equals:Vendor)&per_page=200&page=${page}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
        cache: 'no-store'
      }
    );

    if (response.status === 204) break;
    if (!response.ok) throw new Error('Failed to fetch vendors from Zoho');
    
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      allVendors = allVendors.concat(data.data);
      if (data.info && data.info.more_records) {
        page++;
      } else {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return allVendors;
}

export async function createVendor(vendorData: any) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  const payload: any = {
    Account_Name: vendorData.Vendor_Name,
    Account_Type: 'Vendor',
    Phone: vendorData.Phone,
    Account_Site: vendorData.Email,
    Website: vendorData.Website,
    Industry: vendorData.Category
  };

  const response = await fetch(`${domain}/crm/v6/Accounts`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: [payload] })
  });

  const responseText = await response.text();
  console.log('Zoho Create Vendor Response:', responseText);

  if (!response.ok) throw new Error(`Failed to create vendor: ${responseText}`);
  const data = JSON.parse(responseText);
  
  if (data.data && data.data[0].status === 'success') {
    return data.data[0].details;
  } else {
    throw new Error(`Failed to create vendor: ${data.data?.[0]?.message || 'Unknown error'}`);
  }
}

export async function fetchAccount(id: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const fields = 'Account_Name,Industry,Website,Phone,Billing_City,Billing_State,Annual_Revenue';
  const response = await fetch(`${domain}/crm/v6/Accounts/${id}?fields=${fields}`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });

  if (!response.ok) throw new Error('Failed to fetch account from Zoho');
  const data = await response.json();
  return data.data?.[0] || null;
}

export async function fetchContactsForAccount(accountId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const response = await fetch(`${domain}/crm/v6/Contacts/search?criteria=(Account_Name:equals:${accountId})`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });

  if (response.status === 204) return [];
  if (!response.ok) throw new Error('Failed to fetch contacts for account');
  const data = await response.json();
  return data.data || [];
}

export async function fetchDealsForAccount(accountId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const response = await fetch(`${domain}/crm/v6/Deals/search?criteria=(Account_Name:equals:${accountId})`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });

  if (response.status === 204) return [];
  if (!response.ok) throw new Error('Failed to fetch deals for account');
  const data = await response.json();
  return data.data || [];
}

async function createRecord(module: string, recordData: any) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  const response = await fetch(`${domain}/crm/v6/${module}`, {
    method: 'POST',
    headers: { 
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: [recordData] })
  });

  const responseData = await response.json();
  
  if (responseData.data && responseData.data[0] && responseData.data[0].status === 'success') {
    return responseData.data[0].details;
  }

  console.error(`Failed to create ${module}:`, JSON.stringify(responseData));
  const zohoError = responseData.data?.[0]?.message || responseData.message || JSON.stringify(responseData);
  throw new Error(zohoError || `Failed to create ${module} in Zoho`);
}

async function updateRecord(module: string, recordId: string, recordData: any) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  const response = await fetch(`${domain}/crm/v6/${module}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: [{ id: recordId, ...recordData }] })
  });

  const responseData = await response.json();
  
  if (responseData.data && responseData.data[0] && responseData.data[0].status === 'success') {
    return responseData.data[0].details;
  }

  console.error(`Failed to update ${module} ${recordId}:`, responseData);
  throw new Error(`Failed to update ${module} in Zoho`);
}

export async function updateLead(id: string, data: any) {
  return updateRecord('Leads', id, data);
}

export async function updateContact(id: string, data: any) {
  return updateRecord('Contacts', id, data);
}

export async function updateAccount(id: string, data: any) {
  return updateRecord('Accounts', id, data);
}

async function deleteRecord(module: string, recordId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  const response = await fetch(`${domain}/crm/v6/${module}?ids=${recordId}`, {
    method: 'DELETE',
    headers: { 
      'Authorization': `Zoho-oauthtoken ${token}`
    }
  });

  const responseData = await response.json();
  
  if (responseData.data && responseData.data[0] && responseData.data[0].status === 'success') {
    return true;
  }

  console.error(`Failed to delete ${module} ${recordId}:`, responseData);
  throw new Error(`Failed to delete ${module} in Zoho`);
}

export async function deleteLead(id: string) {
  return deleteRecord('Leads', id);
}

export async function deleteContact(id: string) {
  return deleteRecord('Contacts', id);
}

export async function createDeal(data: { Deal_Name: string, Account_Name?: any, Contact_Name?: any, Amount: number, Stage: string, Closing_Date: string }) {
  return createRecord('Deals', data);
}

export async function deleteDeal(id: string) {
  return deleteRecord('Deals', id);
}

export async function updateDeal(id: string, data: Partial<{ Deal_Name: string, Amount: number, Stage: string, Closing_Date: string, Description: string, Account_Name: any, Contact_Name: any }>) {
  return updateRecord('Deals', id, data);
}

export async function createLead(data: { First_Name: string, Last_Name: string, Company: string, Email: string, Phone: string }) {
  return createRecord('Leads', data);
}

export async function createContact(data: { First_Name: string, Last_Name: string, Account_Name?: any, Contact_Name?: any, Email: string, Phone: string }) {
  // If Account_Name is a string, it creates an account if not exist or links it.
  return createRecord('Contacts', data);
}

export async function createCall(data: { Subject: string, Call_Type: string, Call_Purpose: string, Description: string }) {
  return createRecord('Calls', { ...data, Call_Type: 'Outbound' });
}

export async function updateDealStage(dealId: string, stage: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  const response = await fetch(`${domain}/crm/v6/Deals`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: [{ id: dealId, Stage: stage }] })
  });

  const responseData = await response.json();
  
  if (responseData.data && responseData.data[0] && responseData.data[0].status === 'success') {
    return responseData.data[0].details;
  }

  console.error(`Failed to update deal ${dealId}:`, responseData);
  throw new Error('Failed to update deal stage in Zoho');
}

export async function fetchTasksForDeal(dealId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const response = await fetch(`${domain}/crm/v6/Tasks/search?criteria=(What_Id:equals:${dealId})`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });
  
  if (!response.ok) {
    if (response.status === 204) return [];
    const text = await response.text();
    throw new Error(`Failed to fetch tasks: ${response.status} ${text}`);
  }
  
  const data = await response.json();
  // Filter locally just to be absolutely sure we only get Deals tasks
  return (data.data || []).filter((t: any) => 
    t.SE_Module === 'Deals' || 
    t.$se_module === 'Deals' || 
    (t.What_Id && t.What_Id.id === dealId)
  );
}

export async function fetchTasks() {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const response = await fetch(`${domain}/crm/v6/Tasks?fields=Subject,Status,What_Id,SEMODULE_ID,SE_Module`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });
  
  if (!response.ok) {
    if (response.status === 204) return [];
    const text = await response.text();
    throw new Error(`Failed to fetch all tasks: ${response.status} ${text}`);
  }
  
  const data = await response.json();
  return data.data || [];
}

export async function createTask(data: { Subject: string, What_Id: string }) {
  return createRecord('Tasks', { 
    Subject: data.Subject, 
    $se_module: 'Deals',
    What_Id: { id: data.What_Id }, // Enforce object format
    Status: 'Not Started'
  });
}

export async function updateTaskStatus(taskId: string, status: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  const response = await fetch(`${domain}/crm/v6/Tasks`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: [{ id: taskId, Status: status }] })
  });

  const responseData = await response.json();
  if (responseData.data && responseData.data[0] && responseData.data[0].status === 'success') {
    return responseData.data[0].details;
  }
  throw new Error('Failed to update task status');
}

export async function fetchNotesForDeal(dealId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const fields = 'Note_Title,Note_Content,Created_Time';
  const response = await fetch(`${domain}/crm/v6/Deals/${dealId}/Notes?fields=${fields}`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });

  if (response.status === 204) return [];
  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to fetch notes, response:', errText);
    throw new Error(`Zoho API Error: ${errText}`);
  }
  const data = await response.json();
  return data.data || [];
}

export async function createNote(data: { Parent_Id: string, Note_Content: string, Note_Title: string, se_module?: string }) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const moduleName = data.se_module || 'Deals';

  const payload = {
    data: [{
      Note_Title: data.Note_Title,
      Note_Content: data.Note_Content,
      Parent_Id: {
        id: data.Parent_Id,
        module: { api_name: moduleName }
      },
      se_module: moduleName
    }]
  };

  const response = await fetch(`${domain}/crm/v6/Notes`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseData = await response.json();

  if (responseData.data && responseData.data[0] && responseData.data[0].status === 'success') {
    return responseData.data[0].details;
  }

  // Surface the real Zoho error
  const zohoError = responseData.data?.[0]?.message || responseData.message || JSON.stringify(responseData);
  console.error('Failed to create note, Zoho response:', JSON.stringify(responseData));
  throw new Error(`Zoho error: ${zohoError}`);
}


export async function deleteAccount(id: string) {
  return deleteRecord('Accounts', id);
}

export async function fetchDealsForContact(contactId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const response = await fetch(`${domain}/crm/v6/Deals/search?criteria=(Contact_Name:equals:${contactId})`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });

  if (response.status === 204) return [];
  if (!response.ok) throw new Error('Failed to fetch deals for contact');
  const data = await response.json();
  return data.data || [];
}
export async function uploadDealAttachment(dealId: string, formData: FormData) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  const res = await fetch(`${domain}/crm/v6/Deals/${dealId}/Attachments`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`
    },
    body: formData
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to upload attachment: ${text}`);
  }
  return res.json();
}

export async function getDealAttachments(dealId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  const res = await fetch(`${domain}/crm/v6/Deals/${dealId}/Attachments?fields=id,File_Name,Size,$type,$se_module`, {
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });
  // Return empty array if not found or no attachments
  if (res.status === 204) return { data: [] };
  if (!res.ok) {
    console.error('[ZOHO API ERROR] getDealAttachments:', res.status, await res.text());
    return { data: [] };
  }
  return res.json();
}

export async function deleteDealAttachment(dealId: string, attachmentId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  const res = await fetch(`${domain}/crm/v6/Deals/${dealId}/Attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete attachment');
  return res.json();
}

export async function downloadDealAttachment(dealId: string, attachmentId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  const res = await fetch(`${domain}/crm/v6/Deals/${dealId}/Attachments/${attachmentId}`, {
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
  });
  if (!res.ok) throw new Error('Failed to download attachment');
  return res;
}

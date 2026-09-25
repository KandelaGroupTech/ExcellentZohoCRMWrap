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
  return data.data || [];
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
  
  const fields = 'First_Name,Last_Name,Account_Name,Email,Phone,Title';
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
  
  const fields = 'First_Name,Last_Name,Account_Name,Email,Phone,Title';
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
  const response = await fetch(`${domain}/crm/v6/Accounts?fields=${fields}`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });

  if (response.status === 204) return [];
  if (!response.ok) throw new Error('Failed to fetch accounts from Zoho');
  const data = await response.json();
  return data.data || [];
}

export async function fetchVendors() {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  const fields = 'Account_Name,Industry,Billing_City,Billing_State,Phone,Email,Description,Account_Type';
  // Search for accounts where Account_Type = Vendor
  const response = await fetch(
    `${domain}/crm/v6/Accounts/search?criteria=(Account_Type:equals:Vendor)&fields=${fields}&per_page=200`,
    {
      method: 'GET',
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
      cache: 'no-store'
    }
  );

  if (response.status === 204) return [];
  if (!response.ok) throw new Error('Failed to fetch vendors from Zoho');
  const data = await response.json();
  return data.data || [];
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
  
  // Zoho returns a 201 or 202 status for success, but checking the specific data object status is safer
  if (responseData.data && responseData.data[0] && responseData.data[0].status === 'success') {
    return responseData.data[0].details;
  }

  console.error(`Failed to create ${module}:`, responseData);
  throw new Error(`Failed to create ${module} in Zoho`);
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

export async function createDeal(data: { Deal_Name: string, Account_Name?: string, Amount: number, Stage: string, Closing_Date: string }) {
  return createRecord('Deals', data);
}

export async function deleteDeal(id: string) {
  return deleteRecord('Deals', id);
}

export async function updateDeal(id: string, data: Partial<{ Deal_Name: string, Amount: number, Stage: string, Closing_Date: string, Description: string }>) {
  return updateRecord('Deals', id, data);
}

export async function createLead(data: { First_Name: string, Last_Name: string, Company: string, Email: string, Phone: string }) {
  return createRecord('Leads', data);
}

export async function createContact(data: { First_Name: string, Last_Name: string, Account_Name?: string, Email: string, Phone: string }) {
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
  
  const response = await fetch(`${domain}/crm/v6/Tasks/search?criteria=((SE_Module:equals:Deals)and(SEMODULE_ID:equals:${dealId}))`, {
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
  // Filter locally just to be absolutely sure we only get Deals tasks, in case SEMODULE_ID isn't unique
  return (data.data || []).filter((t: any) => t.SE_Module === 'Deals' || t.$se_module === 'Deals');
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
    SE_Module: 'Deals',
    SEMODULE_ID: data.What_Id,
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

export async function createNote(data: { Parent_Id: string, Note_Content: string, Note_Title: string }) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';

  const payload = {
    data: [{
      Note_Title: data.Note_Title,
      Note_Content: data.Note_Content,
      Parent_Id: {
        id: data.Parent_Id,
        module: { api_name: 'Deals' }
      },
      se_module: 'Deals'
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

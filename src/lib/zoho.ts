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

  const fields = 'Deal_Name,Amount,Stage,Account_Name,Contact_Name,Closing_Date,Probability,Expected_Revenue,Next_Step,Lead_Source,Type,Description,Reason_For_Loss__s';
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
  
  const response = await fetch(`${domain}/crm/v6/Tasks/search?criteria=(What_Id:equals:${dealId})`, {
    method: 'GET',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });

  if (response.status === 204) return [];
  if (!response.ok) throw new Error('Failed to fetch tasks for deal');
  const data = await response.json();
  return data.data || [];
}

export async function createTask(data: { Subject: string, What_Id: string }) {
  return createRecord('Tasks', { 
    Subject: data.Subject, 
    What_Id: { id: data.What_Id },
    $se_module: 'Deals',
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

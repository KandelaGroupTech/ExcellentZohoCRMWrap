
async function getAccessToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', process.env.ZOHO_CLIENT_ID || '');
  params.append('client_secret', process.env.ZOHO_CLIENT_SECRET || '');
  params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN || '');

  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    body: params,
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.access_token;
}

async function test() {
  const token = await getAccessToken();
  
  const dealsRes = await fetch('https://www.zohoapis.com/crm/v6/Deals?fields=Deal_Name', {
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
  });
  const dealsData = await dealsRes.json();
  console.log("Deals Data:", dealsData);
  if (!dealsData.data) return;
  const dealId = dealsData.data[0].id;
  console.log("Using Deal ID:", dealId);

  // Try to create a task
  const taskRes = await fetch('https://www.zohoapis.com/crm/v6/Tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: [{
        Subject: "Test Task",
        What_Id: { id: dealId },
        Status: "Not Started",
        $se_module: "Deals" // Attempting to set se_module
      }]
    })
  });
  const taskData = await taskRes.json();
  console.log("Task Create Response:", JSON.stringify(taskData, null, 2));
}

test();

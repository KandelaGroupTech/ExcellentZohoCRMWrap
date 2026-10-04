

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

async function fetchDeals() {
  try {
    const token = await getAccessToken();
    console.log('Got token:', token ? 'yes' : 'no');
    
    const fields = 'Deal_Name,Amount,Stage,Account_Name,Contact_Name,Closing_Date,Probability,Expected_Revenue,Next_Step,Lead_Source,Type,Description,Reason_For_Loss__s';
    const response = await fetch(`https://www.zohoapis.com/crm/v6/Deals?fields=${fields}`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
      },
    });

    const text = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Body:', text.substring(0, 500) + '...');
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchDeals();

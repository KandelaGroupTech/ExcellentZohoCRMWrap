import { getAccessToken, getDealAttachments } from './src/lib/zoho';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We need to inject fetch into global since zoho.ts uses it
(global as any).fetch = fetch;

async function run() {
  try {
    const dealsRes = await fetch('https://www.zohoapis.com/crm/v6/Deals', {
      headers: { 'Authorization': `Zoho-oauthtoken ${await getAccessToken()}` }
    });
    const deals = await dealsRes.json();
    if (!deals.data || deals.data.length === 0) {
      console.log('No deals found');
      return;
    }
    const dealId = deals.data[0].id;
    console.log('Testing with deal:', dealId, deals.data[0].Deal_Name);

    const attachs = await getDealAttachments(dealId);
    console.log('Attachments response:', JSON.stringify(attachs, null, 2));

  } catch (e) {
    console.error(e);
  }
}
run();

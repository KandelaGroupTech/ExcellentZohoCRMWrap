import urllib.request
import urllib.parse
import json
import datetime

client_id = '1000.LRWV2IV7HP4NC09K54HONWDBE89VMX'
client_secret = 'afb68be2d1a571a2db100a9d3e2e396e0deba7ecb3'
refresh_token = '1000.fc9408f0c1954fb774a2270145d2c618.d195d85f0e973e46faa927219055f7b3'

# 1. Get access token
url = f'https://accounts.zoho.com/oauth/v2/token?refresh_token={refresh_token}&client_id={client_id}&client_secret={client_secret}&grant_type=refresh_token'
req = urllib.request.Request(url, method='POST')
with urllib.request.urlopen(req) as response:
    auth_data = json.loads(response.read().decode())
    access_token = auth_data['access_token']

print('Got access token')

# 2. Fetch deals
req = urllib.request.Request('https://www.zohoapis.com/crm/v6/Deals?fields=Deal_Name,Stage,Closing_Date')
req.add_header('Authorization', f'Zoho-oauthtoken {access_token}')
with urllib.request.urlopen(req) as response:
    deals_data = json.loads(response.read().decode())
    deals = deals_data.get('data', [])

# 3. Find target deal
target = None
for d in deals:
    if 'NPB - CBC Radio Security' in d.get('Deal_Name', ''):
        target = d
        break

if not target:
    print('Deal not found')
    exit(1)

print('Found deal:', target['id'], target['Deal_Name'])

# 4. Update deal
today = datetime.datetime.now().strftime('%Y-%m-%d')
update_data = {
    'data': [{
        'id': target['id'],
        'Closing_Date': today
    }]
}
req = urllib.request.Request('https://www.zohoapis.com/crm/v6/Deals', data=json.dumps(update_data).encode('utf8'), method='PUT')
req.add_header('Authorization', f'Zoho-oauthtoken {access_token}')
req.add_header('Content-Type', 'application/json')

with urllib.request.urlopen(req) as response:
    res = json.loads(response.read().decode())
    print('Update response:', res)


import os

path = r'src/app/api/vendors/[vendorId]/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = """    if (data.Billing_City !== undefined) allowed.Billing_City = data.Billing_City;
    if (data.Billing_State !== undefined) allowed.Billing_State = data.Billing_State;
    if (data.Account_Name !== undefined) allowed.Account_Name = data.Account_Name;"""

repl = """    if (data.Billing_City !== undefined) allowed.Billing_City = data.Billing_City;
    if (data.Billing_State !== undefined) allowed.Billing_State = data.Billing_State;
    if (data.Billing_Street !== undefined) allowed.Billing_Street = data.Billing_Street;
    if (data.Billing_Code !== undefined) allowed.Billing_Code = data.Billing_Code;
    if (data.Billing_Country !== undefined) allowed.Billing_Country = data.Billing_Country;
    if (data.Website !== undefined) allowed.Website = data.Website;
    if (data.Account_Name !== undefined) allowed.Account_Name = data.Account_Name;"""

text = text.replace(target, repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

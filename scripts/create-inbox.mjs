const token = "EAAOkgWTclVUBSLblpZBXDem6VHbJEy8pi1B93ihBjtUgv5ejLuTCy8zBgDvI8iDlnr1Sx7DW3pWQloNPyYGcRJuuGAZAEccrpxUnquXHXcfZAXcCiSZBJhd2ZCv6Nq7JuGOLh1ZCPWQm1BJcMZBPxWh7GVQwEyY1qSiZAMH6dGZBTCm4CJoRy5rAQ7fYvyRaprgZDZD";
const phoneId = "1245411875317124";
const accountId = "1987297745266738";

const chatwootUrl = "https://chat.sanjaworks.com";
const chatwootAccount = "18";
const chatwootUserId = "75";
const chatwootPlatformToken = "qGQpjFsw1PMv8kN4jNVLJ8jH";

async function run() {
  // 1. Fetch phone number from Meta
  const metaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const metaData = await metaRes.json();
  if (metaData.error) {
    console.error("Meta Error:", metaData.error);
    return;
  }
  const phoneNumber = metaData.display_phone_number.replace(/\D/g, '');
  console.log("Phone number:", phoneNumber);

  // 2. Fetch Chatwoot API Token
  const cTokenRes = await fetch(`${chatwootUrl}/platform/api/v1/users/${chatwootUserId}`, {
    headers: { 'api-access-token': chatwootPlatformToken }
  });
  const cTokenData = await cTokenRes.json();
  const apiToken = cTokenData.access_token;
  
  // 3. Create WhatsApp Inbox in Chatwoot
  const payload = {
    name: "WhatsApp Alumax",
    channel: {
      type: "whatsapp",
      phone_number: `+${phoneNumber}`,
      provider: "whatsapp_cloud",
      provider_config: {
        api_key: token,
        phone_number_id: phoneId,
        business_account_id: accountId
      }
    }
  };

  const inboxRes = await fetch(`${chatwootUrl}/api/v1/accounts/${chatwootAccount}/inboxes`, {
    method: 'POST',
    headers: { 
      'api-access-token': apiToken,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(payload)
  });
  
  const inboxData = await inboxRes.json();
  console.log("Inbox Created:", JSON.stringify(inboxData, null, 2));
}

run().catch(console.error);

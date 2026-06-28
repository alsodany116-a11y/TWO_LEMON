import crypto from 'crypto';

interface UserData {
  name: string;
  phone: string;
  userAgent?: string;
  ip?: string;
}

// Helper to hash string to SHA256 as required by Facebook Meta API
function hashValue(val: string): string {
  if (!val) return '';
  const normalized = val.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Clean and normalize phone numbers (strip spaces, symbols, ensure it starts with digits)
function normalizePhone(phone: string): string {
  // Simple normalization: keep only digits
  return phone.replace(/\D/g, '');
}

export async function sendCapiEvent({
  pixelId,
  accessToken,
  testEventCode,
  eventName,
  userData,
  eventSourceUrl,
}: {
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
  eventName: string;
  userData: UserData;
  eventSourceUrl: string;
}) {
  if (!pixelId || !accessToken) {
    console.log('CAPI: Missing Pixel ID or Access Token. Event skipped.');
    return { success: false, message: 'Missing configurations' };
  }

  const phoneNormalized = normalizePhone(userData.phone);
  const firstNameHashed = hashValue(userData.name.split(' ')[0] || '');
  const phoneHashed = hashValue(phoneNormalized);

  const eventData: any = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: eventSourceUrl,
    user_data: {
      ph: [phoneHashed],
      fn: firstNameHashed ? [firstNameHashed] : undefined,
    },
  };

  if (userData.userAgent) {
    eventData.user_data.client_user_agent = userData.userAgent;
  }
  if (userData.ip) {
    eventData.user_data.client_ip_address = userData.ip;
  }

  // Generate a random event_id to prevent deduplication issues
  const eventId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  eventData.event_id = eventId;

  const payload: any = {
    data: [eventData],
  };

  // If a test code is provided, include it to inspect in the Events Manager
  if (testEventCode) {
    payload.test_event_code = testEventCode.trim();
  }

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('CAPI Response:', data);

    if (data.error) {
      return { success: false, error: data.error };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error('CAPI Error:', error);
    return { success: false, error: error.message || error };
  }
}

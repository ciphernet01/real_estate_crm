const postWebhook = async (url, payload) => {
  if (!url) {
    return { sent: false, reason: 'webhook-not-configured' };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Notification webhook failed: ${response.status}`);
  }

  return { sent: true };
};

export const sendSms = async ({ to, message, meta = {} }) => {
  return postWebhook(process.env.SMS_WEBHOOK_URL, {
    channel: 'sms',
    to,
    message,
    from: process.env.NOTIFICATION_FROM || 'RealEstateCRM',
    meta,
  });
};

export const sendEmail = async ({ to, subject, message, meta = {} }) => {
  return postWebhook(process.env.EMAIL_WEBHOOK_URL, {
    channel: 'email',
    to,
    subject,
    message,
    from: process.env.NOTIFICATION_FROM || 'RealEstateCRM',
    meta,
  });
};

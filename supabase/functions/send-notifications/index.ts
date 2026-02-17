// Email Sender Edge Function
// Processes notification queue and sends emails via SMTP or email service

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  subject: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface User {
  id: string;
  email: string;
  name: string;
}

// Email service configuration
// For production, use services like SendGrid, AWS SES, or Mailgun
const EMAIL_CONFIG = {
  from: 'notifications@tutorstartup.com',
  fromName: 'Tutor Startup',
};

async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if we have an email service configured
    const emailServiceUrl = Deno.env.get('EMAIL_SERVICE_URL');
    const emailServiceKey = Deno.env.get('EMAIL_SERVICE_KEY');
    
    if (!emailServiceUrl || !emailServiceKey) {
      // Log to console in development (no actual email service configured)
      console.log('📧 EMAIL WOULD BE SENT:');
      console.log('  To:', to);
      console.log('  Subject:', subject);
      console.log('  Content:', textContent.substring(0, 200) + '...');
      
      // Simulate success
      return { success: true };
    }
    
    // Send via configured email service
    const response = await fetch(emailServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${emailServiceKey}`,
      },
      body: JSON.stringify({
        to,
        from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
        subject,
        html: htmlContent,
        text: textContent,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Email service error: ${response.statusText}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function generateEmailTemplate(
  subject: string,
  content: string,
  userName: string,
  actionUrl?: string,
  actionText?: string
): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Tutor Startup</h1>
  </div>
  <div class="content">
    <h2>Hello ${userName},</h2>
    <p>${content}</p>
    ${actionUrl ? `<a href="${actionUrl}" class="button">${actionText || 'View Details'}</a>` : ''}
  </div>
  <div class="footer">
    <p>You're receiving this email because you have notifications enabled.</p>
    <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Notification Preferences</a></p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Tutor Startup

Hello ${userName},

${content}

${actionUrl ? `View details: ${actionUrl}` : ''}

---
You're receiving this email because you have notifications enabled.
Unsubscribe: {{unsubscribe_url}}
Notification Preferences: {{preferences_url}}
  `.trim();

  return { html, text };
}

async function processNotificationQueue(supabase: any) {
  // Fetch pending notifications with user details
  const { data: notifications, error } = await supabase
    .from('email_notifications')
    .select(`
      id,
      user_id,
      type,
      subject,
      content,
      metadata,
      profiles:user_id(email, name)
    `)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(50);
  
  if (error) {
    console.error('Failed to fetch notifications:', error);
    return;
  }
  
  if (!notifications || notifications.length === 0) {
    console.log('No pending notifications');
    return;
  }
  
  console.log(`Processing ${notifications.length} notifications...`);
  
  for (const notification of notifications) {
    const user = notification.profiles;
    
    if (!user || !user.email) {
      console.log(`Skipping notification ${notification.id}: No user email`);
      await supabase
        .from('email_notifications')
        .update({ status: 'failed', error_message: 'No user email' })
        .eq('id', notification.id);
      continue;
    }
    
    // Generate action URL based on notification type
    let actionUrl: string | undefined;
    let actionText: string | undefined;
    
    switch (notification.type) {
      case 'message':
        actionUrl = `${Deno.env.get('APP_URL') || 'https://app.tutorstartup.com'}/messages/${notification.metadata?.conversation_id}`;
        actionText = 'View Message';
        break;
      case 'proposal':
        actionUrl = `${Deno.env.get('APP_URL') || 'https://app.tutorstartup.com'}/jobs/${notification.metadata?.job_id}`;
        actionText = 'View Proposal';
        break;
      case 'interview':
        actionUrl = `${Deno.env.get('APP_URL') || 'https://app.tutorstartup.com'}/interviews`;
        actionText = 'View Interview';
        break;
      case 'contract':
        actionUrl = `${Deno.env.get('APP_URL') || 'https://app.tutorstartup.com'}/contracts/${notification.metadata?.contract_id}`;
        actionText = 'View Contract';
        break;
      case 'review':
        actionUrl = `${Deno.env.get('APP_URL') || 'https://app.tutorstartup.com'}/contracts`;
        actionText = 'Leave Review';
        break;
      default:
        actionUrl = `${Deno.env.get('APP_URL') || 'https://app.tutorstartup.com'}/dashboard`;
        actionText = 'Go to Dashboard';
    }
    
    // Generate email content
    const { html, text } = generateEmailTemplate(
      notification.subject,
      notification.content,
      user.name || 'there',
      actionUrl,
      actionText
    );
    
    // Send email
    const result = await sendEmail(user.email, notification.subject, html, text);
    
    // Update notification status
    if (result.success) {
      await supabase
        .from('email_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id);
      
      console.log(`✅ Email sent to ${user.email}: ${notification.subject}`);
    } else {
      await supabase
        .from('email_notifications')
        .update({
          status: 'failed',
          error_message: result.error,
          retry_count: supabase.raw('retry_count + 1'),
        })
        .eq('id', notification.id);
      
      console.log(`❌ Failed to send to ${user.email}: ${result.error}`);
    }
  }
}

async function retryFailedNotifications(supabase: any) {
  // Retry failed notifications (up to 3 times)
  const { data: failedNotifications, error } = await supabase
    .from('email_notifications')
    .select(`
      id,
      user_id,
      type,
      subject,
      content,
      metadata,
      retry_count,
      profiles:user_id(email, name)
    `)
    .eq('status', 'failed')
    .lt('retry_count', 3)
    .order('created_at', { ascending: true })
    .limit(20);
  
  if (error || !failedNotifications || failedNotifications.length === 0) {
    return;
  }
  
  console.log(`Retrying ${failedNotifications.length} failed notifications...`);
  
  for (const notification of failedNotifications) {
    // Reset to pending for retry
    await supabase
      .from('email_notifications')
      .update({ status: 'pending' })
      .eq('id', notification.id);
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Process notification queue
    await processNotificationQueue(supabase);
    
    // Retry failed notifications
    await retryFailedNotifications(supabase);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Notification queue processed' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
    console.warn('RESEND_API_KEY is missing. Email functionality will not work.');
}

const resend = new Resend(resendApiKey);

export async function sendWelcomeEmail(email: string, name: string) {
    if (!resendApiKey) {
        console.error('Resend API Key missing');
        return { error: 'Configuration Error' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'SolisTech Pro <onboarding@solistech.pro>', // Update with your verified domain
            to: [email],
            subject: 'Welcome to SolisTech Pro',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; color: #333;">
          <div style="text-align: center; padding-bottom: 20px;">
             <h1 style="color: #000;">SolisTech Pro</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="margin-top: 0;">Welcome, ${name}!</h2>
            <p>We are thrilled to have you on board. SolisTech Pro is designed to help you streamline your operations and achieve your goals.</p>
            <p>Your account has been successfully created and is ready to use.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Dashboard</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            &copy; ${new Date().getFullYear()} SolisTech Pro. All rights reserved.
          </div>
        </div>
      `,
        });

        if (error) {
            console.error('Error sending welcome email:', error);
            return { error };
        }

        return { data };
    } catch (error) {
        console.error('Exception sending welcome email:', error);
        return { error };
    }
}

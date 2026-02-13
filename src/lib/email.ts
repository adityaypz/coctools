import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "CocTools <onboarding@resend.dev>"; // Resend's test email for free tier

interface Submission {
    projectName: string;
    projectUrl: string;
    description: string;
    submittedBy: string | null;
}

/**
 * Send confirmation email when user submits an airdrop
 */
export async function sendSubmissionConfirmation(
    email: string | null,
    submission: Submission
) {
    if (!email || !process.env.RESEND_API_KEY) return;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `✅ Airdrop Submission Received - ${submission.projectName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #8b5cf6;">Thank You for Your Submission! 🎉</h2>
                    
                    <p>Hi there!</p>
                    
                    <p>We've received your airdrop submission for <strong>${submission.projectName}</strong> and our team will review it shortly.</p>
                    
                    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Project:</strong> ${submission.projectName}</p>
                        <p style="margin: 8px 0 0 0;"><strong>URL:</strong> <a href="${submission.projectUrl}" style="color: #8b5cf6;">${submission.projectUrl}</a></p>
                    </div>
                    
                    <p>You'll receive another email once we've reviewed your submission.</p>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        Best regards,<br>
                        <strong>CocTools Team</strong>
                    </p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Failed to send confirmation email:", error);
        // Don't throw - email failure shouldn't block submission
    }
}

/**
 * Send approval notification with link to airdrop page
 */
export async function sendApprovalNotification(
    email: string | null,
    submission: Submission,
    toolId: string | null
) {
    if (!email || !process.env.RESEND_API_KEY) return;

    const airdropUrl = "https://coctools.vercel.app/airdrops";

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `🎉 Your Airdrop Submission Was Approved!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #10b981;">Great News! 🎉</h2>
                    
                    <p>Your airdrop submission for <strong>${submission.projectName}</strong> has been approved!</p>
                    
                    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Project:</strong> ${submission.projectName}</p>
                        <p style="margin: 8px 0 0 0;"><strong>URL:</strong> <a href="${submission.projectUrl}" style="color: #8b5cf6;">${submission.projectUrl}</a></p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${airdropUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            View Your Airdrop →
                        </a>
                    </div>
                    
                    <p>Thank you for contributing to CocTools! 🚀</p>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        Best regards,<br>
                        <strong>CocTools Team</strong>
                    </p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Failed to send approval email:", error);
    }
}

/**
 * Send rejection notification with reason
 */
export async function sendRejectionNotification(
    email: string | null,
    submission: Submission,
    reason?: string | null
) {
    if (!email || !process.env.RESEND_API_KEY) return;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Airdrop Submission Update - ${submission.projectName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #ef4444;">Submission Update</h2>
                    
                    <p>Hi there,</p>
                    
                    <p>Unfortunately, we couldn't approve your airdrop submission for <strong>${submission.projectName}</strong> at this time.</p>
                    
                    ${reason ? `
                        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
                        </div>
                    ` : ''}
                    
                    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Project:</strong> ${submission.projectName}</p>
                        <p style="margin: 8px 0 0 0;"><strong>URL:</strong> <a href="${submission.projectUrl}" style="color: #8b5cf6;">${submission.projectUrl}</a></p>
                    </div>
                    
                    <p>You're welcome to submit again with updated information at <a href="https://coctools.vercel.app/submit-airdrop" style="color: #8b5cf6;">coctools.vercel.app/submit-airdrop</a></p>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        Best regards,<br>
                        <strong>CocTools Team</strong>
                    </p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Failed to send rejection email:", error);
    }
}

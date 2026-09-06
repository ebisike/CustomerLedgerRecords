using CustomerLedger.Application.Common.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace CustomerLedger.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink, CancellationToken cancellationToken = default)
    {
        var subject = "Reset Your Password - Drinks & Food Warehouse Intl Limited";
        var body = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
  <div style='background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;'>
    <h1 style='color: white; margin: 0;'>Password Reset</h1>
  </div>
  <div style='background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;'>
    <p>Hello {toName},</p>
    <p>You requested a password reset for your Drinks & Food Warehouse account.</p>
    <p>Click the button below to reset your password. This link expires in <strong>2 hours</strong>.</p>
    <div style='text-align: center; margin: 30px 0;'>
      <a href='{resetLink}' style='background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;'>Reset Password</a>
    </div>
    <p style='color: #64748b; font-size: 14px;'>If you did not request this, please ignore this email. Your password will not change.</p>
    <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
    <p style='color: #94a3b8; font-size: 12px; text-align: center;'>Drinks and Food Warehouse Intl Limited</p>
  </div>
</body>
</html>";

        await SendEmailAsync(toEmail, toName, subject, body, cancellationToken);
    }

    public async Task SendInvitationEmailAsync(string toEmail, string toName, string invitationLink, string invitedByName, CancellationToken cancellationToken = default)
    {
        var subject = "You're Invited - Drinks & Food Warehouse Intl Limited";
        var body = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
  <div style='background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;'>
    <h1 style='color: white; margin: 0;'>You're Invited!</h1>
  </div>
  <div style='background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;'>
    <p>Hello {toName},</p>
    <p><strong>{invitedByName}</strong> has invited you to join the <strong>Drinks and Food Warehouse Intl Limited</strong> customer ledger system.</p>
    <p>Click the button below to accept the invitation and set up your account. This link expires in <strong>7 days</strong>.</p>
    <div style='text-align: center; margin: 30px 0;'>
      <a href='{invitationLink}' style='background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;'>Accept Invitation</a>
    </div>
    <p style='color: #64748b; font-size: 14px;'>If you were not expecting this invitation, you can safely ignore this email.</p>
    <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
    <p style='color: #94a3b8; font-size: 12px; text-align: center;'>Drinks and Food Warehouse Intl Limited</p>
  </div>
</body>
</html>";

        await SendEmailAsync(toEmail, toName, subject, body, cancellationToken);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string toName, CancellationToken cancellationToken = default)
    {
        var subject = "Welcome to Drinks & Food Warehouse Intl Limited";
        var body = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
  <div style='background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;'>
    <h1 style='color: white; margin: 0;'>Welcome Aboard!</h1>
  </div>
  <div style='background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;'>
    <p>Hello {toName},</p>
    <p>Welcome to <strong>Drinks and Food Warehouse Intl Limited</strong>! Your account has been created successfully.</p>
    <p>You can now log in to access the Customer Credit Ledger system.</p>
    <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
    <p style='color: #94a3b8; font-size: 12px; text-align: center;'>Drinks and Food Warehouse Intl Limited</p>
  </div>
</body>
</html>";

        await SendEmailAsync(toEmail, toName, subject, body, cancellationToken);
    }

    private async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration["Email:SenderName"] ?? "Food & Drinks Warehouse",
                _configuration["Email:SenderEmail"] ?? "noreply@fdwarehouse.com"
            ));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(
                _configuration["Email:SmtpHost"] ?? "smtp.gmail.com",
                int.TryParse(_configuration["Email:SmtpPort"], out var port) ? port : 587,
                SecureSocketOptions.StartTls,
                cancellationToken);

            await client.AuthenticateAsync(
                _configuration["Email:Username"] ?? string.Empty,
                _configuration["Email:Password"] ?? string.Empty,
                cancellationToken);

            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            throw;
        }
    }
}

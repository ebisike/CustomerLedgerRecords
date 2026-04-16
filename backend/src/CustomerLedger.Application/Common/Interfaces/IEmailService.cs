namespace CustomerLedger.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink, CancellationToken cancellationToken = default);
    Task SendInvitationEmailAsync(string toEmail, string toName, string invitationLink, string invitedByName, CancellationToken cancellationToken = default);
    Task SendWelcomeEmailAsync(string toEmail, string toName, CancellationToken cancellationToken = default);
}

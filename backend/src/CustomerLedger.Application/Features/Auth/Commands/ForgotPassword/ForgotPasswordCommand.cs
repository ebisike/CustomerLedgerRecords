using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace CustomerLedger.Application.Features.Auth.Commands.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest<ApiResponse<string>>;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, ApiResponse<string>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public ForgotPasswordCommandHandler(IUnitOfWork unitOfWork, IEmailService emailService, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<ApiResponse<string>> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.FirstOrDefaultAsync(
            u => u.Email.ToLower() == request.Email.ToLower() && !u.IsDeleted,
            cancellationToken);

        // Always return success to avoid email enumeration
        if (user == null)
            return ApiResponse<string>.Success("If an account with that email exists, a password reset link has been sent.");

        // Invalidate existing tokens
        var existingTokens = await _unitOfWork.PasswordResetTokens.FindAsync(
            t => t.UserId == user.Id && !t.IsUsed && !t.IsDeleted,
            cancellationToken);

        foreach (var existing in existingTokens)
        {
            existing.IsUsed = true;
            _unitOfWork.PasswordResetTokens.Update(existing);
        }

        var token = new Domain.Entities.PasswordResetToken
        {
            Token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
            ExpiresAt = DateTime.UtcNow.AddHours(2),
            UserId = user.Id
        };

        await _unitOfWork.PasswordResetTokens.AddAsync(token, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5173";
        var resetLink = $"{frontendUrl}/auth/reset-password?token={token.Token}";

        await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, resetLink, cancellationToken);

        return ApiResponse<string>.Success("If an account with that email exists, a password reset link has been sent.");
    }
}

using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using MediatR;

namespace CustomerLedger.Application.Features.Auth.Commands.ResetPassword;

public record ResetPasswordCommand(string Token, string NewPassword, string ConfirmPassword) : IRequest<ApiResponse<string>>;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, ApiResponse<string>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ResetPasswordCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<string>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var resetToken = await _unitOfWork.PasswordResetTokens.FirstOrDefaultAsync(
            t => t.Token == request.Token && !t.IsDeleted,
            cancellationToken);

        if (resetToken == null || !resetToken.IsValid)
            return ApiResponse<string>.Failure("Invalid or expired password reset token.", 400);

        var user = await _unitOfWork.Users.GetByIdAsync(resetToken.UserId, cancellationToken);
        if (user == null || user.IsDeleted)
            return ApiResponse<string>.Failure("User not found.", 404);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);

        resetToken.IsUsed = true;
        resetToken.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.PasswordResetTokens.Update(resetToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<string>.Success("Password has been reset successfully. You can now log in.");
    }
}

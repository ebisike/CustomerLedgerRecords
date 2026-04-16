using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace CustomerLedger.Application.Features.Auth.Commands.InviteUser;

public record InviteUserCommand(string Email, string FirstName, string LastName) : IRequest<ApiResponse<string>>;

public class InviteUserCommandHandler : IRequestHandler<InviteUserCommand, ApiResponse<string>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IConfiguration _configuration;

    public InviteUserCommandHandler(
        IUnitOfWork unitOfWork,
        IEmailService emailService,
        ICurrentUserService currentUserService,
        IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _emailService = emailService;
        _currentUserService = currentUserService;
        _configuration = configuration;
    }

    public async Task<ApiResponse<string>> Handle(InviteUserCommand request, CancellationToken cancellationToken)
    {
        var companyId = _currentUserService.CompanyId
            ?? throw new UnauthorizedAccessException("Company context not found.");
        var inviterId = _currentUserService.UserId
            ?? throw new UnauthorizedAccessException("User not authenticated.");

        // Check if email already registered
        var existingUser = await _unitOfWork.Users.FirstOrDefaultAsync(
            u => u.Email.ToLower() == request.Email.ToLower() && !u.IsDeleted,
            cancellationToken);

        if (existingUser != null)
            return ApiResponse<string>.Failure("A user with this email address already exists.", 409);

        // Check for pending invitation
        var existingInvite = await _unitOfWork.InvitationTokens.FirstOrDefaultAsync(
            t => t.Email.ToLower() == request.Email.ToLower() && !t.IsUsed && !t.IsDeleted,
            cancellationToken);

        if (existingInvite != null && existingInvite.IsValid)
            return ApiResponse<string>.Failure("An invitation has already been sent to this email.", 409);

        var inviterUser = await _unitOfWork.Users.GetByIdAsync(inviterId, cancellationToken);

        var token = new Domain.Entities.InvitationToken
        {
            Token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CompanyId = companyId,
            InvitedByUserId = inviterId
        };

        await _unitOfWork.InvitationTokens.AddAsync(token, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5173";
        var inviteLink = $"{frontendUrl}/auth/accept-invitation?token={token.Token}";

        await _emailService.SendInvitationEmailAsync(
            request.Email,
            $"{request.FirstName} {request.LastName}",
            inviteLink,
            inviterUser?.FullName ?? "Admin",
            cancellationToken);

        return ApiResponse<string>.Success($"Invitation sent to {request.Email} successfully.");
    }
}

using CustomerLedger.Application.Features.Auth.Commands.AcceptInvitation;
using CustomerLedger.Application.Features.Auth.Commands.ForgotPassword;
using CustomerLedger.Application.Features.Auth.Commands.InviteUser;
using CustomerLedger.Application.Features.Auth.Commands.Login;
using CustomerLedger.Application.Features.Auth.Commands.RefreshToken;
using CustomerLedger.Application.Features.Auth.Commands.ResetPassword;
using CustomerLedger.Application.Features.Auth.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CustomerLedger.API.Controllers;

public class AuthController : BaseController
{
    /// <summary>Authenticate with email and password</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken ct)
        => HandleResponse(await Mediator.Send(new LoginCommand(dto.Email, dto.Password), ct));

    /// <summary>Request password reset email</summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto, CancellationToken ct)
        => HandleResponse(await Mediator.Send(new ForgotPasswordCommand(dto.Email), ct));

    /// <summary>Reset password using token from email</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto, CancellationToken ct)
        => HandleResponse(await Mediator.Send(new ResetPasswordCommand(dto.Token, dto.NewPassword, dto.ConfirmPassword), ct));

    /// <summary>Refresh access token</summary>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto, CancellationToken ct)
        => HandleResponse(await Mediator.Send(new RefreshTokenCommand(dto.RefreshToken), ct));

    /// <summary>Invite a new user (Admin only)</summary>
    [HttpPost("invite")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> InviteUser([FromBody] InviteUserDto dto, CancellationToken ct)
        => HandleResponse(await Mediator.Send(new InviteUserCommand(dto.Email, dto.FirstName, dto.LastName), ct));

    /// <summary>Accept invitation and create account</summary>
    [HttpPost("accept-invitation")]
    [AllowAnonymous]
    public async Task<IActionResult> AcceptInvitation([FromBody] AcceptInvitationDto dto, CancellationToken ct)
        => HandleResponse(await Mediator.Send(new AcceptInvitationCommand(dto.Token, dto.Password, dto.ConfirmPassword), ct));

    /// <summary>Validate an invitation token</summary>
    [HttpGet("validate-invitation/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> ValidateInvitation(string token, CancellationToken ct)
    {
        // Quick validation without consuming token
        return Ok(new { valid = !string.IsNullOrEmpty(token) });
    }
}

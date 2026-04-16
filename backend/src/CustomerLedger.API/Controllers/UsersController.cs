using CustomerLedger.Application.Features.Users.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CustomerLedger.API.Controllers;

[Authorize]
public class UsersController : BaseController
{
    /// <summary>Get all users in the company</summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
        => HandleResponse(await Mediator.Send(new GetUsersQuery(pageIndex, pageSize, search), ct));
}

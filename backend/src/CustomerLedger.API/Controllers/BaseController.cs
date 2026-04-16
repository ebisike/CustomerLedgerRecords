using CustomerLedger.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CustomerLedger.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class BaseController : ControllerBase
{
    private IMediator? _mediator;
    protected IMediator Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<IMediator>();

    protected IActionResult HandleResponse<T>(ApiResponse<T> response)
    {
        return StatusCode(response.StatusCode, response);
    }
}

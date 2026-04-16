using CustomerLedger.Application.Features.Customers.Commands.CreateCustomer;
using CustomerLedger.Application.Features.Customers.Commands.UpdateCustomer;
using CustomerLedger.Application.Features.Customers.DTOs;
using CustomerLedger.Application.Features.Customers.Queries.GetCustomerById;
using CustomerLedger.Application.Features.Customers.Queries.GetCustomers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CustomerLedger.API.Controllers;

[Authorize]
public class CustomersController : BaseController
{
    /// <summary>Get all customers with filtering and pagination</summary>
    [HttpGet]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? phone = null,
        [FromQuery] string? email = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        CancellationToken ct = default)
        => HandleResponse(await Mediator.Send(
            new GetCustomersQuery(pageIndex, pageSize, search, phone, email, sortBy, sortDescending), ct));

    /// <summary>Get customer by ID</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCustomer(Guid id, CancellationToken ct)
        => HandleResponse(await Mediator.Send(new GetCustomerByIdQuery(id), ct));

    /// <summary>Create a new customer</summary>
    [HttpPost]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerDto dto, CancellationToken ct)
        => HandleResponse(await Mediator.Send(new CreateCustomerCommand(dto.Name, dto.Address, dto.Phone, dto.Email), ct));

    /// <summary>Update an existing customer</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCustomer(Guid id, [FromBody] UpdateCustomerDto dto, CancellationToken ct)
        => HandleResponse(await Mediator.Send(new UpdateCustomerCommand(id, dto.Name, dto.Address, dto.Phone, dto.Email), ct));
}

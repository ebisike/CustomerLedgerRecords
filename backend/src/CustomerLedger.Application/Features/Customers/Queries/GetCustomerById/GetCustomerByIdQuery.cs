using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Application.Features.Customers.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CustomerLedger.Application.Features.Customers.Queries.GetCustomerById;

public record GetCustomerByIdQuery(Guid Id) : IRequest<ApiResponse<CustomerDto>>;

public class GetCustomerByIdQueryHandler : IRequestHandler<GetCustomerByIdQuery, ApiResponse<CustomerDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetCustomerByIdQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<CustomerDto>> Handle(GetCustomerByIdQuery request, CancellationToken cancellationToken)
    {
        var companyId = _currentUserService.CompanyId
            ?? throw new UnauthorizedAccessException("Company context not found.");

        var customer = await _unitOfWork.Customers.Query()
            .Include(c => c.LedgerEntries.Where(e => !e.IsDeleted))
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.CompanyId == companyId && !c.IsDeleted, cancellationToken);

        if (customer == null)
            return ApiResponse<CustomerDto>.Failure("Customer not found.", 404);

        var currentBalance = customer.LedgerEntries
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .FirstOrDefault()?.Balance ?? 0;

        var dto = new CustomerDto(customer.Id, customer.Name, customer.Address, customer.Phone, customer.Email, customer.CreatedAt, currentBalance);
        return ApiResponse<CustomerDto>.Success(dto);
    }
}

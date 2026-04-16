using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Application.Features.Customers.DTOs;
using MediatR;

namespace CustomerLedger.Application.Features.Customers.Commands.UpdateCustomer;

public record UpdateCustomerCommand(Guid Id, string Name, string Address, string Phone, string? Email) : IRequest<ApiResponse<CustomerDto>>;

public class UpdateCustomerCommandHandler : IRequestHandler<UpdateCustomerCommand, ApiResponse<CustomerDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public UpdateCustomerCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<CustomerDto>> Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
    {
        var companyId = _currentUserService.CompanyId
            ?? throw new UnauthorizedAccessException("Company context not found.");

        var customer = await _unitOfWork.Customers.FirstOrDefaultAsync(
            c => c.Id == request.Id && c.CompanyId == companyId && !c.IsDeleted,
            cancellationToken);

        if (customer == null)
            return ApiResponse<CustomerDto>.Failure("Customer not found.", 404);

        var phoneConflict = await _unitOfWork.Customers.FirstOrDefaultAsync(
            c => c.Phone == request.Phone && c.CompanyId == companyId && c.Id != request.Id && !c.IsDeleted,
            cancellationToken);

        if (phoneConflict != null)
            return ApiResponse<CustomerDto>.Failure("A customer with this phone number already exists.", 409);

        customer.Name = request.Name;
        customer.Address = request.Address;
        customer.Phone = request.Phone;
        customer.Email = request.Email;
        customer.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Customers.Update(customer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var currentBalance = (await _unitOfWork.LedgerEntries.FindAsync(
            e => e.CustomerId == customer.Id && !e.IsDeleted, cancellationToken))
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .FirstOrDefault()?.Balance ?? 0;

        var dto = new CustomerDto(customer.Id, customer.Name, customer.Address, customer.Phone, customer.Email, customer.CreatedAt, currentBalance);
        return ApiResponse<CustomerDto>.Success(dto, "Customer updated successfully.");
    }
}

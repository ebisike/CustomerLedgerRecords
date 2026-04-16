using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Application.Features.Customers.DTOs;
using CustomerLedger.Domain.Entities;
using MediatR;

namespace CustomerLedger.Application.Features.Customers.Commands.CreateCustomer;

public record CreateCustomerCommand(string Name, string Address, string Phone, string? Email) : IRequest<ApiResponse<CustomerDto>>;

public class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, ApiResponse<CustomerDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public CreateCustomerCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<CustomerDto>> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        var companyId = _currentUserService.CompanyId
            ?? throw new UnauthorizedAccessException("Company context not found.");

        var existing = await _unitOfWork.Customers.FirstOrDefaultAsync(
            c => c.Phone == request.Phone && c.CompanyId == companyId && !c.IsDeleted,
            cancellationToken);

        if (existing != null)
            return ApiResponse<CustomerDto>.Failure("A customer with this phone number already exists.", 409);

        var customer = new Customer
        {
            Name = request.Name,
            Address = request.Address,
            Phone = request.Phone,
            Email = request.Email,
            CompanyId = companyId
        };

        await _unitOfWork.Customers.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new CustomerDto(customer.Id, customer.Name, customer.Address, customer.Phone, customer.Email, customer.CreatedAt, 0);
        return ApiResponse<CustomerDto>.Success(dto, "Customer created successfully.", 201);
    }
}

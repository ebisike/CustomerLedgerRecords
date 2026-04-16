namespace CustomerLedger.Application.Features.Customers.DTOs;

public record CustomerDto(
    Guid Id,
    string Name,
    string Address,
    string Phone,
    string? Email,
    DateTime CreatedAt,
    decimal CurrentBalance
);

public record CreateCustomerDto(string Name, string Address, string Phone, string? Email);

public record UpdateCustomerDto(string Name, string Address, string Phone, string? Email);

public record CustomerListRequestDto(
    int PageIndex = 1,
    int PageSize = 10,
    string? Search = null,
    string? Phone = null,
    string? Email = null,
    string? SortBy = null,
    bool SortDescending = false
);

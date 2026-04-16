using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Application.Features.Customers.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CustomerLedger.Application.Features.Customers.Queries.GetCustomers;

public record GetCustomersQuery(
    int PageIndex,
    int PageSize,
    string? Search,
    string? Phone,
    string? Email,
    string? SortBy,
    bool SortDescending
) : IRequest<ApiResponse<List<CustomerDto>>>;

public class GetCustomersQueryHandler : IRequestHandler<GetCustomersQuery, ApiResponse<List<CustomerDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetCustomersQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<List<CustomerDto>>> Handle(GetCustomersQuery request, CancellationToken cancellationToken)
    {
        var companyId = _currentUserService.CompanyId
            ?? throw new UnauthorizedAccessException("Company context not found.");

        var query = _unitOfWork.Customers.Query()
            .Where(c => c.CompanyId == companyId && !c.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(s) ||
                c.Phone.ToLower().Contains(s) ||
                (c.Email != null && c.Email.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(request.Phone))
            query = query.Where(c => c.Phone.Contains(request.Phone));

        if (!string.IsNullOrWhiteSpace(request.Email))
            query = query.Where(c => c.Email != null && c.Email.ToLower().Contains(request.Email.ToLower()));

        query = request.SortBy?.ToLower() switch
        {
            "name" => request.SortDescending ? query.OrderByDescending(c => c.Name) : query.OrderBy(c => c.Name),
            "phone" => request.SortDescending ? query.OrderByDescending(c => c.Phone) : query.OrderBy(c => c.Phone),
            "email" => request.SortDescending ? query.OrderByDescending(c => c.Email) : query.OrderBy(c => c.Email),
            "createdat" => request.SortDescending ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt),
            _ => query.OrderByDescending(c => c.CreatedAt)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var pageIndex = Math.Max(1, request.PageIndex);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var customers = await query
            .Include(c => c.LedgerEntries.Where(e => !e.IsDeleted))
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = customers.Select(c =>
        {
            var currentBalance = c.LedgerEntries
                .OrderByDescending(e => e.Date)
                .ThenByDescending(e => e.CreatedAt)
                .FirstOrDefault()?.Balance ?? 0;

            return new CustomerDto(c.Id, c.Name, c.Address, c.Phone, c.Email, c.CreatedAt, currentBalance);
        }).ToList();

        var metaData = MetaData.Create(pageIndex, pageSize, totalCount);
        return ApiResponse<List<CustomerDto>>.Success(dtos, string.Empty, 200, metaData);
    }
}

using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Common.Models;
using CustomerLedger.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CustomerLedger.Application.Features.Users.Queries;

public record GetUsersQuery(int PageIndex = 1, int PageSize = 20, string? Search = null) : IRequest<ApiResponse<List<UserDto>>>;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, ApiResponse<List<UserDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetUsersQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<List<UserDto>>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var companyId = _currentUserService.CompanyId
            ?? throw new UnauthorizedAccessException("Company context not found.");

        var query = _unitOfWork.Users.Query()
            .Where(u => u.CompanyId == companyId && !u.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.ToLower();
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(s) ||
                u.LastName.ToLower().Contains(s) ||
                u.Email.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageIndex = Math.Max(1, request.PageIndex);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var users = await query
            .OrderBy(u => u.FirstName)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = users.Select(u => new UserDto(u.Id, u.FirstName, u.LastName, u.Email, u.FullName, u.Role.ToString(), u.CompanyId)).ToList();
        var metaData = MetaData.Create(pageIndex, pageSize, totalCount);

        return ApiResponse<List<UserDto>>.Success(dtos, string.Empty, 200, metaData);
    }
}

using AutoMapper;
using CustomerLedger.Application.Features.Auth.DTOs;
using CustomerLedger.Application.Features.Customers.DTOs;
using CustomerLedger.Application.Features.Ledger.DTOs;
using CustomerLedger.Domain.Entities;

namespace CustomerLedger.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>()
            .ConstructUsing(u => new UserDto(u.Id, u.FirstName, u.LastName, u.Email, u.FullName, u.Role.ToString(), u.CompanyId));

        CreateMap<Customer, CustomerDto>()
            .ConstructUsing((c, ctx) => new CustomerDto(c.Id, c.Name, c.Address, c.Phone, c.Email, c.CreatedAt, 0));

        CreateMap<LedgerEntry, LedgerEntryDto>()
            .ConstructUsing((e, ctx) => new LedgerEntryDto(
                e.Id, e.Date, e.Description, e.InvoiceReceiptNumber,
                e.UpdatedBy != null ? e.UpdatedBy.FullName : "Unknown",
                e.UpdatedById, e.Debit, e.Credit, e.Balance, e.CreatedAt));
    }
}

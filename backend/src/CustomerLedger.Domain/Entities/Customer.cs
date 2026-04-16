namespace CustomerLedger.Domain.Entities;

public class Customer : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }

    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public ICollection<LedgerEntry> LedgerEntries { get; set; } = new List<LedgerEntry>();
}

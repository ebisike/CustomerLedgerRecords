namespace CustomerLedger.Domain.Entities;

public class LedgerEntry : BaseEntity
{
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public string InvoiceReceiptNumber { get; set; } = string.Empty;
    public decimal Debit { get; set; } = 0;
    public decimal Credit { get; set; } = 0;
    public decimal Balance { get; set; } = 0;

    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public Guid UpdatedById { get; set; }
    public User UpdatedBy { get; set; } = null!;
}

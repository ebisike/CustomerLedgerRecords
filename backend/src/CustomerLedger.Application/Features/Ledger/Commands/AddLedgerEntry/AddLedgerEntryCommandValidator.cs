using FluentValidation;

namespace CustomerLedger.Application.Features.Ledger.Commands.AddLedgerEntry;

public class AddLedgerEntryCommandValidator : AbstractValidator<AddLedgerEntryCommand>
{
    public AddLedgerEntryCommandValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty().WithMessage("Customer ID is required.");

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Transaction date is required.")
            .LessThanOrEqualTo(DateTime.UtcNow.AddDays(1)).WithMessage("Transaction date cannot be in the future.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description/Narration is required.")
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters.");

        RuleFor(x => x.InvoiceReceiptNumber)
            .NotEmpty().WithMessage("Invoice/Receipt number is required.")
            .MaximumLength(100).WithMessage("Invoice/Receipt number must not exceed 100 characters.");

        RuleFor(x => x.PageNo)
            .MaximumLength(20).WithMessage("Page number must not exceed 20 characters.")
            .When(x => x.PageNo != null);

        RuleFor(x => x.Debit)
            .GreaterThanOrEqualTo(0).WithMessage("Debit amount cannot be negative.");

        RuleFor(x => x.Credit)
            .GreaterThanOrEqualTo(0).WithMessage("Credit amount cannot be negative.");

        RuleFor(x => x)
            .Must(x => x.Debit > 0 || x.Credit > 0)
            .WithMessage("Either debit or credit amount must be greater than zero.");
    }
}

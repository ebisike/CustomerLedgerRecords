using CustomerLedger.Application.Common.Interfaces;
using CustomerLedger.Application.Features.Ledger.DTOs;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Drawing;
using Color = System.Drawing.Color;

namespace CustomerLedger.Infrastructure.Services;

public class ExportService : IExportService
{
    public ExportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task<byte[]> ExportLedgerToPdfAsync(LedgerExportDto data, CancellationToken cancellationToken = default)
    {
        return await Task.Run(() =>
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(1.5f, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial"));

                    page.Header().Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Food and Drinks Warehouse Intl Limited")
                                    .Bold().FontSize(14).FontColor("#1e40af");
                                c.Item().Text("Customer Credit Ledger Statement")
                                    .FontSize(11).FontColor("#475569");
                            });
                            row.ConstantItem(120).AlignRight().Column(c =>
                            {
                                c.Item().Text($"Generated: {DateTime.UtcNow:dd MMM yyyy}").FontSize(8).FontColor("#94a3b8");
                            });
                        });

                        col.Item().PaddingTop(5).BorderBottom(1).BorderColor("#e2e8f0");

                        col.Item().PaddingTop(8).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text($"Customer: {data.CustomerName}").Bold().FontSize(10);
                                c.Item().Text($"Phone: {data.CustomerPhone}").FontSize(9).FontColor("#475569");
                                if (!string.IsNullOrEmpty(data.CustomerEmail))
                                    c.Item().Text($"Email: {data.CustomerEmail}").FontSize(9).FontColor("#475569");
                                c.Item().Text($"Address: {data.CustomerAddress}").FontSize(9).FontColor("#475569");
                            });
                            row.ConstantItem(200).Column(c =>
                            {
                                if (data.StartDate.HasValue || data.EndDate.HasValue)
                                {
                                    c.Item().Text("Period:").Bold().FontSize(9);
                                    c.Item().Text($"{data.StartDate?.ToString("dd MMM yyyy") ?? "Beginning"} - {data.EndDate?.ToString("dd MMM yyyy") ?? "Present"}")
                                        .FontSize(9).FontColor("#475569");
                                }
                            });
                        });

                        col.Item().PaddingTop(8);
                    });

                    page.Content().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(70);   // Date
                            cols.RelativeColumn(3);    // Description
                            cols.RelativeColumn(1.5f); // Invoice
                            cols.RelativeColumn(1.5f); // Updated By
                            cols.ConstantColumn(75);   // Debit
                            cols.ConstantColumn(75);   // Credit
                            cols.ConstantColumn(80);   // Balance
                        });

                        // Header
                        static IContainer HeaderCell(IContainer c) => c
                            .Background("#1e40af").Padding(5).AlignMiddle();

                        table.Header(header =>
                        {
                            header.Cell().Element(HeaderCell).Text("Date").Bold().FontColor(Colors.White).FontSize(8);
                            header.Cell().Element(HeaderCell).Text("Description/Narration").Bold().FontColor(Colors.White).FontSize(8);
                            header.Cell().Element(HeaderCell).Text("Invoice/Receipt #").Bold().FontColor(Colors.White).FontSize(8);
                            header.Cell().Element(HeaderCell).Text("Updated By").Bold().FontColor(Colors.White).FontSize(8);
                            header.Cell().Element(HeaderCell).AlignRight().Text("Debit (₦)").Bold().FontColor(Colors.White).FontSize(8);
                            header.Cell().Element(HeaderCell).AlignRight().Text("Credit (₦)").Bold().FontColor(Colors.White).FontSize(8);
                            header.Cell().Element(HeaderCell).AlignRight().Text("Balance (₦)").Bold().FontColor(Colors.White).FontSize(8);
                        });

                        // Rows
                        var rowNum = 0;
                        foreach (var entry in data.Entries)
                        {
                            var bgColor = rowNum % 2 == 0 ? "#ffffff" : "#f8fafc";
                            rowNum++;

                            static IContainer DataCell(IContainer c, string bg) =>
                                c.Background(bg).BorderBottom(0.5f).BorderColor("#e2e8f0").Padding(4).AlignMiddle();

                            table.Cell().Element(c => DataCell(c, bgColor))
                                .Text(entry.Date.ToString("dd/MM/yyyy")).FontSize(8);
                            table.Cell().Element(c => DataCell(c, bgColor))
                                .Text(entry.Description).FontSize(8);
                            table.Cell().Element(c => DataCell(c, bgColor))
                                .Text(entry.InvoiceReceiptNumber).FontSize(8);
                            table.Cell().Element(c => DataCell(c, bgColor))
                                .Text(entry.UpdatedByName).FontSize(8);
                            table.Cell().Element(c => DataCell(c, bgColor)).AlignRight()
                                .Text(entry.Debit > 0 ? entry.Debit.ToString("N2") : "-").FontSize(8)
                                .FontColor(entry.Debit > 0 ? "#dc2626" : "#94a3b8");
                            table.Cell().Element(c => DataCell(c, bgColor)).AlignRight()
                                .Text(entry.Credit > 0 ? entry.Credit.ToString("N2") : "-").FontSize(8)
                                .FontColor(entry.Credit > 0 ? "#16a34a" : "#94a3b8");
                            table.Cell().Element(c => DataCell(c, bgColor)).AlignRight()
                                .Text(entry.Balance.ToString("N2")).Bold().FontSize(8)
                                .FontColor(entry.Balance >= 0 ? "#1e40af" : "#dc2626");
                        }
                    });

                    page.Footer().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().PaddingTop(8).BorderTop(1).BorderColor("#e2e8f0").Row(r =>
                            {
                                r.RelativeItem().Text($"Total Debits: {data.TotalDebits:N2}").FontSize(9).Bold().FontColor("#dc2626");
                                r.RelativeItem().AlignCenter().Text($"Total Credits: {data.TotalCredits:N2}").FontSize(9).Bold().FontColor("#16a34a");
                                r.RelativeItem().AlignRight().Text($"Closing Balance: {data.ClosingBalance:N2}").FontSize(9).Bold().FontColor("#1e40af");
                            });
                        });
                    });
                });
            });

            return document.GeneratePdf();
        }, cancellationToken);
    }

    public async Task<byte[]> ExportLedgerToExcelAsync(LedgerExportDto data, CancellationToken cancellationToken = default)
    {
        return await Task.Run(() =>
        {
            using var package = new ExcelPackage();
            var ws = package.Workbook.Worksheets.Add("Ledger");

            // Title
            ws.Cells["A1"].Value = "Food and Drinks Warehouse Intl Limited";
            ws.Cells["A1:G1"].Merge = true;
            ws.Cells["A1"].Style.Font.Bold = true;
            ws.Cells["A1"].Style.Font.Size = 14;
            ws.Cells["A1"].Style.Font.Color.SetColor(ColorTranslator.FromHtml("#1e40af"));

            ws.Cells["A2"].Value = "Customer Credit Ledger Statement";
            ws.Cells["A2:G2"].Merge = true;
            ws.Cells["A2"].Style.Font.Size = 11;

            ws.Cells["A4"].Value = "Customer:";
            ws.Cells["B4"].Value = data.CustomerName;
            ws.Cells["A5"].Value = "Phone:";
            ws.Cells["B5"].Value = data.CustomerPhone;
            ws.Cells["A6"].Value = "Email:";
            ws.Cells["B6"].Value = data.CustomerEmail ?? "N/A";
            ws.Cells["A7"].Value = "Address:";
            ws.Cells["B7"].Value = data.CustomerAddress;
            ws.Cells["A8"].Value = "Generated:";
            ws.Cells["B8"].Value = DateTime.UtcNow.ToString("dd MMM yyyy HH:mm");

            if (data.StartDate.HasValue || data.EndDate.HasValue)
            {
                ws.Cells["A9"].Value = "Period:";
                ws.Cells["B9"].Value = $"{data.StartDate?.ToString("dd MMM yyyy") ?? "Beginning"} - {data.EndDate?.ToString("dd MMM yyyy") ?? "Present"}";
            }

            // Headers row 11
            var headerRow = 11;
            var headers = new[] { "Date", "Description/Narration", "Invoice/Receipt #", "Updated By", "Debit", "Credit", "Balance" };
            for (var i = 0; i < headers.Length; i++)
            {
                var cell = ws.Cells[headerRow, i + 1];
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Font.Color.SetColor(Color.White);
                cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                cell.Style.Fill.BackgroundColor.SetColor(ColorTranslator.FromHtml("#1e40af"));
                cell.Style.Border.BorderAround(ExcelBorderStyle.Thin, Color.White);
            }

            // Data rows
            var row = headerRow + 1;
            foreach (var entry in data.Entries)
            {
                ws.Cells[row, 1].Value = entry.Date.ToString("dd/MM/yyyy");
                ws.Cells[row, 2].Value = entry.Description;
                ws.Cells[row, 3].Value = entry.InvoiceReceiptNumber;
                ws.Cells[row, 4].Value = entry.UpdatedByName;
                ws.Cells[row, 5].Value = entry.Debit;
                ws.Cells[row, 6].Value = entry.Credit;
                ws.Cells[row, 7].Value = entry.Balance;

                ws.Cells[row, 5].Style.Numberformat.Format = "#,##0.00";
                ws.Cells[row, 6].Style.Numberformat.Format = "#,##0.00";
                ws.Cells[row, 7].Style.Numberformat.Format = "#,##0.00";

                if (row % 2 == 0)
                {
                    ws.Cells[row, 1, row, 7].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    ws.Cells[row, 1, row, 7].Style.Fill.BackgroundColor.SetColor(ColorTranslator.FromHtml("#f8fafc"));
                }

                row++;
            }

            // Totals row
            row++;
            ws.Cells[row, 4].Value = "TOTALS:";
            ws.Cells[row, 4].Style.Font.Bold = true;
            ws.Cells[row, 5].Value = data.TotalDebits;
            ws.Cells[row, 6].Value = data.TotalCredits;
            ws.Cells[row, 7].Value = data.ClosingBalance;
            ws.Cells[row, 5, row, 7].Style.Font.Bold = true;
            ws.Cells[row, 5].Style.Numberformat.Format = "#,##0.00";
            ws.Cells[row, 6].Style.Numberformat.Format = "#,##0.00";
            ws.Cells[row, 7].Style.Numberformat.Format = "#,##0.00";
            ws.Cells[row, 5].Style.Font.Color.SetColor(ColorTranslator.FromHtml("#dc2626"));
            ws.Cells[row, 6].Style.Font.Color.SetColor(ColorTranslator.FromHtml("#16a34a"));
            ws.Cells[row, 7].Style.Font.Color.SetColor(ColorTranslator.FromHtml("#1e40af"));

            // Auto-fit columns
            ws.Cells[ws.Dimension.Address].AutoFitColumns();
            ws.Column(2).Width = Math.Max(ws.Column(2).Width, 35);

            return package.GetAsByteArray();
        }, cancellationToken);
    }
}

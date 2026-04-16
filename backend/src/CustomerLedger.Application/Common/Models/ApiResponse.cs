namespace CustomerLedger.Application.Common.Models;

public class ApiResponse<T>
{
    public T? Results { get; set; }
    public bool Status { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public string SuccessMessage { get; set; } = string.Empty;
    public MetaData? MetaData { get; set; }
    public int StatusCode { get; set; }

    public static ApiResponse<T> Success(T results, string message = "", int statusCode = 200, MetaData? metaData = null)
        => new()
        {
            Results = results,
            Status = true,
            SuccessMessage = message,
            StatusCode = statusCode,
            MetaData = metaData
        };

    public static ApiResponse<T> Failure(string errorMessage, int statusCode = 400)
        => new()
        {
            Status = false,
            ErrorMessage = errorMessage,
            StatusCode = statusCode
        };
}

public class MetaData
{
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public string Showing { get; set; } = string.Empty;

    public static MetaData Create(int pageIndex, int pageSize, int totalCount)
    {
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var from = totalCount == 0 ? 0 : (pageIndex - 1) * pageSize + 1;
        var to = Math.Min(pageIndex * pageSize, totalCount);
        return new MetaData
        {
            PageIndex = pageIndex,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            Showing = totalCount == 0 ? "No records found" : $"Showing {from} to {to} of {totalCount} records"
        };
    }
}

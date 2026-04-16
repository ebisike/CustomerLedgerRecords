using CustomerLedger.Domain.Entities;
using CustomerLedger.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CustomerLedger.Infrastructure.Data.Seed;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext context, ILogger logger)
    {
        try
        {
            await context.Database.MigrateAsync();

            if (!await context.Companies.AnyAsync())
            {
                var company = new Company
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    Name = "Food and Drinks Warehouse Intl Limited",
                    Address = "123 Warehouse Road, Business District",
                    Phone = "+1234567890",
                    Email = "info@fdwarehouse.com"
                };

                await context.Companies.AddAsync(company);
                await context.SaveChangesAsync();
                logger.LogInformation("Company seeded successfully.");
            }

            if (!await context.Users.AnyAsync())
            {
                var adminUser = new User
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    FirstName = "Admin",
                    LastName = "User",
                    Email = "admin@fdwarehouse.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234"),
                    Role = UserRole.Admin,
                    IsActive = true,
                    CompanyId = Guid.Parse("11111111-1111-1111-1111-111111111111")
                };

                await context.Users.AddAsync(adminUser);
                await context.SaveChangesAsync();
                logger.LogInformation("Admin user seeded. Email: admin@fdwarehouse.com | Password: Admin@1234");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }
}

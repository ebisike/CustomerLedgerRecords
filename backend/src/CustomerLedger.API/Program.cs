using System.Text;
using CustomerLedger.Application;
using CustomerLedger.Infrastructure;
using CustomerLedger.Infrastructure.Data;
using CustomerLedger.Infrastructure.Data.Seed;
using CustomerLedger.API.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();

// Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Customer Ledger API",
        Version = "v1",
        Description = "Food and Drinks Warehouse Intl Limited - Customer Credit Ledger API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:SecretKey"]
    ?? throw new InvalidOperationException("JWT Secret Key is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
            //.AllowCredentials();
    });
});

// Application + Infrastructure DI
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await DatabaseSeeder.SeedAsync(context, logger);
}

// Middleware pipeline
app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Customer Ledger API v1");
    c.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();
app.UseSerilogRequestLogging();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Root landing page
app.MapGet("/", () => Results.Content("""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Customer Ledger API</title>
        <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 24px;
            }
            .card {
                background: #00bcd4;
                border-radius: 4px;
                padding: 32px;
                width: 100%;
                max-width: 780px;
            }
            .card h1 {
                font-size: 2rem;
                font-weight: 700;
                color: #fff;
                margin-bottom: 20px;
            }
            .status-box {
                background: #fff;
                border-radius: 3px;
                padding: 18px 20px;
                font-size: 1rem;
                font-weight: 600;
                color: #111;
                letter-spacing: 0.02em;
                margin-bottom: 18px;
            }
            .links {
                display: flex;
                flex-wrap: wrap;
                gap: 4px 0;
            }
            .links a {
                color: #003d45;
                font-size: 0.9rem;
                text-decoration: underline;
                margin-right: 12px;
            }
            .links a:hover { color: #001f24; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Customer Ledger API</h1>
            <div class="status-box">API PUBLISHED SUCCESSFULLY</div>
            <div class="links">
                <a href="/swagger">click here to view swagger documentation &#8594;</a>
                <a href="/swagger">view API documentation &#8594;</a>
            </div>
        </div>
    </body>
    </html>
    """, "text/html")).AllowAnonymous();

app.Run();

using FitvaApi.Auth;
using FitvaApi.Infrastructure;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Npgsql;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Logging: console + one file per day (kept 14 days). Request bodies are never logged, so
// passwords and tokens don't end up in the files. Serilog:FilePath = "" turns the file off.
var logFile = builder.Configuration["Serilog:FilePath"];
builder.Services.AddSerilog(lc =>
{
    lc.ReadFrom.Configuration(builder.Configuration).WriteTo.Console();
    if (!string.IsNullOrWhiteSpace(logFile))
        lc.WriteTo.File(
            Path.Combine(builder.Environment.ContentRootPath, logFile),
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 14);
});

// Database: one pooled data source for the whole app. The connection string comes from
// user-secrets (dev) or the ConnectionStrings__Fitva environment variable (server) — never from git.
var connectionString = builder.Configuration.GetConnectionString("Fitva");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException(
        "ConnectionStrings:Fitva is not set. Dev: dotnet user-secrets set \"ConnectionStrings:Fitva\" \"...\"");
builder.Services.AddSingleton(NpgsqlDataSource.Create(connectionString));
builder.Services.AddSingleton<Db>();

// Auth: short-lived JWT access tokens + rotated refresh tokens (DB_CONTRACT.md §4).
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (System.Text.Encoding.UTF8.GetByteCount(jwt.Key) < 32)
    throw new InvalidOperationException("Jwt:Key must be at least 32 bytes. Set it in user-secrets or the Jwt__Key env var.");
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<TokenService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentUser>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = jwt.SigningKey(),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            NameClaimType = TokenService.SubjectClaim,
            RoleClaimType = TokenService.RoleClaim,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

builder.Services.AddAuthorizationBuilder()
    // Every endpoint needs a valid token unless it opts out with [AllowAnonymous].
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())
    .AddPolicy(Policies.Owner, p => p.RequireRole(Roles.Owner))
    .AddPolicy(Policies.Staff, p => p.RequireRole(Roles.Owner, Roles.FrontDesk))
    .AddPolicy(Policies.AnyStaff, p => p.RequireRole(Roles.Owner, Roles.FrontDesk, Roles.Trainer));

builder.Services.AddFitvaRateLimits(builder.Configuration.GetSection("RateLimits").Get<RateLimitOptions>() ?? new RateLimitOptions());

// Behind IIS / Nginx on the same server: trust X-Forwarded-For / -Proto from the local proxy only
// (the default KnownProxies is loopback), so the client IP and https scheme are the real ones.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto);

// The API only accepts small JSON bodies.
const long maxBodyBytes = 64 * 1024;
builder.WebHost.ConfigureKestrel(o =>
{
    o.AddServerHeader = false;
    o.Limits.MaxRequestBodySize = maxBodyBytes;
});
builder.Services.Configure<IISServerOptions>(o => o.MaxRequestBodySize = maxBodyBytes);

builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddControllers(o => o.Filters.Add<ValidationFilter>());
builder.Services.AddOpenApi(o => o.AddDocumentTransformer((doc, _, _) =>
{
    // "Authorize" button in Swagger UI: paste the accessToken from /auth/login.
    doc.Components ??= new OpenApiComponents();
    doc.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
    doc.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
    };
    doc.Security = [new OpenApiSecurityRequirement { [new OpenApiSecuritySchemeReference("Bearer", doc)] = [] }];
    return Task.CompletedTask;
}));
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<CancelledRequestHandler>();
builder.Services.AddExceptionHandler<PgExceptionHandler>();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseForwardedHeaders();

// Security headers on every response — added when the response starts, so error responses
// (whose headers the exception handler clears) get them too.
app.Use((ctx, next) =>
{
    ctx.Response.OnStarting(() =>
    {
        var headers = ctx.Response.Headers;
        headers.XContentTypeOptions = "nosniff";
        headers.XFrameOptions = "DENY";
        headers["Referrer-Policy"] = "no-referrer";
        return Task.CompletedTask;
    });
    return next(ctx);
});

// Outside the exception handler, so each request is logged once with its final status (404/409/499).
app.UseSerilogRequestLogging();
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.UseSwaggerUI(o => o.SwaggerEndpoint("/openapi/v1.json", "FITVA API"));
}
else
{
    app.UseHsts();
    // The website on the same server calls the API over loopback (FITVA_API_URL=http://127.0.0.1:…);
    // every other request is sent to HTTPS.
    app.UseWhen(ctx => !IsLoopbackHost(ctx.Request.Host.Host), branch => branch.UseHttpsRedirection());
}

static bool IsLoopbackHost(string host) =>
    host == "localhost" || (System.Net.IPAddress.TryParse(host, out var ip) && System.Net.IPAddress.IsLoopback(ip));

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

app.Run();

/// <summary>Visible to the integration tests (WebApplicationFactory&lt;Program&gt;).</summary>
public partial class Program;

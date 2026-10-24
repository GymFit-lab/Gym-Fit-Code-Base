using System.Threading.RateLimiting;
using FitvaApi.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FitvaApi.Infrastructure;

public sealed class RateLimitOptions
{
    /// <summary>Login attempts per minute per client IP (slows down password guessing).</summary>
    public int LoginPerMinute { get; init; } = 5;

    /// <summary>All requests per minute per signed-in user (or per IP when anonymous).</summary>
    public int RequestsPerMinute { get; init; } = 300;
}

public static class RateLimits
{
    /// <summary>Policy name for [EnableRateLimiting] on the login endpoint.</summary>
    public const string Login = "login";

    public static IServiceCollection AddFitvaRateLimits(this IServiceCollection services, RateLimitOptions limits) =>
        services.AddRateLimiter(o =>
        {
            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            o.OnRejected = async (ctx, ct) =>
            {
                if (ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    ctx.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                await ctx.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status429TooManyRequests,
                    Title = "Too many requests. Please wait a minute and try again.",
                }, ct);
            };

            o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    ctx.User.FindFirst(TokenService.SubjectClaim)?.Value ?? "ip:" + ClientIp(ctx),
                    _ => Window(limits.RequestsPerMinute)));

            o.AddPolicy(Login, ctx => RateLimitPartition.GetFixedWindowLimiter(ClientIp(ctx), _ => Window(limits.LoginPerMinute)));
        });

    static FixedWindowRateLimiterOptions Window(int permits) => new()
    {
        PermitLimit = permits,
        Window = TimeSpan.FromMinutes(1),
        QueueLimit = 0,
    };

    // Behind IIS / Nginx this is the real client IP (UseForwardedHeaders runs first).
    static string ClientIp(HttpContext ctx) => ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}

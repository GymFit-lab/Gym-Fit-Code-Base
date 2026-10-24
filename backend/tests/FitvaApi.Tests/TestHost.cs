using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace FitvaApi.Tests;

/// <summary>
/// Runs the API in memory against the real local fitva_db (connection string and JWT key come from
/// the API project's user-secrets) with the demo gym loaded (database/04_seed/01_demo_gym.sql).
/// Rate limits are raised so the suite's many logins aren't throttled; RateLimitTests uses the real ones.
/// </summary>
public class FitvaFactory : WebApplicationFactory<Program>
{
    protected virtual bool RealRateLimits => false;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("Serilog:FilePath", "");
        if (!RealRateLimits)
        {
            builder.UseSetting("RateLimits:LoginPerMinute", "10000");
            builder.UseSetting("RateLimits:RequestsPerMinute", "100000");
        }
    }

    public async Task<HttpClient> ClientAs(DemoUser user)
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/auth/login", new { email = user.Email, password = user.Password });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body.GetProperty("accessToken").GetString());
        return client;
    }
}

public sealed class RealLimitsFactory : FitvaFactory
{
    protected override bool RealRateLimits => true;
}

/// <summary>Logins from the demo seed (DB_CONTRACT.md §5).</summary>
public sealed record DemoUser(string Email, string Password)
{
    public static readonly DemoUser Owner = new("owner@fitvademo.in", "Owner@123");
    public static readonly DemoUser FrontDesk = new("frontdesk@fitvademo.in", "Desk@123");
    public static readonly DemoUser Trainer = new("trainer@fitvademo.in", "Trainer@123");
}

public static class Json
{
    public static async Task<JsonElement> Read(this HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>();

    public static string Str(this JsonElement e, string name) => e.GetProperty(name).GetString()!;

    public static string[] Keys(this JsonElement e) => e.EnumerateObject().Select(p => p.Name).ToArray();

    /// <summary>A random valid Indian mobile number, so test clients never collide.</summary>
    public static string RandomPhone() => "9" + Random.Shared.NextInt64(100_000_000, 999_999_999);
}

using System.Net;
using System.Net.Http.Json;

namespace FitvaApi.Tests;

public sealed class AuthTests(FitvaFactory factory) : IClassFixture<FitvaFactory>
{
    [Fact]
    public async Task Health_is_anonymous_and_sends_security_headers()
    {
        var response = await factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("ok", (await response.Read()).Str("database"));
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").Single());
        Assert.False(response.Headers.Contains("Server"));
    }

    [Fact]
    public async Task Login_returns_tokens_and_user()
    {
        var response = await factory.CreateClient().PostAsJsonAsync("/auth/login", new { email = "OWNER@fitvademo.in", password = "Owner@123" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Read();
        Assert.False(string.IsNullOrEmpty(body.Str("accessToken")));
        Assert.False(string.IsNullOrEmpty(body.Str("refreshToken")));
        Assert.Equal(900, body.GetProperty("expiresIn").GetInt32());
        Assert.Equal("owner", body.GetProperty("user").Str("role"));
    }

    [Theory]
    [InlineData("owner@fitvademo.in", "wrong-password")]
    [InlineData("nobody@example.in", "Owner@123")]
    public async Task Bad_credentials_get_the_same_401(string email, string password)
    {
        var response = await factory.CreateClient().PostAsJsonAsync("/auth/login", new { email, password });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("Invalid email or password", (await response.Read()).Str("title"));
    }

    [Fact]
    public async Task Invalid_login_body_is_400_with_field_errors()
    {
        var response = await factory.CreateClient().PostAsJsonAsync("/auth/login", new { email = "not-an-email", password = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Read()).GetProperty("errors");
        Assert.True(errors.TryGetProperty("email", out _));
        Assert.True(errors.TryGetProperty("password", out _));
    }

    [Fact]
    public async Task Me_needs_a_token()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync("/auth/me")).StatusCode);

        var client = await factory.ClientAs(DemoUser.FrontDesk);
        var me = await (await client.GetAsync("/auth/me")).Read();
        Assert.Equal("front_desk", me.Str("role"));
    }

    [Fact]
    public async Task Refresh_rotates_and_logout_revokes()
    {
        var client = factory.CreateClient();
        var login = await (await client.PostAsJsonAsync("/auth/login", new { email = DemoUser.Owner.Email, password = DemoUser.Owner.Password })).Read();
        var first = login.Str("refreshToken");

        var refreshed = await client.PostAsJsonAsync("/auth/refresh", new { refreshToken = first });
        Assert.Equal(HttpStatusCode.OK, refreshed.StatusCode);
        var second = (await refreshed.Read()).Str("refreshToken");

        // The old token was revoked by the rotation.
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/auth/refresh", new { refreshToken = first })).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/auth/logout", new { refreshToken = second })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/auth/refresh", new { refreshToken = second })).StatusCode);
    }
}

public sealed class RateLimitTests(RealLimitsFactory factory) : IClassFixture<RealLimitsFactory>
{
    [Fact]
    public async Task Sixth_login_attempt_in_a_minute_is_429()
    {
        var client = factory.CreateClient();
        for (var i = 0; i < 5; i++)
        {
            var attempt = await client.PostAsJsonAsync("/auth/login", new { email = "owner@fitvademo.in", password = "guess-" + i });
            Assert.Equal(HttpStatusCode.Unauthorized, attempt.StatusCode);
        }

        var blocked = await client.PostAsJsonAsync("/auth/login", new { email = "owner@fitvademo.in", password = "guess-6" });
        Assert.Equal(HttpStatusCode.TooManyRequests, blocked.StatusCode);
        Assert.True(blocked.Headers.Contains("Retry-After"));
    }
}

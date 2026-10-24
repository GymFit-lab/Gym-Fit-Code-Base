using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace FitvaApi.Auth;

public sealed class JwtOptions
{
    public string Issuer { get; init; } = "";
    public string Audience { get; init; } = "";
    /// <summary>HMAC-SHA256 signing key, at least 32 bytes. From user-secrets / env, never git.</summary>
    public string Key { get; init; } = "";
    public int AccessTokenMinutes { get; init; } = 15;
    public int RefreshTokenDays { get; init; } = 30;

    public SymmetricSecurityKey SigningKey() => new(Encoding.UTF8.GetBytes(Key));
}

/// <summary>Issues access tokens (JWT) and refresh tokens (random, stored only as a sha256 hash).</summary>
public sealed class TokenService(IOptions<JwtOptions> options, TimeProvider clock)
{
    public const string SubjectClaim = "sub";
    public const string GymIdClaim = "gymId";
    public const string RoleClaim = "role";

    readonly JwtOptions _options = options.Value;

    public int AccessTokenSeconds => _options.AccessTokenMinutes * 60;

    public string CreateAccessToken(Guid userId, Guid gymId, string role)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            Subject = new ClaimsIdentity(
            [
                new Claim(SubjectClaim, userId.ToString()),
                new Claim(GymIdClaim, gymId.ToString()),
                new Claim(RoleClaim, role),
            ]),
            IssuedAt = now,
            NotBefore = now,
            Expires = now.AddSeconds(AccessTokenSeconds),
            SigningCredentials = new SigningCredentials(_options.SigningKey(), SecurityAlgorithms.HmacSha256),
        });
    }

    /// <summary>A new refresh token: the raw value goes to the client, the hash to the database.</summary>
    public (string Token, string Hash, DateTime ExpiresAt) CreateRefreshToken()
    {
        var token = Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(32));
        return (token, Hash(token), clock.GetUtcNow().UtcDateTime.AddDays(_options.RefreshTokenDays));
    }

    public static string Hash(string refreshToken) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));
}

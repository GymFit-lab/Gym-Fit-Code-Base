using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace FitvaApi.Tests;

/// <summary>
/// Staff logins. There is no delete, so each test login is left deactivated at the end
/// (it disappears when the demo seed is re-applied).
/// </summary>
public sealed class StaffTests(FitvaFactory factory) : IClassFixture<FitvaFactory>
{
    static string RandomEmail() => $"test.staff.{Guid.NewGuid():N}@example.in";

    async Task<HttpResponseMessage> Login(string email, string password) =>
        await factory.CreateClient().PostAsJsonAsync("/auth/login", new { email, password });

    [Fact]
    public async Task Owner_lists_staff_without_password_hashes()
    {
        var owner = await factory.ClientAs(DemoUser.Owner);
        var staff = await (await owner.GetAsync("/staff")).Read();

        Assert.Contains(staff.EnumerateArray(), s => s.Str("email") == DemoUser.Owner.Email && s.Str("role") == "owner");
        Assert.All(staff.EnumerateArray(), s => Assert.False(s.TryGetProperty("passwordHash", out _)));
        Assert.Equal(["id", "name", "email", "phone", "role", "isActive", "lastLoginAt", "createdAt"], staff[0].Keys());
    }

    [Fact]
    public async Task Only_owners_manage_staff()
    {
        var desk = await factory.ClientAs(DemoUser.FrontDesk);
        Assert.Equal(HttpStatusCode.Forbidden, (await desk.GetAsync("/staff")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await desk.PostAsJsonAsync("/staff", new { })).StatusCode);
    }

    [Fact]
    public async Task Staff_login_lifecycle()
    {
        var owner = await factory.ClientAs(DemoUser.Owner);
        var email = RandomEmail();

        var created = await owner.PostAsJsonAsync("/staff", new { name = "Test Desk", email, phone = "", role = "front_desk", password = "First#Pass1" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var id = (await created.Read()).Str("id");
        try
        {
            Assert.Equal(HttpStatusCode.OK, (await Login(email, "First#Pass1")).StatusCode);
            Assert.Equal(HttpStatusCode.Conflict, (await owner.PostAsJsonAsync("/staff", new { name = "Dup", email, role = "trainer", password = "Other#Pass1" })).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsJsonAsync("/staff", new { name = "X", email = "bad", role = "boss", password = "short" })).StatusCode);

            var updated = await (await owner.PutAsJsonAsync($"/staff/{id}", new { name = "Test Trainer", email, phone = "9876500000", role = "trainer" })).Read();
            Assert.Equal("trainer", updated.Str("role"));
            Assert.Equal("9876500000", updated.Str("phone"));

            // Owner resets the password: the old one stops working at once.
            Assert.Equal(HttpStatusCode.NoContent, (await owner.PostAsJsonAsync($"/staff/{id}/password", new { password = "Second#Pass2" })).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await Login(email, "First#Pass1")).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await Login(email, "Second#Pass2")).StatusCode);

            var off = await (await owner.PostAsync($"/staff/{id}/deactivate", null)).Read();
            Assert.False(off.GetProperty("isActive").GetBoolean());
            Assert.Equal(HttpStatusCode.Unauthorized, (await Login(email, "Second#Pass2")).StatusCode);

            await owner.PostAsync($"/staff/{id}/activate", null);
            Assert.Equal(HttpStatusCode.OK, (await Login(email, "Second#Pass2")).StatusCode);
        }
        finally
        {
            await owner.PostAsync($"/staff/{id}/deactivate", null);
        }
    }

    [Fact]
    public async Task The_last_owner_cannot_be_removed()
    {
        var owner = await factory.ClientAs(DemoUser.Owner);
        var self = (await (await owner.GetAsync("/staff")).Read()).EnumerateArray().Single(s => s.Str("email") == DemoUser.Owner.Email);
        var id = self.Str("id");

        var deactivate = await owner.PostAsync($"/staff/{id}/deactivate", null);
        Assert.Equal(HttpStatusCode.Conflict, deactivate.StatusCode);
        Assert.Equal("LAST_OWNER", (await deactivate.Read()).Str("code"));

        var demote = await owner.PutAsJsonAsync($"/staff/{id}", new { name = self.Str("name"), email = self.Str("email"), phone = self.GetProperty("phone").GetString(), role = "trainer" });
        Assert.Equal(HttpStatusCode.Conflict, demote.StatusCode);
    }

    [Fact]
    public async Task Change_own_password_signs_out_other_devices()
    {
        var owner = await factory.ClientAs(DemoUser.Owner);
        var email = RandomEmail();
        var id = (await (await owner.PostAsJsonAsync("/staff", new { name = "Test Self", email, role = "trainer", password = "Start#Pass1" })).Read()).Str("id");
        try
        {
            var other = await (await Login(email, "Start#Pass1")).Read();
            var mine = await (await Login(email, "Start#Pass1")).Read();
            var client = factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new("Bearer", mine.Str("accessToken"));

            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/auth/change-password", new { currentPassword = "wrong", newPassword = "Next#Pass22" })).StatusCode);

            var changed = await client.PostAsJsonAsync("/auth/change-password", new { currentPassword = "Start#Pass1", newPassword = "Next#Pass22" });
            Assert.Equal(HttpStatusCode.OK, changed.StatusCode);
            Assert.False(string.IsNullOrEmpty((await changed.Read()).Str("refreshToken")));

            // The other device's refresh token was revoked.
            Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().PostAsJsonAsync("/auth/refresh", new { refreshToken = other.Str("refreshToken") })).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await Login(email, "Next#Pass22")).StatusCode);
        }
        finally
        {
            await owner.PostAsync($"/staff/{id}/deactivate", null);
        }
    }

    [Fact]
    public async Task Recent_attendance_for_bulk_loading()
    {
        var trainer = await factory.ClientAs(DemoUser.Trainer);
        var response = await trainer.GetAsync("/attendance/recent?days=90");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rows = await response.Read();
        Assert.Equal(JsonValueKind.Array, rows.ValueKind);
        if (rows.GetArrayLength() > 0)
            Assert.Equal(["id", "clientId", "checkedInAt"], rows[0].Keys());
        Assert.Equal(HttpStatusCode.BadRequest, (await trainer.GetAsync("/attendance/recent?days=0")).StatusCode);
    }
}

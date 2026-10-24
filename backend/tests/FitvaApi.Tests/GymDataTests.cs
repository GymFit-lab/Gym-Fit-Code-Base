using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace FitvaApi.Tests;

/// <summary>
/// Clients, trainers, plans, memberships, attendance and payments. Write tests use a fresh client
/// that is soft-deleted at the end; its membership/payment/check-in rows stay behind (there are no
/// delete functions for them) until the demo seed is re-applied.
/// </summary>
public sealed class GymDataTests(FitvaFactory factory) : IClassFixture<FitvaFactory>
{
    [Fact]
    public async Task Client_list_counts_add_up()
    {
        var trainer = await factory.ClientAs(DemoUser.Trainer);
        var body = await (await trainer.GetAsync("/clients?pageSize=200")).Read();

        var counts = body.GetProperty("meta").GetProperty("counts");
        var total = counts.GetProperty("total").GetInt64();
        Assert.Equal(total, body.GetProperty("meta").GetProperty("total").GetInt64());
        Assert.Equal(total, new[] { "active", "due", "expired", "none" }.Sum(k => counts.GetProperty(k).GetInt64()));
        Assert.Equal(total, body.GetProperty("items").GetArrayLength());
    }

    [Theory]
    [InlineData("/clients?status=bogus")]
    [InlineData("/clients?pageSize=999")]
    [InlineData("/memberships?status=none")]
    [InlineData("/payments?method=cheque")]
    [InlineData("/attendance/summary?days=0")]
    public async Task Bad_filters_are_400(string url)
    {
        var owner = await factory.ClientAs(DemoUser.Owner);
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.GetAsync(url)).StatusCode);
    }

    [Theory]
    [InlineData("trainer", "POST", "/clients")]
    [InlineData("trainer", "POST", "/memberships")]
    [InlineData("trainer", "POST", "/attendance")]
    [InlineData("trainer", "GET", "/payments")]
    [InlineData("trainer", "GET", "/reports")]
    [InlineData("front_desk", "POST", "/plans")]
    [InlineData("front_desk", "POST", "/trainers")]
    [InlineData("front_desk", "GET", "/payments/export.csv")]
    public async Task Roles_are_enforced(string role, string method, string url)
    {
        var user = role == "trainer" ? DemoUser.Trainer : DemoUser.FrontDesk;
        var client = await factory.ClientAs(user);
        var request = new HttpRequestMessage(new HttpMethod(method), url);
        if (method == "POST")
            request.Content = JsonContent.Create(new { });

        Assert.Equal(HttpStatusCode.Forbidden, (await client.SendAsync(request)).StatusCode);
    }

    [Fact]
    public async Task Client_lifecycle()
    {
        var desk = await factory.ClientAs(DemoUser.FrontDesk);
        var owner = await factory.ClientAs(DemoUser.Owner);
        var phone = Json.RandomPhone();

        var created = await desk.PostAsJsonAsync("/clients", new { name = "Test Lifecycle", phone, email = "", gender = "male" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var client = await created.Read();
        var id = client.Str("id");
        Assert.Equal("none", client.Str("status"));

        Assert.Equal(HttpStatusCode.Conflict, (await desk.PostAsJsonAsync("/clients", new { name = "Test Dup", phone, gender = "male" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await desk.PostAsJsonAsync("/clients", new { name = "A", phone = "12345", gender = "x" })).StatusCode);

        var updated = await (await desk.PutAsJsonAsync($"/clients/{id}", new { name = "Test Lifecycle Edited", phone, email = "t@example.in", gender = "male" })).Read();
        Assert.Equal("Test Lifecycle Edited", updated.Str("name"));

        Assert.Equal(HttpStatusCode.Forbidden, (await desk.DeleteAsync($"/clients/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.DeleteAsync($"/clients/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync($"/clients/{id}")).StatusCode);
    }

    [Fact]
    public async Task Membership_check_in_and_payments()
    {
        var desk = await factory.ClientAs(DemoUser.FrontDesk);
        var owner = await factory.ClientAs(DemoUser.Owner);
        var client = await (await desk.PostAsJsonAsync("/clients", new { name = "Test Operations", phone = Json.RandomPhone(), gender = "female" })).Read();
        var clientId = client.Str("id");
        try
        {
            var plan = (await (await owner.GetAsync("/plans")).Read()).EnumerateArray().First();

            // Selling a plan creates the membership and its payment together.
            var sale = await desk.PostAsJsonAsync("/memberships", new { clientId, planId = plan.Str("id"), paymentStatus = "pending", method = "upi" });
            Assert.Equal(HttpStatusCode.Created, sale.StatusCode);
            var sold = await sale.Read();
            Assert.Equal(plan.GetProperty("price").GetInt32(), sold.GetProperty("payment").GetProperty("amount").GetInt32());
            Assert.Equal("pending", sold.GetProperty("payment").Str("status"));
            Assert.Equal("active", (await (await owner.GetAsync($"/clients/{clientId}")).Read()).Str("status"));

            // One check-in per gym-local day.
            Assert.Equal(HttpStatusCode.Created, (await desk.PostAsJsonAsync("/attendance", new { clientId })).StatusCode);
            var duplicate = await desk.PostAsJsonAsync("/attendance", new { clientId });
            Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
            Assert.Equal("DUPLICATE_CHECKIN", (await duplicate.Read()).Str("code"));

            var payment = await (await desk.PostAsJsonAsync("/payments", new { clientId, amount = 500, method = "cash", status = "pending", note = "Test fee" })).Read();
            var paid = await (await desk.PatchAsync($"/payments/{payment.Str("id")}/mark-paid", null)).Read();
            Assert.Equal("paid", paid.Str("status"));

            var csv = await owner.GetAsync("/payments/export.csv");
            Assert.Equal("text/csv", csv.Content.Headers.ContentType?.MediaType);
            Assert.StartsWith("date,client,method,status,amount,note", (await csv.Content.ReadAsStringAsync()).TrimStart('﻿'));
        }
        finally
        {
            await owner.DeleteAsync($"/clients/{clientId}");
        }
    }

    [Fact]
    public async Task Unknown_ids_are_404()
    {
        var desk = await factory.ClientAs(DemoUser.FrontDesk);
        var unknown = Guid.NewGuid();

        Assert.Equal(HttpStatusCode.NotFound, (await desk.GetAsync($"/clients/{unknown}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await desk.PostAsJsonAsync("/attendance", new { clientId = unknown })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await desk.PatchAsync($"/payments/{unknown}/mark-paid", null)).StatusCode);
    }
}

public sealed class DashboardTests(FitvaFactory factory) : IClassFixture<FitvaFactory>
{
    [Fact]
    public async Task Dashboard_matches_the_website_contract()
    {
        var trainer = await factory.ClientAs(DemoUser.Trainer);
        var body = await (await trainer.GetAsync("/dashboard")).Read();

        // Exactly DashboardData in lib/dashboard/types.ts.
        Assert.Equal(
            ["gym", "generatedAt", "kpis", "revenueByMonth", "checkInsByDay", "membersByPlan", "renewals", "recentCheckIns", "trainers", "pendingPayments"],
            body.Keys());
        Assert.Equal(
            ["activeMembers", "revenueThisMonth", "checkInsToday", "renewalsDue"],
            body.GetProperty("kpis").EnumerateArray().Select(k => k.Str("id")));
        Assert.Equal(6, body.GetProperty("revenueByMonth").GetArrayLength());
        Assert.Equal(7, body.GetProperty("checkInsByDay").GetArrayLength());
        Assert.Matches(@"^\d{4}-\d{2}-\d{2}$", body.GetProperty("checkInsByDay")[0].Str("date"));
        Assert.Equal(["id", "name", "specialty", "activeClients", "sessionsToday"], body.GetProperty("trainers")[0].Keys());
    }

    [Fact]
    public async Task Reports_are_owner_only()
    {
        var owner = await factory.ClientAs(DemoUser.Owner);
        var body = await (await owner.GetAsync("/reports")).Read();

        Assert.Equal(
            ["thisMonth", "newClients", "outstanding", "retention", "revenue", "checkIns", "byPlan", "methods", "trainers", "renewals"],
            body.Keys());
        Assert.Equal(14, body.GetProperty("checkIns").GetArrayLength());
        Assert.True(body.GetProperty("retention").ValueKind is JsonValueKind.Number or JsonValueKind.Null);
    }
}

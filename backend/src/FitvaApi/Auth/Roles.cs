namespace FitvaApi.Auth;

/// <summary>Staff roles stored in app_users.role.</summary>
public static class Roles
{
    public const string Owner = "owner";
    public const string Trainer = "trainer";
    public const string FrontDesk = "front_desk";
}

/// <summary>Authorization policies used with [Authorize(Policy = …)].</summary>
public static class Policies
{
    /// <summary>Owner only: plans, trainers, reports, exports.</summary>
    public const string Owner = "Owner";

    /// <summary>Owner + front desk: clients, memberships, payments, check-ins.</summary>
    public const string Staff = "Staff";

    /// <summary>Any signed-in staff member (incl. trainers): read-only views.</summary>
    public const string AnyStaff = "AnyStaff";
}

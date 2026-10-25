/**
 * Copy for the authentication pages (/login, /signup) and the log-out button.
 * Templates use `{key}` tokens filled via `fill()` from lib/utils.
 */
import type { NavLink } from "@/content/landing";

type AuthField = { label: string; placeholder: string };

export type AuthPageCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  description: string;
  submit: string;
  submitting: string;
  switchPrompt: string;
  switchLink: NavLink;
};

export const authContent = {
  /** Where users land after signing in or signing up. */
  afterAuthPath: "/dashboard",
  google: { label: "Continue with Google", redirecting: "Redirecting to Google…" },
  divider: "or",
  showPassword: "Show password",
  hidePassword: "Hide password",
  backHome: { label: "Back to home", href: "/" },

  /** Left-hand brand panel on desktop. */
  panel: {
    eyebrow: "GymFit",
    headline: { lead: "Run your gym.", punch: "Not spreadsheets." },
    points: [
      "Clients, memberships and renewals in one place",
      "Attendance and progress tracking built in",
      "Owners, trainers and members — one login each",
    ],
  },

  login: {
    metaTitle: "Log in",
    metaDescription: "Log in to your GymFit account.",
    eyebrow: "Welcome back",
    title: "Log in",
    description: "Pick up where you left off.",
    submit: "Log in",
    submitting: "Logging in…",
    switchPrompt: "New to GymFit?",
    switchLink: { label: "Start your free trial", href: "/signup" },
    rememberMe: "Keep me logged in",
  } satisfies AuthPageCopy & { rememberMe: string },

  signup: {
    metaTitle: "Start your free trial",
    metaDescription: "Create your GymFit account and start a 14-day free trial.",
    eyebrow: "14-day free trial",
    title: "Create your account",
    description: "No credit card required. Set up your gym in minutes.",
    submit: "Create account",
    submitting: "Creating account…",
    switchPrompt: "Already have an account?",
    switchLink: { label: "Log in", href: "/login" },
    /** `{plan}` is replaced with the plan name picked on the pricing section. */
    selectedPlan: "Selected plan: {plan}",
    terms: {
      before: "By creating an account, you agree to our ",
      terms: { label: "Terms", href: "/terms" },
      and: " and ",
      privacy: { label: "Privacy Policy", href: "/privacy" },
      after: ".",
    },
  } satisfies AuthPageCopy & Record<string, unknown>,

  fields: {
    name: { label: "Full name", placeholder: "e.g. Priya Sharma" },
    email: { label: "Email", placeholder: "you@yourgym.com" },
    password: { label: "Password", placeholder: "At least 8 characters" },
    loginPassword: { label: "Password", placeholder: "Your password" },
  } satisfies Record<string, AuthField>,

  errors: {
    name: "Please enter your name.",
    email: "Enter a valid email address.",
    passwordRequired: "Please enter your password.",
    passwordLength: "Use at least 8 characters.",
    passwordMax: "Use 128 characters or fewer.",
  },

  /** Messages for errors returned by the auth server (keyed by Better Auth error code). */
  serverErrors: {
    INVALID_EMAIL_OR_PASSWORD: "That email and password don’t match. Please try again.",
    USER_ALREADY_EXISTS: "An account with this email already exists. Try logging in instead.",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      "An account with this email already exists. Try logging in instead.",
    PASSWORD_TOO_SHORT: "Use at least 8 characters.",
    TOO_MANY_REQUESTS: "Too many attempts. Please wait a minute and try again.",
    oauth: "Google sign-in didn’t complete. Please try again.",
    generic: "Something went wrong. Please try again in a moment.",
  } as Record<string, string> & { generic: string; oauth: string },

  /** ⚠️ TEMPORARY — copy for demo mode (static credentials, see lib/auth-mode.ts). */
  demo: {
    /** `{username}` / `{password}` are filled from DEMO_CREDENTIALS. */
    notice: "Demo mode — log in with username {username} and password {password}.",
    fields: {
      username: { label: "Username", placeholder: "Admin" },
      password: { label: "Password", placeholder: "Your password" },
    },
    errors: {
      username: "Please enter your username.",
      invalid: "Incorrect username or password.",
    },
    signupDisabled: {
      title: "Sign-up opens soon",
      body: "New accounts can be created once the GymFit backend is live. For now, use the demo login.",
      cta: { label: "Go to login", href: "/login" },
    },
  },

  /** Staff login against the FITVA database (AUTH_MODE=fitva). */
  fitva: {
    notice: "Log in with your gym staff account.",
    fields: {
      email: { label: "Email", placeholder: "you@yourgym.in" },
      password: { label: "Password", placeholder: "Your password" },
    },
    errors: {
      invalid: "Incorrect email or password.",
      unavailable: "Can't reach the gym database right now. Please try again.",
    },
  },

  /** Log-out button (dashboard). */
  dashboard: {
    signOut: "Log out",
    signingOut: "Logging out…",
  },
};

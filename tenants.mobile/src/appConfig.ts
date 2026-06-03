export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export interface AppConfigIssue {
  id: string;
  title: string;
  detail: string;
  blocking: boolean;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL.trim() && SUPABASE_ANON_KEY.trim());
}

export function getAppConfigIssues(): AppConfigIssue[] {
  const issues: AppConfigIssue[] = [];

  if (!SUPABASE_URL.trim()) {
    issues.push({
      id: 'supabase-url',
      title: 'EXPO_PUBLIC_SUPABASE_URL is missing',
      detail:
        'Supabase URL was not baked into this build. Add it to tenants.mobile/.env for local dev, or to EAS Environment variables (preview/production) for release APKs, then rebuild.',
      blocking: true,
    });
  }

  if (!SUPABASE_ANON_KEY.trim()) {
    issues.push({
      id: 'supabase-key',
      title: 'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing',
      detail:
        'Supabase anon key was not baked into this build. Use the same value as tenants-web (Project Settings → API). Set it in .env locally or in EAS Environment variables for cloud builds.',
      blocking: true,
    });
  }

  if (!DEFAULT_API_URL.trim()) {
    issues.push({
      id: 'api-url',
      title: 'EXPO_PUBLIC_API_URL is not set (optional)',
      detail:
        'The app can still run; set your tenants-web API base URL on the login screen. For a default in release builds, add EXPO_PUBLIC_API_URL to .env or EAS (use your LAN IP or public URL, not localhost).',
      blocking: false,
    });
  }

  return issues;
}

export function getBlockingConfigIssues(): AppConfigIssue[] {
  return getAppConfigIssues().filter((issue) => issue.blocking);
}

export function hasBlockingConfigIssues(): boolean {
  return getBlockingConfigIssues().length > 0;
}

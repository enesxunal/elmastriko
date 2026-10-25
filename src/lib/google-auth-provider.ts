/** Google is shown only after the actual Supabase Auth provider is enabled. */
export async function isGoogleAuthEnabled(): Promise<boolean> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) return false;
  try {
    const response = await fetch(new URL('/auth/v1/settings', base), {
      headers: { apikey: key },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return false;
    const settings = await response.json() as { external?: { google?: boolean } };
    return settings.external?.google === true;
  } catch {
    return false;
  }
}

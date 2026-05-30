import { createClient } from "@/lib/supabase/server";
import { SiteHeaderClient } from "./SiteHeaderClient";

type HeaderUser = {
  id: string;
  email?: string;
};

type UserProfile = {
  full_name: string | null;
  email: string | null;
  user_type: string;
};

async function getHeaderUserData(): Promise<{
  user: HeaderUser | null;
  profile: UserProfile | null;
  unreadCount: number;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return {
      user: null,
      profile: null,
      unreadCount: 0,
    };
  }

  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, user_type")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile ?? null,
    unreadCount: count ?? 0,
  };
}

export async function SiteHeader() {
  const { user, profile, unreadCount } = await getHeaderUserData();

  return (
    <SiteHeaderClient user={user} profile={profile} unreadCount={unreadCount} />
  );
}

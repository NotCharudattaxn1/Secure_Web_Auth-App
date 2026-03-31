import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const session = await getSession();
  
  // Route Protection: Server-side check ensures no rendering of sensitive data
  // if the session is invalid or missing.
  if (!session) {
    redirect("/");
  }

  return <DashboardClient user={session.user} />
}

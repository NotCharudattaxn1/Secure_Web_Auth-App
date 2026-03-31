import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import SecurityClient from "./SecurityClient"

export const metadata = {
  title: "Security Center - Secure Web App"
}

export default async function SecurityPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/");
  }

  return <SecurityClient user={session.user} />
}

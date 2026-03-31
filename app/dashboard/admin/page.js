import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import AdminLookupClient from "./AdminLookupClient";

export const metadata = {
  title: "User Lookup — Admin Panel",
};

export default async function AdminLookupPage() {
  const session = await getSession();
  if (!session) redirect("/");
  return <AdminLookupClient currentUser={session.user} />;
}

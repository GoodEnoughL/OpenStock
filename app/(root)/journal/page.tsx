import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import JournalClient from "./JournalClient";

export default async function JournalPage() {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        redirect('/sign-in');
    }

    return <JournalClient userId={session.user.id} userName={session.user.name || ''} />;
}

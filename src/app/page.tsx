import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const { userId } = auth();

  // If the user is already signed in, immediately redirect to the dashboard.
  // This catches the case where Clerk's Account Portal drops users at the
  // root URL after sign-up/sign-in instead of the dashboard subfolder.
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50">
      <main className="max-w-2xl flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Team CRM Dashboard
        </h1>
        <p className="text-lg leading-8 text-gray-600">
          Shared access to Zoho CRM pipeline, contacts, and accounts without needing individual seats.
        </p>

        <div className="mt-4 flex items-center justify-center gap-x-6">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-md bg-brand-red px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-red/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red">
                Sign In to Continue
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-md bg-brand-red px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-red/90 flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </main>
    </div>
  );
}

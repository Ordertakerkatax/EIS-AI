import { InvoiceCreationForm } from '@/components/invoices/InvoiceCreationForm';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/(auth)/actions';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen p-8 bg-zinc-50 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">

        {user && (
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-zinc-200">
            <div>
              <p className="text-sm text-zinc-500">Logged in as</p>
              <p className="font-medium text-zinc-900">{user.email}</p>
            </div>
            <form action={logout}>
              <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-500">
                Log out
              </button>
            </form>
          </div>
        )}
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            BIR EIS Compliance Gateway
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            A Spec-Driven Component prototype demonstrating 10-year data retention,
            canonical JSON structural alignment, RS256 signing, and an asynchronous retry API client.
          </p>
        </header>

        <InvoiceCreationForm />

        <footer className="pt-10 text-center text-sm text-zinc-500">
          Built for Phase 1 MVP Testing
        </footer>
      </div>
    </main>
  );
}

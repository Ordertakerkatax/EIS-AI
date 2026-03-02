import { InvoiceCreationForm } from '@/components/invoices/InvoiceCreationForm';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-zinc-50 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
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

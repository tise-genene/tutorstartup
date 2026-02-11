import Link from "next/link";
import { PageShell } from "../../_components/PageShell";

export default function PaymentSuccessPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <div className="glass-panel p-8 sm:p-10">
          <h1 className="text-2xl font-semibold">Payment success</h1>
          <p className="mt-2 text-sm ui-muted">
            Your payment was received. It may take a moment for your contract to
            update.
          </p>
          <div className="mt-6">
            <Link href="/contracts" className="ui-btn ui-btn-primary">
              Go to contracts
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

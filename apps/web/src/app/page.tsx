import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Nimbus
            </span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Unified Cloud FinOps Platform
          </p>
        </div>

        <p className="mb-8 text-muted-foreground">
          Cost visibility, optimization recommendations, budget governance, and forecasting
          across AWS, Azure, GCP, and Kubernetes.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Open Dashboard
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">Multi-Cloud</div>
            <p className="mt-1 text-sm text-muted-foreground">AWS, Azure, GCP, K8s</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">FOCUS Schema</div>
            <p className="mt-1 text-sm text-muted-foreground">Vendor-neutral data</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">Multi-Tenant</div>
            <p className="mt-1 text-sm text-muted-foreground">BFSI-ready isolation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

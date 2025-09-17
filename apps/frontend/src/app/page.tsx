// apps/frontend/src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-3xl font-bold">Welcome to Enterprise Dashboards</h1>
      <p className="text-muted-foreground">Select a dashboard to continue</p>
      <nav className="flex gap-4">
        <Link href="/churn-prediction" className="text-blue-500 underline">
          Churn Prediction
        </Link>
        <Link href="/customer-behavior" className="text-blue-500 underline">
          Customer Behavior
        </Link>
      </nav>
    </main>
  );
}

import { KpiCards } from './components/KpiCards';
import { CostTrendChart } from './components/CostTrendChart';
import { CostByProviderChart } from './components/CostByProviderChart';
import { TopServices } from './components/TopServices';
import { RecentRecommendations } from './components/RecentRecommendations';

export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Cloud spend overview across all connected accounts.
        </p>
      </div>

      <KpiCards />

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <CostTrendChart />
        </div>
        <div className="lg:col-span-3">
          <CostByProviderChart />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopServices />
        <RecentRecommendations />
      </div>
    </div>
  );
}

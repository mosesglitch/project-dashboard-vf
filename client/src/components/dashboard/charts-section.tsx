import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { SpendingData, StatusData, DivisionData } from "@/lib/types";
// import { PieChart, BarChart } from "@ui5/webcomponents-react";
import { PieChart, BarChart } from '@ui5/webcomponents-react-charts';
import '@ui5/webcomponents-react/dist/Assets.js';

interface ChartsSectionProps {
  spendingData: SpendingData | undefined;
  statusData: StatusData | undefined;
  divisionData: DivisionData | undefined;
  isLoading: boolean;
}

const SPENDING_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
const STATUS_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export function ChartsSection({
  spendingData,
  statusData,
  divisionData,
  isLoading
}: ChartsSectionProps) {
  const spendingChartData = spendingData ? [
    { name: 'Under Budget', value: spendingData.underBudget },
    { name: 'Within Budget', value: spendingData.withinBudget },
    { name: 'Overspent', value: spendingData.overspent },
    { name: 'Critical Overspent', value: spendingData.criticalOverspent },
  ] : [];

  const statusChartData = statusData ? [
    { name: 'Ahead of Schedule', value: statusData.aheadOfSchedule },
    { name: 'On Track', value: statusData.onTrack },
    { name: 'Slightly Behind', value: statusData.slightlyBehind },
    { name: 'Critical Delay', value: statusData.criticalDelay },
  ] : [];

  const divisionChartData = divisionData ? [
    { name: 'Mechanical', value: divisionData.mechanical },
    { name: 'Electrical', value: divisionData.electrical },
    { name: 'Instrumentation', value: divisionData.instrumentation },
  ] : [];
   if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="bg-white dark:bg-gray-900">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Spending Categories Pie Chart */}
      <Card className="bg-white dark:bg-gray-900 border dark:border-gray-700">
        <CardHeader>
          <CardTitle
            className="text-lg font-semibold text-gray-900 dark:text-white"
            data-testid="text-spending-chart-title"
          >
            Spending Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <PieChart
              dataset={spendingChartData}
              dimension={{
                accessor: "name"
              }}
              measure={{
                accessor: "value",
                colors: SPENDING_COLORS
              }}
              onClick={function cie() { }}
              onDataPointClick={function cie() { }}
              onLegendClick={function cie() { }}
              noLegend={false}
            // loading={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Project Status Pie Chart */}
      <Card className="bg-white dark:bg-gray-900 border dark:border-gray-700">
        <CardHeader>
          <CardTitle
            className="text-lg font-semibold text-gray-900 dark:text-white"
            data-testid="text-status-chart-title"
          >
            Project Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <PieChart
              dataset={statusChartData}
              dimension={{
                accessor: "name"
              }}
              measure={{
                accessor: "value",
                colors: STATUS_COLORS
              }}
              noLegend={false}
              loading={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Projects by Division Bar Chart */}
      <Card className="bg-white dark:bg-gray-900 border dark:border-gray-700">
        <CardHeader>
          <CardTitle
            className="text-lg font-semibold text-gray-900 dark:text-white"
            data-testid="text-division-chart-title"
          >
            {/* Projects by Division */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <BarChart
              dataset={divisionChartData}
              dimensions={[
                {
                  accessor: "name",
                  formatter: (name: string) => name
                }
              ]}
              measures={[
                {
                  accessor: "value",
                  label: "Projects",
                  color: "#3B82F6"
                }
              ]}
              loading={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

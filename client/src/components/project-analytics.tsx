import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExcelProject } from "@shared/excel-schema";
import { TrendingUp, DollarSign, BarChart3, Target } from "lucide-react";
import { BarChart } from "@ui5/webcomponents-react-charts";

interface ProjectAnalyticsProps {
  project: ExcelProject;
}

export function ProjectAnalytics({ project }: ProjectAnalyticsProps) {
  // Formatters
  const formatCurrency = (amount: number) =>
    !amount || isNaN(amount) ? "KSh 0" : `KSh ${amount.toLocaleString()}`;

  // Derived values
  const scopeCompletionPct = (project.scopeCompletion || 0) * 100;
  const timeCompletionPct = Math.min((project.timeCompletion || 0) * 100, 200);
  const spi = project.timeCompletion
    ? (project.scopeCompletion || 0) / (project.timeCompletion / 100)
    : 0;
  const cpi = project.totalAmountSpent
    ? project.budgetAmount / project.totalAmountSpent
    : 0;

  // Datasets
  const scopeTimeData = [
    { metric: "Scope Completion", value: Math.round(scopeCompletionPct) },
    { metric: "Time Completion", value: Math.round(timeCompletionPct) },
  ];

  const budgetData = [
    { metric: "Budget Amount", value: Math.round(project.budgetAmount) },
    { metric: "Actual Spent", value: Math.round(project.totalAmountSpent) },
  ];

  const performanceIndexData = [
    { metric: "SPI", value: spi },
    { metric: "CPI", value: cpi },
  ];

  const marginData = [
    {
      metric: "Projected Margin",
      value: Math.round((project.projectedGrossMargin || 0) * 100),
    },
    {
      metric: "Actual Margin",
      value: Math.round((project.actualGrossMargin || 0) * 100),
    },
  ];

  // Chart config for thinner bars
  const thinBarConfig = {
    bar: {
      barThickness: 12, // thinner bars
    },
    
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Scope vs Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Scope vs Time Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              className="h-40"
              dataset={scopeTimeData}
              dimensions={[{ accessor: "metric" }]}
              measures={[
                {
                  accessor: "value",
                  color: "#797c79ff",
                  formatter: (val: number) => `${val}%`,
                },
              ]}
              noLegend={true}
              chartConfig={{
                ...thinBarConfig,

                // xAxisVisible: false,
                barGap: 12,
                referenceLine: {
                  color: "#22c55e",
                  label: "Target",
                  value: 100,
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Budget vs Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              className="h-40"
              dataset={budgetData}
              dimensions={[{ accessor: "metric" }]}
              measures={[
                {
                  accessor: "value",
                  color: "#054d17ff",
                  formatter: (val: number) =>
                    `KSh ${val.toLocaleString("en-KE")}`,
                },
              ]}
              axis={{ visible: false }}
              noLegend={true}

              chartConfig={thinBarConfig}
            />
          </CardContent>
        </Card>

        {/* Margins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Margins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              className="h-40"
              dataset={marginData}
              dimensions={[{ accessor: "metric" }]}
              measures={[
                {
                  accessor: "value",
                  color: "purple",
                  formatter: (val: number) => `${val}%`,
                },
              ]}
              axis={{ visible: false }}
              chartConfig={thinBarConfig}
              noLegend={true}

            />
          </CardContent>
        </Card>

        {/* SPI & CPI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              SPI & CPI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              className="h-40"
              dataset={performanceIndexData}
              dimensions={[{ accessor: "metric" }]}
              measures={[
                {
                  accessor: "value",
                  color: "teal",
                  formatter: (val: number) => val.toFixed(2),
                },
              ]}
              axis={{ visible: false }}
              chartConfig={thinBarConfig}
              noLegend={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

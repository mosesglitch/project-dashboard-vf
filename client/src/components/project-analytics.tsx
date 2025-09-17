import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExcelProject } from "@shared/excel-schema";
import { TrendingUp, DollarSign, BarChart3, Target } from "lucide-react";
import { BarChart,DonutChart } from "@ui5/webcomponents-react-charts";

interface ProjectAnalyticsProps {
  project: ExcelProject;
}

export function ProjectAnalytics({ project }: ProjectAnalyticsProps) {
  // Formatters
   const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `Ksh ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `Ksh ${(amount / 1000).toFixed(0)}K`;
    }
    return `Ksh ${amount.toLocaleString()}`;
  };
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
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scope vs Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Scope vs Time vs Budget Completion
            </CardTitle>
          </CardHeader>
            <CardContent>
              <div className="space-y-2">
              {/* <div className="flex justify-between text-sm">
                <span>Scope Completion</span>
                <span className="font-medium text-blue-500 dark:text-gray-200">
                {`${Math.round(scopeCompletionPct)}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
                <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  scopeCompletionPct > 100 ? "bg-yellow-500" : "bg-blue-500"
                }`}
                style={{
                  width: `${Math.min(scopeCompletionPct, 100)}%`,
                }}
                ></div>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>Time Completion</span>
                <span
                className={`font-medium ${
                  timeCompletionPct > 100 ? "text-red-600" : "text-green-600"
                }`}
                >
                {`${Math.round(timeCompletionPct)}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
                <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  timeCompletionPct > 100 ? "bg-red-500" : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min(timeCompletionPct, 100)}%`,
                }}
                ></div>
              </div> */}
              {/* Budget Completion */}
              {/* <div className="flex justify-between text-sm mt-2">
                <span>Budget Completion</span>
                <span
                className={`font-medium ${
                  project.budgetAmount && project.totalAmountSpent / project.budgetAmount > 1
                  ? "text-red-600"
                  : "text-purple-600"
                }`}
                >
                {`${project.budgetAmount
                  ? Math.round((project.totalAmountSpent / project.budgetAmount) * 100)
                  : 0}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
                <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  project.budgetAmount && project.totalAmountSpent / project.budgetAmount > 1
                  ? "bg-red-500"
                  : "bg-purple-500"
                }`}
                style={{
                  width: `${
                  project.budgetAmount
                    ? Math.min((project.totalAmountSpent / project.budgetAmount) * 100, 100)
                    : 0
                  }%`,
                }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>0%</span>
                <span>100%</span>
              </div> */}
              {/* BarChart for metrics */}
              <div className="mt-4">
                <BarChart
                  className="h-40"
                  dataset={[
                    { metric: "Scope Completion", value: Math.round(scopeCompletionPct) },
                    { metric: "Time Completion", value: Math.round(timeCompletionPct) },
                    {
                      metric: "Budget Completion",
                      value: project.budgetAmount
                        ? Math.round((project.totalAmountSpent / project.budgetAmount) * 100)
                        : 0,
                    },
                  ]}
                  dimensions={[{ accessor: "metric" }]}
                  measures={[
                    {
                      accessor: "value",
                      colors: ["#3b82f6", "#22c55e", "#a855f7"], // blue, green, purple
                      formatter: (val: number) => `${val}%`,
                    },
                  ]}
                  axis={{ visible: false }}
                  chartConfig={thinBarConfig}
                  noLegend={true}
                />
              </div>
              </div>
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
              <div className="space-y-2">
                {/* <div className="flex justify-between text-sm">
                  <span>Budget Amount</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {formatCurrency(project.budgetAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Actual Spent</span>
                  <span
                    className={`font-medium ${
                      project.totalAmountSpent > project.budgetAmount
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatCurrency(project.totalAmountSpent)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CO Amount</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {formatCurrency(project.coAmount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      project.totalAmountSpent > project.budgetAmount
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${
                        project.budgetAmount
                          ? Math.min((project.totalAmountSpent / project.budgetAmount) * 100, 100)
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div> */}
                <div className="mt-4">
                  <BarChart
                    className="h-40"
                    dataset={[
                      { metric: "Budget Amount", value: Math.round(project.budgetAmount) },
                      { metric: "Actual Spent", value: Math.round(project.totalAmountSpent) },
                      { metric: "CO Amount", value: Math.round(project.coAmount || 0) },
                    ]}
                    dimensions={[{ accessor: "metric" }]}
                    measures={[
                      {
                        accessor: "value",
                        // color: "#054d17ff",
                        formatter: (val: number) => formatCurrency(val),
                      },
                    ]}
                    axis={{ visible: false }}
                    chartConfig={thinBarConfig}
                    noLegend={true}
                  />
                </div>
              </div>
            </CardContent>
        </Card>
{/* Amount Received */}
 <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Amount Received
            </CardTitle>
          </CardHeader>
            <CardContent>
            <DonutChart
              dataset={[
              {
                label: "Amount Received",
                value: Math.round(project.amountReceived || 0),
              },
              {
                label: "CO Amount",
                value: Math.round(project.coAmount || 0),
              },
              ]}
              dimension={{ accessor: "label" }}
              measure={{
              accessor: "value",
              formatter: (val) => formatCurrency(Number(val)),
              }}
              onClick={(e) => console.log("Chart clicked", e)}
              onDataPointClick={(e) => console.log("Data point clicked", e)}
              onLegendClick={(e) => console.log("Legend clicked", e)}
              style={{ height: "220px" }}
            />
            </CardContent>
        </Card>
        {/* Margins */}
        {/* <Card>
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
        </Card> */}

        {/* SPI & CPI */}
        {/* <Card>
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
        </Card> */}
      </div>
    </div>
  );
}

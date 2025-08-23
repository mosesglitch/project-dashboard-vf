import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ExcelProject } from "@shared/excel-schema";
import { TrendingUp, DollarSign, BarChart3, Target } from "lucide-react";
import { BarChart } from "@ui5/webcomponents-react-charts";

interface ProjectAnalyticsProps {
  project: ExcelProject;
}

export function ProjectAnalytics({ project }: ProjectAnalyticsProps) {
  // Format currency for KSh
  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return 'KSh 0';
    if (amount >= 1000000) return `KSh ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `KSh ${(amount / 1000).toFixed(0)}K`;
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Calculate performance indices
  const scopeCompletionPct = (project.scopeCompletion || 0) * 100;
  const timeCompletionPct = Math.min((project.timeCompletion || 0) * 100, 200); // Cap at 200% for display
  const spi = project.timeCompletion ? (project.scopeCompletion || 0) / (project.timeCompletion / 100) : 0;
  const cpi = project.totalAmountSpent ? project.budgetAmount / project.totalAmountSpent : 0;

  // Summary metrics
  const summaryMetrics = [
    { category: 'Progress', metric: 'Scope Completion', value: formatPercentage(project.scopeCompletion || 0), status: 'good' },
    { category: 'Progress', metric: 'Time Completion', value: formatPercentage((project.timeCompletion || 0) / 100), status: timeCompletionPct > 100 ? 'warning' : 'good' },
    { category: 'Performance', metric: 'Performance Category', value: project.performanceCategory || 'N/A', status: project.performanceCategory?.includes('Critical') ? 'critical' : project.performanceCategory?.includes('Behind') ? 'warning' : 'good' },
    { category: 'Schedule', metric: 'SPI (Schedule Performance Index)', value: spi.toFixed(2), status: spi >= 1 ? 'good' : spi >= 0.8 ? 'warning' : 'critical' },
    { category: 'Budget', metric: 'Budget Amount', value: formatCurrency(project.budgetAmount), status: 'neutral' },
    { category: 'Budget', metric: 'Actual Spent', value: formatCurrency(project.totalAmountSpent), status: 'neutral' },
    { category: 'Budget', metric: 'Budget Status', value: project.budgetStatusCategory || 'N/A', status: project.budgetStatusCategory?.includes('Over') ? 'critical' : 'good' },
    { category: 'Cost', metric: 'CPI (Cost Performance Index)', value: cpi.toFixed(2), status: cpi >= 1 ? 'good' : cpi >= 0.8 ? 'warning' : 'critical' },
    { category: 'Margin', metric: 'Projected Gross Margin', value: formatPercentage(project.projectedGrossMargin || 0), status: 'neutral' },
    { category: 'Margin', metric: 'Actual Gross Margin', value: formatPercentage(project.actualGrossMargin || 0), status: 'neutral' },
    { category: 'Margin', metric: 'Margin Deviation', value: formatPercentage(project.deviationProfitMargin || 0), status: Math.abs((project.deviationProfitMargin || 0) * 100) > 10 ? 'warning' : 'good' },
    { category: 'Risk', metric: 'Issues & Risks', value: (project.issuesRisks || 0).toString(), status: (project.issuesRisks || 0) > 5 ? 'critical' : (project.issuesRisks || 0) > 3 ? 'warning' : 'good' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return <Badge className="bg-green-100 text-green-800">Good</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  // Helper to get status for charts
  const getStatus = (metric: string) => summaryMetrics.find(m => m.metric.includes(metric))?.status || "neutral";

  // Dynamic color map
  const statusColors: Record<string, string> = {
    good: "#10B981", // green
    warning: "#F59E0B", // amber
    critical: "#EF4444", // red
    neutral: "#3B82F6" // blue default
  };

  // Chart datasets
const scopeTimeData = [
  { metric: "Scope Completion", value: Math.round(scopeCompletionPct), fill: statusColors[getStatus("Scope Completion")] },
  { metric: "Time Completion", value: Math.round(timeCompletionPct), fill: statusColors[getStatus("Time Completion")] }
];

const budgetData = [
  { metric: "Budget Amount", value: Math.round(project.budgetAmount), fill: "#10B981" },
  { metric: "Actual Spent", value: Math.round(project.totalAmountSpent), fill: "#F59E0B" }
];

const performanceIndexData = [
  { metric: "SPI", value: Math.round(spi), fill: statusColors[getStatus("SPI")] },
  { metric: "CPI", value: Math.round(cpi), fill: statusColors[getStatus("CPI")] }
];

const marginData = [
  { metric: "Projected Margin", value: Math.round((project.projectedGrossMargin || 0) * 100), fill: statusColors[getStatus("Projected Gross Margin")] },
  { metric: "Actual Margin", value: Math.round((project.actualGrossMargin || 0) * 100), fill: statusColors[getStatus("Actual Gross Margin")] }
];

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-4 ">

        {/* Scope vs Time Completion */}
    <Card className="h-full w-full">
  <CardHeader>
    <CardTitle className="flex flex-col gap-1 " style={{ height: '2rem' }}>
      <span className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        Scope vs Time Completion
      </span>
    
    </CardTitle>
  </CardHeader>

  {/* Centered Chart */}
  <CardContent className=" flex justify-center items-center">
    <BarChart
      className=" h-40 m-0 p-0 flex justify-center items-center"
      dataset={scopeTimeData}
      dimensions={[{ accessor: "metric" }]}
      measures={[{ accessor: "value", label: "Completion (%)" }]}
    />
  </CardContent>
</Card>

        {/* Budget vs Actual Spend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-1 " style={{ height: '2rem' }}>
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Budget vs Actual Spend
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart className="w-full h-40" dataset={budgetData} dimensions={[{ accessor: "metric" }]} measures={[{ accessor: "value", label: "Amount (KSh)" }]} />
          </CardContent>
        </Card>

    

        {/* Margins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-1 " style={{ height: '2rem' }}>
              <span className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Projected vs Actual Gross Margin
              </span>
           </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart className="w-full h-40" dataset={marginData} dimensions={[{ accessor: "metric" }]} measures={[{ accessor: "value", label: "Margin (%)" }]} />
          </CardContent>
        </Card>

            {/* SPI & CPI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-1 " style={{ height: '2rem' }}>
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Performance Indices (SPI & CPI)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart className="w-full h-40" dataset={performanceIndexData} dimensions={[{ accessor: "metric" }]} measures={[{ accessor: "value", label: "Index Value" }]} />
          </CardContent>
        </Card>
      </div>

      {/* Summary Metrics Table */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Project Metrics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryMetrics.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell>{item.metric}</TableCell>
                  <TableCell className="font-mono">{item.value}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card> */}
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts";
import type { ExcelProject } from "@shared/excel-schema";
import { TrendingUp, DollarSign, BarChart3, Target } from "lucide-react";

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

  // Chart data
  const scopeTimeData = [
    { metric: 'Scope Completion', value: scopeCompletionPct, fill: '#3B82F6' },
    { metric: 'Time Completion', value: timeCompletionPct, fill: '#EF4444' }
  ];

  const budgetData = [
    { metric: 'Budget Amount', value: project.budgetAmount, fill: '#10B981' },
    { metric: 'Actual Spent', value: project.totalAmountSpent, fill: '#F59E0B' }
  ];

  const performanceIndexData = [
    { metric: 'SPI', value: spi, fill: spi >= 1 ? '#10B981' : '#EF4444' },
    { metric: 'CPI', value: cpi, fill: cpi >= 1 ? '#10B981' : '#EF4444' }
  ];

  const marginData = [
    { metric: 'Projected Margin', value: (project.projectedGrossMargin || 0) * 100, fill: '#8B5CF6' },
    { metric: 'Actual Margin', value: (project.actualGrossMargin || 0) * 100, fill: '#06B6D4' }
  ];

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

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scope vs Time Completion Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Scope vs Time Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scopeTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget vs Actual Spend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Budget vs Actual Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis 
                  label={{ value: 'Amount (KSh)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SPI & CPI Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Performance Indices (SPI & CPI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceIndexData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis label={{ value: 'Index Value', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => [value.toFixed(2), '']} />
                <ReferenceLine y={1} stroke="#666" strokeDasharray="2 2" />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">Reference line at 1.0 indicates on-track performance</p>
          </CardContent>
        </Card>

        {/* Projected vs Actual Gross Margin Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Projected vs Actual Gross Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={marginData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis label={{ value: 'Margin (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Metrics Table */}
      <Card>
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
      </Card>
    </div>
  );
}
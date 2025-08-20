import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, DollarSign, TrendingUp, AlertTriangle, BarChart3, PieChart } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ProjectMap } from "@/components/dashboard/project-map";
import type { ExcelProject } from "@shared/excel-schema";
import type { DashboardFilters } from "@/lib/types";
import { BarChart, ColumnChart, DonutChart } from '@ui5/webcomponents-react-charts';

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    status: "all",
    division: "all",
    dateFrom: "",
    dateTo: "",
  });

  // Fetch data using Excel data service
  const { data: projects, isLoading: projectsLoading } = useQuery<ExcelProject[]>({
    queryKey: ["/api/projects", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.division !== "all") params.append("division", filters.division);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  const { data: kpiData } = useQuery<any>({
    queryKey: ["/api/projects/stats/overview"],
  });

  const { data: performanceStats } = useQuery<any>({
    queryKey: ["/api/projects/stats/performance"],
  });

  const { data: spendingStats } = useQuery<any>({
    queryKey: ["/api/projects/stats/spending"],
  });

  const { data: divisionStats } = useQuery<any>({
    queryKey: ["/api/projects/stats/divisions"],
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('on track')) {
      return <Badge className="bg-green-100 text-green-800">On Track</Badge>;
    } else if (statusLower.includes('delay')) {
      return <Badge className="bg-red-100 text-red-800">Delayed</Badge>;
    } else if (statusLower.includes('behind')) {
      return <Badge className="bg-yellow-100 text-yellow-800">Behind</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getBudgetStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('under')) {
      return <Badge className="bg-green-100 text-green-800">Under Budget</Badge>;
    } else if (statusLower.includes('within')) {
      return <Badge className="bg-blue-100 text-blue-800">Within Budget</Badge>;
    } else if (statusLower.includes('over')) {
      return <Badge className="bg-red-100 text-red-800">Over Budget</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };
  console.log(performanceStats, spendingStats, "Hello world")
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="p-4 md:p-6">
        {/* Header */}


        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <Input
            type="date"
            placeholder="From Date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="w-auto"
            data-testid="input-date-from"
          />
          <Input
            type="date"
            placeholder="To Date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="w-auto"
            data-testid="input-date-to"
          />
          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.division} onValueChange={(value) => setFilters({ ...filters, division: value })}>
            <SelectTrigger className="w-48" data-testid="select-division-filter">
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              <SelectItem value="mechanical">Mechanical</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="instrumentation">Instrumentation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* KPI Cards */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card data-testid="tile-total-projects">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {kpiData?.totalProjects ? Math.round(kpiData.totalProjects).toString() : "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Active portfolio</p>
                </CardContent>
              </Card>

              <Card data-testid="tile-total-budget">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {kpiData ? formatCurrency(Math.round(kpiData.totalBudget)) : "$0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Allocated funds</p>
                </CardContent>
              </Card>

              <Card data-testid="tile-actual-spend">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actual Spend</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {kpiData ? formatCurrency(Math.round(kpiData.actualSpend)) : "$0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Current spending</p>
                </CardContent>
              </Card>

              <Card data-testid="tile-amount-received">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Amount Received</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {kpiData ? formatCurrency(Math.round(kpiData.amountReceived)) : "$0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Revenue collected</p>
                </CardContent>
              </Card>

              <Card data-testid="tile-total-risks">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {kpiData?.totalRisks ? Math.round(kpiData.totalRisks).toString() : "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Active risks</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Charts Row */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Spending Categories Chart */}
              <Card data-testid="card-spending-chart">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Spending Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {spendingStats ? (
                    <DonutChart
                      dataset={Object.entries(spendingStats).map(([category, value]) => ({ category, value }))}
                      dimension={{ accessor: "category" }}
                      measures={[
                        {
                          accessor: "value",
                          label: "Spend",
                          color: "#3B82F6"
                        }
                      ]}
                    />
                  ) : (
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">No data</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Status Chart */}
              <Card data-testid="card-status-chart">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Performance Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceStats ? (
                    <DonutChart
                      dataset={Object.entries(performanceStats).map(([name, value]) => ({ name, value }))}
                      dimension={{ accessor: "name" }}
                      measures={[
                        {
                          accessor: "value",
                          label: "Projects",
                          color: "#3B82F6"
                        }
                      ]}
                    />
                  ) : (
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">No data</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Division Projects Chart */}
              <Card data-testid="card-division-chart">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Projects by Division
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {divisionStats ? (
                    <BarChart
                      dataset={Object.entries(divisionStats).map(([name, value]) => ({ name, value }))}
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
                    />
                  ) : (
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">No data</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Projects Table */}
          <div className="lg:col-span-4">
            <Card data-testid="card-projects-table">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Project Portfolio</CardTitle>
                <Button variant="outline" data-testid="button-export-projects">
                  Export Data
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table data-testid="table-projects">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Budget Status</TableHead>
                        <TableHead>Risks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectsLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            Loading projects...
                          </TableCell>
                        </TableRow>
                      ) : projects && projects.length > 0 ? (
                        projects.map((project) => (
                          <TableRow
                            key={project.id}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => window.open(`/project/${project.projectCode}`, '_blank')}
                            data-testid={`row-project-${project.projectCode}`}
                          >
                            <TableCell className="font-medium">
                              <Link href={`/project/${project.projectCode}`} className="text-blue-600 hover:underline">
                                {project.projectCode}
                              </Link>
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={project.description}>
                              {project.description}
                            </TableCell>
                            <TableCell>{project.division}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={project.percentageComplete * 100}
                                  className="w-16 h-2"
                                />
                                <span className="text-sm text-gray-600">
                                  {(project.percentageComplete * 100).toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(project.budgetAmount)}</TableCell>
                            <TableCell>{project.performanceCategory ? getStatusBadge(project.performanceCategory) : '-'}</TableCell>
                            <TableCell>{project.budgetStatusCategory ? getBudgetStatusBadge(project.budgetStatusCategory) : '-'}</TableCell>
                            <TableCell>
                              <Badge variant={(project.issuesRisks || 0) > 3 ? "destructive" : "outline"}>
                                {project.issuesRisks || 0}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            No projects found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Project Locations Map */}
        <div className="mt-6">
          <ProjectMap projects={projects || []} />
        </div>
      </div>
    </div>
  );
}
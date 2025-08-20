import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Settings, 
  Building, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  BarChart3,
  Users,
  MapPin,
  Activity
} from "lucide-react";

import type { ExcelProject, ExcelActivity } from "@shared/excel-schema";

const formatDate = (excelDate: number) => {
  // Excel date serial number to JavaScript Date
  const excelEpoch = new Date(1899, 11, 30); // Excel's epoch
  const jsDate = new Date(excelEpoch.getTime() + (excelDate * 24 * 60 * 60 * 1000));
  return jsDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

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
  } else if (statusLower.includes('delay') || statusLower.includes('critical')) {
    return <Badge className="bg-red-100 text-red-800">Critical Delay</Badge>;
  } else if (statusLower.includes('behind')) {
    return <Badge className="bg-yellow-100 text-yellow-800">Behind Schedule</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
};

const getBudgetStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('under')) {
    return <Badge className="bg-green-100 text-green-800">Under Budget</Badge>;
  } else if (statusLower.includes('within')) {
    return <Badge className="bg-blue-100 text-blue-800">Within Budget</Badge>;
  } else if (statusLower.includes('over') || statusLower.includes('critical')) {
    return <Badge className="bg-red-100 text-red-800">Over Budget</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
};

const getStatusIcon = (percentageComplete: number) => {
  if (percentageComplete >= 1) return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (percentageComplete > 0) return <Clock className="w-4 h-4 text-yellow-600" />;
  return <Calendar className="w-4 h-4 text-blue-600" />;
};

const getProgressColor = (percentageComplete: number) => {
  if (percentageComplete >= 1) return "bg-green-500";
  if (percentageComplete > 0.8) return "bg-yellow-500";
  return "bg-blue-500";
};

export default function ProjectDetailsDashboard() {
  const { id } = useParams();

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery<ExcelProject>({
    queryKey: ["/api/projects", id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      return response.json();
    },
  });

  // Fetch activities data
  const { data: milestones } = useQuery<ExcelActivity[]>({
    queryKey: ["/api/projects", project?.projectCode, "milestones"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project?.projectCode}/milestones`);
      if (!response.ok) throw new Error("Failed to fetch milestones");
      return response.json();
    },
    enabled: !!project?.projectCode,
  });

  const { data: risks } = useQuery<ExcelActivity[]>({
    queryKey: ["/api/projects", project?.projectCode, "risks"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project?.projectCode}/risks`);
      if (!response.ok) throw new Error("Failed to fetch risks");
      return response.json();
    },
    enabled: !!project?.projectCode,
  });

  const { data: upcomingActivities } = useQuery<ExcelActivity[]>({
    queryKey: ["/api/projects", project?.projectCode, "upcoming"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project?.projectCode}/upcoming`);
      if (!response.ok) throw new Error("Failed to fetch upcoming activities");
      return response.json();
    },
    enabled: !!project?.projectCode,
  });

  const { data: lateActivities } = useQuery<ExcelActivity[]>({
    queryKey: ["/api/projects", project?.projectCode, "late"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project?.projectCode}/late`);
      if (!response.ok) throw new Error("Failed to fetch late activities");
      return response.json();
    },
    enabled: !!project?.projectCode,
  });

  if (projectLoading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading project details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Header with Back Button */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Project {project.projectCode}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
            {project.description}
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card data-testid="kpi-scope-completion">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scope Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(project.scopeCompletion * 100).toFixed(0)}%
            </div>
            <Progress value={project.scopeCompletion * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="kpi-time-completion">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Completion</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(project.timeCompletion * 100).toFixed(0)}%
            </div>
            <Progress value={Math.min(project.timeCompletion * 100, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="kpi-performance-category">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {getStatusBadge(project.performanceCategory)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current status</p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-budget-status">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {getBudgetStatusBadge(project.budgetStatusCategory)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(project.budgetAmount)}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-margin-deviation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Deviation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(project.deviationProfitMargin * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">From projected</p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-total-risks">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {project.issuesRisks || 0}
            </div>
            <p className="text-xs text-muted-foreground">Issues & risks</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget & Financial Details */}
        <Card data-testid="card-budget-details">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget & Financial Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Budget Amount</p>
                  <p className="text-lg font-semibold">{formatCurrency(project.budgetAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Spent</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatCurrency(project.totalAmountSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget Spent</p>
                  <p className="text-lg font-semibold">
                    {(project.budgetSpent * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Received</p>
                  <p className="text-lg font-semibold text-green-600">
                    {project.amountReceived || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projected Margin</p>
                  <p className="text-lg font-semibold">
                    {(project.projectedGrossMargin * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Margin</p>
                  <p className="text-lg font-semibold">
                    {(project.actualGrossMargin * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time & Performance Metrics */}
        <Card data-testid="card-time-metrics">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time & Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="text-lg font-semibold">{formatDate(project.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Finish Date</p>
                  <p className="text-lg font-semibold">{formatDate(project.finishDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Division</p>
                  <p className="text-lg font-semibold">{project.division}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Performance Index</p>
                  <p className="text-lg font-semibold">
                    {project.performanceIndex.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overall Progress</p>
                  <div className="flex items-center gap-2">
                    <Progress value={project.percentageComplete * 100} className="flex-1" />
                    <span className="text-sm">{(project.percentageComplete * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Multiple sites
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones Section */}
        <Card data-testid="card-milestones">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Project Milestones ({milestones?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {milestones && milestones.length > 0 ? (
                milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(milestone.percentageComplete || 0)}
                      <div>
                        <p className="font-medium text-sm">{milestone.item}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(milestone.startDate)} - {formatDate(milestone.finishDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(milestone.percentageComplete || 0) * 100} 
                        className="w-16 h-2" 
                      />
                      <span className="text-xs text-muted-foreground">
                        {((milestone.percentageComplete || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground text-sm">No milestones data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risks Section */}
        <Card data-testid="card-risks">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Management ({risks?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {risks && risks.length > 0 ? (
                risks.map((risk, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{risk.item}</p>
                        <p className="text-xs text-muted-foreground">
                          Owner: {risk.owner || 'Unassigned'}
                        </p>
                      </div>
                      <Badge variant="destructive">{risk.status || 'Active'}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground text-sm">No active risks</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Activities */}
        <Card data-testid="card-upcoming-activities">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Activities ({upcomingActivities?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Finish Date</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingActivities && upcomingActivities.length > 0 ? (
                    upcomingActivities.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-sm">{activity.item}</TableCell>
                        <TableCell className="text-sm">{formatDate(activity.startDate)}</TableCell>
                        <TableCell className="text-sm">{formatDate(activity.finishDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(activity.percentageComplete || 0) * 100} 
                              className="w-16 h-2" 
                            />
                            <span className="text-xs">
                              {((activity.percentageComplete || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                        No upcoming activities
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Late Activities */}
        <Card data-testid="card-late-activities">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Late Activities ({lateActivities?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Finish Date</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lateActivities && lateActivities.length > 0 ? (
                    lateActivities.map((activity, index) => (
                      <TableRow key={index} className="bg-red-50 dark:bg-red-950/20">
                        <TableCell className="font-medium text-sm">{activity.item}</TableCell>
                        <TableCell className="text-sm">{formatDate(activity.startDate)}</TableCell>
                        <TableCell className="text-sm">{formatDate(activity.finishDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(activity.percentageComplete || 0) * 100} 
                              className="w-16 h-2" 
                            />
                            <span className="text-xs">
                              {((activity.percentageComplete || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                        No late activities
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
  );
}
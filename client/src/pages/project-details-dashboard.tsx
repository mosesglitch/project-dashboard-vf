import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Navbar } from "@/components/navbar";
import { ProjectMap } from "@/components/dashboard/project-map";
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

const formatDate = (excelDate: number | string) => {
  if (typeof excelDate === 'string') {
    return new Date(excelDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short", 
      day: "numeric",
    });
  }
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

const getStatusIcon = (percentageComplete: number | string) => {
  const progress = typeof percentageComplete === 'string' ? parseFloat(percentageComplete) || 0 : percentageComplete;
  if (progress >= 1) return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (progress > 0) return <Clock className="w-4 h-4 text-yellow-600" />;
  return <Calendar className="w-4 h-4 text-blue-600" />;
};

const getProgressColor = (percentageComplete: number | string) => {
  const progress = typeof percentageComplete === 'string' ? parseFloat(percentageComplete) || 0 : percentageComplete;
  if (progress >= 1) return "bg-green-500";
  if (progress > 0.8) return "bg-yellow-500";
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="p-4 md:p-6">
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
              {((project.scopeCompletion || 0) * 100).toFixed(0)}%
            </div>
            <Progress value={(project.scopeCompletion || 0) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="kpi-time-completion">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Completion</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {((project.timeCompletion || 0) * 100).toFixed(0)}%
            </div>
            <Progress value={Math.min((project.timeCompletion || 0) * 100, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="kpi-performance-category">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {getStatusBadge(project.performanceCategory || 'Unknown')}
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
              {getBudgetStatusBadge(project.budgetStatusCategory || 'Unknown')}
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
              {((project.deviationProfitMargin || 0) * 100).toFixed(1)}%
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
                  <p className="text-lg font-semibold">{formatDate(project.startDate || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Finish Date</p>
                  <p className="text-lg font-semibold">{formatDate(project.finishDate || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Division</p>
                  <p className="text-lg font-semibold">{project.division}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Performance Index</p>
                  <p className="text-lg font-semibold">
                    {(project.performanceIndex || 0).toFixed(2)}
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
                (() => {
                  // Order milestones by phase: Preliminaries, Procurement, Construction, Commissioning
                  const phaseOrder = ['Preliminaries', 'Procurement', 'Construction', 'Commissioning'];
                  const orderedMilestones = milestones.sort((a, b) => {
                    const aPhase = phaseOrder.findIndex(phase => 
                      a.item.toLowerCase().includes(phase.toLowerCase()));
                    const bPhase = phaseOrder.findIndex(phase => 
                      b.item.toLowerCase().includes(phase.toLowerCase()));
                    
                    if (aPhase === -1 && bPhase === -1) return 0;
                    if (aPhase === -1) return 1;
                    if (bPhase === -1) return -1;
                    return aPhase - bPhase;
                  });

                  return orderedMilestones.map((milestone, index) => {
                    const progress = typeof milestone.percentageComplete === 'string' ? 
                      parseFloat(milestone.percentageComplete) || 0 : milestone.percentageComplete || 0;
                    const isComplete = progress >= 1;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                          isComplete 
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200' 
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(progress)}
                          <div>
                            <p className={`font-medium text-sm ${
                              isComplete ? 'text-green-800 dark:text-green-200' : ''
                            }`}>
                              {milestone.item}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(milestone.startDate || 0)} - {formatDate(milestone.finishDate || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={progress * 100} 
                            className={`w-16 h-2 ${isComplete ? 'bg-green-100' : ''}`}
                          />
                          <span className={`text-xs ${
                            isComplete ? 'text-green-600 font-medium' : 'text-muted-foreground'
                          }`}>
                            {(progress * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()
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

        {/* Budget Consumption Chart */}
        <Card data-testid="card-budget-chart" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Budget vs Time vs Scope Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Performance Comparison Chart */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Performance Comparison</h4>
                
                {/* Budget vs Expected Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budget Consumption</span>
                    <span className={`font-medium ${
                      (project.budgetSpent || 0) > (project.scopeCompletion || 0) ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {((project.budgetSpent || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        (project.budgetSpent || 0) > (project.scopeCompletion || 0) ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((project.budgetSpent || 0) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Scope Completion */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scope Completion</span>
                    <span className="font-medium text-blue-600">
                      {((project.scopeCompletion || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(project.scopeCompletion || 0) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Time Completion */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Time Elapsed</span>
                    <span className={`font-medium ${
                      (project.timeCompletion || 0) > 1 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {((project.timeCompletion || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        (project.timeCompletion || 0) > 1 ? 'bg-red-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${Math.min((project.timeCompletion || 0) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Budget Efficiency</p>
                    <p className={`text-sm font-bold ${
                      (project.scopeCompletion || 0) > (project.budgetSpent || 0) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(project.scopeCompletion || 0) > 0 ? 
                        (((project.scopeCompletion || 0) / (project.budgetSpent || 0.01)) * 100).toFixed(0) + '%' : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Schedule Performance</p>
                    <p className={`text-sm font-bold ${
                      (project.scopeCompletion || 0) > (project.timeCompletion || 0) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(project.timeCompletion || 0) > 0 ? 
                        (((project.scopeCompletion || 0) / (project.timeCompletion || 0.01)) * 100).toFixed(0) + '%' : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Overall Index</p>
                    <p className="text-sm font-bold text-blue-600">
                      {(project.performanceIndex || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-lg font-bold">{formatCurrency(project.budgetAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Spent</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(project.totalAmountSpent)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(Math.max(0, project.budgetAmount - project.totalAmountSpent))}
                  </p>
                </div>
              </div>

              {/* Margin Analysis */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Projected Margin</p>
                  <p className="text-xl font-bold">{((project.projectedGrossMargin || 0) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Margin</p>
                  <p className="text-xl font-bold">{((project.actualGrossMargin || 0) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities Section - Full Width */}
      <div className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upcoming Activities - 3/4 width */}
          <Card data-testid="card-upcoming-activities" className="lg:col-span-3">
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
                          <TableCell className="text-sm">{formatDate(activity.startDate || 0)}</TableCell>
                          <TableCell className="text-sm">{formatDate(activity.finishDate || 0)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={typeof activity.percentageComplete === 'string' ? 
                                  (parseFloat(activity.percentageComplete) || 0) * 100 : 
                                  (activity.percentageComplete || 0) * 100} 
                                className="w-16 h-2" 
                              />
                              <span className="text-xs">
                                {typeof activity.percentageComplete === 'string' ? 
                                  ((parseFloat(activity.percentageComplete) || 0) * 100).toFixed(0) : 
                                  ((activity.percentageComplete || 0) * 100).toFixed(0)}%
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

          {/* Late Activities - 1/4 width - Compact */}
          <Card data-testid="card-late-activities" className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Late Tasks ({lateActivities?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {lateActivities && lateActivities.length > 0 ? (
                  lateActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="p-2 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-xs text-red-800 dark:text-red-200">
                          {activity.item}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div>
                            <span>{formatDate(activity.finishDate || 0)}</span>
                            <div className="text-red-600 font-medium mt-1">
                              Late by: {(() => {
                                const finishDate = new Date(1899, 11, 30);
                                finishDate.setTime(finishDate.getTime() + ((activity.finishDate || 0) * 24 * 60 * 60 * 1000));
                                const today = new Date();
                                const diffTime = today.getTime() - finishDate.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                return diffDays > 0 ? `${diffDays} days` : '0 days';
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Progress 
                              value={typeof activity.percentageComplete === 'string' ? 
                                (parseFloat(activity.percentageComplete) || 0) * 100 : 
                                (activity.percentageComplete || 0) * 100} 
                              className="w-8 h-1" 
                            />
                            <span>
                              {typeof activity.percentageComplete === 'string' ? 
                                ((parseFloat(activity.percentageComplete) || 0) * 100).toFixed(0) : 
                                ((activity.percentageComplete || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground text-sm">No late activities</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Project Location Map */}
        <div className="mt-6">
          <ProjectMap projects={project ? [project] : []} />
        </div>
      </div>
    </div>
  );
}
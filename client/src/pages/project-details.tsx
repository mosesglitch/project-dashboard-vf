import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download } from "lucide-react";
import type { Project } from "@shared/schema";

export default function ProjectDetails() {
  const { id } = useParams();

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ['/api/projects', id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    }
  });

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRemainingBudget = () => {
    if (!project) return 0;
    const budget = parseFloat(project.budget);
    const spent = parseFloat(project.actualSpend);
    const commitments = parseFloat(project.commitments);
    return budget - spent - commitments;
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-gray-300';
      case 'delayed':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getRiskSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'high':
        return 'destructive';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRiskBorderColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'border-green-400';
      case 'medium':
        return 'border-yellow-400';
      case 'high':
        return 'border-red-400';
      case 'critical':
        return 'border-red-600';
      default:
        return 'border-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-12 w-80 mb-2" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-lg">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-8" data-testid="button-back-to-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Project Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              The project you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const milestones = project.milestones as any[] || [];
  const risks = project.risks as any[] || [];
  const upcomingActivities = project.upcomingActivities as any[] || [];
  const performanceMetrics = project.performanceMetrics as any || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="button-back-to-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                data-testid="text-project-name"
              >
                {project.name}
              </h1>
              <p 
                className="text-lg text-gray-600 dark:text-gray-400"
                data-testid="text-project-code"
              >
                {project.code}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {project.description}
              </p>
            </div>
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-export-project"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Project Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Project Manager:</span>
                  <span 
                    className="text-gray-900 dark:text-white font-medium"
                    data-testid="text-project-manager"
                  >
                    {project.manager}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                  <span 
                    className="text-gray-900 dark:text-white"
                    data-testid="text-start-date"
                  >
                    {formatDate(project.startDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                  <span 
                    className="text-gray-900 dark:text-white"
                    data-testid="text-end-date"
                  >
                    {formatDate(project.endDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Division:</span>
                  <span 
                    className="text-gray-900 dark:text-white capitalize"
                    data-testid="text-division"
                  >
                    {project.division}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <Badge 
                    variant={project.status === 'completed' ? 'default' : project.status === 'active' ? 'secondary' : 'destructive'}
                    data-testid="badge-project-status"
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Completion:</span>
                  <span 
                    className="text-gray-900 dark:text-white font-medium"
                    data-testid="text-project-completion"
                  >
                    {project.percentComplete}%
                  </span>
                </div>
              </div>
            </div>

            {/* Budget Details */}
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Budget Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Budget (BAC):</span>
                  <span 
                    className="text-gray-900 dark:text-white font-medium"
                    data-testid="text-budget"
                  >
                    {formatCurrency(project.budget)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Actual Spend (AC):</span>
                  <span 
                    className="text-gray-900 dark:text-white"
                    data-testid="text-actual-spend"
                  >
                    {formatCurrency(project.actualSpend)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Commitments:</span>
                  <span 
                    className="text-gray-900 dark:text-white"
                    data-testid="text-commitments"
                  >
                    {formatCurrency(project.commitments)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Forecast (EAC):</span>
                  <span 
                    className="text-gray-900 dark:text-white"
                    data-testid="text-forecast"
                  >
                    {formatCurrency(project.forecast)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount Received:</span>
                  <span 
                    className="text-gray-900 dark:text-white"
                    data-testid="text-amount-received"
                  >
                    {formatCurrency(project.amountReceived)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Remaining Budget:</span>
                  <span 
                    className={`font-medium ${getRemainingBudget() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    data-testid="text-remaining-budget"
                  >
                    {formatCurrency(getRemainingBudget().toString())}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Performance Metrics
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Cost Performance Index (CPI):</span>
                    <div 
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                      data-testid="text-cpi"
                    >
                      {performanceMetrics.cpi?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Schedule Performance Index (SPI):</span>
                    <div 
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                      data-testid="text-spi"
                    >
                      {performanceMetrics.spi?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Earned Value (EV):</span>
                    <div 
                      className="text-lg font-semibold text-gray-900 dark:text-white"
                      data-testid="text-ev"
                    >
                      {performanceMetrics.ev ? formatCurrency(performanceMetrics.ev.toString()) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Planned Value (PV):</span>
                    <div 
                      className="text-lg font-semibold text-gray-900 dark:text-white"
                      data-testid="text-pv"
                    >
                      {performanceMetrics.pv ? formatCurrency(performanceMetrics.pv.toString()) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mt-4 pt-4 border-t">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Cost Variance (CV):</span>
                  <div 
                    className={`text-lg font-semibold ${performanceMetrics.cv >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    data-testid="text-cv"
                  >
                    {performanceMetrics.cv ? formatCurrency(performanceMetrics.cv.toString()) : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Schedule Variance (SV):</span>
                  <div 
                    className={`text-lg font-semibold ${performanceMetrics.sv >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    data-testid="text-sv"
                  >
                    {performanceMetrics.sv ? formatCurrency(performanceMetrics.sv.toString()) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Milestones */}
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Milestones
              </h2>
              <div className="space-y-4">
                {milestones.length > 0 ? (
                  milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <div 
                          className={`w-4 h-4 ${getMilestoneStatusColor(milestone.status)} rounded-full mr-3`}
                        />
                        <div>
                          <div 
                            className="font-medium text-gray-900 dark:text-white"
                            data-testid={`text-milestone-${index}`}
                          >
                            {milestone.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {milestone.status.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {milestone.date}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No milestones defined
                  </p>
                )}
              </div>
            </div>

            {/* Risks and Issues */}
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Risks & Issues
              </h2>
              <div className="space-y-4">
                {risks.length > 0 ? (
                  risks.map((risk, index) => (
                    <div 
                      key={index} 
                      className={`border-l-4 ${getRiskBorderColor(risk.severity)} pl-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-r-lg`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div 
                          className="font-medium text-gray-900 dark:text-white"
                          data-testid={`text-risk-title-${index}`}
                        >
                          {risk.title}
                        </div>
                        <Badge 
                          variant={getRiskSeverityBadge(risk.severity)}
                          data-testid={`badge-risk-severity-${index}`}
                        >
                          {risk.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Owner: {risk.owner}</div>
                        <div className="capitalize">Status: {risk.status.replace('_', ' ')}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No risks identified
                  </p>
                )}
              </div>
            </div>

            {/* Upcoming Activities */}
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Upcoming Activities (Next 30 Days)
              </h2>
              <div className="space-y-3">
                {upcomingActivities.length > 0 ? (
                  upcomingActivities.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span 
                        className="text-gray-900 dark:text-white"
                        data-testid={`text-activity-${index}`}
                      >
                        {activity.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.date}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No upcoming activities
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
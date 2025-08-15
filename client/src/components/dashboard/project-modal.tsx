import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, X } from "lucide-react";
import type { Project } from "@shared/schema";

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
  if (!project) return null;

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

  const milestones = project.milestones as any[] || [];
  const risks = project.risks as any[] || [];
  const upcomingActivities = project.upcomingActivities as any[] || [];
  const performanceMetrics = project.performanceMetrics as any || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle 
                className="text-lg font-semibold text-gray-900 dark:text-white"
                data-testid="text-modal-project-name"
              >
                {project.name}
              </DialogTitle>
              <p 
                className="text-sm text-gray-600 dark:text-gray-400"
                data-testid="text-modal-project-code"
              >
                {project.code}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Project Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Project Manager:</span>
                  <span 
                    className="text-gray-900 dark:text-white"
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
              </div>
            </div>

            {/* Budget Details */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Budget Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Budget (BAC):</span>
                  <span 
                    className="text-gray-900 dark:text-white"
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
                  <span className="text-gray-600 dark:text-gray-400">Remaining Budget:</span>
                  <span 
                    className={`${getRemainingBudget() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    data-testid="text-remaining-budget"
                  >
                    {formatCurrency(getRemainingBudget().toString())}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Performance Metrics
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">CPI:</span>
                  <span 
                    className="ml-2 text-gray-900 dark:text-white"
                    data-testid="text-cpi"
                  >
                    {performanceMetrics.cpi?.toFixed(2) || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">SPI:</span>
                  <span 
                    className="ml-2 text-gray-900 dark:text-white"
                    data-testid="text-spi"
                  >
                    {performanceMetrics.spi?.toFixed(2) || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">EV:</span>
                  <span 
                    className="ml-2 text-gray-900 dark:text-white"
                    data-testid="text-ev"
                  >
                    {performanceMetrics.ev ? formatCurrency(performanceMetrics.ev.toString()) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">PV:</span>
                  <span 
                    className="ml-2 text-gray-900 dark:text-white"
                    data-testid="text-pv"
                  >
                    {performanceMetrics.pv ? formatCurrency(performanceMetrics.pv.toString()) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">CV:</span>
                  <span 
                    className={`ml-2 ${performanceMetrics.cv >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    data-testid="text-cv"
                  >
                    {performanceMetrics.cv ? formatCurrency(performanceMetrics.cv.toString()) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">SV:</span>
                  <span 
                    className={`ml-2 ${performanceMetrics.sv >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    data-testid="text-sv"
                  >
                    {performanceMetrics.sv ? formatCurrency(performanceMetrics.sv.toString()) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Milestones */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Milestones
              </h4>
              <div className="space-y-3">
                {milestones.length > 0 ? (
                  milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className={`w-3 h-3 ${getMilestoneStatusColor(milestone.status)} rounded-full mr-3`}
                        />
                        <span 
                          className="text-sm text-gray-900 dark:text-white"
                          data-testid={`text-milestone-${index}`}
                        >
                          {milestone.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {milestone.date}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No milestones defined
                  </p>
                )}
              </div>
            </div>

            {/* Risks and Issues */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Risks & Issues
              </h4>
              <div className="space-y-3">
                {risks.length > 0 ? (
                  risks.map((risk, index) => (
                    <div 
                      key={index} 
                      className={`border-l-4 ${getRiskBorderColor(risk.severity)} pl-3`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p 
                            className="text-sm font-medium text-gray-900 dark:text-white"
                            data-testid={`text-risk-title-${index}`}
                          >
                            {risk.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Owner: {risk.owner}
                          </p>
                        </div>
                        <Badge 
                          variant={getRiskSeverityBadge(risk.severity)}
                          data-testid={`badge-risk-severity-${index}`}
                        >
                          {risk.severity}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No risks identified
                  </p>
                )}
              </div>
            </div>

            {/* Upcoming Activities */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Upcoming Activities (Next 30 Days)
              </h4>
              <div className="space-y-2">
                {upcomingActivities.length > 0 ? (
                  upcomingActivities.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span 
                        className="text-sm text-gray-900 dark:text-white"
                        data-testid={`text-activity-${index}`}
                      >
                        {activity.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.date}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No upcoming activities
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-export-details"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Details
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-close-modal-footer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

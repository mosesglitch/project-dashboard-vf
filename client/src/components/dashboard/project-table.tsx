import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, ChevronUp, ChevronDown } from "lucide-react";
import type { Project } from "@shared/schema";

interface ProjectTableProps {
  projects: Project[] | undefined;
  isLoading: boolean;
  onProjectSelect: (project: Project) => void;
}

type SortField = 'code' | 'name' | 'percentComplete' | 'status' | 'budgetVarianceCategory';
type SortOrder = 'asc' | 'desc';

export function ProjectTable({ projects, isLoading, onProjectSelect }: ProjectTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'; // blue
      case 'active':
        return 'secondary'; // green
      case 'delayed':
        return 'destructive'; // red
      default:
        return 'outline'; // yellow/at risk
    }
  };

  const getBudgetVarianceBadge = (category: string) => {
    switch (category) {
      case 'under_budget':
        return { variant: 'secondary' as const, text: 'Under Budget' };
      case 'within_budget':
        return { variant: 'default' as const, text: 'Within Budget' };
      case 'overspent':
        return { variant: 'outline' as const, text: 'Overspent' };
      case 'critical_overspent':
        return { variant: 'destructive' as const, text: 'Critical Overspent' };
      default:
        return { variant: 'outline' as const, text: 'Unknown' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'active':
        return 'On Track';
      case 'delayed':
        return 'Delayed';
      default:
        return 'At Risk';
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  const calculateProfitDeviation = (project: Project) => {
    const plannedMargin = (parseFloat(project.plannedRevenue) - parseFloat(project.plannedCost)) / parseFloat(project.plannedRevenue);
    const actualMargin = (parseFloat(project.actualRevenue) - parseFloat(project.actualCost)) / parseFloat(project.actualRevenue);
    const deviation = ((actualMargin - plannedMargin) / plannedMargin) * 100;
    return `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%`;
  };

  const filteredAndSortedProjects = projects
    ?.filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.manager.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'percentComplete') {
        aValue = a.percentComplete;
        bValue = b.percentComplete;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-900">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 
            className="text-lg font-semibold text-gray-900 dark:text-white"
            data-testid="text-project-table-title"
          >
            Project Portfolio
          </h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-project-search"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            <Button 
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('code')}
                  data-testid="header-project-code"
                >
                  <div className="flex items-center space-x-1">
                    <span>Project Code</span>
                    <SortIcon field="code" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('name')}
                  data-testid="header-project-name"
                >
                  <div className="flex items-center space-x-1">
                    <span>Project Name</span>
                    <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('percentComplete')}
                  data-testid="header-completion"
                >
                  <div className="flex items-center space-x-1">
                    <span>% Completion</span>
                    <SortIcon field="percentComplete" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time Completion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Budget Variance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Risk Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Profit Deviation
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('status')}
                  data-testid="header-status"
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <SortIcon field="status" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedProjects?.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => onProjectSelect(project)}
                  data-testid={`row-project-${project.id}`}
                >
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                    data-testid={`text-project-code-${project.id}`}
                  >
                    {project.code}
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    data-testid={`text-project-name-${project.id}`}
                  >
                    {project.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-3">
                      <Progress value={project.percentComplete} className="w-16" />
                      <span data-testid={`text-completion-${project.id}`}>
                        {project.percentComplete}%
                      </span>
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    data-testid={`text-time-completion-${project.id}`}
                  >
                    {project.elapsedDays}/{project.totalPlannedDays} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant={getBudgetVarianceBadge(project.budgetVarianceCategory).variant}
                      data-testid={`badge-budget-variance-${project.id}`}
                    >
                      {getBudgetVarianceBadge(project.budgetVarianceCategory).text}
                    </Badge>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    data-testid={`text-risk-count-${project.id}`}
                  >
                    {project.riskCount}
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    data-testid={`text-amount-received-${project.id}`}
                  >
                    {formatCurrency(project.amountReceived)}
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    data-testid={`text-profit-deviation-${project.id}`}
                  >
                    {calculateProfitDeviation(project)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant={getStatusBadgeVariant(project.status)}
                      data-testid={`badge-status-${project.id}`}
                    >
                      {getStatusText(project.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

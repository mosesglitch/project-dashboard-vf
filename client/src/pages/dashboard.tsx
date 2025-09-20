import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NumericSideIndicator,
  AnalyticalCardHeader,
} from "@ui5/webcomponents-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CalendarIcon,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  PieChart,
  Filter,
  ArrowRight,
  X,Table as TableIcon
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ProjectMap } from "@/components/dashboard/project-map";
import { AIInsights } from "@/components/ai-insights";
import { ProjectDetailsModal } from "@/components/project-details-modal";
import { FilterModal } from "@/components/filter-modal";
import type { ExcelProject } from "@shared/excel-schema";
import type { DashboardFilters } from "@/lib/types";
import { dataService } from "@/lib/dataService";
import {
  DonutChart,
  BarChart,
  ColumnChart,
} from "@ui5/webcomponents-react-charts";
import ProjectDetailsDashboard from "./project-details-dashboard";
import ProjectDetails from "@/components/unusedPages/project-details";
import { useTheme } from "@/components/theme-provider";
type Project = {
  code: string;
  budget: number;
  risks: number;
  progress: number;
};
export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    status: "all",
    division: "all",
    budgetStatus: "all",
    performanceStatus: "all",
    dateFrom: "",
    dateTo: "",
  });
  const [sortField, setSortField] = useState();
  const [sortAsc, setSortAsc] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | number | null
  >(null);
  console.log(filters, "filters");
  // Get data from local data service
  const projects = useMemo(() => {
    return dataService.getProjects({
      status: filters.status,
      division: filters.division,
      budgetStatus: filters.budgetStatus,
      performanceStatus: filters.performanceStatus,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });
  }, [filters]);
  const projectsLoading = false;
  const kpiData = useMemo(() => dataService.getOverviewStats(), []);
  console.log(kpiData, "KPIdata");
  const performanceStats = useMemo(
    () => dataService.getPerformanceCategoryStats(),
    []
  );
  const spendingStats = useMemo(
    () => dataService.getSpendingCategoriesStats(),
    []
  );
  const divisionStats = useMemo(() => dataService.getDivisionStats(), []);

  // Suppose `projects` is your array of project objects
  const topProjects = [...(projects || [])]
    .sort((a, b) => (b.coAmount || 0) - (a.coAmount || 0)) // sort descending
    .slice(0, 15); // pick top 10

  const sortedProjects = [...(projects || [])]?.sort((a, b) => {
    let aVal, bVal;

    switch (sortField) {
      case "progress":
        // multiply by 100 to treat as percentage
        aVal = (a.percentageComplete || 0) * 100;
        bVal = (b.percentageComplete || 0) * 100;
        break;
        break;
      case "budget":
        aVal = a.budgetAmount;
        bVal = b.budgetAmount;
        break;
      case "risks":
        aVal = a.issuesRisks || 0;
        bVal = b.issuesRisks || 0;
        break;
      case "code":
        aVal = a.projectCode;
        bVal = b.projectCode;
        break;
      default:
        aVal = 0;
        bVal = 0;
    }

    // Numeric sort
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }

    // String sort
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc); // toggle order
    } else {
      setSortField(field);
      setSortAsc(false); // default descending
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    // Handle NaN, null, undefined, or empty string values
    const validAmount =
      typeof amount === "number" && !isNaN(amount) ? amount : 0;

    if (validAmount >= 1000000) {
      return `Ksh ${(validAmount / 1000000).toFixed(1)}M`;
    } else if (validAmount >= 1000) {
      return `Ksh ${(validAmount / 1000).toFixed(0)}K`;
    }
    return `Ksh ${validAmount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("on track")) {
      return <Badge className="bg-green-100 text-green-800">On Track</Badge>;
    } else if (statusLower.includes("delay")) {
      return <Badge className="bg-red-100 text-red-800">Delayed</Badge>;
    } else if (statusLower.includes("behind")) {
      return <Badge className="bg-yellow-100 text-yellow-800">Behind</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getBudgetStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("under")) {
      return (
        <Badge className="bg-green-100 text-green-800">Under Budget</Badge>
      );
    } else if (statusLower.includes("within")) {
      return <Badge className="bg-blue-100 text-blue-800">Within Budget</Badge>;
    } else if (statusLower.includes("over")) {
      return <Badge className="bg-red-100 text-red-800">Over Budget</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };
  const { theme, setTheme } = useTheme();
  if (
    selectedProjectId &&
    selectedProjectId !== "null" &&
    selectedProjectId !== "undefined"
  ) {
    return (
      <ProjectDetailsDashboard
        id={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
      />
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="px-4 md:px-6 pt-3">
        {/* Header */}

        {/* Filter Button */}
        <div className="mb-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Filter indicator */}
            {(filters.division !== "all" ||
              filters.status !== "all" ||
              filters.budgetStatus !== "all" ||
              filters.performanceStatus !== "all" ||
              filters.dateFrom ||
              filters.dateTo) && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Filters applied
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      status: "all",
                      division: "all",
                      budgetStatus: "all",
                      performanceStatus: "all",
                      dateFrom: "",
                      dateTo: "",
                    })
                  }
                  data-testid="button-open-filters"
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterModalOpen(true)}
            data-testid="button-open-filters"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* KPI Cards */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 ">
              <Card data-testid="tile-total-projects">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                  <CardTitle className="text-sm font-medium">
                    Total Projects
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {kpiData?.totalProjects
                      ? Math.round(kpiData.totalProjects).toString()
                      : "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active portfolio
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="tile-total-budget">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                  <CardTitle className="text-sm font-medium">
                    Total Budget
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {kpiData ? formatCurrency(kpiData.totalBudget) : "$0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Allocated funds estimate
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="tile-actual-spend">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                  <CardTitle className="text-sm font-medium">
                    Actual Spend
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {kpiData ? formatCurrency(kpiData.totalSpent) : "$0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current spending estimate
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="tile-amount-received">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                  <CardTitle className="text-sm font-medium">
                    Amount Received
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {kpiData ? formatCurrency(97000000) : "$0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Revenue collected estimate
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="tile-total-risks">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                  <CardTitle className="text-sm font-medium">
                    Total Risks
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{"12"}</div>
                  <p className="text-xs text-muted-foreground">Active risks</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Budget Overview Section */}
          {/* <div className="lg:col-span-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Budget Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Allocated:</span>
                        <span className="font-semibold">{kpiData ? formatCurrency(kpiData.totalBudget) : 'KSh 0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Spent:</span>
                        <span className="font-semibold text-orange-600">{kpiData ? formatCurrency(kpiData.actualSpend) : 'KSh 0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Received:</span>
                        <span className="font-semibold text-green-600">{kpiData ? formatCurrency(kpiData.amountReceived) : 'KSh 0'}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm text-muted-foreground">Available Budget:</span>
                        <span className="font-semibold text-blue-600">
                          {kpiData ? formatCurrency(Math.max(0, kpiData.totalBudget - kpiData.actualSpend)) : 'KSh 0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Budget Utilization</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Spent</span>
                          <span className="text-sm">{kpiData && kpiData.totalBudget > 0 ? ((kpiData.actualSpend / kpiData.totalBudget) * 100).toFixed(1) : '0'}%</span>
                        </div>
                        <Progress 
                          value={kpiData && kpiData.totalBudget > 0 ? (kpiData.actualSpend / kpiData.totalBudget) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Received</span>
                          <span className="text-sm">{kpiData && kpiData.totalBudget > 0 ? ((kpiData.amountReceived / kpiData.totalBudget) * 100).toFixed(1) : '0'}%</span>
                        </div>
                        <Progress 
                          value={kpiData && kpiData.totalBudget > 0 ? (kpiData.amountReceived / kpiData.totalBudget) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Budget Status</h3>
                    <div className="space-y-2">
                      {spendingStats ? (
                        Object.entries(spendingStats).map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-sm">{status}:</span>
                            <Badge variant="outline" className="ml-2">
                              {count as number} projects
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No budget status data</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* AI Insights Section */}

          {/* Charts Row */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 ">
              {/* Division Projects Chart */}
              <Card data-testid="card-division-chart">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Projects by Division
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {divisionStats &&
                  Array.isArray(divisionStats) &&
                  divisionStats.length > 0 ? (
                    <BarChart
                      dataset={divisionStats}
                      dimensions={[{ accessor: "name", label: "Division" }]}
                      measures={[{ accessor: "projects", label: "Projects" }]}
                      style={{ height: "220px" }}
                      onDataPointClick={(e) => {
                        const division = e?.detail.payload.name;
                        console.log(division, "division", e);
                        if (division) {
                          setFilters((prev) => ({
                            ...prev,
                            division,
                          }));
                        }
                      }}
                      onClick={() => {}}
                      onLegendClick={() => {}}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No data
                    </span>
                  )}
                </CardContent>
              </Card>
              <Card data-testid="card-division-coamount-chart">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    CO Amount by Division
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projects && projects.length > 0 ? (
                    <DonutChart
                      dataset={Object.values(
                        projects.reduce<
                          Record<string, { division: string; value: number }>
                        >((acc, project) => {
                          const div = project.division || "Unknown";
                          if (!acc[div]) {
                            acc[div] = { division: div, value: 0 };
                          }
                          acc[div].value += Math.round(project.coAmount || 0);
                          return acc;
                        }, {})
                      )}
                      dimension={{ accessor: "division" }}
                      measure={{
                        accessor: "value",
                        formatter: (val) => formatCurrency(Number(val)),
                      }}
                      onDataPointClick={(e) => {
                        const division = e?.detail.name;
                        console.log(division, "division");
                        if (division) {
                          setFilters((prev) => ({
                            ...prev,
                            division,
                          }));
                        }
                      }}
                      onClick={(e) => console.log("Chart clicked", e)}
                      onLegendClick={(e) => console.log("Legend clicked", e)}
                      style={{ height: "220px" }}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No data
                    </span>
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
                  {projects && projects.length > 0 ? (
                    <DonutChart
                      dataset={Object.values(
                        projects.reduce<
                          Record<string, { category: string; value: number }>
                        >((acc, project) => {
                          const cat = project.performanceCategory || "Unknown";
                          if (!acc[cat]) {
                            acc[cat] = { category: cat, value: 0 };
                          }
                          acc[cat].value += 1;
                          return acc;
                        }, {})
                      )}
                      dimension={{ accessor: "category" }}
                      measure={{ accessor: "value" }}
                      onDataPointClick={(e) => {
                        const performanceStatus = e?.detail.name;
                        if (performanceStatus) {
                          setFilters((prev) => ({
                            ...prev,
                            performanceStatus,
                          }));
                        }
                      }}
                      onClick={() => {}}
                      onLegendClick={() => {}}
                      style={{ height: "220px" }}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No data
                    </span>
                  )}
                </CardContent>
              </Card>

              {/* Budget Status Chart */}
              <Card data-testid="card-budget-status-chart">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 " >
                    <PieChart className="h-5 w-5" />

                    Budget Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projects && projects.length > 0 ? (
                    <DonutChart
                      dataset={Object.values(
                        projects.reduce<
                          Record<string, { status: string; value: number }>
                        >((acc, project) => {
                          const status =
                            project.budgetStatusCategory || "Unknown";
                          if (!acc[status]) {
                            acc[status] = { status, value: 0 };
                          }
                          acc[status].value += 1;
                          return acc;
                        }, {})
                      )}
                      dimension={{ accessor: "status" }}
                      measure={{ accessor: "value" }}
                      onDataPointClick={(e) => {
                        const budgetStatus = e?.detail.name;
                        console.log(e, budgetStatus, "budgetStatus");
                        if (budgetStatus) {
                          setFilters((prev) => ({
                            ...prev,
                            budgetStatus,
                          }));
                        }
                      }}
                      onClick={() => {}}
                      onLegendClick={() => {}}
                      style={{ height: "220px" }}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No data
                    </span>
                  )}
                </CardContent>
              </Card>

              {/* Performance Status Chart */}
              {/* <Card data-testid="card-status-chart">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <PieChart className="h-5 w-5" />
      Performance Status
    </CardTitle>
  </CardHeader>
  <CardContent>
    {projects && projects.length > 0 ? (
      <DonutChart
        dataset={Object.values(
          projects.reduce<
            Record<string, { category: string; value: number }>
          >((acc, project) => {
            const cat = project.performanceCategory || "Unknown";
            if (!acc[cat]) {
              acc[cat] = { category: cat, value: 0 };
            }
            acc[cat].value += Math.round(project.coAmount || 0);
            return acc;
          }, {})
        )}
        dimension={{ accessor: "category" }}
        measure={{ accessor: "value" }}
        onClick={() => {}}
        onDataPointClick={() => {}}
        onLegendClick={() => {}}
        style={{ height: "220px" }}
      />
    ) : (
      <span className="text-sm text-muted-foreground">No data</span>
    )}
  </CardContent>
</Card> */}

              {/* Budget Status Chart */}
              {/* <Card data-testid="card-budget-status-chart">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <PieChart className="h-5 w-5" />
      Budget Status
    </CardTitle>
  </CardHeader>
  <CardContent>
    {projects && projects.length > 0 ? (
      <DonutChart
        dataset={Object.values(
          projects.reduce<
            Record<string, { status: string; value: number }>
          >((acc, project) => {
            const status = project.budgetStatusCategory || "Unknown";
            if (!acc[status]) {
              acc[status] = { status, value: 0 };
            }
            acc[status].value += Math.round(project.coAmount || 0);
            return acc;
          }, {})
        )}
        dimension={{ accessor: "status" }}
        measure={{ accessor: "value" }}
        onClick={() => {}}
        onDataPointClick={() => {}}
        onLegendClick={() => {}}
        style={{ height: "220px" }}
      />
    ) : (
      <span className="text-sm text-muted-foreground">No data</span>
    )}
  </CardContent>
</Card> */}
            </div>
          </div>
          {/* currentMargin: (p.coAmount || 0) - (p.totalAmountSpent || 0),
          targetMargin: (p.coAmount || 0) - (p.budgetAmount || 0),
          deviationPercentage:
          p.coAmount && p.budgetAmount && p.totalAmountSpent
          ? (
          (((p.coAmount - p.totalAmountSpent) -
          (p.coAmount - p.budgetAmount)) /
          Math.max(1, p.coAmount - p.budgetAmount)) *
          100
          ).toFixed(1)
          : "0", */}
          <div className="lg:col-span-4">
            <Card data-testid="card-projects-table">
              {topProjects.length > 0 && (
                <AnalyticalCardHeader
                  className={
                    theme !== "dark"
                      ? "bg-white/10 text-white" // dark theme look
                      : "bg-black/5 text-black" // light theme look
                  }
                  description="Q3,2025"
                  onClick={() => {}}
                  state="Good"
                  subtitleText="Current Profit Margin"
                  titleText={
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign
                        className={`h-4 w-4 ${
                          theme === "dark"
                            ? "text-gray-300"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className={` ${
                          theme === "dark"
                            ? "text-gray-300"
                            : "text-black"
                        }`}>
                        Top 15 Projects by CO amount
                      </span>
                    </CardTitle>
                  }
                  trend="Up"
                  unitOfMeasurement="| Ksh"
                  value={formatCurrency(
                    Number(topProjects[0].coAmount || 0) -
                      Number(topProjects[0].totalAmountSpent || 0)
                  )}
                >
                  <React.Fragment>
                    <NumericSideIndicator
                      number={formatCurrency(
                        Number(topProjects[0].coAmount || 0) -
                          Number(topProjects[0].budgetAmount || 0)
                      )}
                      titleText="Target Margin"
                    />
                    <NumericSideIndicator
                      number={
                        topProjects[0].coAmount &&
                        topProjects[0].budgetAmount &&
                        topProjects[0].totalAmountSpent
                          ? (
                              ((topProjects[0].coAmount -
                                topProjects[0].totalAmountSpent -
                                (topProjects[0].coAmount -
                                  topProjects[0].budgetAmount)) /
                                Math.max(
                                  1,
                                  topProjects[0].coAmount -
                                    topProjects[0].budgetAmount
                                )) *
                              100
                            ).toFixed(1) + "%"
                          : "0%"
                      }
                      state="Critical"
                      titleText="Deviation"
                    />
                  </React.Fragment>
                </AnalyticalCardHeader>
              )}

              <CardContent>
                <ColumnChart
                  dataset={topProjects.map((p) => ({
                    projectCode: p.projectCode.toString(),
                    coAmount: p.coAmount || 0,
                    budgetAmount: p.budgetAmount || 0,
                    totalAmountSpent: p.totalAmountSpent || 0,
                    description: p.description,
                    deviationProfitMargin: p.deviationProfitMargin,
                    budgetSpent: p.budgetSpent,
                  }))}
                  dimensions={[
                    {
                      accessor: "projectCode",
                      formatter: (val) => `#${val}`, // optional formatting for x-axis
                    },
                  ]}
                  measures={[
                    {
                      accessor: "coAmount",
                      label: "CO Amount",
                      formatter: (val) => formatCurrency(val),
                    },
                    {
                      accessor: "budgetAmount",
                      label: "Budget Amount",
                      formatter: (val) => formatCurrency(val),
                    },
                    {
                      accessor: "totalAmountSpent",
                      label: "Actual Spent",
                      formatter: (val) => formatCurrency(val),
                    },
                  ]}
                  tooltipConfig={{
                    formatter: (value: any, name: string, props: any) => {
                      const datum = props.payload;
                      if (datum) {
                        return [
                          formatCurrency(value), // formatted value
                          name,
                          <div
                            key="extra"
                            style={{ fontSize: "0.8em", marginTop: 4 }}
                          >
                            <div>Description: {datum.description}</div>
                            {/* <div>
                              Deviation Margin:{" "}
                              {datum.deviationProfitMargin?.toFixed(2)}
                            </div> */}
                            <div>Budget Spent: {datum.budgetSpent}</div>
                          </div>,
                        ];
                      }
                      return [formatCurrency(value), name];
                    },
                  }}
                  onClick={(e) => console.log("Chart clicked", e)}
                  onDataPointClick={(e) => console.log("Data point clicked", e)}
                  onLegendClick={(e) => console.log("Legend clicked", e)}
                />
              </CardContent>
            </Card>
          </div>
          {/* Projects Table */}
          <div className="lg:col-span-4">
            <Card data-testid="card-projects-table">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div>

                  <TableIcon className="h-5 w-5" />
                  </div>
                  <div className={` ${
                      theme === "dark"
                        ? "text-gray-300"
                        : "text-black"
                    }`}>
                    Project Portfolio
                  </div>
                </CardTitle>
                <Button variant="outline" data-testid="button-export-projects">
                  Export Data
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="overflow-x-auto">
                    <div className="max-h-[500px] overflow-y-auto ">
                      {/* limit table height */}
                      <Table
                        data-testid="table-projects "
                        alternateRowColor={true}
                        filterable={true}
                        sortable={true}
                      >
                        <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                          <TableRow>
                            <TableHead
                              className="sticky top-0 left-0 bg-white dark:bg-gray-900 z-20 cursor-pointer"
                              onClick={() => handleSort("code")}
                              filterable={true}
                            >
                              Project Code{" "}
                              {sortField === "code" && (sortAsc ? "↑" : "↓")}
                            </TableHead>
                            <TableHead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                              Description
                            </TableHead>
                            <TableHead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                              Division
                            </TableHead>
                            <TableHead
                              className="sticky top-0 bg-white dark:bg-gray-900 z-10 cursor-pointer"
                              onClick={() => handleSort("progress")}
                            >
                              Progress{" "}
                              {sortField === "progress" &&
                                (sortAsc ? "↑" : "↓")}
                            </TableHead>
                            <TableHead
                              className="sticky top-0 bg-white dark:bg-gray-900 z-10 cursor-pointer"
                              onClick={() => handleSort("budget")}
                            >
                              Budget{" "}
                              {sortField === "budget" && (sortAsc ? "↑" : "↓")}
                            </TableHead>
                            <TableHead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                              Status
                            </TableHead>
                            <TableHead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                              Budget Status
                            </TableHead>
                            <TableHead
                              className="sticky top-0 bg-white dark:bg-gray-900 z-10 cursor-pointer"
                              onClick={() => handleSort("risks")}
                            >
                              Risks{" "}
                              {sortField === "risks" && (sortAsc ? "↑" : "↓")}
                            </TableHead>
                            <TableHead className="sticky top-0 bg-white dark:bg-gray-900 z-10 w-12">
                              {/* Arrow column - no header text */}
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {projectsLoading ? (
                            <TableRow>
                              <TableCell
                                colSpan={8}
                                className="text-center py-4"
                              >
                                Loading projects...
                              </TableCell>
                            </TableRow>
                          ) : sortedProjects.length > 0 ? (
                            sortedProjects.map((project) => (
                              <TableRow
                                key={project.id}
                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => {
                                  setSelectedProjectId(project.id);
                                  setIsProjectModalOpen(true);
                                }}
                                data-testid={`row-project-${project.projectCode}`}
                              >
                                <TableCell
                                  className="font-medium sticky left-0 bg-white dark:bg-gray-900 z-10 text-blue-600 hover:underline cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProjectId(project.id);
                                    setIsProjectModalOpen(true);
                                  }}
                                >
                                  {project.projectCode}
                                </TableCell>
                                <TableCell
                                  className="max-w-xs truncate"
                                  title={project.description}
                                >
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
                                      {(
                                        project.percentageComplete * 100
                                      ).toFixed(0)}
                                      %
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(project.budgetAmount)}
                                </TableCell>
                                <TableCell>
                                  {project.performanceCategory
                                    ? getStatusBadge(
                                        project.performanceCategory
                                      )
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {project.budgetStatusCategory
                                    ? getBudgetStatusBadge(
                                        project.budgetStatusCategory
                                      )
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      (project.issuesRisks || 0) > 3
                                        ? "destructive"
                                        : "outline"
                                    }
                                  >
                                    {project.issuesRisks || 0}
                                  </Badge>
                                </TableCell>
                                <TableCell className="w-12">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      // e.stopPropagation();
                                      // Use wouter's router to navigate
                                      setSelectedProjectId(project.id);
                                      setIsProjectModalOpen(true);
                                      // window.location.href = `/project/${project.projectCode}`;
                                    }}
                                    data-testid={`button-goto-project-${project.projectCode}`}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={9}
                                className="text-center py-4"
                              >
                                No projects found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="lg:col-span-4 mb-6">
          {/* <AIInsights type="portfolio" /> */}
        </div>
        {/* Project Locations Map */}
        <div className="mt-6">
          <ProjectMap projects={projects || []} />
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Project Details Modal */}
      <ProjectDetailsModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projectId={selectedProjectId}
      />
      {/* <ProjectDetailsDashboard id={selectedProjectId} /> */}
    </div>
  );
}

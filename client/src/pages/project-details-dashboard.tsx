import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Navbar } from "@/components/navbar";
import { ProjectMap } from "@/components/dashboard/project-map";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ArrowRight,
  Circle,
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
  Activity,
} from "lucide-react";

import type { ExcelProject, ExcelActivity } from "@shared/excel-schema";
import { TimelineChart } from "@ui5/webcomponents-react-charts";
import { Text } from "@ui5/webcomponents-react";
import { AIInsights } from "@/components/ai-insights";
import { ProjectAnalytics } from "@/components/project-analytics";

const formatDate = (excelDate: number | string) => {
  if (typeof excelDate === "string") {
    return new Date(excelDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  // Excel date serial number to JavaScript Date
  const excelEpoch = new Date(1899, 11, 30); // Excel's epoch
  const jsDate = new Date(
    excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000
  );
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
  if (statusLower.includes("on track")) {
    return <Badge className="bg-green-100 text-green-800">On Track</Badge>;
  } else if (
    statusLower.includes("delay") ||
    statusLower.includes("critical")
  ) {
    return <Badge className="bg-red-100 text-red-800">Critical Delay</Badge>;
  } else if (statusLower.includes("behind")) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800">Behind Schedule</Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
};

const getBudgetStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("under")) {
    return <Badge className="bg-green-100 text-green-800">Under Budget</Badge>;
  } else if (statusLower.includes("within")) {
    return <Badge className="bg-blue-100 text-blue-800">Within Budget</Badge>;
  } else if (statusLower.includes("over") || statusLower.includes("critical")) {
    return <Badge className="bg-red-100 text-red-800">Over Budget</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
};

const getStatusIcon = (percentageComplete: number | string) => {
  const progress =
    typeof percentageComplete === "string"
      ? parseFloat(percentageComplete) || 0
      : percentageComplete;
  if (progress >= 1) return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (progress > 0) return <Clock className="w-4 h-4 text-yellow-600" />;
  return <Calendar className="w-4 h-4 text-blue-600" />;
};

const getProgressColor = (percentageComplete: number | string) => {
  const progress =
    typeof percentageComplete === "string"
      ? parseFloat(percentageComplete) || 0
      : percentageComplete;
  if (progress >= 1) return "bg-green-500";
  if (progress > 0.8) return "bg-yellow-500";
  return "bg-blue-500";
};

export default function ProjectDetailsDashboard() {
  const [startDateForUpcoming, setStartDateForUpcoming] = useState<string>("");
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
      const response = await fetch(
        `/api/projects/${project?.projectCode}/milestones`
      );
      if (!response.ok) throw new Error("Failed to fetch milestones");
      return response.json();
    },
    enabled: !!project?.projectCode,
  });

  const { data: risks } = useQuery<ExcelActivity[]>({
    queryKey: ["/api/projects", project?.projectCode, "risks"],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${project?.projectCode}/risks`
      );
      if (!response.ok) throw new Error("Failed to fetch risks");
      return response.json();
    },
    enabled: !!project?.projectCode,
  });

  // Helper to calculate duration in days
  function getDuration(
    start: string | number | null,
    finish: string | number | null
  ): number {
    const s =
      typeof start === "number" ? formatDate(start) : formatDate(start || 0);
    const f =
      typeof finish === "number" ? formatDate(finish) : formatDate(finish || 0);
    if (!start || !finish || s === "N/A" || f === "N/A") return 1;
    const startDate = new Date(s).getTime();
    const finishDate = new Date(f).getTime();
    return Math.max(
      1,
      Math.round((finishDate - startDate) / (1000 * 60 * 60 * 24))
    );
  }

  function getTimelineChartData(activities: ExcelActivity[]): any[] {
    // Find the earliest and latest dates among activities
    const validStartDates = activities
      .map((a) => {
        const d = formatDate(a.startDate);
        return d !== "N/A" && a.startDate
          ? new Date(
              typeof a.startDate === "number"
                ? formatDate(a.startDate)
                : a.startDate
            ).getTime()
          : null;
      })
      .filter((t): t is number => t !== null);
    const validFinishDates = activities
      .map((a) => {
        const d = formatDate(a.finishDate);
        return d !== "N/A" && a.finishDate
          ? new Date(
              typeof a.finishDate === "number"
                ? formatDate(a.finishDate)
                : a.finishDate
            ).getTime()
          : null;
      })
      .filter((t): t is number => t !== null);

    const minDate =
      validStartDates.length > 0 ? Math.min(...validStartDates) : null;

    // Assign unique IDs for each activity
    const activityIds = activities.map((activity, idx) =>
      activity.id ? String(activity.id) : `ACT-${idx}`
    );

    return activities.map((activity, idx) => {
      const startDateStr = formatDate(activity.startDate);
      const finishDateStr = formatDate(activity.finishDate);

      // Calculate start offset from earliest date
      let startOffset = 0;
      if (minDate !== null && startDateStr !== "N/A") {
        const activityStart = new Date(startDateStr).getTime();
        startOffset = Math.round(
          (activityStart - minDate) / (1000 * 60 * 60 * 24)
        );
      }

      // Connect to previous activity if exists
      const connections = [];
      if (idx > 0) {
        connections.push({
          itemId: activityIds[idx - 1],
          type: "F2S",
        });
      }

      return {
        color: `var(--sapChart_OrderedColor_${(idx % 11) + 1})`,
        label: activity.item,
        tasks: [
          {
            id: activityIds[idx],
            start: startOffset,
            duration: getDuration(activity.startDate, activity.finishDate),
            connections: connections.length > 0 ? connections : undefined,
          },
        ],
      };
    });
  }

  // TimelineChart rendering function
  function renderTimelineChart(activities: ExcelActivity[]) {
    if (!activities || activities.length === 0)
      return <Text>No timeline data</Text>;

    // Use activities as listed (no sorting)
    const dataset = getTimelineChartData(activities);

    // Adjust all activities so the first activity starts at 1
    const firstStart = dataset[0]?.tasks?.[0]?.start ?? 0;
    const offset = firstStart === 0 ? 1 : 0;

    const adjustedDataset = dataset.map((d, idx) => ({
      ...d,
      tasks: d.tasks.map((task) => ({
        ...task,
        start: task.start + offset,
      })),
    }));

    // Find earliest and latest dates for display (actual dates)
    const validStartDates = activities
      .map((a) => a.startDate)
      .filter((d): d is string | number => !!d && d !== "N/A");
    const validFinishDates = activities
      .map((a) => a.finishDate)
      .filter((d): d is string | number => !!d && d !== "N/A");

    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    if (validStartDates.length > 0) {
      minDate = new Date(
        formatDate(
          validStartDates.reduce((a, b) =>
            new Date(formatDate(a)).getTime() <
            new Date(formatDate(b)).getTime()
              ? a
              : b
          )
        )
      );
    }
    if (validFinishDates.length > 0) {
      maxDate = new Date(
        formatDate(
          validFinishDates.reduce((a, b) =>
            new Date(formatDate(a)).getTime() >
            new Date(formatDate(b)).getTime()
              ? a
              : b
          )
        )
      );
    }

    const start = 1; // Start at 1 instead of 0
    const totalDuration = Math.max(
      ...adjustedDataset.map(
        (d) => (d.tasks?.[0]?.start || 0) + (d.tasks?.[0]?.duration || 0)
      ),
      1
    );

    // Format actual earliest and latest dates for column title, including day of week
    const startDateLabel = minDate
      ? minDate.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";
    const finishDateLabel = maxDate
      ? maxDate.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";
    if (!startDateForUpcoming) {
      setStartDateForUpcoming(startDateLabel);
    }
    return (
      <TimelineChart
        dataset={adjustedDataset}
        isDiscrete
        start={start}
        totalDuration={16}
        columnTitle={`Duration (days)`}
        style={{ width: "100%", paddingBottom: "2rem" }}
      />
    );
  }

  const { data: upcomingActivities } = useQuery<ExcelActivity[]>({
    queryKey: ["/api/projects", project?.projectCode, "upcoming"],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${project?.projectCode}/upcoming`
      );
      if (!response.ok) throw new Error("Failed to fetch upcoming activities");
      return response.json();
    },
    enabled: !!project?.projectCode,
  });

  const { data: lateActivities } = useQuery<ExcelActivity[]>({
    queryKey: ["/api/projects", project?.projectCode, "late"],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${project?.projectCode}/late`
      );
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
  console.log(milestones, "ms");

  const formatDateforMilestones = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = (progress) => {
    if (progress >= 1) {
      return <CheckCircle className="w-6 h-6 text-white" />;
    } else if (progress > 0) {
      return <Clock className="w-6 h-6 text-white" />;
    } else {
      return <Circle className="w-6 h-6 text-white" />;
    }
  };

  const Progress = ({ value, className = "" }) => (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );

  // Order milestones by phase
  const phaseOrder = [
    "Preliminaries",
    "Procurement",
    "Construction",
    "Commissioning",
  ];
  const orderedMilestones =
    milestones &&
    [...milestones]?.sort((a, b) => {
      const aPhase = phaseOrder.findIndex((phase) =>
        a.item.toLowerCase().includes(phase.toLowerCase())
      );
      const bPhase = phaseOrder.findIndex((phase) =>
        b.item.toLowerCase().includes(phase.toLowerCase())
      );

      if (aPhase === -1 && bPhase === -1) return 0;
      if (aPhase === -1) return 1;
      if (bPhase === -1) return -1;
      return aPhase - bPhase;
    });
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-2 ">
        <Navbar
          DisplayTitle={project.projectCode}
          subtitle={project.description}
        />
      </div>
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mx-5">
        <Card data-testid="kpi-scope-completion">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium">
              Scope Completion
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((project.scopeCompletion || 0) * 100).toFixed(0)}%
            </div>
            <Progress
              value={(project.scopeCompletion || 0) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card data-testid="kpi-time-completion">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium">
              Time Completion
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {((project.timeCompletion || 0) * 100).toFixed(0)}%
            </div>
            <Progress
              value={Math.min((project.timeCompletion || 0) * 100, 100)}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card data-testid="kpi-performance-category">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {getStatusBadge(project.performanceCategory || "Unknown")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current status</p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-budget-status">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {getBudgetStatusBadge(project.budgetStatusCategory || "Unknown")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(project.budgetAmount)}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-margin-deviation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium">
              Margin Deviation
            </CardTitle>
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
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
      {/* Project Analytics Section */}
      <div className="mt-6">
        <div>
          {/* <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Project Analytics
              </CardTitle>
            </CardHeader> */}
          <CardContent>
            {project && <ProjectAnalytics project={project} />}
          </CardContent>
          {milestones !== undefined && [...milestones]?.length > 0 && (
            <div data-testid="card-milestones" className=" py-3">
              {/* <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Project Milestones
              <h2 className="text-3xl font-bold  bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
               Project Milestones ({milestones?.length || 0})
            </h2>
            </CardTitle>
          </CardHeader> */}
              <div className="w-full px-6 pb-3 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl">
                {/* Desktop & Tablet: Horizontal Timeline */}
                <div className="hidden sm:block">
                  <div className="relative px-4">
                    {/* Background Timeline Line */}
                    <div
                      style={{ top: "20px" }}
                      className="absolute  left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"
                    ></div>

                    {/* Progress Line */}
                    <div
                      className="absolute left-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{
                        top: "20px",
                        width: `${orderedMilestones.reduce((acc, m, idx) => {
                          const progress = m.percentageComplete || 0;
                          return (
                            acc + progress * (100 / orderedMilestones.length)
                          );
                        }, 0)}%`,
                      }}
                    ></div>

                    <div className="flex justify-between relative">
                      {orderedMilestones.map((milestone, index) => {
                        const progress =
                          typeof milestone.percentageComplete === "string"
                            ? parseFloat(milestone.percentageComplete) || 0
                            : milestone.percentageComplete || 0;
                        const isComplete = progress >= 1;
                        const isInProgress = progress > 0 && progress < 1;

                        return (
                          <div
                            key={index}
                            className="flex flex-col items-center flex-1 mx-3"
                          >
                            {/* Milestone Circle */}
                            <div
                              className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center mb-4 transition-all duration-300 ${
                                isComplete
                                  ? "bg-green-500 border-green-400 shadow-lg shadow-green-200"
                                  : isInProgress
                                  ? "bg-blue-500 border-blue-400 shadow-lg shadow-blue-200"
                                  : "bg-gray-400 border-gray-300 shadow-lg shadow-gray-200"
                              }`}
                            >
                              {getStatusIcon(progress)}
                            </div>

                            {/* Connection Arrow (except for last item) */}
                            {index < orderedMilestones.length - 1 && (
                              <div className="absolute top-20 left-1/2 transform translate-x-8 z-20">
                                <ArrowRight
                                  className={`w-4 h-4 ${
                                    isComplete
                                      ? "text-green-500"
                                      : isInProgress
                                      ? "text-blue-500"
                                      : "text-gray-400"
                                  }`}
                                />
                              </div>
                            )}

                            {/* Content div */}
                            <div
                              className={`w-full max-w-full p-3 lg:p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                                isComplete
                                  ? "bg-green-50 dark:bg-green-950/30 border-2 border-green-200"
                                  : isInProgress
                                  ? "bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200"
                                  : "bg-white dark:bg-gray-800 border-2 border-gray-200"
                              }`}
                            >
                              <div className="text-center">
                                <h3
                                  className={`font-bold text-xs sm:text-sm mb-1 leading-tight ${
                                    isComplete
                                      ? "text-green-800 dark:text-green-200"
                                      : isInProgress
                                      ? "text-blue-800 dark:text-blue-200"
                                      : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {milestone.item}
                                </h3>

                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 hidden sm:block">
                                  {milestone.description}
                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">
                                  {formatDateforMilestones(milestone.startDate)}{" "}
                                  -{" "}
                                  {formatDateforMilestones(
                                    milestone.finishDate
                                  )}
                                </p>

                                <div className="relative w-full">
                                  <Progress
                                    value={progress * 100}
                                    className="w-full h-1.5 sm:h-2"
                                  />
                                  <span
                                    className={`absolute -top-5 right-0 text-xs font-medium ${
                                      isComplete
                                        ? "text-green-600"
                                        : isInProgress
                                        ? "text-blue-600"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {(progress * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Mobile: Vertical Timeline */}
                <div className="sm:hidden">
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-6 top-7 bottom-0 w-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

                    {/* Progress Line */}
                    <div
                      className="absolute left-6 top-10 w-1 bg-gradient-to-b from-green-500 via-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{
                        height: `${orderedMilestones.reduce((acc, m, idx) => {
                          const progress = m.percentageComplete || 0;
                          return (
                            acc + progress * (100 / orderedMilestones.length)
                          );
                        }, 0)}%`,
                      }}
                    ></div>

                    <div className="space-y-6">
                      {orderedMilestones.map((milestone, index) => {
                        const progress =
                          typeof milestone.percentageComplete === "string"
                            ? parseFloat(milestone.percentageComplete) || 0
                            : milestone.percentageComplete || 0;
                        const isComplete = progress >= 1;
                        const isInProgress = progress > 0 && progress < 1;

                        return (
                          <div key={index} className="flex items-start gap-4">
                            {/* Milestone Circle */}
                            <div
                              className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                isComplete
                                  ? "bg-green-500 border-green-400 shadow-lg shadow-green-200"
                                  : isInProgress
                                  ? "bg-blue-500 border-blue-400 shadow-lg shadow-blue-200"
                                  : "bg-gray-400 border-gray-300 shadow-lg shadow-gray-200"
                              }`}
                            >
                              {getStatusIcon(progress)}
                            </div>

                            {/* Content div */}
                            <div
                              className={`flex-1 p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg ${
                                isComplete
                                  ? "bg-green-50 dark:bg-green-950/30 border-2 border-green-200"
                                  : isInProgress
                                  ? "bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200"
                                  : "bg-white dark:bg-gray-800 border-2 border-gray-200"
                              }`}
                            >
                              <h3
                                className={`font-bold text-sm mb-1 ${
                                  isComplete
                                    ? "text-green-800 dark:text-green-200"
                                    : isInProgress
                                    ? "text-blue-800 dark:text-blue-200"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {milestone.item}
                              </h3>

                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {milestone.description}
                              </p>

                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                {formatDate(milestone.startDate)} -{" "}
                                {formatDate(milestone.finishDate)}
                              </p>

                              <div className="flex items-center gap-3">
                                <Progress
                                  value={progress * 100}
                                  className="flex-1 h-2"
                                />
                                <span
                                  className={`text-xs font-medium min-w-12 ${
                                    isComplete
                                      ? "text-green-600"
                                      : isInProgress
                                      ? "text-blue-600"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {(progress * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Milestones Section */}

      {/* Activities Section - Full Width */}
      <div className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upcoming Activities - 3/4 width */}
          <Card
            data-testid="card-upcoming-activities"
            className="lg:col-span-3"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Activities ({upcomingActivities?.length || 0})
              </CardTitle>
              <p>
                <span className="text-xs text-muted-foreground">
                  Next 14 days of activities (from{" "}
                  {startDateForUpcoming || "N/A"})
                </span>
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {upcomingActivities &&
                  upcomingActivities.length > 0 &&
                  renderTimelineChart(upcomingActivities || [])}
                {upcomingActivities && upcomingActivities.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm">
                    No upcoming activities
                  </p>
                )}
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
                              Late by:{" "}
                              {(() => {
                                const finishDate = new Date(1899, 11, 30);
                                finishDate.setTime(
                                  finishDate.getTime() +
                                    (activity.finishDate || 0) *
                                      24 *
                                      60 *
                                      60 *
                                      1000
                                );
                                const today = new Date();
                                const diffTime =
                                  today.getTime() - finishDate.getTime();
                                const diffDays = Math.ceil(
                                  diffTime / (1000 * 60 * 60 * 24)
                                );
                                return diffDays > 0
                                  ? `${diffDays} days`
                                  : "0 days";
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Progress
                              value={
                                typeof activity.percentageComplete === "string"
                                  ? (parseFloat(activity.percentageComplete) ||
                                      0) * 100
                                  : (activity.percentageComplete || 0) * 100
                              }
                              className="w-8 h-1"
                            />
                            <span>
                              {typeof activity.percentageComplete === "string"
                                ? (
                                    (parseFloat(activity.percentageComplete) ||
                                      0) * 100
                                  ).toFixed(0)
                                : (
                                    (activity.percentageComplete || 0) * 100
                                  ).toFixed(0)}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground text-sm">
                    No late activities
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget & Financial Details */}
        {/* <Card data-testid="card-budget-details">
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
          </Card> */}

        {/* Time & Performance Metrics */}
        {/* <Card data-testid="card-time-metrics">
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
          </Card> */}
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
                          Owner: {risk.owner || "Unassigned"}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {risk.status || "Active"}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground text-sm">
                  No active risks
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIInsights type="project" projectCode={project?.projectCode} />
          </CardContent>
        </Card>

        {/* Budget Consumption Chart */}
      </div>

      <div className="mt-6">
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
                <h4 className="text-sm font-medium text-muted-foreground">
                  Performance Comparison
                </h4>

                {/* Budget vs Expected Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budget Consumption</span>
                    <span
                      className={`font-medium ${
                        (project.budgetSpent || 0) >
                        (project.scopeCompletion || 0)
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {((project.budgetSpent || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        (project.budgetSpent || 0) >
                        (project.scopeCompletion || 0)
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (project.budgetSpent || 0) * 100,
                          100
                        )}%`,
                      }}
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
                      style={{
                        width: `${(project.scopeCompletion || 0) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Time Completion */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Time Elapsed</span>
                    <span
                      className={`font-medium ${
                        (project.timeCompletion || 0) > 1
                          ? "text-red-600"
                          : "text-orange-600"
                      }`}
                    >
                      {((project.timeCompletion || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        (project.timeCompletion || 0) > 1
                          ? "bg-red-500"
                          : "bg-orange-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (project.timeCompletion || 0) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Budget Efficiency
                    </p>
                    <p
                      className={`text-sm font-bold ${
                        (project.scopeCompletion || 0) >
                        (project.budgetSpent || 0)
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(project.scopeCompletion || 0) > 0
                        ? (
                            ((project.scopeCompletion || 0) /
                              (project.budgetSpent || 0.01)) *
                            100
                          ).toFixed(0) + "%"
                        : "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Schedule Performance
                    </p>
                    <p
                      className={`text-sm font-bold ${
                        (project.scopeCompletion || 0) >
                        (project.timeCompletion || 0)
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(project.timeCompletion || 0) > 0
                        ? (
                            ((project.scopeCompletion || 0) /
                              (project.timeCompletion || 0.01)) *
                            100
                          ).toFixed(0) + "%"
                        : "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Overall Index
                    </p>
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
                  <p className="text-lg font-bold">
                    {formatCurrency(project.budgetAmount)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Spent</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatCurrency(project.totalAmountSpent)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      Math.max(
                        0,
                        project.budgetAmount - project.totalAmountSpent
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Location Map */}
      <div className="mt-6">
        <ProjectMap projects={project ? [project] : []} />
      </div>
    </div>
    // </div>
  );
}

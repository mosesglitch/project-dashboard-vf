import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Handshake, HardHat } from "lucide-react";

// UI5 Web Components
import {
  ObjectPage,
  ObjectPageHeader,
  ObjectPageTitle,
  ObjectPageSection,
  ObjectPageSubSection,
  Card,
  CardHeader,
  Table,
  TableHeaderRow,
  TableHeaderCell,
  TableRow,
  TableCell,
  ProgressIndicator,
  Button,
  FlexBox,
  Title,
  Label,
  Text,
  // Timeline,
  // TimelineItem,
} from "@ui5/webcomponents-react";
import { TimelineChart } from "@ui5/webcomponents-react-charts";
import {
  Calendar,
  CheckCircle,
  Clock,
  Settings,
  Building,
  ShoppingCart,
} from "lucide-react";

// Import required icons
import "@ui5/webcomponents-icons/dist/arrow-left.js";
import "@ui5/webcomponents-icons/dist/workflow-tasks.js";
import "@ui5/webcomponents-icons/dist/calendar.js";

import { AIInsights } from "@/components/ai-insights";
import { ProjectAnalytics } from "@/components/project-analytics";
import type { ExcelProject, ExcelActivity } from "@shared/excel-schema";
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusIcon = (percentageComplete) => {
  if (percentageComplete >= 1) return <CheckCircle className="w-5 h-5" />;
  if (percentageComplete > 0) return <Clock className="w-5 h-5" />;
  return <Calendar className="w-5 h-5" />;
};

const getPhaseIcon = (phase) => {
  const icons = {
    Preliminaries: <Settings className="w-4 h-4" />,
    Procurement: <ShoppingCart className="w-4 h-4" />,
    Construction: <HardHat className="w-4 h-4" />,
    Commisioning: <Handshake className="w-4 h-4" />,
  };
  return icons[phase] || <Calendar className="w-4 h-4" />;
};

const getStatusColor = (percentageComplete) => {
  if (percentageComplete >= 1) return "text-green-600";
  if (percentageComplete > 0) return "text-yellow-600";
  return "text-blue-600";
};

const getProgressColor = (percentageComplete) => {
  if (percentageComplete >= 1) return "bg-green-500";
  if (percentageComplete > 0) return "bg-yellow-500";
  return "bg-blue-500";
};

const getBgColor = (percentageComplete) => {
  if (percentageComplete >= 1) return "bg-green-50 border-green-200";
  if (percentageComplete > 0) return "bg-yellow-50 border-yellow-200";
  return "bg-blue-50 border-blue-200";
};
export default function ProjectDetails() {
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

  function getTimelineChartData(activities: ExcelActivity[]): any[] {
    // Find the earliest and latest dates among activities
    const validStartDates = activities
      .map((a) => {
        const d = formatDate(a.startDate);
        // Use original date value for calculation
        return d !== "N/A" && a.startDate
          ? new Date(
              Number(a.startDate) ? formatDate(a.startDate) : a.startDate
            ).getTime()
          : null;
      })
      .filter((t): t is number => t !== null);
    const validFinishDates = activities
      .map((a) => {
        const d = formatDate(a.finishDate);
        return d !== "N/A" && a.finishDate
          ? new Date(
              Number(a.finishDate) ? formatDate(a.finishDate) : a.finishDate
            ).getTime()
          : null;
      })
      .filter((t): t is number => t !== null);

    const minDate =
      validStartDates.length > 0 ? Math.min(...validStartDates) : null;
    const maxDate =
      validFinishDates.length > 0 ? Math.max(...validFinishDates) : null;

    // Assign unique IDs for each activity
    const activityIds = activities.map((activity, idx) =>
      activity.id ? String(activity.id) : `ACT-${idx}`
    );

    return activities.map((activity, idx) => {
      const startDateStr = formatDate(activity.startDate);
      const finishDateStr = formatDate(activity.finishDate);

      // Calculate start offset from earliest date
      let startOffset = 0;
      if (
        minDate !== null &&
        startDateStr !== "N/A" &&
        startDateStr !== activity.startDate
      ) {
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
            duration: getDuration(startDateStr, finishDateStr),
            connections: connections.length > 0 ? connections : undefined,
          },
        ],
      };
    });
  }

  // Helper to calculate duration in days
  function getDuration(start: string | null, finish: string | null): number {
    const s = formatDate(start);
    const f = formatDate(finish);
    if (!start || !finish || s === "N/A" || f === "N/A") return 1;
    const startDate = new Date(s).getTime();
    const finishDate = new Date(f).getTime();
    return Math.max(
      1,
      Math.round((finishDate - startDate) / (1000 * 60 * 60 * 24))
    );
  }

  // TimelineChart rendering function
  function renderTimelineChart(activities: ExcelActivity[]) {
    if (!activities || activities.length === 0)
      return <Text>No timeline data</Text>;
    const dataset = getTimelineChartData(activities);

    // Find earliest and latest dates for display (actual dates)
    const validStartDates = activities
      .map((a) => a.startDate)
      .filter((d): d is string => !!d && d !== "N/A");
    const validFinishDates = activities
      .map((a) => a.finishDate)
      .filter((d): d is string => !!d && d !== "N/A");

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

    const start = 0;
    const totalDuration = Math.max(
      ...dataset.map((d) => d.tasks?.[0]?.start + d.tasks?.[0]?.duration || 0),
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

    return (
      <TimelineChart
        dataset={dataset}
        isDiscrete
        showConnection={true}
        start={start}
        totalDuration={totalDuration}
        columnTitle={`Duration (${startDateLabel} - ${finishDateLabel})`}
        style={{  width: "100%",paddingBottom: "2rem" }}
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

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === undefined || amount === null) return "$0";
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    // Handles formats like "45854" (Excel serial date)
    if (/^\d+$/.test(dateStr)) {
      // Excel serial date: days since 1899-12-30
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(
        excelEpoch.getTime() + Number(dateStr) * 24 * 60 * 60 * 1000
      );
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    // Otherwise, try parsing as ISO string
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRiskColor = (description: string) => {
    const level = description?.toLowerCase();
    if (level === "high" || level === "critical") return "#dc3545";
    if (level === "medium") return "#ffc107";
    if (level === "low") return "#28a745";
    return "#6c757d";
  };

  const getStatusColor = (status: string) => {
    if (status === "Open") return "#dc3545";
    if (status === "Closed") return "#28a745";
    return "#6c757d";
  };

  if (projectLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <Text>Loading project details...</Text>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <Text>Project not found</Text>
        <div style={{ marginTop: "1rem" }}>
          <Link href="/">
            <Button icon="arrow-left">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <ObjectPage
        headerArea={
          <ObjectPageHeader>
            {/* Back Button */}
            <div style={{ marginBottom: "1rem" }}>
              <Link href="/">
                <Button icon="arrow-left" design="Transparent">
                  Back to Dashboar
                </Button>
              </Link>
            </div>

            {/* KPI Cards in Header Area */}
            <FlexBox
              wrap="NoWrap"
              justifyContent="SpaceAround"
              style={{ padding: "1rem", overflowX: "auto" }}
            >
              <Card style={{ margin: "0.5rem", minWidth: "180px" }}>
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <Title level="H3">
                    {Math.round((project.scopeCompletion || 0) * 100)}%
                  </Title>
                  <Text>Scope Completion</Text>
                </div>
              </Card>
              <Card style={{ margin: "0.5rem", minWidth: "180px" }}>
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <Title level="H3">
                    {(project.timeCompletion || 0).toFixed(1)}%
                  </Title>
                  <Text>Time Completion</Text>
                </div>
              </Card>
              <Card style={{ margin: "0.5rem", minWidth: "180px" }}>
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <Title
                    level="H3"
                    style={{
                      color:
                        project.performanceCategory === "On Track"
                          ? "#28a745"
                          : project.performanceCategory === "Slightly Behind"
                          ? "#ffc107"
                          : project.performanceCategory === "Critical Delay"
                          ? "#dc3545"
                          : "#007bff",
                    }}
                  >
                    {project.performanceCategory || "On Track"}
                  </Title>
                  <Text>Performance Category</Text>
                </div>
              </Card>
              <Card style={{ margin: "0.5rem", minWidth: "180px" }}>
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <Title
                    level="H3"
                    style={{
                      color:
                        project.budgetStatusCategory === "Under Budget"
                          ? "#28a745"
                          : project.budgetStatusCategory === "Within Budget"
                          ? "#007bff"
                          : project.budgetStatusCategory === "Over Budget"
                          ? "#ffc107"
                          : "#dc3545",
                    }}
                  >
                    {project.budgetStatusCategory || "Within Budget"}
                  </Title>
                  <Text>Budget Status</Text>
                </div>
              </Card>
              <Card style={{ margin: "0.5rem", minWidth: "180px" }}>
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <Title
                    level="H3"
                    style={{
                      color:
                        (project.deviationProfitMargin || 0) > 0
                          ? "#28a745"
                          : "#dc3545",
                    }}
                  >
                    {((project.deviationProfitMargin || 0) * 100).toFixed(2)}%
                  </Title>
                  <Text>Margin Deviation</Text>
                </div>
              </Card>
            </FlexBox>
          </ObjectPageHeader>
        }
        titleArea={
          <ObjectPageTitle>
            <Title level="H1">
              {project.projectCode} - {project.description}
            </Title>
          </ObjectPageTitle>
        }
      >
        {/* Section 1: Budget Details and Time Metrics */}
        <ObjectPageSection id="overview-section" titleText="Project Overview">
          <ObjectPageSubSection id="overview-subsection" titleText="">
            <FlexBox
              wrap="Wrap"
              justifyContent="SpaceAround"
              style={{ padding: "1rem", gap: "2rem" }}
            >
              {/* Budget Details Card */}
              <Card
                style={{ minWidth: "400px", maxWidth: "500px" }}
                header={<CardHeader titleText="Budget Details" />}
              >
                <div style={{ padding: "1rem", display: "flex", gap: "2rem" }}>
                  {/* Column 1 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: "1rem" }}>
                      <Label>Budget Amount:</Label>
                      <br />
                      <Text style={{ fontSize: "1.1em", fontWeight: "bold" }}>
                        {formatCurrency(project.budgetAmount)}
                      </Text>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <Label>Budget Spent:</Label>
                      <br />
                      <Text style={{ fontSize: "1.1em", fontWeight: "bold" }}>
                        {formatCurrency(project.totalAmountSpent)}
                      </Text>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <Label>CO Amount:</Label>
                      <br />
                      <Text style={{ fontSize: "1.1em", fontWeight: "bold" }}>
                        {formatCurrency(project.coAmount || 0)}
                      </Text>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: "1rem" }}>
                      <Label>Projected Margin:</Label>
                      <br />
                      <Text style={{ fontSize: "1.1em", fontWeight: "bold" }}>
                        {((project.projectedGrossMargin || 0) * 100).toFixed(2)}
                        %
                      </Text>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <Label>Actual Margin:</Label>
                      <br />
                      <Text style={{ fontSize: "1.1em", fontWeight: "bold" }}>
                        {((project.actualGrossMargin || 0) * 100).toFixed(2)}%
                      </Text>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <Label>Margin Deviation:</Label>
                      <br />
                      <Text
                        style={{
                          fontSize: "1.1em",
                          fontWeight: "bold",
                          color:
                            (project.deviationProfitMargin || 0) > 0
                              ? "#28a745"
                              : "#dc3545",
                        }}
                      >
                        {((project.deviationProfitMargin || 0) * 100).toFixed(
                          2
                        )}
                        %
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Time Metrics Card */}
              <Card
                style={{ minWidth: "400px", maxWidth: "500px" }}
                header={<CardHeader titleText="Time Metrics" />}
              >
                <div style={{ padding: "1rem", display: "flex", gap: "2rem" }}>
                  {/* Column 1 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: "1rem" }}>
                      <Label>Start Date:</Label>
                      <br />
                      <Text style={{ fontSize: "1.1em", fontWeight: "bold" }}>
                        {formatDate(project.startDate)}
                      </Text>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <Label>Finish Date:</Label>
                      <br />
                      <Text style={{ fontSize: "1.1em", fontWeight: "bold" }}>
                        {formatDate(project.finishDate)}
                      </Text>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <Label>Scope Completion:</Label>
                      <br />
                      <Text style={{ fontSize: "1.1em", fontWeight: "bold" }}>
                        {Math.round((project.scopeCompletion || 0) * 100)}%
                      </Text>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: "1rem" }}>
                      <Label>Time Completion:</Label>
                      <br />
                      <Text style={{ fontSize: "1.1em", fontWeight: "bold" }}>
                        {(project.timeCompletion || 0).toFixed(1)}%
                      </Text>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <Label>Performance Category:</Label>
                      <br />
                      <Text
                        style={{
                          fontSize: "1.1em",
                          fontWeight: "bold",
                          color:
                            project.performanceCategory === "On Track"
                              ? "#28a745"
                              : project.performanceCategory ===
                                "Slightly Behind"
                              ? "#ffc107"
                              : project.performanceCategory === "Critical Delay"
                              ? "#dc3545"
                              : "#007bff",
                        }}
                      >
                        {project.performanceCategory || "On Track"}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </FlexBox>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Section 1.5: AI Insights */}
        <ObjectPageSection id="ai-insights-section" titleText="AI Insights">
          <ObjectPageSubSection id="ai-insights-subsection" titleText="">
            <div style={{ padding: "1rem" }}>
              <AIInsights type="project" projectCode={project?.projectCode} />
            </div>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Section 1.7: Project Analytics */}
        <ObjectPageSection id="analytics-section" titleText="Project Analytics">
          <ObjectPageSubSection id="analytics-subsection" titleText="">
            <div style={{ padding: "1rem" }}>
              {project && <ProjectAnalytics project={project} />}
            </div>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Section 2: Milestones and Risks */}
        <ObjectPageSection
          id="milestones-risks-section"
          titleText="Milestones & Risks"
        >
          <ObjectPageSubSection id="milestones-risks-subsection" titleText="">
            <FlexBox
              wrap="Wrap"
              justifyContent="SpaceAround"
              style={{ padding: "1rem", gap: "2rem" }}
            >
              {/* Milestones Card with Timeline */}
              <Card
                style={{ minWidth: "450px", maxWidth: "600px" }}
                header={<CardHeader titleText="Milestones (Workstreams)" />}
              >
                <div style={{ padding: "1rem" }}>
                  {milestones && milestones.length > 0 ? (
                    <div className="max-w-4xl mx-auto p-6 bg-white">
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                        {[
                          "Preliminaries",
                          "Procurement",
                          "Construction",
                          "Commisioning",
                        ]
                          .map((phase) =>
                            milestones.find((m) => m.item === phase)
                          )
                          .filter(Boolean)
                          .map((milestone, index) => {
                            const percentageComplete =
                              milestone!.percentageComplete || 0;
                            const isComplete = percentageComplete >= 1;
                            const isOngoing =
                              percentageComplete > 0 && percentageComplete < 1;

                            return (
                              <div
                                key={milestone!.item}
                                className="relative mb-8 last:mb-0"
                              >
                                {/* Timeline node */}
                                <div
                                  className={`absolute left-6 w-4 h-4 rounded-full border-2 bg-white z-10 ${
                                    isComplete
                                      ? "border-green-500"
                                      : isOngoing
                                      ? "border-yellow-500"
                                      : "border-blue-500"
                                  }`}
                                >
                                  <div
                                    className={`w-2 h-2 rounded-full m-0.5 ${
                                      isComplete
                                        ? "bg-green-500"
                                        : isOngoing
                                        ? "bg-yellow-500"
                                        : "bg-blue-500"
                                    }`}
                                  ></div>
                                </div>

                                {/* Content card */}
                                <div
                                  className={`ml-16 p-6 rounded-lg border-2 shadow-sm transition-all hover:shadow-md ${getBgColor(
                                    percentageComplete
                                  )}`}
                                >
                                  {/* Header */}
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`p-2 rounded-lg ${
                                          isComplete
                                            ? "bg-green-100"
                                            : isOngoing
                                            ? "bg-yellow-100"
                                            : "bg-blue-100"
                                        }`}
                                      >
                                        {getPhaseIcon(milestone!.item)}
                                      </div>
                                      <div>
                                        <h3 className="text-xl font-semibold text-gray-900">
                                          {milestone!.item}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                          Target:{" "}
                                          {formatDate(milestone!.finishDate)}
                                        </p>
                                      </div>
                                    </div>

                                    <div
                                      className={`flex items-center gap-2 ${getStatusColor(
                                        percentageComplete
                                      )}`}
                                    >
                                      {getStatusIcon(percentageComplete)}
                                      <span className="font-medium">
                                        {Math.round(percentageComplete * 100)}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="mb-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(
                                          percentageComplete
                                        )}`}
                                        style={{
                                          width: `${percentageComplete * 100}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>

                                  {/* Description */}
                                  <p className="text-gray-700 font-medium">
                                    {milestone!.description}
                                  </p>

                                  {/* Status badge */}
                                  <div className="mt-3">
                                    <span
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                        isComplete
                                          ? "bg-green-100 text-green-800"
                                          : isOngoing
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-blue-100 text-blue-800"
                                      }`}
                                    >
                                      {isComplete
                                        ? "Completed"
                                        : isOngoing
                                        ? "In Progress"
                                        : "Not Started"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    <Text>No milestones available</Text>
                  )}
                </div>
              </Card>

              {/* Risks Card */}
              <Card
                style={{ minWidth: "450px", maxWidth: "600px" }}
                header={<CardHeader titleText="Risks" />}
              >
                <div style={{ padding: "1rem" }}>
                  {risks && risks.length > 0 ? (
                    risks.map((risk, index) => (
                      <div
                        key={index}
                        style={{
                          marginBottom: "1rem",
                          padding: "0.5rem",
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <Text style={{ fontWeight: "bold" }}>
                            {risk.item}
                          </Text>
                          <Text
                            style={{
                              color: getStatusColor(risk.status || ""),
                              fontWeight: "bold",
                            }}
                          >
                            {risk.status || "Unknown"}
                          </Text>
                        </div>
                        <div style={{ marginBottom: "0.5rem" }}>
                          <Text
                            style={{
                              color: getRiskColor(risk.description || ""),
                            }}
                          >
                            Level: {risk.description || "Not specified"}
                          </Text>
                        </div>
                        {risk.owner && (
                          <div style={{ marginBottom: "0.5rem" }}>
                            <Text style={{ color: "#666" }}>
                              Owner: {risk.owner}
                            </Text>
                          </div>
                        )}
                        {risk.startDate && (
                          <div>
                            <Text style={{ color: "#666" }}>
                              Date: {formatDate(risk.startDate)}
                            </Text>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <Text>No risks available</Text>
                  )}
                </div>
              </Card>
            </FlexBox>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Section 3: Upcoming Activities with Timeline */}
        <ObjectPageSection
          id="upcoming-section"
          titleText="Upcoming Activities"
        >
          <ObjectPageSubSection id="upcoming-subsection" titleText="">
            <Card
              header={<CardHeader titleText="Upcoming Activities Timeline" />}
            >
              <div style={{ padding: "1rem" }}>
                {upcomingActivities && upcomingActivities.length > 0 ? (
                  renderTimelineChart(upcomingActivities || [])
                ) : (
                  <div style={{ padding: "2rem", textAlign: "center" }}>
                    <Text>No upcoming activities</Text>
                  </div>
                )}
              </div>
            </Card>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Section 4: Late Activities */}
        <ObjectPageSection id="late-section" titleText="Late Activities">
          <ObjectPageSubSection id="late-subsection" titleText="">
            <Card header={<CardHeader titleText="Late Activities" />}>
              {lateActivities && lateActivities.length > 0 ? (
                <Table
                  headerRow={
                    <TableHeaderRow sticky>
                      <TableHeaderCell>
                        <span>Item</span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span>Start Date</span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span>Finish Date</span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span>Progress</span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span>Days Overdue</span>
                      </TableHeaderCell>
                    </TableHeaderRow>
                  }
                >
                  {lateActivities.map((activity, index) => {
                  
                    // Handle Excel serial date or ISO string for finishDate
                    let finishDate: Date | null = null;
                    if (activity.finishDate) {
                      if (/^\d+$/.test(activity.finishDate)) {
                      // Excel serial date: days since 1899-12-30
                      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                      finishDate = new Date(
                        excelEpoch.getTime() +
                        Number(activity.finishDate) * 24 * 60 * 60 * 1000
                      );
                      } else {
                      finishDate = new Date(activity.finishDate);
                      }
                    }
                    const today = new Date();
                    // Remove time part for accurate day comparison
                    const finishDateOnly = finishDate
                      ? new Date(
                        finishDate.getFullYear(),
                        finishDate.getMonth(),
                        finishDate.getDate()
                      )
                      : null;
                    const todayOnly = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate()
                    );
                    const daysOverdue =
                      finishDateOnly && finishDateOnly < todayOnly
                      ? Math.ceil(
                        (todayOnly.getTime() - finishDateOnly.getTime()) /
                          (1000 * 60 * 60 * 24)
                        )
                      : 0;

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Text style={{ color: "#dc3545" }}>
                            {activity.item}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Text>{formatDate(activity.startDate)}</Text>
                        </TableCell>
                        <TableCell>
                          <Text>{formatDate(activity.finishDate)}</Text>
                        </TableCell>
                        <TableCell>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <ProgressIndicator
                              value={Math.round(
                                (activity.percentageComplete || 0) * 100
                              )}
                              style={{ width: "80px" }}
                            />
                            <Text>
                              {Math.round(
                                (activity.percentageComplete || 0) * 100
                              )}
                              %
                            </Text>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Text
                            style={{ color: "#dc3545", fontWeight: "bold" }}
                          >
                            {daysOverdue > 0
                              ? `${daysOverdue} days`
                              : "On time"}
                          </Text>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </Table>
              ) : (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <Text>No late activities</Text>
                </div>
              )}
            </Card>
          </ObjectPageSubSection>
        </ObjectPageSection>
      </ObjectPage>
    </div>
  );
}

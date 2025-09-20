import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import React, { act, useState,useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
// import { Progress } from "@/components/ui/progress";
import { NumericSideIndicator, AnalyticalCardHeader } from '@ui5/webcomponents-react';
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Building,
  ShoppingCart,
  DollarSign,
  Edit,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  Users,
  MapPin,
  Activity,
} from "lucide-react";
import GanttChartView from "@/components/gantt-chart-view";
import GaugeComponent from "react-gauge-component";
import type { ExcelProject, ExcelActivity } from "@shared/excel-schema";
import { TimelineChart } from "@ui5/webcomponents-react-charts";
import { Text } from "@ui5/webcomponents-react";
import { AIInsights } from "@/components/ai-insights";
import { ProjectAnalytics } from "@/components/project-analytics";
import { c } from "node_modules/vite/dist/node/types.d-aGj9QkWt";
import { dataService } from "@/lib/dataService";
const riskOwners = [
  "Project Manager",
  "Procurement Manager",
  "Finance Controller",
  "Engineering / Design",
  "Construction / Site Manager",
  // "Quality Manager",
  "Health, Safety & Environment (HSE)",
  "IT",
  "Client",
  "Legal Officer",
  "Subcontractors / Vendors",
];
// Progress Component
const Progress = ({ value = 0, className = "", ...props }) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-secondary ${className}`}
      {...props}
    >
      <div className="h-2 w-full bg-gray-200 rounded-full">
        <div
          className="h-2  rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${clampedValue}%`, backgroundColor: "#054d17ff" }}
        />
      </div>
    </div>
  );
};

const formatDate = (excelDate: number | string | null | undefined): string => {
  if (!excelDate) return "N/A";

  // Handle numbers (Excel serial dates)
  if (typeof excelDate === "number") {
    const excelEpoch = new Date(1899, 11, 30); // Excel base date
    const jsDate = new Date(
      excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000
    );
    return jsDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Handle strings (try parsing directly)
  const parsed = new Date(excelDate);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return "N/A"; // fallback if invalid
};

interface Risk {
  _id?: string;
  projectCode: string;
  title: string;
  description: string;
  status: "active" | "resolved" | "mitigated";
  priority: "low" | "medium" | "high" | "critical";
  owner: string;
  createdAt?: string;
  updatedAt?: string;
}
interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | number;
}
const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount?.toLocaleString()}`;
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

export default function ProjectDetailsDashboard({id,setSelectedProjectId}: {id: string | number,setSelectedProjectId: (id: string) => void}) {
  const [startDateForUpcoming, setStartDateForUpcoming] = useState<string>("");
  const [isAddingRisk, setIsAddingRisk] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [riskForm, setRiskForm] = useState({
    title: "",
    description: "",
    status: "active" as Risk["status"],
    priority: "medium" as Risk["priority"],
    owner: "Project Manager" as Risk["owner"],
  });
console.log(id, "id");
  const queryClient = useQueryClient();
const projectLoading = false;
  // const { id } = useParams();
  // Fetch project data
  const project = useMemo(() => {
      return id ? dataService.getProjectById(id) : undefined;
    }, [id]);
console.log(project, "proj");
  // Fetch activities data
   // Get activities data from local service
  const milestones = useMemo(() => {
    return project?.projectCode ? dataService.getMilestonesByProjectCode(project.projectCode.toString()) : [];
  }, [project?.projectCode]);


  // Fetch risks
  
    // const risks = useMemo(() => {
    //   return project?.projectCode ? dataService.getRisksByProjectCode(project.projectCode.toString()) : [];
    // }, [project?.projectCode]);

  const risks=[
  {
    "_id": "651a23b0d1e5f4c6a2e9b1d2",
    "title": "Supply Chain Delays",
    "description": "Risk of critical components arriving late, impacting the project timeline.",
    "priority": "high",
    "status": "active",
    "owner": "John Doe"
  },
  {
    "_id": "651a23b0d1e5f4c6a2e9b1d3",
    "title": "Budget Overrun",
    "description": "Potential for project costs to exceed the allocated budget due to unforeseen expenses.",
    "priority": "medium",
    "status": "mitigated",
    "owner": "Jane Doe"
  },
  {
    "_id": "651a23b0d1e5f4c6a2e9b1d4",
    "title": "Resource Unavailability",
    "description": "Key personnel might not be available for critical project phases.",
    "priority": "high",
    "status": "active",
    "owner": "John Doe"
  },
  {
    "_id": "651a23b0d1e5f4c6a2e9b1d6",
    "title": "Scope Creep",
    "description": "Additional client requests beyond the initial project scope could extend the timeline.",
    "priority": "medium",
    "status": "active",
    "owner": "John Doe"
  }
]

  // Create risk mutation
  const createRiskMutation = useMutation({
    mutationFn: async (
      newRisk: Omit<Risk, "_id" | "createdAt" | "updatedAt">
    ) => {
      const response = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRisk),
      });
      if (!response.ok) throw new Error("Failed to create risk");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/risks", project?.projectCode],
      });
      setIsAddingRisk(false);
      setRiskForm({
        title: "",
        description: "",
        status: "active",
        priority: "medium",
        owner: "",
      });
    },
  });

  // Update risk mutation
  const updateRiskMutation = useMutation({
    mutationFn: async (updatedRisk: Risk) => {
      const response = await fetch(`/api/risks/${updatedRisk._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRisk),
      });
      if (!response.ok) throw new Error("Failed to update risk");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/risks", project?.projectCode],
      });
      setEditingRisk(null);
      setRiskForm({
        title: "",
        description: "",
        status: "active",
        priority: "medium",
        owner: "",
      });
    },
  });

  // Delete risk mutation
  const deleteRiskMutation = useMutation({
    mutationFn: async (riskId: string) => {
      const response = await fetch(`/api/risks/${riskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete risk");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/risks", project?.projectCode],
      });
    },
  });

  const handleCreateRisk = () => {
    if (!project?.projectCode) return;
    createRiskMutation.mutate({
      ...riskForm,
      projectCode: project.projectCode,
    });
  };

  const handleUpdateRisk = () => {
    if (!editingRisk) return;
    updateRiskMutation.mutate({
      ...editingRisk,
      ...riskForm,
    });
  };

  const handleEditRisk = (risk: Risk) => {
    setEditingRisk(risk);
    setRiskForm({
      title: risk.title,
      description: risk.description,
      status: risk.status,
      priority: risk.priority,
      owner: risk.owner,
    });
    setIsAddingRisk(true);
  };

  const handleDeleteRisk = (riskId: string) => {
    if (confirm("Are you sure you want to delete this risk?")) {
      deleteRiskMutation.mutate(riskId);
    }
  };

  const getPriorityBadge = (priority: Risk["priority"]) => {
    const variants = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={variants[priority]}>{priority.toUpperCase()}</Badge>
    );
  };

  const getStatusBadge = (status: Risk["status"]) => {
    const variants = {
      active: "bg-red-100 text-red-800",
      mitigated: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
    };
    return <Badge className={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  // const { data: risks } = useQuery<ExcelActivity[]>({
  //   queryKey: ["/api/projects", project?.projectCode, "risks"],
  //   queryFn: async () => {
  //     const response = await fetch(
  //       `/api/projects/${project?.projectCode}/risks`
  //     );
  //     if (!response.ok) throw new Error("Failed to fetch risks");
  //     return response.json();
  //   },
  //   enabled: !!project?.projectCode,
  // });

  // Parse Excel serial or string date into Date | null
  function parseExcelDate(
    value: string | number | null | undefined
  ): Date | null {
    if (value === null || value === undefined || value === "") return null;

    // If it's a number or a string that looks like a number, treat as Excel serial
    if (
      typeof value === "number" ||
      (typeof value === "string" && /^\d+$/.test(value))
    ) {
      const serial = typeof value === "number" ? value : parseInt(value, 10);
      const excelEpoch = new Date(1899, 11, 30); // Excel's epoch
      return new Date(excelEpoch.getTime() + serial * 86400000);
    }

    // Try parsing a normal date string
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return null; // invalid
  }

  // Helper to calculate duration in days
  function getDuration(
    start: string | number | null,
    finish: string | number | null
  ): number {
    const startDate = parseExcelDate(start);
    const finishDate = parseExcelDate(finish);
    console.log({ startDate, finishDate, start, finish });
    if (!startDate || !finishDate) return 1; // fallback

    const diffDays = Math.round(
      (finishDate.getTime() - startDate.getTime()) / 86400000
    );

    return Math.max(1, diffDays);
  }

  // Build dataset for TimelineChart
  function getTimelineChartData(activities: ExcelActivity[]): any[] {
    // Extract valid dates
    const validStartDates = activities
      .map((a) => parseExcelDate(a.startDate)?.getTime() ?? null)
      .filter((t): t is number => t !== null);

    const minDate =
      validStartDates.length > 0 ? Math.min(...validStartDates) : null;

    // Assign unique IDs
    const activityIds = activities.map((activity, idx) =>
      activity.id ? String(activity.id) : `ACT-${idx}`
    );

    return activities.map((activity, idx) => {
      const startDate = parseExcelDate(activity.startDate);
      const finishDate = parseExcelDate(activity.finishDate);

      // Calculate start offset from earliest date
      let startOffset = 0;
      if (minDate !== null && startDate) {
        startOffset = Math.round((startDate.getTime() - minDate) / 86400000);
      }

      // Connect to previous activity if exists
      const connections =
        idx > 0
          ? [
            {
              itemId: activityIds[idx - 1],
              type: "F2S",
            },
          ]
          : [];

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
    console.log(activities, "act");
    if (!activities || activities.length === 0)
      return <Text>No timeline data</Text>;

    // Build dataset
    const dataset = getTimelineChartData(activities);

    // Adjust all activities so the first activity starts at 1
    const firstStart = dataset[0]?.tasks?.[0]?.start ?? 0;
    const offset = firstStart === 0 ? 1 : 0;

    const adjustedDataset = dataset.map((d) => ({
      ...d,
      tasks: d.tasks.map((task) => ({
        ...task,
        start: task.start + offset,
      })),
    }));

    // Find earliest and latest dates
    const validStartDates = activities
      .map((a) => parseExcelDate(a.startDate))
      .filter((d): d is Date => !!d);
    const validFinishDates = activities
      .map((a) => parseExcelDate(a.finishDate))
      .filter((d): d is Date => !!d);

    const minDate =
      validStartDates.length > 0
        ? new Date(Math.min(...validStartDates.map((d) => d.getTime())))
        : null;
    const maxDate =
      validFinishDates.length > 0
        ? new Date(Math.max(...validFinishDates.map((d) => d.getTime())))
        : null;

    const start = 1; // Start at 1 instead of 0
    const totalDuration = Math.max(
      ...adjustedDataset.map(
        (d) => (d.tasks?.[0]?.start || 0) + (d.tasks?.[0]?.duration || 0)
      ),
      1
    );

    // Format labels for earliest and latest dates
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

    console.log({ adjustedDataset, start, totalDuration });

    return (
      <TimelineChart
        dataset={adjustedDataset}
        isDiscrete
        start={start}
        totalDuration={totalDuration}
        columnTitle={`Duration (days)`}
        style={{ width: "100%", paddingBottom: "2rem", backgroundColor: "" }}
      />
    );
  }
  const formatDateforMilestones = (serial) => {
    if (!serial) return "";

    // Excel's serial date starts on Dec 30, 1899
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(
      excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000
    );

    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };

    if (jsDate.getFullYear() === 2024) {
      options.year = "numeric";
    }

    return jsDate.toLocaleDateString("en-US", options);
  };
  // const { data: upcomingActivities } = useQuery<ExcelActivity[]>({
  //   queryKey: ["/api/projects", project?.projectCode, "upcoming"],
  //   queryFn: async () => {
  //     const response = await fetch(
  //       `/api/projects/${project?.projectCode}/upcoming`
  //     );
  //     if (!response.ok) throw new Error("Failed to fetch upcoming activities");
  //     return response.json();
  //   },
  //   enabled: !!project?.projectCode,
  // });
  const upcomingActivities = useMemo(() => {
      return project?.projectCode ? dataService.getUpcomingActivitiesByProjectCode(project?.projectCode) : undefined;
    }, [project?.projectCode]);

  console.log(upcomingActivities, "upcomingActivities");
  // Transform upcomingActivities to Gantt chart format
  const upComingActivities =
    upcomingActivities && upcomingActivities.length > 0
      ? upcomingActivities.map((activity, idx) => {
          // Convert Excel serial date to JS Date object
          const excelSerialToDate = (serial: number | string | undefined) => {
            if (!serial) return undefined;
            const serialNum =
              typeof serial === "string" ? parseInt(serial, 10) : serial;
            if (isNaN(serialNum)) return undefined;
            const excelEpoch = new Date(1899, 11, 30);
            return new Date(excelEpoch.getTime() + serialNum * 24 * 60 * 60 * 1000);
          };
          const startDate = excelSerialToDate(activity.startDate);
          const endDate = excelSerialToDate(activity.finishDate);

          // Set predecessor as the previous activity's id, if exists
          const dependencies =
            idx > 0
              ? [
                  `Task-${
                    upcomingActivities[idx - 1].id ??
                    (idx - 1)
                  }`,
                ]
              : undefined;

          return {
            start: startDate ?? new Date(),
            end: endDate ?? new Date(),
            name: activity.item,
            id: `Task-${activity.id ?? idx}`,
            progress:
              typeof activity.percentageComplete === "string"
                ? parseFloat(activity.percentageComplete) * 100
                : (activity.percentageComplete ?? 0) * 100,
            type: "task",
            project: activity.projectCode ? `Project-${activity.projectCode}` : undefined,
            dependencies,
            hideChildren: false,
          };
        })
      : [];

  console.log(upComingActivities, "upcomingActivities", upcomingActivities);

  // const { data: lateActivities } = useQuery<ExcelActivity[]>({
  //   queryKey: ["/api/projects", project?.projectCode, "late"],
  //   queryFn: async () => {
  //     const response = await fetch(
  //       `/api/projects/${project?.projectCode}/late`
  //     );
  //     if (!response.ok) throw new Error("Failed to fetch late activities");
  //     return response.json();
  //   },
  //   enabled: !!project?.projectCode,
  // });
const lateActivities = useMemo(() => {
      return project?.projectCode ? dataService.getLateActivitiesByProjectCode(project?.projectCode) : undefined;
    }, [project?.projectCode]);

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



  const getStatusIcon = (progress) => {
    if (progress >= 1) {
      return <CheckCircle className="w-6 h-6 text-white" />;
    } else if (progress > 0) {
      return <Clock className="w-6 h-6 text-white" />;
    } else {
      return <Circle className="w-6 h-6 text-white" />;
    }
  };

  // const Progress = ({ value, className = "" }) => (
  //   <div
  //     className={`bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}
  //   >
  //     <div
  //       className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
  //       style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
  //     />
  //   </div>
  // );

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
    console.log(project,"adii project")
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Scroll to top on mount */}
      {React.useEffect(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      }, [])}
      <div className="mb-2 ">
      <Navbar
        DisplayTitle={project.projectCode}
        subtitle={project.description}
        setSelectedProjectId={setSelectedProjectId}
      />
      </div>
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mx-5">
        {/* <Card data-testid="kpi-scope-completion">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
            <CardTitle className="text-sm font-medium">
              Scope Completion
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((project.scopeCompletion || 0) * 100).toFixed(0)}%
            <Progress
              value={(project.scopeCompletion || 0) * 100}
              className="mt-2"
            />
            </div>
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
        </Card> */}

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
              {4 }
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

          <div className="flex flex-col lg:flex-row items-stretch justify-between mb-8 ">
            <div className="w-full lg:w-[25%] h-full ml-0 lg:ml-5">
              <Card data-testid="kpi-scope-completion ">
                {/* <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                  <CardTitle className="text-sm font-medium">
                    Scope Completion
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader> */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Project Scope
                  </CardTitle>
                </CardHeader>
                <AnalyticalCardHeader
                  // titleText={project.projectCode}
                  subtitleText={"Remaining"}
                  // description={
                  //   `Start: ${formatDateforMilestones(project.startDate)} | Finish: ${formatDateforMilestones(project.finishDate)}`
                  // }
                  // unitOfMeasurement="%"
                  value={
                        (() => {
                          // Calculate days remaining
                          const today = new Date();
                          const finish = parseExcelDate(project.finishDate);
                          if (!finish) return "N/A";
                          const diff = Math.ceil((finish.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          return diff >= 0 ? diff : 0;
                        })()
                      }
                  scale="days"
                  state={
                    project.performanceIndex == null
                      ? "None"
                      : project.performanceIndex > 1
                        ? "Good"
                        : project.performanceIndex < 0.95
                          ? "Error"
                          : project.performanceIndex < 1
                            ? "Critical"
                            : "Neutral"
                  }
                  trend="Down"

                >
                  <React.Fragment>
                    {/* <NumericSideIndicator
                      number={
                        (() => {
                          // Calculate days remaining
                          const today = new Date();
                          const finish = parseExcelDate(project.finishDate);
                          if (!finish) return "N/A";
                          const diff = Math.ceil((finish.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          return diff >= 0 ? diff : 0;
                        })()
                      }
                      titleText="Days Remaining"
                      unit="days"
                    /> */}

                    <NumericSideIndicator
                      number={ `Start: ${formatDateforMilestones(project.startDate)} | Finish: ${formatDateforMilestones(project.finishDate)}`}
                      titleText="Project Duration"
                      unit=""
                      // state="Error"
                    />
                  </React.Fragment>
                </AnalyticalCardHeader>

                {/* <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                  <CardTitle className="text-sm font-medium">
                    Scope Completion
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader> */}
                <CardContent>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", minHeight: "370px", position: "relative", padding: "24px 0" }}>
                    <GaugeComponent
                      arc={{
                        subArcs: [
                          { limit: 20, color: "#E5E7EB", showTick: true },
                          { limit: 40, color: "#93C5FD", showTick: true },
                          { limit: 60, color: "#60A5FA", showTick: true },
                          { limit: 100, color: "#2563EB", showTick: true },
                        ],
                      }}
                      type="radial"
                      value={((project.scopeCompletion || 0) * 100).toFixed(0)}
                      valueLabel={{
                        style: {
                          fontSize: "45px",
                          fill: "#fff",
                          textShadow: "black 1px 1px 0px, black 0px 0px 2.5em, black 0px 0px 0.2em",
                        },
                        formatTextValue: (value) => `${value}%`,
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        minHeight: "320px",
                        maxHeight: "340px",
                        margin: "0 auto",
                        display: "block",
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="w-full lg:w-[75%] h-full ml-0 lg:ml-5">
              <div className="mb-4">
                {project && <ProjectAnalytics project={project} />}
              </div>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                  <CardTitle className="text-sm font-medium">
                    Milestones
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
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
                                width: `${orderedMilestones.reduce(
                                  (acc, m, idx) => {
                                    const progress = m.percentageComplete || 0;
                                    return (
                                      acc +
                                      progress *
                                      (100 / orderedMilestones.length)
                                    );
                                  },
                                  0
                                )}%`,
                              }}
                            ></div>

                            <div className="flex justify-between relative">
                              {orderedMilestones.map((milestone, index) => {
                                const progress =
                                  typeof milestone.percentageComplete ===
                                    "string"
                                    ? parseFloat(
                                      milestone.percentageComplete
                                    ) || 0
                                    : milestone.percentageComplete || 0;
                                const isComplete = progress >= 1;
                                const isInProgress =
                                  progress > 0 && progress < 1;
                                console.log(
                                  "hahaha",
                                  milestone.startDate,
                                  milestone.finishDate
                                );
                                return (
                                  <div
                                    key={index}
                                    className="flex flex-col items-center flex-1 mx-3"
                                  >
                                    {/* Milestone Circle */}
                                    <div
                                      className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center mb-4 transition-all duration-300 ${isComplete
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
                                          className={`w-4 h-4 ${isComplete
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
                                      className={`w-full max-w-full p-3 lg:p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${isComplete
                                        ? "bg-green-50 dark:bg-green-950/30 border-2 border-green-200"
                                        : isInProgress
                                          ? "bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200"
                                          : "bg-white dark:bg-gray-800 border-2 border-gray-200"
                                        }`}
                                    >
                                      <div className="text-center">
                                        <h3
                                          className={`font-bold text-xs sm:text-sm mb-1 leading-tight ${isComplete
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
                                          {formatDateforMilestones(
                                            milestone.startDate
                                          )}{" "}
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
                                            className={`absolute -top-5 right-0 text-xs font-medium ${isComplete
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
                                height: `${orderedMilestones.reduce(
                                  (acc, m, idx) => {
                                    const progress = m.percentageComplete || 0;
                                    return (
                                      acc +
                                      progress *
                                      (100 / orderedMilestones.length)
                                    );
                                  },
                                  0
                                )}%`,
                              }}
                            ></div>

                            <div className="space-y-6">
                              {orderedMilestones.map((milestone, index) => {
                                const progress =
                                  typeof milestone.percentageComplete ===
                                    "string"
                                    ? parseFloat(
                                      milestone.percentageComplete
                                    ) || 0
                                    : milestone.percentageComplete || 0;
                                const isComplete = progress >= 1;
                                const isInProgress =
                                  progress > 0 && progress < 1;

                                return (
                                  <div
                                    key={index}
                                    className="flex items-start gap-4"
                                  >
                                    {/* Milestone Circle */}
                                    <div
                                      className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isComplete
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
                                      className={`flex-1 p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg ${isComplete
                                        ? "bg-green-50 dark:bg-green-950/30 border-2 border-green-200"
                                        : isInProgress
                                          ? "bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200"
                                          : "bg-white dark:bg-gray-800 border-2 border-gray-200"
                                        }`}
                                    >
                                      <h3
                                        className={`font-bold text-sm mb-1 ${isComplete
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
                                        {formatDateforMilestones(milestone.startDate)} -{" "}
                                        {formatDateforMilestones(milestone.finishDate)}
                                      </p>

                                      <div className="flex items-center gap-3">
                                        <Progress
                                          value={progress * 100}
                                          className="flex-1 h-2"
                                        />
                                        <span
                                          className={`text-xs font-medium min-w-12 ${isComplete
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
                  )}{" "}
                </CardContent>
              </Card>

            </div>
          </div>

        </div>
      </div>
      {/* Milestones Section */}

      {/* Activities Section - Full Width */}
      <div className="mt-6 mb-6">
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
                {/* {upcomingActivities &&
                  upcomingActivities.length > 0 &&
                  renderTimelineChart(upcomingActivities || [])} */}
                <GanttChartView activities={upComingActivities || []} />
                {upComingActivities && upComingActivities.length === 0 && (
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
                            <span>{formatDateforMilestones(activity.finishDate || 0)}</span>
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Management
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setIsAddingRisk(true);
                  setEditingRisk(null);
                  setRiskForm({
                    title: "",
                    description: "",
                    status: "active",
                    priority: "medium",
                    owner: "",
                  });
                }}
                style={{ backgroundColor: "rgb(22,142,255)" }}
                data-testid="button-add-risk"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Risk
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isAddingRisk && (
              <div className="border rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800">
                <h4 className="font-semibold mb-3">
                  {editingRisk ? "Edit Risk" : "Add New Risk"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Risk title"
                    value={riskForm.title}
                    onChange={(e) =>
                      setRiskForm({ ...riskForm, title: e.target.value })
                    }
                    data-testid="input-risk-title"
                  />
                  <Select
                    value={riskForm.owner}
                    onValueChange={(value) =>
                      setRiskForm({ ...riskForm, owner: value })
                    }
                  >
                    <SelectTrigger data-testid="select-risk-owner">
                      <SelectValue placeholder="Select Owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {riskOwners.map((owner) => (
                        <SelectItem key={owner} value={owner}>
                          {owner}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={riskForm.priority}
                    onValueChange={(value: Risk["priority"]) =>
                      setRiskForm({ ...riskForm, priority: value })
                    }
                  >
                    <SelectTrigger data-testid="select-risk-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={riskForm.status}
                    onValueChange={(value: Risk["status"]) =>
                      setRiskForm({ ...riskForm, status: value })
                    }
                  >
                    <SelectTrigger data-testid="select-risk-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="mitigated">Mitigated</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Risk description"
                  value={riskForm.description}
                  onChange={(e) =>
                    setRiskForm({ ...riskForm, description: e.target.value })
                  }
                  className="mt-4"
                  data-testid="textarea-risk-description"
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={editingRisk ? handleUpdateRisk : handleCreateRisk}
                    disabled={
                      createRiskMutation.isPending ||
                      updateRiskMutation.isPending
                    }
                    data-testid="button-save-risk"
                  >
                    {editingRisk ? "Update Risk" : "Add Risk"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingRisk(false);
                      setEditingRisk(null);
                      setRiskForm({
                        title: "",
                        description: "",
                        status: "active",
                        priority: "medium",
                        owner: "",
                      });
                    }}
                    data-testid="button-cancel-risk"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            { risks && risks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map((risk) => (
                    <TableRow key={risk._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{risk.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {risk.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(risk.priority)}</TableCell>
                      <TableCell>{getStatusBadge(risk.status)}</TableCell>
                      <TableCell>{risk.owner}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRisk(risk)}
                            data-testid={`button-edit-risk-${risk._id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              risk._id && handleDeleteRisk(risk._id)
                            }
                            data-testid={`button-delete-risk-${risk._id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">
                No risks recorded for this project.
              </p>
            )}
          </CardContent>
        </Card>
        {/* Project Location Map */}
        <div className="">
          <ProjectMap projects={project ? [project] : []} />
        </div>
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIInsights type="project" projectCode={project?.projectCode} />
          </CardContent>
        </Card> */}

        {/* Budget Consumption Chart */}
      </div>

      {/* <div className="mt-6">
        <Card data-testid="card-budget-chart" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Budget vs Time vs Scope Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Performance Comparison
                </h4>

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
      </div> */}

      {/* Project Location Map */}
      {/* <div className="mt-6">
        <ProjectMap projects={project ? [project] : []} />
      </div> */}
    </div>
    // </div>
  );
}

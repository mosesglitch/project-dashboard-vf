import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Building,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  Users,
  MapPin,
  Activity,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import type { ExcelProject, ExcelActivity } from "@shared/excel-schema";

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

const formatDate = (excelDate: number | string) => {
 
  const excelEpoch = new Date(1899, 11, 30);
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
    return `Ksh ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `Ksh ${(amount / 1000).toFixed(0)}K`;
  }
  return `Ksh ${amount.toLocaleString()}`;
};
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
export function ProjectDetailsModal({ isOpen, onClose, projectId }: ProjectDetailsModalProps) {
  const [isAddingRisk, setIsAddingRisk] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [riskForm, setRiskForm] = useState({
    title: "",
    description: "",
    status: "active" as Risk["status"],
    priority: "medium" as Risk["priority"],
    owner: "",
  });

  const queryClient = useQueryClient();

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery<ExcelProject>({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      return response.json();
    },
    enabled: isOpen && !!projectId,
  });

  // Fetch project activities
  const { data: activities } = useQuery<ExcelActivity[]>({
    queryKey: ["/api/activities", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/activities?projectId=${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
    enabled: isOpen && !!projectId,
  });

  // Fetch risks
  const { data: risks, isLoading: risksLoading } = useQuery<Risk[]>({
    queryKey: ["/api/risks", project?.projectCode],
    queryFn: async () => {
      const response = await fetch(`/api/risks?projectCode=${project?.projectCode}`);
      if (!response.ok) throw new Error("Failed to fetch risks");
      return response.json();
    },
    enabled: isOpen && !!project?.projectCode,
  });

  // Create risk mutation
  const createRiskMutation = useMutation({
    mutationFn: async (newRisk: Omit<Risk, "_id" | "createdAt" | "updatedAt">) => {
      const response = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRisk),
      });
      if (!response.ok) throw new Error("Failed to create risk");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks", project?.projectCode] });
      setIsAddingRisk(false);
      setRiskForm({ title: "", description: "", status: "active", priority: "medium", owner: "" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/risks", project?.projectCode] });
      setEditingRisk(null);
      setRiskForm({ title: "", description: "", status: "active", priority: "medium", owner: "" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/risks", project?.projectCode] });
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
    return <Badge className={variants[priority]}>{priority.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: Risk["status"]) => {
    const variants = {
      active: "bg-red-100 text-red-800",
      mitigated: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
    };
    return <Badge className={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Project {project.projectCode}
              </DialogTitle>
              <DialogDescription className="text-lg mt-1">
                {project.description}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Link href={`/project/${projectId}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Full View
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((project.percentageComplete || 0) * 100).toFixed(1)}%
                </div>
                <Progress value={(project.percentageComplete || 0) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(project.budgetAmount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Spent: {formatCurrency(project.totalAmountSpent || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Division
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{project.division}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {risks?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Active risks</p>
              </CardContent>
            </Card>
          </div>

          {/* Project Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Project Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-semibold">{formatDate(project.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Finish Date</p>
                  <p className="font-semibold">{formatDate(project.finishDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risks Management */}
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
                    setRiskForm({ title: "", description: "", status: "active", priority: "medium", owner: "" });
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
                      onChange={(e) => setRiskForm({ ...riskForm, title: e.target.value })}
                      data-testid="input-risk-title"
                    />
                    <Select
  value={riskForm.owner}
  onValueChange={(value) => setRiskForm({ ...riskForm, owner: value })}
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
                      onValueChange={(value: Risk["priority"]) => setRiskForm({ ...riskForm, priority: value })}
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
                      onValueChange={(value: Risk["status"]) => setRiskForm({ ...riskForm, status: value })}
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
                    onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })}
                    className="mt-4"
                    data-testid="textarea-risk-description"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={editingRisk ? handleUpdateRisk : handleCreateRisk}
                      disabled={createRiskMutation.isPending || updateRiskMutation.isPending}
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
                        setRiskForm({ title: "", description: "", status: "active", priority: "medium", owner: "" });
                      }}
                      data-testid="button-cancel-risk"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {risksLoading ? (
                <p>Loading risks...</p>
              ) : risks && risks.length > 0 ? (
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
                            <p className="text-sm text-muted-foreground">{risk.description}</p>
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
                              onClick={() => risk._id && handleDeleteRisk(risk._id)}
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
                <p className="text-muted-foreground">No risks recorded for this project.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          {activities && activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                    {activities.slice(0, 5).map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>{activity.item}</TableCell>
                        <TableCell>{formatDate(activity.startDate)}</TableCell>
                        <TableCell>{formatDate(activity.finishDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={(activity.percentageComplete || 0) * 100} className="w-20" />
                            <span className="text-sm">{((activity.percentageComplete || 0) * 100).toFixed(0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
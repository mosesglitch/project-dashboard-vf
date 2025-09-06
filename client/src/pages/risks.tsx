import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Plus, Filter, Trash2, Edit, TrendingUp, Clock, CheckCircle, Shield } from "lucide-react";
import { Navbar } from "@/components/navbar";

interface RiskFilters {
  status: string;
  priority: string;
  owner: string;
  projectCode: string;
  division: string;
}

interface Risk {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  division: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  owner: string;
  dueDate?: string;
  createdAt: string;
}

interface RiskFormData {
  title: string;
  description: string;
  severity: string;
  status: string;
  owner: string;
  projectCode: string;
  dueDate?: string;
}

export default function RisksPage() {
  const [filters, setFilters] = useState<RiskFilters>({
    status: "all",
    priority: "all",
    owner: "all",
    projectCode: "all",
    division: "all",
  });
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [formData, setFormData] = useState<RiskFormData>({
    title: "",
    description: "",
    severity: "medium",
    status: "open",
    owner: "",
    projectCode: "",
    dueDate: "",
  });

  const queryClient = useQueryClient();

  // Fetch risks with filters
  const { data: risks = [], isLoading } = useQuery<Risk[]>({
    queryKey: ["/api/risks", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "all") params.append(key, value);
      });

      const response = await fetch(`/api/risks?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch risks");
      return response.json();
    },
  });

  // Fetch risk statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/risks/stats/overview"],
    queryFn: async () => {
      const response = await fetch("/api/risks/stats/overview");
      if (!response.ok) throw new Error("Failed to fetch risk stats");
      return response.json();
    },
  });

  // Create risk mutation
  const createRiskMutation = useMutation({
    mutationFn: async (data: RiskFormData) => {
      const response = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create risk");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/risks/stats/overview"] });
      resetForm();
      setIsCreateDialogOpen(false);
    },
  });

  // Update risk mutation
  const updateRiskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RiskFormData> }) => {
      const response = await fetch(`/api/risks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update risk");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/risks/stats/overview"] });
      setEditingRisk(null);
      resetForm();
    },
  });

  // Delete risk mutation
  const deleteRiskMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/risks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete risk");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/risks/stats/overview"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      severity: "medium",
      status: "open",
      owner: "",
      projectCode: "",
      dueDate: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRisk) {
      updateRiskMutation.mutate({ id: editingRisk.id, data: formData });
    } else {
      createRiskMutation.mutate(formData);
    }
  };

  const handleEdit = (risk: Risk) => {
    setEditingRisk(risk);
    setFormData({
      title: risk.title,
      description: risk.description,
      severity: risk.severity,
      status: risk.status,
      owner: risk.owner,
      projectCode: risk.projectCode,
      dueDate: risk.dueDate || "",
    });
    setIsCreateDialogOpen(true);
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      critical: { label: "Critical", className: "bg-red-100 text-red-800 border-red-200" },
      high: { label: "High", className: "bg-orange-100 text-orange-800 border-orange-200" },
      medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      low: { label: "Low", className: "bg-green-100 text-green-800 border-green-200" },
    };
    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.medium;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: "Open", className: "bg-red-100 text-red-800", icon: AlertTriangle },
      in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-800", icon: Clock },
      closed: { label: "Closed", className: "bg-gray-100 text-gray-800", icon: CheckCircle },
      mitigated: { label: "Mitigated", className: "bg-green-100 text-green-800", icon: Shield },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Get unique values for filter options
  const uniqueOwners = [...new Set(risks.map(r => r.owner))];
  const uniqueProjectCodes = [...new Set(risks.map(r => r.projectCode))];
  const uniqueDivisions = [...new Set(risks.map(r => r.division))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar DisplayTitle="Risk Management" subtitle="Manage and monitor project risks" />
      
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Risk Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Monitor and manage all project risks</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {resetForm(); setEditingRisk(null);}}>
                <Plus className="h-4 w-4 mr-2" />
                Add Risk
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingRisk ? "Edit Risk" : "Create New Risk"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="severity">Priority</Label>
                    <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="mitigated">Mitigated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="owner">Owner</Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="projectCode">Project Code</Label>
                  <Input
                    id="projectCode"
                    value={formData.projectCode}
                    onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                    placeholder="e.g., PRJ-001"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {setIsCreateDialogOpen(false); setEditingRisk(null); resetForm();}}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRiskMutation.isPending || updateRiskMutation.isPending}>
                    {editingRisk ? "Update" : "Create"} Risk
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRisks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.openRisks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inProgressRisks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mitigated</CardTitle>
                <Shield className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.mitigatedRisks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{stats.criticalRisks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.highRisks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Medium</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.mediumRisks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low</CardTitle>
                <AlertTriangle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.lowRisks}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority-filter">Priority</Label>
                <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="owner-filter">Owner</Label>
                <Select value={filters.owner} onValueChange={(value) => setFilters({ ...filters, owner: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Owners" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    {uniqueOwners.map((owner) => (
                      <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project-filter">Project Code</Label>
                <Select value={filters.projectCode} onValueChange={(value) => setFilters({ ...filters, projectCode: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {uniqueProjectCodes.map((code) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="division-filter">Division</Label>
                <Select value={filters.division} onValueChange={(value) => setFilters({ ...filters, division: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Divisions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {uniqueDivisions.map((division) => (
                      <SelectItem key={division} value={division}>{division}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Register</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Loading risks...
                      </TableCell>
                    </TableRow>
                  ) : risks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No risks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    risks.map((risk) => (
                      <TableRow key={risk.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{risk.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{risk.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{risk.projectCode}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{risk.projectName}</div>
                          </div>
                        </TableCell>
                        <TableCell>{risk.division}</TableCell>
                        <TableCell>{getSeverityBadge(risk.severity)}</TableCell>
                        <TableCell>{getStatusBadge(risk.status)}</TableCell>
                        <TableCell>{risk.owner}</TableCell>
                        <TableCell>
                          {risk.dueDate ? new Date(risk.dueDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(risk)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteRiskMutation.mutate(risk.id)}
                              disabled={deleteRiskMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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
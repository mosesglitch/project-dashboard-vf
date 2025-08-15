import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard/header";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { ChartsSection } from "@/components/dashboard/charts-section";
import { ProjectTable } from "@/components/dashboard/project-table";
import { ProjectModal } from "@/components/dashboard/project-modal";
import type { Project } from "@shared/schema";
import type { DashboardFilters, KPIData, SpendingData, StatusData, DivisionData } from "@/lib/types";

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    status: "all",
    division: "all",
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31"
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch projects with filters
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.division !== 'all') params.append('division', filters.division);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  // Fetch KPI data
  const { data: kpiData, isLoading: kpiLoading } = useQuery<KPIData>({
    queryKey: ['/api/projects/stats/overview'],
  });

  // Fetch chart data
  const { data: spendingData, isLoading: spendingLoading } = useQuery<SpendingData>({
    queryKey: ['/api/projects/charts/spending'],
  });

  const { data: statusData, isLoading: statusLoading } = useQuery<StatusData>({
    queryKey: ['/api/projects/charts/status'],
  });

  const { data: divisionData, isLoading: divisionLoading } = useQuery<DivisionData>({
    queryKey: ['/api/projects/charts/divisions'],
  });

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const chartsLoading = spendingLoading || statusLoading || divisionLoading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <DashboardHeader filters={filters} onFiltersChange={setFilters} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <KPICards data={kpiData} isLoading={kpiLoading} />
        
        <ChartsSection
          spendingData={spendingData}
          statusData={statusData}
          divisionData={divisionData}
          isLoading={chartsLoading}
        />
        
        <ProjectTable
          projects={projects}
          isLoading={projectsLoading}
          onProjectSelect={handleProjectSelect}
        />
      </main>

      <ProjectModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  ComboBox,
  ComboBoxItem,
  DatePicker,
  FlexBox,
  Title,
  Label,
  Text,
} from "@ui5/webcomponents-react";

// UI5 Charts - temporarily disabled due to runtime errors
// import {
//   PieChart,
//   ColumnChart,
// } from "@ui5/webcomponents-react-charts";

// Import required icons
import "@ui5/webcomponents-icons/dist/download.js";

import type { ExcelProject } from "@shared/excel-schema";
import { parseLocation } from "@shared/excel-schema";
import type { DashboardFilters } from "@/lib/types";

export default function UI5Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    status: "all",
    division: "all", 
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31"
  });
  const [, navigate] = useLocation();

  // Fetch data using Excel data service
  const { data: projects, isLoading: projectsLoading } = useQuery<ExcelProject[]>({
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

  const { data: kpiData } = useQuery<any>({
    queryKey: ['/api/projects/stats/overview'],
  });

  const { data: projectLocations } = useQuery<any[]>({
    queryKey: ['/api/projects/locations'],
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Function to reload Excel data
  const reloadData = async () => {
    try {
      await fetch('/api/projects/reload', { method: 'POST' });
      // Invalidate all queries to refetch data
      window.location.reload();
    } catch (error) {
      console.error('Failed to reload data:', error);
    }
  };

  // Sample locations for map when API fails
  const getSampleLocations = () => {
    if (!projects) return [];
    return projects.slice(0, 3).map((project, index) => {
      const coords = [
        { lat: 39.7419, lng: -3.9389 },
        { lat: 39.6434, lng: -0.4571 },
        { lat: 34.7680, lng: -0.0917 }
      ];
      return {
        id: project.id.toString(),
        code: project.projectCode,
        name: project.description,
        locations: [coords[index] || coords[0]]
      };
    });
  };


  const handleTableRowClick = (event: any) => {
    const row = event.detail?.row || event.target.closest('[data-project-id]');
    const projectId = row?.dataset?.projectId;
    if (projectId) {
      navigate(`/project/${projectId}`);
    }
  };

  // Calculate spending categories based on variance ratio
  const getSpendingCategories = () => {
    if (!projects) return [];
    
    const categories = {
      'Under Budget': 0,
      'Within Budget': 0, 
      'Overspent': 0,
      'Critical Overspent': 0
    };
    
    projects.forEach(project => {
      const variance = project.totalAmountSpent / project.budgetAmount;
      if (variance < 0.9) categories['Under Budget']++;
      else if (variance < 1.1) categories['Within Budget']++;
      else if (variance < 1.5) categories['Overspent']++;
      else categories['Critical Overspent']++;
    });
    
    return Object.entries(categories).map(([category, count]) => ({ category, count }));
  };

  // Calculate project status based on Performance Index (PI)
  const getProjectStatus = () => {
    if (!projects) return [];
    
    const statuses = {
      'Ahead of Schedule': 0,
      'On Track': 0,
      'Slightly Behind': 0,
      'Critical Delay': 0
    };
    
    projects.forEach(project => {
      const pi = 100 / (project.timeCompletion || 100); // Calculate PI from time completion
      
      if (pi >= 1.10) statuses['Ahead of Schedule']++;
      else if (pi >= 0.90) statuses['On Track']++;
      else if (pi >= 0.75) statuses['Slightly Behind']++;
      else statuses['Critical Delay']++;
    });
    
    return Object.entries(statuses).map(([status, count]) => ({ status, count }));
  };

  // Calculate projects by division
  const getDivisionData = () => {
    if (!projects) return [];
    
    const divisions = {
      'Mechanical': 0,
      'Electrical': 0,
      'Instrumentation': 0
    };
    
    projects.forEach(project => {
      const division = project.division.charAt(0).toUpperCase() + project.division.slice(1);
      if (divisions.hasOwnProperty(division)) {
        divisions[division as keyof typeof divisions]++;
      }
    });
    
    return Object.entries(divisions).map(([division, count]) => ({ division, count }));
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <ObjectPage
        headerArea={
          <ObjectPageHeader>
            {/* KPI Cards in Header Area */}
            <FlexBox wrap="NoWrap" justifyContent="SpaceAround" style={{ padding: '1rem', overflowX: 'auto' }}>
              <Card
                style={{ margin: '0.5rem', minWidth: '200px', cursor: 'pointer' }}
                data-testid="tile-total-projects"
              >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title level="H2">{kpiData?.totalProjects?.toString() || "0"}</Title>
                  <Text>Total Projects</Text>
                </div>
              </Card>
              <Card
                style={{ margin: '0.5rem', minWidth: '200px', cursor: 'pointer' }}
                data-testid="tile-active-projects"
              >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title level="H2" style={{color: '#28a745'}}>{kpiData?.activeProjects?.toString() || "0"}</Title>
                  <Text>Active Projects</Text>
                </div>
              </Card>
              <Card
                style={{ margin: '0.5rem', minWidth: '200px', cursor: 'pointer' }}
                data-testid="tile-completed-projects"
              >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title level="H2" style={{color: '#007bff'}}>{kpiData?.completedProjects?.toString() || "0"}</Title>
                  <Text>Completed Projects</Text>
                </div>
              </Card>
              <Card
                style={{ margin: '0.5rem', minWidth: '200px', cursor: 'pointer' }}
                data-testid="tile-delayed-projects"
              >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title level="H2" style={{color: '#dc3545'}}>{kpiData?.delayedProjects?.toString() || "0"}</Title>
                  <Text>Delayed Projects</Text>
                </div>
              </Card>
              <Card
                style={{ margin: '0.5rem', minWidth: '200px', cursor: 'pointer' }}
                data-testid="tile-total-budget"
              >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title level="H2">{kpiData ? formatCurrency(kpiData.totalBudget) : "$0"}</Title>
                  <Text>Total Budget</Text>
                </div>
              </Card>
              <Card
                style={{ margin: '0.5rem', minWidth: '200px', cursor: 'pointer' }}
                data-testid="tile-actual-spend"
              >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title level="H2" style={{color: '#ffc107'}}>{kpiData ? formatCurrency(kpiData.actualSpend) : "$0"}</Title>
                  <Text>Actual Spend</Text>
                </div>
              </Card>
              <Card
                style={{ margin: '0.5rem', minWidth: '200px', cursor: 'pointer' }}
                data-testid="tile-amount-received"
              >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title level="H2" style={{color: '#17a2b8'}}>{kpiData ? formatCurrency(kpiData.amountReceived) : "$0"}</Title>
                  <Text>Amount Received</Text>
                </div>
              </Card>
            </FlexBox>
          </ObjectPageHeader>
        }
        titleArea={
          <ObjectPageTitle>
            <Title level="H1">TechCorp Engineering Dashboard</Title>
            {/* Filters in Title Area */}
            <FlexBox wrap="Wrap" justifyContent="Start" style={{ padding: '1rem' }}>
              <DatePicker
                value={filters.dateFrom}
                onChange={(e: any) => setFilters({...filters, dateFrom: e.target.value as string})}
                style={{ marginRight: '1rem' }}
                data-testid="input-date-from"
              />
              <DatePicker
                value={filters.dateTo}
                onChange={(e: any) => setFilters({...filters, dateTo: e.target.value as string})}
                style={{ marginRight: '1rem' }}
                data-testid="input-date-to"
              />
              <ComboBox
                value={filters.status}
                onChange={(e: any) => setFilters({...filters, status: e.target.value as string})}
                style={{ marginRight: '1rem', width: '200px' }}
                data-testid="select-status-filter"
              >
                <ComboBoxItem text="All Status" />
                <ComboBoxItem text="Active" />
                <ComboBoxItem text="Completed" />
                <ComboBoxItem text="Delayed" />
              </ComboBox>
              <ComboBox
                value={filters.division}
                onChange={(e: any) => setFilters({...filters, division: e.target.value as string})}
                style={{ width: '200px' }}
                data-testid="select-division-filter"
              >
                <ComboBoxItem text="All Divisions" />
                <ComboBoxItem text="Mechanical" />
                <ComboBoxItem text="Electrical" />
                <ComboBoxItem text="Instrumentation" />
              </ComboBox>
            </FlexBox>
          </ObjectPageTitle>
        }
      >

        {/* Charts Section - temporarily disabled */}
        <ObjectPageSection 
          id="charts-section"
          titleText="Analytics Dashboard"
        >
          <ObjectPageSubSection id="charts-subsection" titleText="">
            <FlexBox wrap="Wrap" justifyContent="SpaceAround" style={{ padding: '1rem', gap: '2rem' }}>
              
              {/* Spending Categories Summary */}
              <Card
                style={{ minWidth: '350px', maxWidth: '400px', height: '200px' }}
                header={
                  <CardHeader
                    titleText="Spending Categories"
                    data-testid="card-spending-chart"
                  />
                }
              >
                <div style={{ padding: '1rem' }}>
                  {getSpendingCategories().map((cat, idx) => (
                    <div key={idx} style={{ marginBottom: '0.5rem' }}>
                      <Text>{cat.category}: {cat.count} projects</Text>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Project Status Summary */}
              <Card
                style={{ minWidth: '350px', maxWidth: '400px', height: '200px' }}
                header={
                  <CardHeader
                    titleText="Project Status (Performance Index)"
                    data-testid="card-status-chart"
                  />
                }
              >
                <div style={{ padding: '1rem' }}>
                  {getProjectStatus().map((status, idx) => (
                    <div key={idx} style={{ marginBottom: '0.5rem' }}>
                      <Text>{status.status}: {status.count} projects</Text>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Projects by Division Summary */}
              <Card
                style={{ minWidth: '350px', maxWidth: '400px', height: '200px' }}
                header={
                  <CardHeader
                    titleText="Projects by Division"
                    data-testid="card-division-chart"
                  />
                }
              >
                <div style={{ padding: '1rem' }}>
                  {getDivisionData().map((div, idx) => (
                    <div key={idx} style={{ marginBottom: '0.5rem' }}>
                      <Text>{div.division}: {div.count} projects</Text>
                    </div>
                  ))}
                </div>
              </Card>
            </FlexBox>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Projects Table Section */}
        <ObjectPageSection 
          id="projects-section"
          titleText="Project Portfolio"
        >
          <ObjectPageSubSection id="projects-subsection" titleText="">
            <Card
              header={
                <CardHeader
                  titleText="All Projects"
                  action={
                    <Button
                      icon="download"
                      design="Emphasized"
                      data-testid="button-export-projects"
                    >
                      Export
                    </Button>
                  }
                  data-testid="card-projects-table"
                />
              }
            >
              <Table
                onRowClick={handleTableRowClick}
                data-testid="table-projects"
                headerRow={
                  <TableHeaderRow sticky>
                    <TableHeaderCell minWidth="150px" width="150px">
                      <span>Project Code</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="250px" width="250px">
                      <span>Project Name</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="120px" width="120px">
                      <span>% Complete</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="150px" width="150px">
                      <span>Time Progress</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="150px" width="150px">
                      <span>Budget Status</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="80px" width="80px">
                      <span>Risks</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="150px" width="150px">
                      <span>Amount Received</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="120px" width="120px">
                      <span>Status</span>
                    </TableHeaderCell>
                  </TableHeaderRow>
                }
              >
                {projects?.map((project) => (
                  <TableRow
                    key={project.id}
                    data-project-id={project.id}
                    data-testid={`row-project-${project.id}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Text data-testid={`text-project-code-${project.id}`}>
                        {project.projectCode}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text data-testid={`text-project-name-${project.id}`}>
                        {project.description}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <div>
                        <ProgressIndicator
                          value={Math.round(project.percentageComplete * 100)}
                          style={{ width: '100px', marginBottom: '0.25rem' }}
                        />
                        <Text data-testid={`text-completion-${project.id}`}>
                          {Math.round(project.percentageComplete * 100)}%
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Text data-testid={`text-time-completion-${project.id}`}>
                        {(project.timeCompletion || 0).toFixed(1)}%
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text 
                        data-testid={`text-budget-variance-${project.id}`}
                        style={{
                          color: project.budgetStatusCategory === 'Under Budget' ? '#28a745' :
                                 project.budgetStatusCategory === 'Within Budget' ? '#007bff' :
                                 project.budgetStatusCategory === 'Over Budget' ? '#ffc107' : '#dc3545'
                        }}
                      >
                        {project.budgetStatusCategory || project.budgetStatus}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text 
                        data-testid={`text-risk-count-${project.id}`}
                        style={{ color: (project.issuesRisks || 0) > 3 ? '#dc3545' : '#28a745' }}
                      >
                        {project.issuesRisks || 0}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text data-testid={`text-amount-received-${project.id}`}>
                        {formatCurrency(project.amountReceived || 0)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text 
                        data-testid={`text-status-${project.id}`}
                        style={{
                          color: project.percentageComplete >= 1 ? '#007bff' :
                                 project.percentageComplete > 0 ? '#28a745' :
                                 (project.timeCompletion || 0) > 100 ? '#dc3545' : '#ffc107'
                        }}
                      >
                        {project.percentageComplete >= 1 ? 'Completed' :
                         project.percentageComplete > 0 ? 'Active' :
                         (project.timeCompletion || 0) > 100 ? 'Delayed' : 'Pending'}
                      </Text>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </Card>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Map Section */}
        <ObjectPageSection 
          id="map-section"
          titleText="Project Locations"
        >
          <ObjectPageSubSection id="map-subsection" titleText="">
            <Card
              header={
                <CardHeader
                  titleText="Project Geographic Distribution"
                  data-testid="card-project-map"
                />
              }
            >
              <div style={{ height: '400px', width: '100%' }}>
                <MapContainer 
                  center={[39.8283, -98.5795]} 
                  zoom={4} 
                  style={{ height: '100%', width: '100%' }}
                  data-testid="map-projects"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {(projectLocations || getSampleLocations())?.map((project: any) => 
                    project.locations?.map((location: any, index: number) => (
                      <Marker 
                        key={`${project.id}-${index}`} 
                        position={[location.lat, location.lng]}
                        eventHandlers={{
                          click: () => navigate(`/project/${project.id}`)
                        }}
                      >
                        <Popup>
                          <div>
                            <strong>{project.code}</strong>
                            <br />
                            {project.name}
                            <br />
                            <small>Click to view project details</small>
                          </div>
                        </Popup>
                      </Marker>
                    ))
                  )}
                </MapContainer>
              </div>
            </Card>
          </ObjectPageSubSection>
        </ObjectPageSection>
      </ObjectPage>
    </div>
  );
}
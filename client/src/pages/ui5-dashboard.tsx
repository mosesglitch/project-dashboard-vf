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

// Import required icons
import "@ui5/webcomponents-icons/dist/download.js";

import type { Project } from "@shared/schema";
import type { DashboardFilters, KPIData, SpendingData, StatusData, DivisionData } from "@/lib/types";

export default function UI5Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    status: "all",
    division: "all", 
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31"
  });
  const [, navigate] = useLocation();

  // Fetch data using the same queries as before
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

  const { data: kpiData } = useQuery<KPIData>({
    queryKey: ['/api/projects/stats/overview'],
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Sample project locations for the map
  const projectLocations = [
    { id: "1", name: "Power Plant Modernization", lat: 37.7749, lng: -122.4194 },
    { id: "2", name: "Control System Upgrade", lat: 40.7128, lng: -74.0060 },
    { id: "3", name: "Safety Systems Installation", lat: 34.0522, lng: -118.2437 },
    { id: "4", name: "Turbine Maintenance", lat: 41.8781, lng: -87.6298 },
  ];

  const handleTableRowClick = (event: any) => {
    const row = event.detail?.row || event.target.closest('[data-project-id]');
    const projectId = row?.dataset?.projectId;
    if (projectId) {
      navigate(`/project/${projectId}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <ObjectPage
        headerArea={
          <ObjectPageHeader>
            {/* KPI Cards in Header Area */}
            <FlexBox wrap="Wrap" justifyContent="SpaceAround" style={{ padding: '1rem' }}>
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
          <ObjectPageTitle titleText="TechCorp Engineering Dashboard">
            {/* Filters in Title Area */}
            <FlexBox wrap="Wrap" justifyContent="FlexStart" style={{ padding: '1rem' }}>
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
                <ComboBoxItem text="All Status" value="all" />
                <ComboBoxItem text="Active" value="active" />
                <ComboBoxItem text="Completed" value="completed" />
                <ComboBoxItem text="Delayed" value="delayed" />
              </ComboBox>
              <ComboBox
                value={filters.division}
                onChange={(e: any) => setFilters({...filters, division: e.target.value as string})}
                style={{ width: '200px' }}
                data-testid="select-division-filter"
              >
                <ComboBoxItem text="All Divisions" value="all" />
                <ComboBoxItem text="Mechanical" value="mechanical" />
                <ComboBoxItem text="Electrical" value="electrical" />
                <ComboBoxItem text="Instrumentation" value="instrumentation" />
              </ComboBox>
            </FlexBox>
          </ObjectPageTitle>
        }
      >

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
                        {project.code}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text data-testid={`text-project-name-${project.id}`}>
                        {project.name}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <div>
                        <ProgressIndicator
                          value={project.percentComplete}
                          style={{ width: '100px', marginBottom: '0.25rem' }}
                        />
                        <Text data-testid={`text-completion-${project.id}`}>
                          {project.percentComplete}%
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Text data-testid={`text-time-completion-${project.id}`}>
                        {project.elapsedDays}/{project.totalPlannedDays} days
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text 
                        data-testid={`text-budget-variance-${project.id}`}
                        style={{
                          color: project.budgetVarianceCategory === 'under_budget' ? '#28a745' :
                                 project.budgetVarianceCategory === 'within_budget' ? '#007bff' :
                                 project.budgetVarianceCategory === 'overspent' ? '#ffc107' : '#dc3545'
                        }}
                      >
                        {project.budgetVarianceCategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text 
                        data-testid={`text-risk-count-${project.id}`}
                        style={{ color: project.riskCount > 3 ? '#dc3545' : '#28a745' }}
                      >
                        {project.riskCount}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text data-testid={`text-amount-received-${project.id}`}>
                        {formatCurrency(parseFloat(project.amountReceived))}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text 
                        data-testid={`text-status-${project.id}`}
                        style={{
                          color: project.status === 'completed' ? '#007bff' :
                                 project.status === 'active' ? '#28a745' :
                                 project.status === 'delayed' ? '#dc3545' : '#ffc107'
                        }}
                      >
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
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
                  {projectLocations.map((location) => (
                    <Marker 
                      key={location.id} 
                      position={[location.lat, location.lng]}
                      eventHandlers={{
                        click: () => navigate(`/project/${location.id}`)
                      }}
                    >
                      <Popup>
                        <div>
                          <strong>{location.name}</strong>
                          <br />
                          Click to view project details
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </Card>
          </ObjectPageSubSection>
        </ObjectPageSection>
      </ObjectPage>
    </div>
  );
}
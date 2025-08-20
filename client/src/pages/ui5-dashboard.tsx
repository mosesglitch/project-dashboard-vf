import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
// Temporarily remove problematic UI5 charts to fix runtime errors
// import {
//   PieChart,
//   DonutChart,
//   BarChart,
//   ColumnChart,
// } from "@ui5/webcomponents-react-charts";
import { Link } from "wouter";
// Fix default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
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
import {
  PieChart,
  DonutChart,
  BarChart,
  ColumnChart,
} from "@ui5/webcomponents-react-charts";
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
    dateFrom: "",
    dateTo: "",
  });
  const [, navigate] = useLocation();

  // Fetch data using Excel data service
  const { data: projects, isLoading: projectsLoading } = useQuery<
    ExcelProject[]
  >({
    queryKey: ["/api/projects", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.division !== "all")
        params.append("division", filters.division);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  const { data: kpiData } = useQuery<any>({
    queryKey: ["/api/projects/stats/overview"],
  });

  const { data: performanceStats } = useQuery<any>({
    queryKey: ["/api/projects/stats/performance"],
  });

  const { data: spendingStats } = useQuery<any>({
    queryKey: ["/api/projects/stats/spending"],
  });

  const { data: divisionStats } = useQuery<any>({
    queryKey: ["/api/projects/stats/divisions"],
  });

  const { data: projectLocations } = useQuery<any[]>({
    queryKey: ["/api/projects/locations"],
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
      await fetch("/api/projects/reload", { method: "POST" });
      // Invalidate all queries to refetch data
      window.location.reload();
    } catch (error) {
      console.error("Failed to reload data:", error);
    }
  };

  // Sample locations for map when API fails
  const getSampleLocations = () => {
    if (!projects || projects.length === 0) {
      // Return default sample locations if no projects
      return [
        {
          id: "1",
          code: "51422",
          name: "Sample Project 1",
          locations: [{ lat: 39.7419, lng: -3.9389 }],
        },
        {
          id: "2",
          code: "51419",
          name: "Sample Project 2",
          locations: [{ lat: 39.6434, lng: -0.4571 }],
        },
      ];
    }

    return projects.slice(0, 3).map((project, index) => {
      const coords = [
        { lat: 39.7419, lng: -3.9389 },
        { lat: 39.6434, lng: -0.4571 },
        { lat: 34.768, lng: -0.0917 },
      ];
      return {
        id: project.id.toString(),
        code: project.projectCode,
        name: project.description,
        locations: [coords[index] || coords[0]],
      };
    });
  };

  const handleTableRowClick = (event: any) => {
    const row = event.detail?.row || event.target.closest("[data-project-id]");
    const projectId = row?.dataset?.projectId;
    if (projectId) {
      navigate(`/project/${projectId}`);
    }
  };

  // Helper functions to format chart data from API responses
  const formatChartData = (data: Record<string, number> | undefined) => {
    if (!data) return [];
    return Object.entries(data).map(([key, value]) => ({ name: key, value }));
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <ObjectPage
        headerArea={
          <ObjectPageHeader>
            {/* KPI Cards in Header Area - Smaller width and removed active/completed projects */}
            <FlexBox
              wrap="Wrap" // changed from "NoWrap" to "Wrap"
              justifyContent="SpaceAround"
              style={{
                padding: "1rem",
                overflowX: "auto",
                gap: "1rem", // add gap for better wrapping
              }}
            >
              <Card
                style={{
                  margin: "0.5rem",
                  minWidth: "160px",
                  flex: "1 1 160px", // allow cards to shrink/grow
                  cursor: "pointer",
                  maxWidth: "220px", // optional: limit max width for wrapping
                }}
                data-testid="tile-total-projects"
              >
                <div style={{ textAlign: "center", padding: "0.75rem" }}>
                  <Title level="H3">
                    {kpiData?.totalProjects
                      ? Math.round(kpiData.totalProjects).toString()
                      : "0"}
                  </Title>
                  <Text>Total Projects</Text>
                </div>
              </Card>
              <Card
                style={{
                  margin: "0.5rem",
                  minWidth: "160px",
                  flex: "1 1 160px",
                  cursor: "pointer",
                  maxWidth: "220px",
                }}
                data-testid="tile-total-budget"
              >
                <div style={{ textAlign: "center", padding: "0.75rem" }}>
                  <Title level="H3">
                    {kpiData
                      ? formatCurrency(Math.round(kpiData.totalBudget))
                      : "$0"}
                  </Title>
                  <Text>Total Budget</Text>
                </div>
              </Card>
              <Card
                style={{
                  margin: "0.5rem",
                  minWidth: "160px",
                  flex: "1 1 160px",
                  cursor: "pointer",
                  maxWidth: "220px",
                }}
                data-testid="tile-actual-spend"
              >
                <div style={{ textAlign: "center", padding: "0.75rem" }}>
                  <Title level="H3" style={{ color: "#ffc107" }}>
                    {kpiData
                      ? formatCurrency(Math.round(kpiData.actualSpend))
                      : "$0"}
                  </Title>
                  <Text>Actual Spend</Text>
                </div>
              </Card>
              <Card
                style={{
                  margin: "0.5rem",
                  minWidth: "160px",
                  flex: "1 1 160px",
                  cursor: "pointer",
                  maxWidth: "220px",
                }}
                data-testid="tile-amount-received"
              >
                <div style={{ textAlign: "center", padding: "0.75rem" }}>
                  <Title level="H3" style={{ color: "#17a2b8" }}>
                    {kpiData
                      ? formatCurrency(Math.round(kpiData.amountReceived))
                      : "$0"}
                  </Title>
                  <Text>Amount Received</Text>
                </div>
              </Card>
              <Card
                style={{
                  margin: "0.5rem",
                  minWidth: "160px",
                  flex: "1 1 160px",
                  cursor: "pointer",
                  maxWidth: "220px",
                }}
                data-testid="tile-total-risks"
              >
                <div style={{ textAlign: "center", padding: "0.75rem" }}>
                  <Title level="H3" style={{ color: "#dc3545" }}>
                    {kpiData?.totalRisks
                      ? Math.round(kpiData.totalRisks).toString()
                      : "0"}
                  </Title>
                  <Text>Total Risks</Text>
                </div>
              </Card>
            </FlexBox>
          </ObjectPageHeader>
        }
        titleArea={
          <ObjectPageTitle>
            <Title level="H1">TechCorp Engineering Dashboard</Title>
            {/* Filters in Title Area */}
            <FlexBox
              wrap="Wrap"
              justifyContent="Start"
              style={{ padding: "1rem" }}
            >
              <DatePicker
                value={filters.dateFrom}
                onChange={(e: any) =>
                  setFilters({ ...filters, dateFrom: e.target.value as string })
                }
                style={{ marginRight: "1rem" }}
                data-testid="input-date-from"
              />
              <DatePicker
                value={filters.dateTo}
                onChange={(e: any) =>
                  setFilters({ ...filters, dateTo: e.target.value as string })
                }
                style={{ marginRight: "1rem" }}
                data-testid="input-date-to"
              />
              <ComboBox
                value={filters.status}
                onChange={(e: any) =>
                  setFilters({ ...filters, status: e.target.value as string })
                }
                style={{ marginRight: "1rem", width: "200px" }}
                data-testid="select-status-filter"
              >
                <ComboBoxItem text="All Status" />
                <ComboBoxItem text="Active" />
                <ComboBoxItem text="Completed" />
                <ComboBoxItem text="Delayed" />
              </ComboBox>
              <ComboBox
                value={filters.division}
                onChange={(e: any) =>
                  setFilters({ ...filters, division: e.target.value as string })
                }
                style={{ width: "200px" }}
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
        <ObjectPageSection id="charts-section" titleText="Analytics Dashboard">
          <ObjectPageSubSection id="charts-subsection" titleText="">
            <FlexBox
              wrap="Wrap"
              justifyContent="SpaceAround"
              style={{ padding: "1rem", gap: "2rem" }}
            >
              {/* Spending Categories Pie Chart */}
              <Card
              style={{
                minWidth: "350px",
                maxWidth: "400px",
                height: "450px",
                display: "flex",
                flexDirection: "column",
              }}
              header={
                <CardHeader
                titleText="Spending Categories"
                data-testid="card-spending-chart"
                />
              }
              >
              <div style={{ flex: 1, padding: "1rem", minHeight: 0 }}>
                {spendingStats ? (
                <PieChart
                  dataset={formatChartData(spendingStats)}
                  dimensions={[{ accessor: "name" }]}
                  measures={[{ accessor: "value" }]}
                  chartConfig={{ height: 250 }}
                />
                ) : (
                <Text>Loading...</Text>
                )}
              </div>
              </Card>

              {/* Project Status by Performance Category Pie Chart */}
              <Card
              style={{
                minWidth: "350px",
                maxWidth: "400px",
                height: "450px",
                display: "flex",
                flexDirection: "column",
              }}
              header={
                <CardHeader
                titleText="Project Status (Performance Category)"
                data-testid="card-status-chart"
                />
              }
              >
              <div style={{ flex: 1, padding: "1rem", minHeight: 0 }}>
                {performanceStats ? (
                <PieChart
                  dataset={formatChartData(performanceStats)}
                  dimensions={[{ accessor: "name" }]}
                  measures={[{ accessor: "value" }]}
                  chartConfig={{ height: 250 }}
                />
                ) : (
                <Text>Loading...</Text>
                )}
              </div>
              </Card>

              {/* Projects by Division Bar Chart */}
              <Card
              style={{
                minWidth: "350px",
                maxWidth: "400px",
                height: "450px",
                display: "flex",
                flexDirection: "column",
              }}
              header={
                <CardHeader
                titleText="Projects by Division"
                data-testid="card-division-chart"
                />
              }
              >
              <div style={{ flex: 1, padding: "1rem", minHeight: 0 }}>
                {divisionStats ? (
                <BarChart
                  dataset={formatChartData(divisionStats)}
                  dimensions={[{ accessor: "name", label: "Division" }]}
                  measures={[{ accessor: "value", label: "Projects" }]}
                  chartConfig={{ height: 250 }}
                />
                ) : (
                <Text>Loading...</Text>
                )}
              </div>
              </Card>
            </FlexBox>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Projects Table Section */}
        <ObjectPageSection id="projects-section" titleText="Project Portfolio">
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
                    <TableHeaderCell minWidth="120px" width="120px">
                      <span>Project Code</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="200px" width="600px">
                      <span>Project Name</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="100px" width="100px">
                      <span>% Complete</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="120px" width="120px">
                      <span>Schedule Performance</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="120px" width="120px">
                      <span>Budget Status</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="80px" width="80px">
                      <span>Risks</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="130px" width="130px">
                      <span>Projected Margin %</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="120px" width="120px">
                      <span>Actual Margin %</span>
                    </TableHeaderCell>
                    <TableHeaderCell minWidth="130px" width="130px">
                      <span>Margin Deviation %</span>
                    </TableHeaderCell>
                  </TableHeaderRow>
                }
              >
                {projects?.map((project) => (
                  <TableRow
                    key={project.id}
                    data-project-id={project.projectCode}
                    data-testid={`row-project-${project.id}`}
                    style={{ cursor: "pointer" }}
                  >
                    <Link
                      to={`/project/${project.projectCode}`}
                      style={{ display: "contents" }} // ensures the row layout stays intact
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
                            style={{ width: "100px", marginBottom: "0.25rem" }}
                          />
                          {/* <Text data-testid={`text-completion-${project.id}`}>
                            {Math.round(project.percentageComplete * 100)}%
                          </Text> */}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Text
                          data-testid={`text-performance-category-${project.id}`}
                          style={{
                            color:
                              project.performanceCategory === "On Track"
                                ? "#28a745"
                                : project.performanceCategory ===
                                  "Slightly Behind"
                                ? "#ffc107"
                                : project.performanceCategory ===
                                  "Critical Delay"
                                ? "#dc3545"
                                : "#007bff",
                          }}
                        >
                          {project.performanceCategory || "On Track"}
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text
                          data-testid={`text-budget-variance-${project.id}`}
                          style={{
                            color:
                              project.budgetStatusCategory === "Under Budget"
                                ? "#28a745"
                                : project.budgetStatusCategory ===
                                  "Within Budget"
                                ? "#007bff"
                                : project.budgetStatusCategory === "Over Budget"
                                ? "#ffc107"
                                : "#dc3545",
                          }}
                        >
                          {project.budgetStatusCategory || project.budgetStatus}
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text
                          data-testid={`text-risk-count-${project.id}`}
                          style={{
                            color:
                              (project.issuesRisks || 0) > 3
                                ? "#dc3545"
                                : "#28a745",
                          }}
                        >
                          {project.issuesRisks || 0}
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text
                          data-testid={`text-projected-margin-${project.id}`}
                        >
                          {((project.projectedGrossMargin || 0) * 100).toFixed(
                            2
                          )}
                          %
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text data-testid={`text-actual-margin-${project.id}`}>
                          {((project.actualGrossMargin || 0) * 100).toFixed(2)}%
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text
                          data-testid={`text-margin-deviation-${project.id}`}
                          style={{
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
                      </TableCell>
                    </Link>
                  </TableRow>
                ))}
              </Table>
            </Card>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Map Section */}
        <ObjectPageSection id="map-section" titleText="Project Locations">
          <ObjectPageSubSection id="map-subsection" titleText="">
            {/* <Card
              header={
                <CardHeader
                  titleText="Project Geographic Distribution"
                  data-testid="card-project-map"
                />
              }
            >
              <div style={{ height: '400px', width: '100%' }}> */}
            {(() => {
              // Get locations array from projectLocations or getSampleLocations
              const locationsSource = projectLocations || getSampleLocations();
              const allLocations = locationsSource.flatMap(
                (project: any) => project.locations || []
              );
              // Calculate average lat/lng for center
              let center: [number, number] = [39.8283, -98.5795]; // fallback to US center
              if (allLocations.length > 0) {
                const avgLat =
                  allLocations.reduce((sum, loc) => sum + loc.lat, 0) /
                  allLocations.length;
                const avgLng =
                  allLocations.reduce((sum, loc) => sum + loc.lng, 0) /
                  allLocations.length;
                center = [avgLat, avgLng];
              }
              return (
                <div style={{ height: "700px", width: "100%" }}>
                  <MapContainer
                    center={center}
                    zoom={4}
                    style={{ height: "100%", width: "100%" }}
                    data-testid="map-projects"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {locationsSource?.map((project: any) =>
                      project.locations?.map((location: any, index: number) => (
                        <Marker
                          key={`${project.id}-${index}`}
                          position={[location.lat, location.lng]}
                          eventHandlers={{
                            click: () => navigate(`/project/${project.id}`),
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
              );
            })()}
            {/* </div>
            </Card> */}
          </ObjectPageSubSection>
        </ObjectPageSection>
      </ObjectPage>
    </div>
  );
}

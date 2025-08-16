import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft } from "lucide-react";

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
  Timeline,
  TimelineItem,
} from "@ui5/webcomponents-react";
import { TimelineChart } from '@ui5/webcomponents-react-charts';

// Import required icons
import "@ui5/webcomponents-icons/dist/arrow-left.js";
import "@ui5/webcomponents-icons/dist/workflow-tasks.js";
import "@ui5/webcomponents-icons/dist/calendar.js";

import type { ExcelProject, ExcelActivity } from "@shared/excel-schema";

export default function ProjectDetails() {
  const { id } = useParams();

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery<ExcelProject>({
    queryKey: ['/api/projects', id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    }
  });

  // Fetch activities data
  const { data: milestones } = useQuery<ExcelActivity[]>({
    queryKey: ['/api/projects', project?.projectCode, 'milestones'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project?.projectCode}/milestones`);
      if (!response.ok) throw new Error('Failed to fetch milestones');
      return response.json();
    },
    enabled: !!project?.projectCode
  });

  const { data: risks } = useQuery<ExcelActivity[]>({
    queryKey: ['/api/projects', project?.projectCode, 'risks'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project?.projectCode}/risks`);
      if (!response.ok) throw new Error('Failed to fetch risks');
      return response.json();
    },
    enabled: !!project?.projectCode
  });

  function getTimelineChartData(activities: ExcelActivity[]): any[] {
    // Map activities to TimelineChart dataset format
    return activities.map((activity, idx) => ({
      color: `var(--sapChart_OrderedColor_${(idx % 11) + 1})`,
      label: activity.item,
      tasks: [
        {
          id: activity.id || `ACT-${idx}`,
          start: activity.startDate ? getDayOffset(activity.startDate, activities) : idx * 2,
          duration: getDuration(activity.startDate, activity.finishDate),
          connections: activity.predecessor
            ? [{ itemId: activity.predecessor, type: 'F2S' }]
            : [],
        }
      ]
    }));
  }

  // Helper to calculate start offset (days from earliest start)
  function getDayOffset(dateStr: string | null, activities: ExcelActivity[]): number {
    if (!dateStr) return 0;
    const dates = activities.map(a => a.startDate ? new Date(a.startDate).getTime() : Infinity);
    const minDate = Math.min(...dates);
    const date = new Date(dateStr).getTime();
    return Math.round((date - minDate) / (1000 * 60 * 60 * 24));
  }

  // Helper to calculate duration in days
  function getDuration(start: string | null, finish: string | null): number {
    if (!start || !finish) return 1;
    const startDate = new Date(start).getTime();
    const finishDate = new Date(finish).getTime();
    return Math.max(1, Math.round((finishDate - startDate) / (1000 * 60 * 60 * 24)));
  }

  // TimelineChart rendering function
  function renderTimelineChart(activities: ExcelActivity[]) {
    if (!activities || activities.length === 0) return <Text>No timeline data</Text>;
    const dataset = getTimelineChartData(activities);
    const start = 0;
    const totalDuration = Math.max(...dataset.map(d =>
      d.tasks?.[0]?.start + d.tasks?.[0]?.duration || 0
    ), 1);

    return (
      <TimelineChart
        dataset={dataset}
        isDiscrete
        showConnection
        start={start}
        totalDuration={totalDuration}
        style={{ height: '400px', width: '100%' }}
      />
    );
  }
  const { data: upcomingActivities } = useQuery<ExcelActivity[]>({
    queryKey: ['/api/projects', project?.projectCode, 'upcoming'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project?.projectCode}/upcoming`);
      if (!response.ok) throw new Error('Failed to fetch upcoming activities');
      return response.json();
    },
    enabled: !!project?.projectCode
  });

  const { data: lateActivities } = useQuery<ExcelActivity[]>({
    queryKey: ['/api/projects', project?.projectCode, 'late'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project?.projectCode}/late`);
      if (!response.ok) throw new Error('Failed to fetch late activities');
      return response.json();
    },
    enabled: !!project?.projectCode
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRiskColor = (description: string) => {
    const level = description?.toLowerCase();
    if (level === 'high' || level === 'critical') return '#dc3545';
    if (level === 'medium') return '#ffc107';
    if (level === 'low') return '#28a745';
    return '#6c757d';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Open') return '#dc3545';
    if (status === 'Closed') return '#28a745';
    return '#6c757d';
  };

  if (projectLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Text>Loading project details...</Text>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Text>Project not found</Text>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/">
            <Button icon="arrow-left">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <ObjectPage
        headerArea={
          <ObjectPageHeader>
            {/* Back Button */}
            <div style={{ marginBottom: '1rem' }}>
              <Link href="/">
                <Button icon="arrow-left" design="Transparent">
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            {/* KPI Cards in Header Area */}
            <FlexBox wrap="NoWrap" justifyContent="SpaceAround" style={{ padding: '1rem', overflowX: 'auto' }}>
              <Card style={{ margin: '0.5rem', minWidth: '180px' }}>
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title level="H3">{Math.round((project.scopeCompletion || 0) * 100)}%</Title>
                  <Text>Scope Completion</Text>
                </div>
              </Card>
              <Card style={{ margin: '0.5rem', minWidth: '180px' }}>
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title level="H3">{(project.timeCompletion || 0).toFixed(1)}%</Title>
                  <Text>Time Completion</Text>
                </div>
              </Card>
              <Card style={{ margin: '0.5rem', minWidth: '180px' }}>
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title 
                    level="H3"
                    style={{
                      color: project.performanceCategory === 'On Track' ? '#28a745' :
                             project.performanceCategory === 'Slightly Behind' ? '#ffc107' :
                             project.performanceCategory === 'Critical Delay' ? '#dc3545' : '#007bff'
                    }}
                  >
                    {project.performanceCategory || 'On Track'}
                  </Title>
                  <Text>Performance Category</Text>
                </div>
              </Card>
              <Card style={{ margin: '0.5rem', minWidth: '180px' }}>
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title 
                    level="H3"
                    style={{
                      color: project.budgetStatusCategory === 'Under Budget' ? '#28a745' :
                             project.budgetStatusCategory === 'Within Budget' ? '#007bff' :
                             project.budgetStatusCategory === 'Over Budget' ? '#ffc107' : '#dc3545'
                    }}
                  >
                    {project.budgetStatusCategory || 'Within Budget'}
                  </Title>
                  <Text>Budget Status</Text>
                </div>
              </Card>
              <Card style={{ margin: '0.5rem', minWidth: '180px' }}>
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Title 
                    level="H3"
                    style={{
                      color: (project.deviationProfitMargin || 0) > 0 ? '#28a745' : '#dc3545'
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
            <Title level="H1">{project.projectCode} - {project.description}</Title>
          </ObjectPageTitle>
        }
      >

        {/* Section 1: Budget Details and Time Metrics */}
        <ObjectPageSection 
          id="overview-section"
          titleText="Project Overview"
        >
          <ObjectPageSubSection id="overview-subsection" titleText="">
            <FlexBox wrap="Wrap" justifyContent="SpaceAround" style={{ padding: '1rem', gap: '2rem' }}>
              
              {/* Budget Details Card */}
              <Card
                style={{ minWidth: '400px', maxWidth: '500px' }}
                header={
                  <CardHeader titleText="Budget Details" />
                }
              >
                <div style={{ padding: '1rem', display: 'flex', gap: '2rem' }}>
                  {/* Column 1 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label>Budget Amount:</Label>
                      <br />
                      <Text style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{formatCurrency(project.budgetAmount)}</Text>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label>Budget Spent:</Label>
                      <br />
                      <Text style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{formatCurrency(project.totalAmountSpent)}</Text>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label>CO Amount:</Label>
                      <br />
                      <Text style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{formatCurrency(project.coAmount || 0)}</Text>
                    </div>
                  </div>
                  
                  {/* Column 2 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label>Projected Margin:</Label>
                      <br />
                      <Text style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{((project.projectedGrossMargin || 0) * 100).toFixed(2)}%</Text>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label>Actual Margin:</Label>
                      <br />
                      <Text style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{((project.actualGrossMargin || 0) * 100).toFixed(2)}%</Text>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label>Margin Deviation:</Label>
                      <br />
                      <Text style={{ 
                        fontSize: '1.1em', 
                        fontWeight: 'bold',
                        color: (project.deviationProfitMargin || 0) > 0 ? '#28a745' : '#dc3545' 
                      }}>
                        {((project.deviationProfitMargin || 0) * 100).toFixed(2)}%
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Time Metrics Card */}
              <Card
                style={{ minWidth: '400px', maxWidth: '500px' }}
                header={
                  <CardHeader titleText="Time Metrics" />
                }
              >
                <div style={{ padding: '1rem', display: 'flex', gap: '2rem' }}>
                  {/* Column 1 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label>Start Date:</Label>
                      <br />
                      <Text style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{formatDate(project.startDate)}</Text>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label>Finish Date:</Label>
                      <br />
                      <Text style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{formatDate(project.finishDate)}</Text>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label>Scope Completion:</Label>
                      <br />
                      <Text style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{Math.round((project.scopeCompletion || 0) * 100)}%</Text>
                    </div>
                  </div>
                  
                  {/* Column 2 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label>Time Completion:</Label>
                      <br />
                      <Text style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{(project.timeCompletion || 0).toFixed(1)}%</Text>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <Label>Performance Category:</Label>
                      <br />
                      <Text style={{
                        fontSize: '1.1em',
                        fontWeight: 'bold',
                        color: project.performanceCategory === 'On Track' ? '#28a745' :
                               project.performanceCategory === 'Slightly Behind' ? '#ffc107' :
                               project.performanceCategory === 'Critical Delay' ? '#dc3545' : '#007bff'
                      }}>
                        {project.performanceCategory || 'On Track'}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </FlexBox>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Section 2: Milestones and Risks */}
        <ObjectPageSection 
          id="milestones-risks-section"
          titleText="Milestones & Risks"
        >
          <ObjectPageSubSection id="milestones-risks-subsection" titleText="">
            <FlexBox wrap="Wrap" justifyContent="SpaceAround" style={{ padding: '1rem', gap: '2rem' }}>
              
              {/* Milestones Card with Timeline */}
              <Card
                style={{ minWidth: '450px', maxWidth: '600px' }}
                header={
                  <CardHeader titleText="Milestones (Workstreams)" />
                }
              >
                <div style={{ padding: '1rem' }}>
                  {milestones && milestones.length > 0 ? (
                    <Timeline>
                      {milestones.map((milestone, index) => (
                        <TimelineItem
                          key={index}
                          icon="workflow-tasks"
                          titleText={milestone.item}
                          subtitleText={`Progress: ${Math.round((milestone.percentageComplete || 0) * 100)}%`}
                          itemName={milestone.finishDate ? `Target: ${formatDate(milestone.finishDate)}` : ''}
                        >
                          <div style={{ padding: '0.5rem' }}>
                            <ProgressIndicator
                              value={Math.round((milestone.percentageComplete || 0) * 100)}
                              style={{ width: '200px', marginBottom: '0.5rem' }}
                            />
                            <Text style={{ color: '#666', fontSize: '0.9em' }}>
                              {milestone.description || 'Workstream milestone'}
                            </Text>
                          </div>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  ) : (
                    <Text>No milestones available</Text>
                  )}
                </div>
              </Card>

              {/* Risks Card */}
              <Card
                style={{ minWidth: '450px', maxWidth: '600px' }}
                header={
                  <CardHeader titleText="Risks" />
                }
              >
                <div style={{ padding: '1rem' }}>
                  {risks && risks.length > 0 ? (
                    risks.map((risk, index) => (
                      <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <Text style={{ fontWeight: 'bold' }}>{risk.item}</Text>
                          <Text 
                            style={{ 
                              color: getStatusColor(risk.status || ''),
                              fontWeight: 'bold'
                            }}
                          >
                            {risk.status || 'Unknown'}
                          </Text>
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <Text style={{ color: getRiskColor(risk.description || '') }}>
                            Level: {risk.description || 'Not specified'}
                          </Text>
                        </div>
                        {risk.owner && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <Text style={{ color: '#666' }}>Owner: {risk.owner}</Text>
                          </div>
                        )}
                        {risk.startDate && (
                          <div>
                            <Text style={{ color: '#666' }}>Date: {formatDate(risk.startDate)}</Text>
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
              header={
                <CardHeader titleText="Upcoming Activities Timeline" />
              }
            >
              <div style={{ padding: '1rem' }}>
                {renderTimelineChart(upcomingActivities || [])}
                {upcomingActivities && upcomingActivities.length > 0 ? (
                  <Timeline>
                    {upcomingActivities.map((activity, index) => (
                      <TimelineItem
                        key={index}
                        icon="calendar"
                        titleText={activity.item}
                        subtitleText={`${formatDate(activity.startDate)} - ${formatDate(activity.finishDate)}`}
                        itemName={activity.predecessor ? `Depends on: ${activity.predecessor}` : 'No dependencies'}
                      >
                        <div style={{ padding: '0.5rem' }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <Text style={{ fontWeight: 'bold', marginRight: '1rem' }}>Progress:</Text>
                            <ProgressIndicator
                              value={Math.round((activity.percentageComplete || 0) * 100)}
                              style={{ width: '150px', display: 'inline-block', marginRight: '0.5rem' }}
                            />
                            <Text>{Math.round((activity.percentageComplete || 0) * 100)}%</Text>
                          </div>
                          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9em', color: '#666' }}>
                            <div>
                              <Text>Start: {formatDate(activity.startDate)}</Text>
                            </div>
                            <div>
                              <Text>Finish: {formatDate(activity.finishDate)}</Text>
                              <Text>Finish: {activity.predecessor}</Text>
                            </div>
                          </div>
                        </div>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <Text>No upcoming activities</Text>
                  </div>
                )}
              </div>
            </Card>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Section 4: Late Activities */}
        <ObjectPageSection 
          id="late-section"
          titleText="Late Activities"
        >
          <ObjectPageSubSection id="late-subsection" titleText="">
            <Card
              header={
                <CardHeader titleText="Late Activities" />
              }
            >
              {lateActivities && lateActivities.length > 0 ? (
                <Table
                  headerRow={
                    <TableHeaderRow sticky>
                      <TableHeaderCell><span>Item</span></TableHeaderCell>
                      <TableHeaderCell><span>Start Date</span></TableHeaderCell>
                      <TableHeaderCell><span>Finish Date</span></TableHeaderCell>
                      <TableHeaderCell><span>Progress</span></TableHeaderCell>
                      <TableHeaderCell><span>Days Overdue</span></TableHeaderCell>
                    </TableHeaderRow>
                  }
                >
                  {lateActivities.map((activity, index) => {
                    const finishDate = activity.finishDate ? new Date(activity.finishDate) : null;
                    const today = new Date();
                    const daysOverdue = finishDate && finishDate < today ? 
                      Math.ceil((today.getTime() - finishDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell><Text style={{ color: '#dc3545' }}>{activity.item}</Text></TableCell>
                        <TableCell><Text>{formatDate(activity.startDate)}</Text></TableCell>
                        <TableCell><Text>{formatDate(activity.finishDate)}</Text></TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ProgressIndicator
                              value={Math.round((activity.percentageComplete || 0) * 100)}
                              style={{ width: '80px' }}
                            />
                            <Text>{Math.round((activity.percentageComplete || 0) * 100)}%</Text>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Text style={{ color: '#dc3545', fontWeight: 'bold' }}>
                            {daysOverdue > 0 ? `${daysOverdue} days` : 'On time'}
                          </Text>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </Table>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
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
import { type Project, type InsertProject, type Milestone, type Risk } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Project CRUD
  getProjects(filters?: {
    status?: string;
    division?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Project statistics
  getProjectStats(): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    delayedProjects: number;
    totalBudget: number;
    actualSpend: number;
    amountReceived: number;
  }>;
  
  // Chart data
  getSpendingCategoriesData(): Promise<{
    underBudget: number;
    withinBudget: number;
    overspent: number;
    criticalOverspent: number;
  }>;
  
  getProjectStatusData(): Promise<{
    aheadOfSchedule: number;
    onTrack: number;
    slightlyBehind: number;
    criticalDelay: number;
  }>;
  
  getDivisionData(): Promise<{
    mechanical: number;
    electrical: number;
    instrumentation: number;
  }>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;

  constructor() {
    this.projects = new Map();
    this.seedData();
  }

  private seedData() {
    const sampleProjects: Project[] = [
      {
        id: "1",
        code: "PRJ-001",
        name: "Power Plant Modernization",
        description: "Modernization of existing power plant infrastructure",
        status: "active",
        division: "mechanical",
        manager: "John Smith",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-09-30"),
        budget: "1500000",
        actualSpend: "1125000",
        commitments: "200000",
        forecast: "1475000",
        amountReceived: "1200000",
        percentComplete: 75,
        elapsedDays: 230,
        totalPlannedDays: 300,
        budgetVarianceCategory: "within_budget",
        riskCount: 3,
        plannedRevenue: "1800000",
        plannedCost: "1500000",
        actualRevenue: "1350000",
        actualCost: "1125000",
        performanceMetrics: {
          ev: 1125000,
          pv: 1150000,
          ac: 1125000,
          cpi: 1.02,
          spi: 0.98,
          cv: 0,
          sv: -25000
        },
        milestones: [
          { id: "1", name: "Design Phase Complete", status: "completed", date: "2024-03-15" },
          { id: "2", name: "Procurement Complete", status: "completed", date: "2024-05-20" },
          { id: "3", name: "Installation Phase", status: "in_progress", date: "2024-08-15" },
          { id: "4", name: "Testing & Commissioning", status: "pending", date: "2024-09-30" }
        ],
        risks: [
          { id: "1", title: "Supply Chain Delays", severity: "medium", owner: "Sarah Johnson", status: "open" },
          { id: "2", title: "Equipment Compatibility", severity: "high", owner: "Mike Davis", status: "in_progress" },
          { id: "3", title: "Weather Conditions", severity: "low", owner: "Alex Chen", status: "mitigated" }
        ],
        upcomingActivities: [
          { id: "1", name: "Equipment Installation", date: "2024-12-15" },
          { id: "2", name: "Safety Inspection", date: "2024-12-20" },
          { id: "3", name: "Team Training Session", date: "2024-12-28" }
        ],
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-12-01")
      },
      {
        id: "2",
        code: "PRJ-002",
        name: "Control System Upgrade",
        description: "Upgrade of industrial control systems",
        status: "active",
        division: "electrical",
        manager: "Jane Wilson",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-10-15"),
        budget: "800000",
        actualSpend: "450000",
        commitments: "150000",
        forecast: "780000",
        amountReceived: "500000",
        percentComplete: 45,
        elapsedDays: 90,
        totalPlannedDays: 200,
        budgetVarianceCategory: "overspent",
        riskCount: 5,
        plannedRevenue: "950000",
        plannedCost: "800000",
        actualRevenue: "500000",
        actualCost: "450000",
        performanceMetrics: {
          ev: 360000,
          pv: 320000,
          ac: 450000,
          cpi: 0.80,
          spi: 1.13,
          cv: -90000,
          sv: 40000
        },
        milestones: [],
        risks: [],
        upcomingActivities: [],
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-12-01")
      },
      {
        id: "3",
        code: "PRJ-003",
        name: "Safety Systems Installation",
        description: "Installation of new safety systems",
        status: "completed",
        division: "instrumentation",
        manager: "Robert Brown",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-05-01"),
        budget: "650000",
        actualSpend: "620000",
        commitments: "0",
        forecast: "620000",
        amountReceived: "650000",
        percentComplete: 100,
        elapsedDays: 120,
        totalPlannedDays: 120,
        budgetVarianceCategory: "under_budget",
        riskCount: 0,
        plannedRevenue: "780000",
        plannedCost: "650000",
        actualRevenue: "780000",
        actualCost: "620000",
        performanceMetrics: {
          ev: 650000,
          pv: 650000,
          ac: 620000,
          cpi: 1.05,
          spi: 1.00,
          cv: 30000,
          sv: 0
        },
        milestones: [],
        risks: [],
        upcomingActivities: [],
        createdAt: new Date("2023-12-15"),
        updatedAt: new Date("2024-05-01")
      },
      {
        id: "4",
        code: "PRJ-004",
        name: "Turbine Maintenance",
        description: "Major turbine maintenance and repairs",
        status: "delayed",
        division: "mechanical",
        manager: "Lisa Garcia",
        startDate: new Date("2024-10-01"),
        endDate: new Date("2024-12-30"),
        budget: "400000",
        actualSpend: "250000",
        commitments: "100000",
        forecast: "600000",
        amountReceived: "300000",
        percentComplete: 30,
        elapsedDays: 45,
        totalPlannedDays: 90,
        budgetVarianceCategory: "critical_overspent",
        riskCount: 7,
        plannedRevenue: "480000",
        plannedCost: "400000",
        actualRevenue: "300000",
        actualCost: "250000",
        performanceMetrics: {
          ev: 120000,
          pv: 200000,
          ac: 250000,
          cpi: 0.48,
          spi: 0.60,
          cv: -130000,
          sv: -80000
        },
        milestones: [],
        risks: [],
        upcomingActivities: [],
        createdAt: new Date("2024-09-15"),
        updatedAt: new Date("2024-12-01")
      }
    ];

    sampleProjects.forEach(project => {
      this.projects.set(project.id, project);
    });
  }

  async getProjects(filters?: {
    status?: string;
    division?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Project[]> {
    let projects = Array.from(this.projects.values());

    if (filters) {
      if (filters.status && filters.status !== 'all') {
        projects = projects.filter(p => p.status === filters.status);
      }
      if (filters.division && filters.division !== 'all') {
        projects = projects.filter(p => p.division === filters.division);
      }
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        projects = projects.filter(p => new Date(p.startDate) >= fromDate);
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        projects = projects.filter(p => new Date(p.endDate) <= toDate);
      }
    }

    return projects;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject: Project = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  async getProjectStats(): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    delayedProjects: number;
    totalBudget: number;
    actualSpend: number;
    amountReceived: number;
  }> {
    const projects = Array.from(this.projects.values());
    
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      delayedProjects: projects.filter(p => p.status === 'delayed').length,
      totalBudget: projects.reduce((sum, p) => sum + parseFloat(p.budget), 0),
      actualSpend: projects.reduce((sum, p) => sum + parseFloat(p.actualSpend), 0),
      amountReceived: projects.reduce((sum, p) => sum + parseFloat(p.amountReceived), 0),
    };
  }

  async getSpendingCategoriesData(): Promise<{
    underBudget: number;
    withinBudget: number;
    overspent: number;
    criticalOverspent: number;
  }> {
    const projects = Array.from(this.projects.values());
    
    return {
      underBudget: projects.filter(p => p.budgetVarianceCategory === 'under_budget').length,
      withinBudget: projects.filter(p => p.budgetVarianceCategory === 'within_budget').length,
      overspent: projects.filter(p => p.budgetVarianceCategory === 'overspent').length,
      criticalOverspent: projects.filter(p => p.budgetVarianceCategory === 'critical_overspent').length,
    };
  }

  async getProjectStatusData(): Promise<{
    aheadOfSchedule: number;
    onTrack: number;
    slightlyBehind: number;
    criticalDelay: number;
  }> {
    const projects = Array.from(this.projects.values());
    
    // Calculate performance index for each project
    const statusCounts = {
      aheadOfSchedule: 0,
      onTrack: 0,
      slightlyBehind: 0,
      criticalDelay: 0,
    };

    projects.forEach(project => {
      const timePercent = project.elapsedDays / project.totalPlannedDays;
      const completionPercent = project.percentComplete / 100;
      const pi = completionPercent / timePercent;

      if (pi >= 1.10) {
        statusCounts.aheadOfSchedule++;
      } else if (pi >= 0.90) {
        statusCounts.onTrack++;
      } else if (pi >= 0.75) {
        statusCounts.slightlyBehind++;
      } else {
        statusCounts.criticalDelay++;
      }
    });

    return statusCounts;
  }

  async getDivisionData(): Promise<{
    mechanical: number;
    electrical: number;
    instrumentation: number;
  }> {
    const projects = Array.from(this.projects.values());
    
    return {
      mechanical: projects.filter(p => p.division === 'mechanical').length,
      electrical: projects.filter(p => p.division === 'electrical').length,
      instrumentation: projects.filter(p => p.division === 'instrumentation').length,
    };
  }
}

export const storage = new MemStorage();

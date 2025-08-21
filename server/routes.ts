import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";
import { excelDataService } from "./excel-data-service";
import { parseLocation, calculateBudgetStatusCategory, calculatePerformanceStatus } from "@shared/excel-schema";

// AI Insight Generation Functions
function generatePortfolioInsights(data: any) {
  const { projects, stats, performanceStats, spendingStats, divisionStats } = data;
  
  const insights = [];
  
  // Budget Analysis
  const budgetUtilization = (stats.actualSpend / stats.totalBudget * 100).toFixed(1);
  insights.push({
    type: "financial",
    title: "Budget Performance",
    content: `Portfolio shows ${budgetUtilization}% budget utilization across ${stats.totalProjects} active projects. ${spendingStats['Critically Over Budget']} projects are critically over budget, requiring immediate attention.`,
    priority: spendingStats['Critically Over Budget'] > 0 ? "high" : "medium",
    icon: "💰"
  });
  
  // Schedule Performance
  const delayedProjects = performanceStats['Critical Delay'] + performanceStats['Slightly Behind'];
  const onTrackPercentage = ((performanceStats['On Track'] + performanceStats['Ahead of Schedule']) / stats.totalProjects * 100).toFixed(1);
  insights.push({
    type: "schedule",
    title: "Schedule Health",
    content: `${onTrackPercentage}% of projects are on track or ahead. ${delayedProjects} projects experiencing delays need schedule recovery actions.`,
    priority: delayedProjects > stats.totalProjects * 0.3 ? "high" : "medium",
    icon: "📅"
  });
  
  // Division Analysis  
  const topDivision = Object.entries(divisionStats).reduce((a, b) => (a[1] as number) > (b[1] as number) ? a : b);
  insights.push({
    type: "operations", 
    title: "Division Focus",
    content: `${topDivision[0]} division leads with ${topDivision[1]} projects (${((topDivision[1] as number)/stats.totalProjects*100).toFixed(1)}%). Consider resource rebalancing if bottlenecks emerge.`,
    priority: "low",
    icon: "🏗️"
  });
  
  // Risk Assessment
  const avgRiskPerProject = (stats.totalRisks / stats.totalProjects).toFixed(1);
  insights.push({
    type: "risk",
    title: "Risk Exposure",
    content: `Average ${avgRiskPerProject} risks per project. Projects with >5 risks need enhanced risk management protocols.`,
    priority: parseInt(avgRiskPerProject) > 3 ? "high" : "medium", 
    icon: "⚠️"
  });
  
  return {
    insights,
    summary: `Portfolio of ${stats.totalProjects} projects with ${formatCurrency(stats.totalBudget)} total budget. Key focus areas: ${delayedProjects > 0 ? 'schedule recovery, ' : ''}${spendingStats['Critically Over Budget'] > 0 ? 'budget control, ' : ''}risk mitigation.`,
    lastUpdated: new Date().toISOString()
  };
}

function generateProjectInsights(data: any) {
  const { project, activities, milestones, risks, upcoming, late } = data;
  
  const insights = [];
  
  // Budget Analysis
  const budgetVariance = ((project.totalAmountSpent - project.budgetAmount) / project.budgetAmount * 100).toFixed(1);
  const budgetVarianceNum = parseFloat(budgetVariance);
  insights.push({
    type: "financial",
    title: "Budget Status", 
    content: `Project is ${budgetVarianceNum > 0 ? 'over' : 'under'} budget by ${Math.abs(budgetVarianceNum)}%. Current spend: ${formatCurrency(project.totalAmountSpent)} vs Budget: ${formatCurrency(project.budgetAmount)}.`,
    priority: Math.abs(budgetVarianceNum) > 10 ? "high" : "medium",
    icon: "💰"
  });
  
  // Schedule Analysis
  const progressVsTime = (project.percentageComplete * 100).toFixed(1);
  insights.push({
    type: "schedule",
    title: "Progress Analysis",
    content: `Project ${progressVsTime}% complete. Performance category: ${project.performanceCategory}. ${late.length} activities are running late.`,
    priority: project.performanceCategory?.includes('Critical') ? "high" : "medium", 
    icon: "📈"
  });
  
  // Risk Analysis
  insights.push({
    type: "risk",
    title: "Risk Assessment",
    content: `${project.issuesRisks} total risks identified. ${risks.filter((r: any) => r.status === 'Open').length} open risks require monitoring.`,
    priority: project.issuesRisks > 5 ? "high" : "low",
    icon: "⚠️"
  });
  
  // Milestone Analysis
  const completedMilestones = milestones.filter((m: any) => m.percentageComplete === 1).length;
  insights.push({
    type: "operations",
    title: "Milestone Progress", 
    content: `${completedMilestones}/${milestones.length} milestones completed. ${upcoming.length} upcoming activities scheduled.`,
    priority: "medium",
    icon: "🎯"
  });
  
  return {
    insights,
    summary: `${project.description} - ${progressVsTime}% complete, ${project.performanceCategory.toLowerCase()}. Focus on ${late.length > 0 ? 'schedule recovery and ' : ''}${Math.abs(parseFloat(budgetVariance)) > 10 ? 'budget control.' : 'maintaining momentum.'}`,
    lastUpdated: new Date().toISOString()
  };
}

function formatCurrency(amount: number) {
  if (!amount || isNaN(amount)) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all projects with optional filters
  app.get("/api/projects", async (req, res) => {
    try {
      const { status, division, dateFrom, dateTo } = req.query;
      const projects = excelDataService.getProjects({
        status: status as string,
        division: division as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      });
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get project statistics (must be before :id route)
  app.get("/api/projects/stats/overview", async (req, res) => {
    try {
      const stats = excelDataService.getOverviewStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project statistics" });
    }
  });

  // Get performance category statistics for pie chart
  app.get("/api/projects/stats/performance", async (req, res) => {
    try {
      const stats = excelDataService.getPerformanceCategoryStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance statistics" });
    }
  });

  // Get spending categories statistics for pie chart
  app.get("/api/projects/stats/spending", async (req, res) => {
    try {
      const stats = excelDataService.getSpendingCategoriesStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spending statistics" });
    }
  });

  // Get division statistics for bar chart
  app.get("/api/projects/stats/divisions", async (req, res) => {
    try {
      const stats = excelDataService.getDivisionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch division statistics" });
    }
  });

  // Get project locations for map (must be before :id route)
  app.get("/api/projects/locations", async (req, res) => {
    try {
      const locations = excelDataService.getAllProjectLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project locations" });
    }
  });

  // Reload Excel data (must be before :id route)
  app.post("/api/projects/reload", async (req, res) => {
    try {
      excelDataService.reloadData();
      res.json({ message: "Data reloaded successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reload data" });
    }
  });

  // Get activities by project code
  app.get("/api/projects/:projectCode/activities", async (req, res) => {
    try {
      const activities = excelDataService.getActivitiesByProjectCode(req.params.projectCode);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project activities" });
    }
  });

  // Get milestones by project code  
  app.get("/api/projects/:projectCode/milestones", async (req, res) => {
    try {
      const milestones = excelDataService.getMilestonesByProjectCode(req.params.projectCode);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project milestones" });
    }
  });

  // Get risks by project code
  app.get("/api/projects/:projectCode/risks", async (req, res) => {
    try {
      const risks = excelDataService.getRisksByProjectCode(req.params.projectCode);
      res.json(risks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project risks" });
    }
  });

  // Get upcoming activities by project code
  app.get("/api/projects/:projectCode/upcoming", async (req, res) => {
    try {
      const upcoming = excelDataService.getUpcomingActivitiesByProjectCode(req.params.projectCode);
      console.log("Upcoming activities:", upcoming);
      res.json(upcoming);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming activities" });
    }
  });

  // Get late activities by project code
  app.get("/api/projects/:projectCode/late", async (req, res) => {
    try {
      const late = excelDataService.getLateActivitiesByProjectCode(req.params.projectCode);
      res.json(late);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch late activities" });
    }
  });

  // Get single project by ID (must be after specific routes)
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = excelDataService.getProjectById(req.params.id);
      console.log("Fetching project with ID:", req.params.id,"project",project);
      if (!project) {
        return res.status(404).json({ message: "Project not found. Please check the ID and try again." });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Create new project
  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  // Update project
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // AI Insights for Portfolio/Dashboard
  app.get("/api/ai/insights/portfolio", async (req, res) => {
    try {
      const projects = excelDataService.getProjects();
      const stats = excelDataService.getOverviewStats();
      const performanceStats = excelDataService.getPerformanceCategoryStats();
      const spendingStats = excelDataService.getSpendingCategoriesStats();
      const divisionStats = excelDataService.getDivisionStats();
      
      // Generate AI insights based on data
      const insights = generatePortfolioInsights({
        projects,
        stats,
        performanceStats,
        spendingStats,
        divisionStats
      });
      
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate portfolio insights" });
    }
  });

  // AI Insights for Individual Project
  app.get("/api/ai/insights/project/:projectCode", async (req, res) => {
    try {
      const project = excelDataService.getProjectById(req.params.projectCode);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const activities = excelDataService.getActivitiesByProjectCode(req.params.projectCode);
      const milestones = excelDataService.getMilestonesByProjectCode(req.params.projectCode);
      const risks = excelDataService.getRisksByProjectCode(req.params.projectCode);
      const upcoming = excelDataService.getUpcomingActivitiesByProjectCode(req.params.projectCode);
      const late = excelDataService.getLateActivitiesByProjectCode(req.params.projectCode);
      
      // Generate AI insights for individual project
      const insights = generateProjectInsights({
        project,
        activities,
        milestones,
        risks,
        upcoming,
        late
      });
      
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate project insights" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

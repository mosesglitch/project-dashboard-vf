import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";
import { excelDataService } from "./excel-data-service";
import { parseLocation, calculateBudgetStatusCategory, calculatePerformanceStatus } from "@shared/excel-schema";

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
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
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


  const httpServer = createServer(app);
  return httpServer;
}

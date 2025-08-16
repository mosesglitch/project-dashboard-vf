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

  // Get single project by ID
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

  // Get project statistics
  app.get("/api/projects/stats/overview", async (req, res) => {
    try {
      const stats = excelDataService.getOverviewStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project statistics" });
    }
  });

  // Get project locations for map
  app.get("/api/projects/locations", async (req, res) => {
    try {
      const locations = excelDataService.getAllProjectLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project locations" });
    }
  });

  // Reload Excel data
  app.post("/api/projects/reload", async (req, res) => {
    try {
      excelDataService.reloadData();
      res.json({ message: "Data reloaded successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reload data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

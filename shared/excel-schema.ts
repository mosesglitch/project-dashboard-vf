import { pgTable, text, real, integer, serial, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Excel-based project schema matching the provided structure
export const excelProjects = pgTable("excel_projects", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code").notNull(),
  description: text("description").notNull(),
  startDate: date("start_date").notNull(),
  finishDate: date("finish_date").notNull(),
  percentageComplete: real("percentage_complete").notNull(),
  category: text("category"),
  scopeCompletion: real("scope_completion"),
  timeCompletion: real("time_completion"),
  performanceIndex: real("performance_index"),
  performanceCategory: text("performance_category"),
  priority: text("priority"),
  issuesRisks: integer("issues_risks"),
  division: text("division").notNull(),
  budgetAmount: real("budget_amount").notNull(),
  totalAmountSpent: real("total_amount_spent").notNull(),
  budgetSpent: real("budget_spent"),
  budgetStatus: text("budget_status"),
  budgetStatusCategory: text("budget_status_category"),
  location: text("location"), // Will store coordinate arrays as JSON string
  amountReceived: real("amount_received"),
  coAmount: real("co_amount"),
  projectedGrossMargin: real("projected_gross_margin"),
  actualGrossMargin: real("actual_gross_margin"),
  deviationProfitMargin: real("deviation_profit_margin"),
});

export const insertExcelProjectSchema = createInsertSchema(excelProjects);
export const selectExcelProjectSchema = createSelectSchema(excelProjects);

export type ExcelProject = typeof excelProjects.$inferSelect;
export type InsertExcelProject = z.infer<typeof insertExcelProjectSchema>;

// Schema for the second Excel file containing activities, milestones, and risks
export const excelActivities = pgTable("excel_activities", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code").notNull(),
  item: text("item"),
  description: text("description"),
  owner: text("owner"),
  startDate: date("start_date"),
  finishDate: date("finish_date"),
  percentageComplete: real("percentage_complete"),
  category: text("category").notNull(), // Upcoming, Late, Workstream, Risk, Project Info
  predecessor: text("predecessor"),
  status: text("status"), // For risks: Open, Closed
});

export const insertExcelActivitySchema = createInsertSchema(excelActivities);
export const selectExcelActivitySchema = createSelectSchema(excelActivities);

export type ExcelActivity = typeof excelActivities.$inferSelect;
export type InsertExcelActivity = z.infer<typeof insertExcelActivitySchema>;

// Helper function to parse location coordinates
export function parseLocation(locationStr: string): Array<{lat: number, lng: number}> {
  if (!locationStr) return [];
  
  try {
    // Parse coordinates like "[ (-0.4571, 39.6434), (-3.9389, 39.7419)]"
    const coordsMatch = locationStr.match(/\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/g);
    if (!coordsMatch) return [];
    
    return coordsMatch.map(coord => {
      const match = coord.match(/\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/);
      if (match) {
        return {
          lat: parseFloat(match[2]), // latitude is second
          lng: parseFloat(match[1])  // longitude is first
        };
      }
      return { lat: 0, lng: 0 };
    });
  } catch (error) {
    console.error('Error parsing location:', error);
    return [];
  }
}

// Helper function to calculate budget status category
export function calculateBudgetStatusCategory(budgetAmount: number, totalSpent: number): string {
  const variance = totalSpent / budgetAmount;
  if (variance < 0.9) return 'Under Budget';
  if (variance < 1.1) return 'Within Budget';
  if (variance < 1.5) return 'Over Budget';
  return 'Critically Over Budget';
}

// Helper function to calculate performance status
export function calculatePerformanceStatus(timeCompletion: number): string {
  const pi = 1 / (timeCompletion / 100); // Convert time completion to performance index
  if (pi >= 1.10) return 'Ahead of Schedule';
  if (pi >= 0.90) return 'On Track';
  if (pi >= 0.75) return 'Slightly Behind';
  return 'Critical Delay';
}
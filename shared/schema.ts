import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull(), // 'active', 'completed', 'delayed', 'on-hold'
  division: text("division").notNull(), // 'mechanical', 'electrical', 'instrumentation'
  manager: text("manager").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Budget fields
  budget: decimal("budget", { precision: 15, scale: 2 }).notNull(),
  actualSpend: decimal("actual_spend", { precision: 15, scale: 2 }).notNull().default('0'),
  commitments: decimal("commitments", { precision: 15, scale: 2 }).notNull().default('0'),
  forecast: decimal("forecast", { precision: 15, scale: 2 }).notNull().default('0'),
  amountReceived: decimal("amount_received", { precision: 15, scale: 2 }).notNull().default('0'),
  
  // Progress fields
  percentComplete: integer("percent_complete").notNull().default(0),
  elapsedDays: integer("elapsed_days").notNull().default(0),
  totalPlannedDays: integer("total_planned_days").notNull(),
  
  // Variance and performance
  budgetVarianceCategory: text("budget_variance_category").notNull(), // 'under_budget', 'within_budget', 'overspent', 'critical_overspent'
  riskCount: integer("risk_count").notNull().default(0),
  
  // Margin fields
  plannedRevenue: decimal("planned_revenue", { precision: 15, scale: 2 }).notNull().default('0'),
  plannedCost: decimal("planned_cost", { precision: 15, scale: 2 }).notNull().default('0'),
  actualRevenue: decimal("actual_revenue", { precision: 15, scale: 2 }).notNull().default('0'),
  actualCost: decimal("actual_cost", { precision: 15, scale: 2 }).notNull().default('0'),
  
  // Performance metrics (stored as JSON for flexibility)
  performanceMetrics: jsonb("performance_metrics"), // EV, PV, AC, CPI, SPI, etc.
  
  // Additional data
  milestones: jsonb("milestones"), // Array of milestone objects
  risks: jsonb("risks"), // Array of risk objects
  upcomingActivities: jsonb("upcoming_activities"), // Array of activity objects
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  status: text("status").notNull(), // 'completed', 'in_progress', 'pending', 'delayed'
  dueDate: timestamp("due_date").notNull(),
  completedDate: timestamp("completed_date"),
  description: text("description"),
});

export const risks = pgTable("risks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  status: text("status").notNull(), // 'open', 'in_progress', 'closed', 'mitigated'
  owner: text("owner").notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
});

export const insertRiskSchema = createInsertSchema(risks).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type Risk = typeof risks.$inferSelect;

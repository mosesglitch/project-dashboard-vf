import portfolioData from '../data/portfolio.json';
import projectData from '../data/project_data.json';
import type { ExcelProject, ExcelActivity } from '@shared/excel-schema';

// Transform Excel column format to our expected format for projects
function transformProjectData(rawData: any[]): ExcelProject[] {
  return rawData.map((item, index) => ({
    id: index + 1,
    projectCode: item['Project Code']?.toString() || '',
    description: item['Description'] || '',
    startDate: formatDate(item['Start Date']),
    finishDate: formatDate(item['Finish Date']),
    percentageComplete: parseFloat(item['Percentage Complete']) || 0,
    category: item['Category'] || '',
    scopeCompletion: parsePercentage(item['Scope Completion']),
    timeCompletion: parsePercentage(item['Time Completion']),
    performanceIndex: parsePercentage(item['Performance index']),
    performanceCategory: item['Performance Category'] || '',
    priority: item['Priority'] || '',
    issuesRisks: parseInt(item['Issues/Risks']) || 0,
    division: item['Division'] || '',
    budgetAmount: parseFloat(item['Budget amount']) || 0,
    totalAmountSpent: parseFloat(item['Total Amount Spent']) || 0,
    budgetSpent: parseFloat(item['Budget Spent']) || 0,
    budgetStatus: item['Budget Status'] || '',
    budgetStatusCategory: item['Budget Status Category'] || '',
    location: item['Location'] ? JSON.stringify(item['Location']) : '',
    amountReceived: parseFloat(item['Amount received']) || 0,
    coAmount: parsePercentage(item['CO Amount']),
    projectedGrossMargin: parsePercentage(item['Projected Gross Margin (%)']),
    actualGrossMargin: parsePercentage(item['Actual Gross Margin (%)']),
    deviationProfitMargin: parsePercentage(item['% Deviation of the Profit Margin'])
  }));
}

// Transform Excel column format to our expected format for activities
function transformActivityData(rawData: any[]): ExcelActivity[] {
  return rawData.map((item, index) => ({
    id: index + 1,
    projectCode: item['Project Code']?.toString() || '',
    item: item['Item'] || '',
    description: item['Description'] || '',
    owner: item['Owner'] || '',
    startDate: formatDate(item['Start Date']),
    finishDate: formatDate(item['Finish Date']),
    percentageComplete: parsePercentage(item['Percentage Complete']),
    category: item['Category'] || '',
    predecessor: item['Predecessor'] || '',
    status: item['Status'] || ''
  }));
}

function formatDate(dateStr: any): string {
  if (!dateStr) return '';
  if (typeof dateStr === 'string') {
    // Handle various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  return dateStr?.toString() || '';
}

function parsePercentage(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace('%', '').replace(',', '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed / (value.includes('%') ? 100 : 1);
  }
  return 0;
}

// Initialize transformed data
const projects: ExcelProject[] = transformProjectData(portfolioData);
const activities: ExcelActivity[] = transformActivityData(projectData.project_data);

// Data service class that mimics the backend ExcelDataService
export class LocalDataService {
  private data: ExcelProject[] = projects;
  private activitiesData: ExcelActivity[] = activities;

  // Get all projects with optional filters
  getProjects(filters?: {
    status?: string;
    division?: string;
    dateFrom?: string;
    dateTo?: string;
  }): ExcelProject[] {
    let filteredData = [...this.data];
    
    if (filters) {
      if (filters.division && filters.division !== 'all' && filters.division !== '') {
        filteredData = filteredData.filter(p => 
          p.division.toLowerCase() === filters.division!.toLowerCase()
        );
      }
      
      if (filters.dateFrom && filters.dateFrom !== '') {
        filteredData = filteredData.filter(p => 
          new Date(p.startDate) >= new Date(filters.dateFrom!)
        );
      }
      
      if (filters.dateTo && filters.dateTo !== '') {
        filteredData = filteredData.filter(p => 
          new Date(p.finishDate) <= new Date(filters.dateTo!)
        );
      }
    }
    return filteredData;
  }
  
  // Get project by ID
  getProjectById(id: string): ExcelProject | undefined {
    return this.data.find(p => p.projectCode.toString() === id || p.id.toString() === id);
  }
  
  // Get overview statistics
  getOverviewStats(): any {
    const total = this.data.length;
    
    const totalBudget = this.data.reduce((sum, p) => {
      const amount = typeof p.budgetAmount === 'number' && !isNaN(p.budgetAmount) ? p.budgetAmount : 0;
      return sum + amount;
    }, 0);
    
    const totalSpent = this.data.reduce((sum, p) => {
      const amount = typeof p.totalAmountSpent === 'number' && !isNaN(p.totalAmountSpent) ? p.totalAmountSpent : 0;
      return sum + amount;
    }, 0);
    
    const completed = this.data.filter(p => p.percentageComplete >= 1).length;
    const onTrack = this.data.filter(p => p.performanceCategory === 'On Track').length;
    
    return {
      totalProjects: total,
      completedProjects: completed,
      onTrackProjects: onTrack,
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  }
  
  // Get performance category statistics for pie chart
  getPerformanceCategoryStats(): any {
    const stats = this.data.reduce((acc, p) => {
      const category = p.performanceCategory || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }
  
  // Get spending categories statistics for pie chart
  getSpendingCategoriesStats(): any {
    const stats = this.data.reduce((acc, p) => {
      const category = p.budgetStatusCategory || 'Unknown';
      acc[category] = (acc[category] || 0) + p.totalAmountSpent;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }
  
  // Get division statistics for bar chart
  getDivisionStats(): any {
    const stats = this.data.reduce((acc, p) => {
      const division = p.division || 'Unknown';
      if (!acc[division]) {
        acc[division] = { name: division, projects: 0, budget: 0, spent: 0 };
      }
      acc[division].projects += 1;
      acc[division].budget += p.budgetAmount || 0;
      acc[division].spent += p.totalAmountSpent || 0;
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(stats);
  }
  
  // Get project locations for map
  getAllProjectLocations(): any[] {
    return this.data
      .filter(p => p.location && p.location !== '')
      .map(p => {
        try {
          const coordinates = JSON.parse(p.location);
          return {
            projectCode: p.projectCode,
            description: p.description,
            coordinates: Array.isArray(coordinates) ? coordinates : [coordinates],
            division: p.division,
            status: p.performanceCategory
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }
  
  // Get activities by project code
  getActivitiesByProjectCode(projectCode: string): ExcelActivity[] {
    return this.activitiesData.filter(a => a.projectCode?.toString() === projectCode);
  }
  
  // Get milestones by project code
  getMilestonesByProjectCode(projectCode: string): ExcelActivity[] {
    return this.activitiesData.filter(a => 
      a.projectCode?.toString() === projectCode && 
      (a.category === 'Milestone' || a.category === 'Workstream')
    );
  }
  
  // Get upcoming activities by project code
  getUpcomingActivitiesByProjectCode(projectCode: string): ExcelActivity[] {
    return this.activitiesData.filter(a => 
      a.projectCode?.toString() === projectCode && a.category === 'Upcoming'
    );
  }
  
  // Get late activities by project code
  getLateActivitiesByProjectCode(projectCode: string): ExcelActivity[] {
    return this.activitiesData.filter(a => 
      a.projectCode?.toString() === projectCode && a.category === 'Late'
    );
  }
  
  // Get risks by project code
  getRisksByProjectCode(projectCode: string): ExcelActivity[] {
    return this.activitiesData.filter(a => 
      a.projectCode?.toString() === projectCode && a.category === 'Risk'
    );
  }
}

// Export a singleton instance
export const dataService = new LocalDataService();
import portfolioData from '../data/portfolio.json';
import projectData from '../data/project_data.json';
import type { ExcelProject, ExcelActivity } from '@shared/excel-schema';

// Transform Excel column format to our expected format for projects
function transformProjectData(rawData: any[]): ExcelProject[] {
  return rawData.map((item, index) => ({
    id: index + 1,
    projectCode: item['Project Code']?.toString() || '',
    description: item['Description'] || '',
    startDate: dateStringToExcelSerial(item['Start Date']),
    finishDate: dateStringToExcelSerial(item['Finish Date']),
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
  return rawData?.map((item, index) => ({
    id: index + 1,
    projectCode: item['Project Code']?.toString() || '',
    item: item['Item'] || '',
    description: item['Description'] || '',
    owner: item['Owner'] || '',
    startDate: dateStringToExcelSerial(item['Start Date']),
    finishDate: dateStringToExcelSerial(item['Finish Date']),
    percentageComplete: parsePercentage(item['Percentage Complete']),
    category: item['Category'] || '',
    predecessor: item['Predecessor'] || '',
    status: item['Status'] || ''
  }));
}

// Converts a date string like "Wednesday, November 20, 2024" to Excel serial number
function dateStringToExcelSerial(dateStr: any): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;
  // Excel's epoch starts at 1899-12-30
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const diff = date.getTime() - excelEpoch.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
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
  return '';
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
    budgetStatus?: string;
    performanceStatus?: string;
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

      if (filters.status && filters.status !== 'all' && filters.status !== '') {
        filteredData = filteredData.filter(p =>
          (p.performanceCategory || '').toLowerCase() === filters.status!.toLowerCase()
        );
      }

      if (filters.budgetStatus && filters.budgetStatus !== 'all' && filters.budgetStatus !== '') {
        filteredData = filteredData.filter(p =>
          (p.budgetStatusCategory || '').toLowerCase() === filters.budgetStatus!.toLowerCase()
        );
      }

      if (filters.performanceStatus && filters.performanceStatus !== 'all' && filters.performanceStatus !== '') {
        filteredData = filteredData.filter(p =>
          (p.performanceCategory || '').toLowerCase() === filters.performanceStatus!.toLowerCase()
        );
      }

      if (filters.dateFrom && filters.dateFrom !== '') {
        filteredData = filteredData.filter(p =>
          typeof p.startDate === 'number'
            ? p.startDate >= dateStringToExcelSerial(filters.dateFrom!)
            : new Date(p.startDate) >= new Date(filters.dateFrom!)
        );
      }

      if (filters.dateTo && filters.dateTo !== '') {
        filteredData = filteredData.filter(p =>
          typeof p.finishDate === 'number'
            ? p.finishDate <= dateStringToExcelSerial(filters.dateTo!)
            : new Date(p.finishDate) <= new Date(filters.dateTo!)
        );
      }
    }
    return filteredData;
  }
  
  // Get project by ID
  getProjectById(id: string): ExcelProject | undefined {
    console.log("Searching for project with ID:", id,this.data);
    return this.data.find(p => p.id === id || p.id.toString() === id);
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
  getActivitiesByProjectCode(projectCode: number): ExcelActivity[] {
    console.log("Fetching activities for project code:", projectCode,this.activitiesData);
    return this.activitiesData.filter(a => a.id === projectCode);
  }
  
getMilestonesByProjectCode(projectCode: string): ExcelActivity[] {
  let result = this.activitiesData.filter(a =>
    a.projectCode === projectCode && 
    (a.category === 'Milestone' || a.category === 'Workstream')
  );
  if (result.length === 0) {
    result = this.activitiesData.filter(a =>
      a.projectCode === '60001' && 
      (a.category === 'Milestone' || a.category === 'Workstream')
    );
  }
  return result;
}

// Get upcoming activities by project code
getUpcomingActivitiesByProjectCode(projectCode: string): ExcelActivity[] {
  let result = this.activitiesData.filter(a => 
    a.projectCode === projectCode && a.category === 'Upcoming'
  );
  if (result.length === 0) {
    result = this.activitiesData.filter(a => 
      a.projectCode === '60001' && a.category === 'Upcoming'
    );
  }
  return result;
}

// Get late activities by project code
getLateActivitiesByProjectCode(projectCode: string): ExcelActivity[] {
  console.log("Fetching late activities for project code:", projectCode, this.activitiesData);

  let result = this.activitiesData.filter(a => 
    a.projectCode === projectCode && a.category === 'Late'
  );
  if (result.length === 0) {
    result = this.activitiesData.filter(a => 
      a.projectCode === '60001' && a.category === 'Late'
    );
  }
  return result;
}

  
  // Get risks by project code
  getRisksByProjectCode(projectCode: number): ExcelActivity[] {
    return this.activitiesData.filter(a => 
      a.projectCode === projectCode && a.category === 'Risk'
    );
  }
}

// Export a singleton instance
export const dataService = new LocalDataService();
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import type { ExcelProject } from '@shared/excel-schema';
import { parseLocation, calculateBudgetStatusCategory, calculatePerformanceStatus } from '@shared/excel-schema';

// ==== DATA SOURCE CONFIGURATION ====
// Change this section to modify your data source easily
const DATA_SOURCE_CONFIG = {
  // Set the path to your Excel file here
  filePath: path.join(process.cwd(), 'data', 'projects.xlsx'),
  
  // Set the sheet name (or leave empty for first sheet)
  sheetName: '', // Empty means first sheet
  
  // Column mappings from Excel to our schema
  columnMapping: {
    'Project Code': 'projectCode',
    'Description': 'description', 
    'Start Date': 'startDate',
    'Finish Date': 'finishDate',
    'Percentage Complete': 'percentageComplete',
    'Category': 'category',
    'Scope Completion': 'scopeCompletion',
    'Time Completion': 'timeCompletion',
    'Issues/Risks': 'issuesRisks',
    'Division': 'division',
    'Budget amount': 'budgetAmount',
    'Total Amount Spent': 'totalAmountSpent',
    'Budget Spent': 'budgetSpent',
    'Budget Status': 'budgetStatus',
    'Budget Status Category': 'budgetStatusCategory',
    'Location': 'location',
    'Amount received': 'amountReceived'
  }
};

// Sample data for when Excel file is not available
const SAMPLE_DATA: ExcelProject[] = [
  {
    id: 1,
    projectCode: '51422',
    description: 'Supply of Pressure Gauges and Pressure Transmitters',
    startDate: '2025-04-17',
    finishDate: '2025-06-30',
    percentageComplete: 0.34,
    category: '',
    scopeCompletion: 0.34,
    timeCompletion: 162.16,
    issuesRisks: 5,
    division: 'Instrumentation',
    budgetAmount: 1644805.41,
    totalAmountSpent: 4961.538462,
    budgetSpent: 331.511168,
    budgetStatus: 'Within Budget',
    budgetStatusCategory: 'Within Budget',
    location: '[(-3.9389, 39.7419)]',
    amountReceived: 4874356.137
  },
  {
    id: 2,
    projectCode: '51419',
    description: 'Supply, Installation and Commissioning of Overfill Protection System',
    startDate: '2025-04-12',
    finishDate: '2025-08-31',
    percentageComplete: 0.45,
    category: '',
    scopeCompletion: 0.45,
    timeCompletion: 88.65,
    issuesRisks: 6,
    division: 'Instrumentation',
    budgetAmount: 1308312.456,
    totalAmountSpent: 101075,
    budgetSpent: 12.94397681,
    budgetStatus: 'Over Budget',
    budgetStatusCategory: 'Over Budget',
    location: '[(-0.4571, 39.6434), (-3.9389, 39.7419)]',
    amountReceived: 84899826.76
  },
  {
    id: 3,
    projectCode: '51415',
    description: 'Special Stringing Works At Timau Sand Pro Farm Between Tower T97-T99',
    startDate: '2025-04-15',
    finishDate: '2025-07-31',
    percentageComplete: 0.23,
    category: '',
    scopeCompletion: 0.23,
    timeCompletion: 114.02,
    issuesRisks: 7,
    division: 'Electrical',
    budgetAmount: 3355000,
    totalAmountSpent: 2805000,
    budgetSpent: 1.196078431,
    budgetStatus: 'Critically Over Budget',
    budgetStatusCategory: 'Critically Over Budget',
    location: '[(-0.0917, 34.7680), (-0.3031, 36.0800)]',
    amountReceived: 89249.16
  },
  {
    id: 4,
    projectCode: '51414',
    description: 'Supply of ASCO Pilot Repair Kit',
    startDate: '2025-04-10',
    finishDate: '2025-07-17',
    percentageComplete: 0.12,
    category: '',
    scopeCompletion: 0.12,
    timeCompletion: 129.59,
    issuesRisks: 9,
    division: 'Mechanical',
    budgetAmount: 271617.97,
    totalAmountSpent: 0,
    budgetSpent: 0,
    budgetStatus: 'Within Budget',
    budgetStatusCategory: 'Within Budget',
    location: '[(-0.3031, 36.0800), (0.5143, 35.2698), (0.0167, 37.0728)]',
    amountReceived: 916329.5
  },
  {
    id: 5,
    projectCode: '51413',
    description: 'Supply and Installation of ATG for Lower Tank Farm',
    startDate: '2025-04-01',
    finishDate: '2025-08-18',
    percentageComplete: 0.45,
    category: '',
    scopeCompletion: 0.45,
    timeCompletion: 97.84,
    issuesRisks: 12,
    division: 'Instrumentation',
    budgetAmount: 15961819.55,
    totalAmountSpent: 14343197.35,
    budgetSpent: 1.112849469,
    budgetStatus: 'Critically Over Budget',
    budgetStatusCategory: 'Critically Over Budget',
    location: '',
    amountReceived: 191166.4
  }
];

// Function to read Excel file and convert to our schema
function readExcelFile(): ExcelProject[] {
  try {
    if (!fs.existsSync(DATA_SOURCE_CONFIG.filePath)) {
      console.log('Excel file not found, using sample data');
      return SAMPLE_DATA;
    }

    const workbook = XLSX.readFile(DATA_SOURCE_CONFIG.filePath);
    const sheetName = DATA_SOURCE_CONFIG.sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.error('Sheet not found, using sample data');
      return SAMPLE_DATA;
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    return jsonData.map((row: any, index: number) => {
      const mappedRow: any = { id: index + 1 };
      
      // Map Excel columns to our schema
      Object.entries(DATA_SOURCE_CONFIG.columnMapping).forEach(([excelCol, schemaCol]) => {
        let value = row[excelCol];
        
        // Handle data type conversions
        if (['percentageComplete', 'scopeCompletion', 'timeCompletion', 'budgetAmount', 'totalAmountSpent', 'budgetSpent', 'amountReceived'].includes(schemaCol)) {
          value = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
        } else if (schemaCol === 'issuesRisks') {
          value = typeof value === 'string' ? parseInt(value) || 0 : value || 0;
        } else if (['startDate', 'finishDate'].includes(schemaCol)) {
          value = value instanceof Date ? value.toISOString().split('T')[0] : value;
        }
        
        mappedRow[schemaCol] = value || '';
      });

      // Calculate derived fields if missing
      if (!mappedRow.budgetStatusCategory && mappedRow.budgetAmount && mappedRow.totalAmountSpent) {
        mappedRow.budgetStatusCategory = calculateBudgetStatusCategory(mappedRow.budgetAmount, mappedRow.totalAmountSpent);
      }

      return mappedRow as ExcelProject;
    });
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return SAMPLE_DATA;
  }
}

// Data service class
export class ExcelDataService {
  private data: ExcelProject[] = [];
  
  constructor() {
    this.loadData();
  }
  
  private loadData() {
    this.data = readExcelFile();
    console.log(`Loaded ${this.data.length} projects from data source`);
  }
  
  // Reload data (useful for when Excel file is updated)
  reloadData() {
    this.loadData();
  }
  
  // Get all projects with optional filters
  getProjects(filters?: {
    status?: string;
    division?: string;
    dateFrom?: string;
    dateTo?: string;
  }): ExcelProject[] {
    let filteredData = [...this.data];
    
    if (filters) {
      if (filters.division && filters.division !== 'all') {
        filteredData = filteredData.filter(p => 
          p.division.toLowerCase() === filters.division!.toLowerCase()
        );
      }
      
      if (filters.dateFrom) {
        filteredData = filteredData.filter(p => 
          new Date(p.startDate) >= new Date(filters.dateFrom!)
        );
      }
      
      if (filters.dateTo) {
        filteredData = filteredData.filter(p => 
          new Date(p.finishDate) <= new Date(filters.dateTo!)
        );
      }
    }
    
    return filteredData;
  }
  
  // Get project by ID
  getProjectById(id: string): ExcelProject | undefined {
    return this.data.find(p => p.id.toString() === id || p.projectCode === id);
  }
  
  // Get overview statistics
  getOverviewStats(): any {
    const total = this.data.length;
    const active = this.data.filter(p => p.percentageComplete < 1 && p.percentageComplete > 0).length;
    const completed = this.data.filter(p => p.percentageComplete >= 1).length;
    const delayed = this.data.filter(p => (p.timeCompletion || 0) > 100).length;
    
    const totalBudget = this.data.reduce((sum, p) => sum + p.budgetAmount, 0);
    const actualSpend = this.data.reduce((sum, p) => sum + p.totalAmountSpent, 0);
    const amountReceived = this.data.reduce((sum, p) => sum + (p.amountReceived || 0), 0);
    
    return {
      totalProjects: total,
      activeProjects: active,
      completedProjects: completed,
      delayedProjects: delayed,
      totalBudget,
      actualSpend,
      amountReceived
    };
  }
  
  // Get all project locations for mapping
  getAllProjectLocations(): Array<{id: string, name: string, code: string, locations: Array<{lat: number, lng: number}>}> {
    return this.data.map(project => ({
      id: project.id.toString(),
      name: project.description,
      code: project.projectCode,
      locations: parseLocation(project.location || '')
    })).filter(p => p.locations.length > 0);
  }
}

// Export singleton instance
export const excelDataService = new ExcelDataService();
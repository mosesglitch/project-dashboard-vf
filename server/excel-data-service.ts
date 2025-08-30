import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import type { ExcelProject, ExcelActivity } from '@shared/excel-schema';
import { parseLocation, calculateBudgetStatusCategory, calculatePerformanceStatus } from '@shared/excel-schema';
import { connectToDatabase } from './mongodb';

// ==== DATA SOURCE CONFIGURATION ====
// Change this section to modify your data source easily
const DATA_SOURCE_CONFIG = {
  // Set the path to your Excel file here
  filePath: path.join(process.cwd(), 'data', 'projects.xlsx'),
  
  // Set the sheet names for the two sheets
  projectsSheetName: 'Projects', // Sheet for project details
  portfolioSheetName: 'Portfolio', // Sheet for portfolio/activities data
  
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
    'Performance index': 'performanceIndex',
    'Performance Category': 'performanceCategory',
    'Priority': 'priority',
    'Issues/Risks': 'issuesRisks',
    'Division': 'division',
    'Budget amount': 'budgetAmount',
    'Total Amount Spent': 'totalAmountSpent',
    'Budget Spent': 'budgetSpent',
    'Budget Status': 'budgetStatus',
    'Budget Status Category': 'budgetStatusCategory',
    'Location': 'location',
    'Amount received': 'amountReceived',
    'CO Amount': 'coAmount',
    'ProjectedGross Margin (%)': 'projectedGrossMargin',
    'Actual GrossMargin (%)': 'actualGrossMargin',
    '% Deviation of the Profit Margin': 'deviationProfitMargin'
  },
  
  // Column mappings for Portfolio sheet (activities/milestones/risks)
  portfolioColumnMapping: {
    'Project Code': 'projectCode',
    'Item': 'item',
    'Description': 'description',
    'Owner': 'owner',
    'Start Date': 'startDate',
    'Finish Date': 'finishDate',
    'Percentage Complete': 'percentageComplete',
    'Category': 'category',
    'Predecessor': 'predecessor',
    'Status': 'status'
  }
};
function mapRow(
  row: any,
  mapping: Record<string, string>,
  index: number,
  isProjectSheet = false
): any {
  const mappedRow: any = { id: index + 1 };

  Object.entries(mapping).forEach(([excelCol, schemaCol]) => {
    let value = row[excelCol];

    // 🔄 Handle data type conversions
    if (
      [
        "percentageComplete",
        "scopeCompletion",
        "timeCompletion",
        "performanceIndex",
        "budgetAmount",
        "totalAmountSpent",
        "budgetSpent",
        "amountReceived",
        "coAmount",
        "projectedGrossMargin",
        "actualGrossMargin",
        "deviationProfitMargin",
      ].includes(schemaCol)
    ) {
      value = typeof value === "string" ? parseFloat(value) || 0 : value || 0;
    } else if (schemaCol === "issuesRisks") {
      value = typeof value === "string" ? parseInt(value) || 0 : value || 0;
    } else if (["startDate", "finishDate"].includes(schemaCol)) {
      value =
        value instanceof Date ? value.toISOString().split("T")[0] : value;
    }

    mappedRow[schemaCol] = value ?? "";
  });

  // 🔄 Derived fields (only for project sheet)
  if (
    isProjectSheet &&
    !mappedRow.budgetStatusCategory &&
    mappedRow.budgetAmount &&
    mappedRow.totalAmountSpent
  ) {
    mappedRow.budgetStatusCategory = calculateBudgetStatusCategory(
      mappedRow.budgetAmount,
      mappedRow.totalAmountSpent
    );
  }

  return mappedRow;
}

async function readProjectsFromMongo(): Promise<ExcelProject[]> {
  try {
    const { db } = await connectToDatabase();
    const docs = await db.collection("portfolio").find({}).toArray();

    return docs.map((doc, i) =>
      mapRow(doc, DATA_SOURCE_CONFIG.columnMapping, i)
    );
  } catch (error) {
    console.error("❌ Error reading projects from MongoDB:", error);
    return SAMPLE_DATA;
  }
}

async function readActivitiesFromMongo(): Promise<ExcelActivity[]> {
  try {
    const { db } = await connectToDatabase();
    const docs = await db.collection("project_data").find({}).toArray();

    return docs.map((doc, i) =>
      mapRow(doc, DATA_SOURCE_CONFIG.portfolioColumnMapping, i)
    );
  } catch (error) {
    console.error("❌ Error reading activities from MongoDB:", error);
    return SAMPLE_ACTIVITIES_DATA;
  }
}
/**
 * Generic Excel sheet reader
 */
function readExcelSheet<T>(
  sheetName: string,
  mapping: Record<string, string>,
  isProjectSheet = false,
  sampleData: T[]
): T[] {
  try {
    if (!fs.existsSync(DATA_SOURCE_CONFIG.filePath)) {
      console.warn(
        `⚠️ Excel file not found at ${DATA_SOURCE_CONFIG.filePath}, using sample data`
      );
      return sampleData;
    }

    const workbook = XLSX.readFile(DATA_SOURCE_CONFIG.filePath);
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      console.error(
        `❌ Sheet "${sheetName}" not found in Excel, using sample data`
      );
      return sampleData;
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    return jsonData.map((row: any, i: number) =>
      mapRow(row, mapping, i, isProjectSheet)
    );
  } catch (error) {
    console.error(`❌ Error reading sheet "${sheetName}":`, error);
    return sampleData;
  }
}

/**
 * Specific wrappers for your two Excel sheets
 */
function readProjectsSheet(): ExcelProject[] {
  return readExcelSheet<ExcelProject>(
    "Portfolio",
    DATA_SOURCE_CONFIG.columnMapping,
    true, // 🔄 isProjectSheet
    SAMPLE_DATA
  );
}

function readPortfolioSheet(): ExcelActivity[] {
  return readExcelSheet<ExcelActivity>(
    "Projects",
    DATA_SOURCE_CONFIG.portfolioColumnMapping,
    false,
    SAMPLE_ACTIVITIES_DATA
  );
}
// Sample activities data for the second Excel file
const SAMPLE_ACTIVITIES_DATA: ExcelActivity[] = [
  {
    id: 1,
    projectCode: '51397',
    item: 'Completion of Nairobi Site',
    description: '',
    owner: '',
    startDate: '2025-08-14',
    finishDate: '2025-08-14',
    percentageComplete: 1.0,
    category: 'Upcoming',
    predecessor: '',
    status: ''
  },
  {
    id: 2,
    projectCode: '51397',
    item: 'ELDORET',
    description: '',
    owner: '',
    startDate: '2025-08-19',
    finishDate: '2025-09-15',
    percentageComplete: 0.0,
    category: 'Upcoming',
    predecessor: 'Completion of Nairobi Site',
    status: ''
  },
  {
    id: 3,
    projectCode: '51397',
    item: 'Mobilization',
    description: '',
    owner: '',
    startDate: '2025-08-19',
    finishDate: '2025-08-19',
    percentageComplete: 0.0,
    category: 'Upcoming',
    predecessor: 'ELDORET',
    status: ''
  },
  {
    id: 4,
    projectCode: '51397',
    item: 'MOMBASA',
    description: '',
    owner: '',
    startDate: '2025-06-03',
    finishDate: '2025-07-22',
    percentageComplete: 0.18,
    category: 'Late',
    predecessor: '',
    status: ''
  },
  {
    id: 5,
    projectCode: '51397',
    item: 'Installation works',
    description: '',
    owner: '',
    startDate: '2025-07-15',
    finishDate: '2025-07-18',
    percentageComplete: 0.0,
    category: 'Late',
    predecessor: '',
    status: ''
  },
  {
    id: 6,
    projectCode: '51397',
    item: 'Construction',
    description: '',
    owner: '',
    startDate: null,
    finishDate: null,
    percentageComplete: 0.77,
    category: 'Workstream',
    predecessor: '',
    status: ''
  },
  {
    id: 7,
    projectCode: '51397',
    item: 'Commissioning',
    description: '',
    owner: '',
    startDate: null,
    finishDate: null,
    percentageComplete: 0.0,
    category: 'Workstream',
    predecessor: '',
    status: ''
  },
  {
    id: 8,
    projectCode: '51397',
    item: 'Procurement',
    description: '',
    owner: '',
    startDate: null,
    finishDate: null,
    percentageComplete: 1.0,
    category: 'Workstream',
    predecessor: '',
    status: ''
  },
  {
    id: 9,
    projectCode: '51397',
    item: 'Material delivery delay',
    description: 'High',
    owner: 'Procurement',
    startDate: '2025-08-20',
    finishDate: null,
    percentageComplete: null,
    category: 'Risk',
    predecessor: '',
    status: 'Open'
  },
  {
    id: 10,
    projectCode: '51397',
    item: 'Safety inspection concerns',
    description: 'Medium',
    owner: 'Safety',
    startDate: '2025-08-21',
    finishDate: null,
    percentageComplete: null,
    category: 'Risk',
    predecessor: '',
    status: 'Closed'
  }
];

// Sample data for when Excel file is not available
const SAMPLE_DATA: ExcelProject[] = [
  {
    id: 1,
    projectCode: '51397',
    description: 'Supply of Pressure Gauges and Pressure Transmitters',
    startDate: '2025-04-17',
    finishDate: '2025-06-30',
    percentageComplete: 0.34,
    category: '',
    scopeCompletion: 0.34,
    timeCompletion: 162.16,
    performanceIndex: 0.8,
    performanceCategory: 'Slightly Behind',
    priority: '',
    issuesRisks: 5,
    division: 'Instrumentation',
    budgetAmount: 1644805.41,
    totalAmountSpent: 4961.538462,
    budgetSpent: 331.511168,
    budgetStatus: 'Within Budget',
    budgetStatusCategory: 'Within Budget',
    location: '[(-3.9389, 39.7419)]',
    amountReceived: 4874356.137,
    coAmount: 2088639.00,
    projectedGrossMargin: 0.212498948,
    actualGrossMargin: 0.999841279,
    deviationProfitMargin: 0.787342331
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
    performanceIndex: 0.8,
    performanceCategory: 'Critical Delay',
    priority: '',
    issuesRisks: 6,
    division: 'Instrumentation',
    budgetAmount: 1308312.456,
    totalAmountSpent: 101075,
    budgetSpent: 12.94397681,
    budgetStatus: 'Over Budget',
    budgetStatusCategory: 'Over Budget',
    location: '[(-0.4571, 39.6434), (-3.9389, 39.7419)]',
    amountReceived: 84899826.76,
    coAmount: 4922287.47,
    projectedGrossMargin: 0.734206411,
    actualGrossMargin: 0.99999737,
    deviationProfitMargin: 0.26579096
  },
  {
    id: 3,
    projectCode: '51415',
    description: 'Special Stringing Works At Timau Sand Pro Farm Between Tower T97-T99 (Completion Of Nanyuki - Isiolo 132kv Transmission Line)',
    startDate: '2025-04-15',
    finishDate: '2025-07-31',
    percentageComplete: 0.23,
    category: '',
    scopeCompletion: 0.23,
    timeCompletion: 114.02,
    performanceIndex: 0.8,
    performanceCategory: 'Critical Delay',
    priority: '',
    issuesRisks: 7,
    division: 'Electrical',
    budgetAmount: 3355000,
    totalAmountSpent: 2805000,
    budgetSpent: 1.196078431,
    budgetStatus: 'Critically Over Budget',
    budgetStatusCategory: 'Critically Over Budget',
    location: '[(-0.0917, 34.7680), (-0.3031, 36.0800)]',
    amountReceived: 89249.16,
    coAmount: 30201464.00,
    projectedGrossMargin: 0.88891267,
    actualGrossMargin: 0.99999996,
    deviationProfitMargin: 0.11108729
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
    performanceIndex: 0.8,
    performanceCategory: 'Slightly Behind',
    priority: '',
    issuesRisks: 9,
    division: 'Mechanical',
    budgetAmount: 271617.97,
    totalAmountSpent: 17049.16,
    budgetSpent: 15.93145762,
    budgetStatus: 'Within Budget',
    budgetStatusCategory: 'Within Budget',
    location: '[(-0.3031, 36.0800), (0.5143, 35.2698), (0.0167, 37.0728)]',
    amountReceived: 916329.5,
    coAmount: 713232.00,
    projectedGrossMargin: 0.619173046,
    actualGrossMargin: 0.999977663,
    deviationProfitMargin: 0.380804617
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
    performanceIndex: 0.8,
    performanceCategory: 'On Track',
    priority: '',
    issuesRisks: 12,
    division: 'Instrumentation',
    budgetAmount: 15961819.55,
    totalAmountSpent: 14343197.35,
    budgetSpent: 1.112849469,
    budgetStatus: 'Critically Over Budget',
    budgetStatusCategory: 'Critically Over Budget',
    location: '',
    amountReceived: 191166.4,
    coAmount: 0,
    projectedGrossMargin: 0,
    actualGrossMargin: 0,
    deviationProfitMargin: 0
  }
];


// Data service class
export class ExcelDataService {
  private data: ExcelProject[] = [];
  private activitiesData: ExcelActivity[] = [];

  // Decide here whether to use Mongo or Excel
  private readonly useMongo: boolean = true; // 👈 flip between true/false

  constructor() {
    this.loadData();
    this.loadActivitiesData();
  }

  private async loadData() {
    if (this.useMongo) {
      this.data = await readProjectsFromMongo();
      console.log(`Loaded ${this.data.length} projects from MongoDB`);
    } else {
      this.data = readProjectsSheet();
      console.log(`Loaded ${this.data.length} projects from portfolio sheet`);
    }
  }

  private async loadActivitiesData() {
    if (this.useMongo) {
      this.activitiesData = await readActivitiesFromMongo();
      console.log(`Loaded ${this.activitiesData.length} activities from MongoDB`);
    } else {
      this.activitiesData = readPortfolioSheet();
      console.log(`Loaded ${this.activitiesData.length} activities from project sheet`);
    }
  }

  // Reload data (useful for when Excel file or MongoDB is updated)
  async reloadData() {
    await this.loadData();
    await this.loadActivitiesData();
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
    
    // Sum only valid numeric values, excluding NaN, null, undefined, or empty strings
    const totalBudget = this.data.reduce((sum, p) => {
      const amount = typeof p.budgetAmount === 'number' && !isNaN(p.budgetAmount) ? p.budgetAmount : 0;
      return sum + amount;
    }, 0);
    
    const actualSpend = this.data.reduce((sum, p) => {
      const amount = typeof p.totalAmountSpent === 'number' && !isNaN(p.totalAmountSpent) ? p.totalAmountSpent : 0;
      return sum + amount;
    }, 0);
    
    const amountReceived = this.data.reduce((sum, p) => {
      // Handle cases where amountReceived might be empty string or invalid
      let amount = 0;
      if (typeof p.amountReceived === 'number' && !isNaN(p.amountReceived)) {
        amount = p.amountReceived;
      } else if (typeof p.amountReceived === 'string' && p.amountReceived !== '') {
        const parsed = parseFloat(p.amountReceived);
        amount = isNaN(parsed) ? 0 : parsed;
      }
      return sum + amount;
    }, 0);
    
    const totalRisks = this.data.reduce((sum, p) => {
      const risks = typeof p.issuesRisks === 'number' && !isNaN(p.issuesRisks) ? p.issuesRisks : 0;
      return sum + risks;
    }, 0);
    
    return {
      totalProjects: total,
      totalBudget,
      actualSpend,
      amountReceived,
      totalRisks
    };
  }
  
  // Get performance category statistics for pie chart
  getPerformanceCategoryStats(): any {
    const categories: Record<string, number> = {
      'On Track': 0,
      'Slightly Behind': 0,
      'Critical Delay': 0,
      'Ahead of Schedule': 0
    };
    
    this.data.forEach(project => {
      const category = project.performanceCategory || 'On Track';
      if (category in categories) {
        categories[category]++;
      }
    });
    
    return categories;
  }
  
  // Get spending categories data for pie chart
  getSpendingCategoriesStats(): any {
    const categories: Record<string, number> = {
      'Under Budget': 0,
      'Within Budget': 0,
      'Over Budget': 0,
      'Critically Over Budget': 0
    };
    
    this.data.forEach(project => {
      const category = project.budgetStatusCategory || 'Within Budget';
      if (category in categories) {
        categories[category]++;
      }
    });
    
    return categories;
  }
  
  // Get division data for bar chart
  getDivisionStats(): any {
    const divisions: Record<string, number> = {};
    
    this.data.forEach(project => {
      const division = project.division || 'Other';
      divisions[division] = (divisions[division] || 0) + 1;
    });
    
    return divisions;
  }
  
  // Get all project locations for mapping
  getAllProjectLocations(): Array<{id: string, name: string, code: string, locations: Array<{lat: number, lng: number}>}> {
    const result: Array<{id: string, name: string, code: string, locations: Array<{lat: number, lng: number}>}> = [];
    this.data.forEach(project => {
      const locations = parseLocation(project.location || '');
      locations.forEach(loc => {
      result.push({
        id: project.id.toString(),
        name: project.description,
        code: project.projectCode,
        locations: [loc]
      });
      });
    });
    return result;
  }

  // Get activities by project code
  getActivitiesByProjectCode(projectCode: string): ExcelActivity[] {
  return this.activitiesData.filter(activity => activity.projectCode.toLocaleString() === projectCode);
  }

  // Get activities by project code and category
  getActivitiesByCategory(projectCode: string, category: string): ExcelActivity[] {
    return this.activitiesData.filter(activity =>
      String(activity.projectCode) === String(projectCode) && activity.category === category
    );
  }

  // Get milestones (Workstream category)
  getMilestonesByProjectCode(projectCode: string): ExcelActivity[] {
    return this.getActivitiesByCategory(projectCode, 'Workstream');
  }

  // Get risks (Risk category)
  getRisksByProjectCode(projectCode: string): ExcelActivity[] {
    return this.getActivitiesByCategory(projectCode, 'Risk');
  }

  // Get upcoming activities (Upcoming category)
  getUpcomingActivitiesByProjectCode(projectCode: string): ExcelActivity[] {
    return this.getActivitiesByCategory(projectCode, 'Upcoming');
  }

  // Get late activities (Late category)
  getLateActivitiesByProjectCode(projectCode: string): ExcelActivity[] {
    return this.getActivitiesByCategory(projectCode, 'Late');
  }
}

// Export singleton instance
export const excelDataService = new ExcelDataService();



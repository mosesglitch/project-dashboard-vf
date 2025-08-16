# Excel Data Source Instructions

## How to Use Excel Data with the Dashboard

### 1. Excel File Setup
Place your Excel file at: `data/projects.xlsx`

### 2. Required Excel Column Structure
Your Excel file must have the following columns (exact names):

| Column Name | Type | Description |
|-------------|------|-------------|
| Project Code | Text | Unique project identifier |
| Description | Text | Project description/name |
| Start Date | Date | Project start date |
| Finish Date | Date | Project finish date |
| Percentage Complete | Decimal | Completion percentage (0.0 to 1.0) |
| Category | Text | Project category (optional) |
| Scope Completion | Decimal | Scope completion percentage |
| Time Completion | Decimal | Time completion percentage |
| Issues/Risks | Number | Number of issues/risks |
| Division | Text | Division (Mechanical/Electrical/Instrumentation) |
| Budget amount | Number | Total project budget |
| Total Amount Spent | Number | Amount spent so far |
| Budget Spent | Number | Budget spent ratio |
| Budget Status | Text | Budget status description |
| Budget Status Category | Text | Budget category |
| Location | Text | Coordinates as string: "[(-3.9389, 39.7419)]" |
| Amount received | Number | Amount received |

### 3. Location Format
For map display, use this format in the Location column:
```
[(-3.9389, 39.7419)]                    // Single location
[(-0.4571, 39.6434), (-3.9389, 39.7419)] // Multiple locations
```

### 4. Sample Data
If no Excel file is found, the system will use built-in sample data based on your provided structure.

### 5. Reloading Data
- After updating your Excel file, use the "Reload Excel Data" button on the dashboard
- Or restart the application

### 6. Changing Data Source
To modify the data source configuration, edit: `server/excel-data-service.ts`
- Change `filePath` to point to your Excel file
- Modify `columnMapping` if your Excel columns have different names
- Update `sheetName` if using a specific worksheet

### 7. Budget Categories
The system automatically calculates budget categories based on spend ratio:
- **Under Budget**: < 90% spent
- **Within Budget**: 90%-110% spent  
- **Over Budget**: 110%-150% spent
- **Critically Over Budget**: ≥ 150% spent

### 8. Performance Status
Performance status is calculated from Time Completion:
- **Ahead of Schedule**: PI ≥ 1.10
- **On Track**: 0.90 ≤ PI < 1.10
- **Slightly Behind**: 0.75 ≤ PI < 0.90
- **Critical Delay**: PI < 0.75
# Database Connection Setup for Slow-Moving Inventory Analyzer

## 🎯 Overview
This document explains how to connect the Slow-Moving Inventory Analyzer to your inventory database.

## 📁 Database Location
The system expects the SQLite database at:
```
Inventory/database/inventory.db
```

## 🗃️ Required Tables
The analyzer requires these tables with the following structure:

### `dbo_D_Item` (Item Master)
- `Item_Key` (INTEGER, Primary Key)
- `Item_Number` (TEXT, Unique identifier)
- `Item_Name` (TEXT, Product name)
- `Item_Category` (TEXT, Product category)
- `Unit_Cost` (REAL, Cost per unit)
- `Lead_Time_Days` (INTEGER, Supplier lead time)
- `Obsolescence_Risk` (REAL, Risk factor 0-1)
- `Reorder_Point` (INTEGER, Reorder threshold)
- `Safety_Stock_Level` (INTEGER, Safety stock quantity)

### `dbo_D_Warehouse` (Warehouse Master)
- `Warehouse_Key` (INTEGER, Primary Key)
- `Warehouse_ID` (TEXT, Warehouse identifier)
- `Warehouse_Name` (TEXT, Warehouse name)
- `Warehouse_Type` (TEXT, Warehouse type)
- `Storage_Cost_Per_Unit` (REAL, Storage cost per unit)

### `dbo_F_Inventory_Snapshot` (Inventory Facts)
- `Item_Key` (INTEGER, Foreign key to Item)
- `Warehouse_Key` (INTEGER, Foreign key to Warehouse)
- `Snapshot_Date` (TEXT, Date of snapshot)
- `Current_Stock` (INTEGER, Current stock level)
- `Average_Stock_Level` (INTEGER, Average stock over period)

## 🔌 API Endpoints
The analyzer connects through:
- **Endpoint**: `/api/slow-moving-analyzer/data`
- **Method**: POST
- **Content-Type**: application/json

### Request Parameters:
```json
{
  "category": "Electronics",           // Optional: Filter by category
  "warehouseId": "WH001",             // Optional: Filter by warehouse
  "turnoverThreshold": 4.0,           // Items below this turnover are slow-moving
  "daysThreshold": 90,                // Items with no movement for X days
  "dateRange": {                      // Optional: Date range filter
    "start": "2024-01-01",
    "end": "2024-12-31"
  }
}
```

## 🚀 Quick Setup

### 1. Verify Database Location
Ensure your `inventory.db` file is at:
```bash
apps/web/Inventory/database/inventory.db
```

### 2. Test Connection
The dashboard will automatically attempt to connect. If connection fails, you'll see:
- Clear error message with troubleshooting steps
- Option to retry connection
- Fallback to sample data for testing

### 3. Sample Data Mode
For development/testing, the system includes sample data that mimics real inventory patterns:
- 450 sample items across multiple categories
- Realistic turnover ratios and aging patterns
- $1.25M in sample inventory value

## 🎛️ Dashboard Features

### KPI Metrics
- **Total Slow-Moving Items**: Count of items below turnover threshold
- **Slow-Moving Value**: Dollar value of slow-moving inventory
- **Average Turnover Ratio**: Overall inventory turnover performance
- **Aged Inventory %**: Percentage of inventory over 90 days old
- **Carrying Cost Impact**: Monthly cost of holding slow-moving stock

### Analysis Views
1. **Turnover Analysis Matrix**: Performance by category
2. **Aging Analysis Panel**: Inventory age distribution
3. **Financial Impact Analyzer**: Cost scenarios and savings opportunities
4. **Item Level Analyzer**: Individual item recommendations

### AI Assistant
- Context-aware inventory insights
- 5 specialized agents (@sales_agent, @customer_agent, etc.)
- Real-time analysis based on current data
- Actionable recommendations

## 🔧 Troubleshooting

### Common Issues:
1. **Database not found**: Verify file path and permissions
2. **Missing tables**: Check database schema matches requirements
3. **No data returned**: Verify tables contain inventory data
4. **Performance issues**: Consider indexing on commonly filtered columns

### Database Indexes (Recommended):
```sql
CREATE INDEX idx_item_category ON dbo_D_Item(Item_Category);
CREATE INDEX idx_warehouse_id ON dbo_D_Warehouse(Warehouse_ID);
CREATE INDEX idx_snapshot_date ON dbo_F_Inventory_Snapshot(Snapshot_Date);
CREATE INDEX idx_item_warehouse ON dbo_F_Inventory_Snapshot(Item_Key, Warehouse_Key);
```

## 📊 Data Flow
```
Database (SQLite) → API Endpoint → Dashboard Components → AI Assistant
                 ↓
              Real-time KPIs → Visualizations → Insights & Recommendations
```

## 🔄 Refresh & Updates
- Data refreshes automatically when filters change
- Manual refresh available in dashboard header
- Real-time insights update based on current data
- AI assistant provides context-aware analysis

For technical support or advanced configuration, refer to the database queries in:
- `SlowMovingInventoryAnalyzer/database/queries.js`
- `/api/slow-moving-analyzer/data.js`

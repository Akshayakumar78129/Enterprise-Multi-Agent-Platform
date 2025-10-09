// UI Components
export { Card } from "./ui/Card";
export { ChartCard, MetricChartCard, DashboardChartCard } from "./ui/ChartCard";
export type { ChartCardProps } from "./ui/ChartCard";
export { Button } from "./ui/Button";
export { Badge, Chip } from "./ui/Badge";
export { Skeleton, SkeletonGroup, SkeletonCard } from "./ui/Skeleton";
export { Tabs, TabPanel } from "./ui/Tabs";
export { Tooltip, TooltipProvider } from "./ui/Tooltip";
export { ChartTooltip, useChartTooltip } from "./ui/ChartTooltip";
export type { ChartTooltipProps, TooltipItem } from "./ui/ChartTooltip";
export { ThemeSwitcher } from "./ui/ThemeSwitcher";
export { FloatingActionButtons } from "./ui/FloatingActionButtons";

// Loading Components
export { DashboardLoader, SkeletonLoader, PageLoader } from "./loading/DashboardLoader";
export type { DashboardLoaderProps, SkeletonLoaderProps, PageLoaderProps } from "./loading/DashboardLoader";

// Form Components
export { Input } from "./forms/Input";
export { TextArea } from "./forms/TextArea";
export { Select } from "./forms/Select";
export { CustomerSelector } from "./forms/CustomerSelector";

// Feedback Components
export { Modal, Dialog } from "./feedback/Modal";
export { Toast, ToastContainer, useToast } from "./feedback/Toast";

// Layout Components
export {
  DashboardLayout,
  DashboardGrid,
  DashboardSection,
  MetricsRow,
  ChartContainer
} from "./layout/DashboardLayout";
export { DashboardNavigation, DashboardMegaMenu } from "./layout/DashboardNavigation";
export { SidePanelLayout } from "./layout/SidePanelLayout";
export { AppLayout } from "./layout/AppLayout";

// KPI Components
export { KPICard } from "./kpi/KPICard";
export { KPIRow, AnimatedKPITile } from "./kpi/KPIRow";
export { KPITiles } from "./kpi/KPITiles";

// Visualization Components
export { RiskPyramid } from "./visualizations/RiskPyramid";
export { ProbabilityHistogram } from "./visualizations/ProbabilityHistogram";
export { AIFeatureImportance } from "./visualizations/AIFeatureImportance";
export { SegmentComparisonMatrix } from "./visualizations/SegmentComparisonMatrix";
export { RiskTrendsOverTime } from "./visualizations/RiskTrendsOverTime";
export { TemporalRiskPattern } from "./visualizations/TemporalRiskPattern";
export { LineChart } from "./visualizations/LineChart";
export { BarChart } from "./visualizations/BarChart";

// AI Components
export { AIInsightBlock } from "./ui/AIInsightBlock";
export { ChatInterface, ChatButton } from "./chat";
export { ChatPanel } from "./chat/ChatPanel";
export type { ChatInterfaceProps, ChatButtonProps, Message, SelectedPoint } from "./chat";
export { BusinessIntelligenceTrigger, BusinessIntelligenceModal } from "./bi";
export { BusinessIntelligencePanel } from "./bi/BusinessIntelligencePanel";
export type { BusinessIntelligenceTriggerProps, BusinessIntelligenceModalProps, ChurnCustomer } from "./bi";
export { InsightCard } from "./insights";
export type { InsightCardProps, InsightData } from "./insights";

// Selection Components (Shift+Click)
export { ShiftClickSelectionManager, getShiftClickManager } from "./selection/ShiftClickSelectionManager";
export type { ShiftClickPoint } from "./selection/ShiftClickSelectionManager";
export { SelectionIndicator } from "./selection/SelectionIndicator";
export type { SelectionIndicatorProps } from "./selection/SelectionIndicator";
export { useShiftClickHandler, useSimpleShiftClick } from "./hooks/useShiftClickHandler";
export type { UseShiftClickHandlerOptions } from "./hooks/useShiftClickHandler";

// Filter Components
export { DateRangeFilter } from "./filters/DateRangeFilter";
export { FilterBar } from "./filters/FilterBar";
export { MultiSelectFilter } from "./filters/MultiSelectFilter";
export { SearchFilter } from "./filters/SearchFilter";
export { SingleSelectFilter } from "./filters/SingleSelectFilter";

// Table Components
export { DataTable } from "./tables/DataTable";

// Context Components
export { ThemeProvider, useTheme } from "./context/ThemeContext";
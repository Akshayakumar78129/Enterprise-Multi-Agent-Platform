# Dashboard Testing Checklist

**Version**: 1.0
**Last Updated**: 2025-10-25
**Purpose**: Comprehensive end-to-end manual testing checklist for all dashboards to ensure compliance with implementation standards.

---

## How to Use This Checklist

1. **Test Each Dashboard Individually**: Go through this checklist for every dashboard in the application
2. **Check All Boxes**: Mark items as ✅ pass, ❌ fail, or N/A (not applicable)
3. **Document Issues**: Note any failures with screenshots and details
4. **Cross-Reference**: Compare behavior across dashboards to ensure consistency
5. **Test Responsive**: Verify at desktop (1920px), tablet (768px), and mobile (375px) widths

---

## Dashboard List

Test the following dashboards:

- [ ] Churn Prediction (`/churn-prediction`)
- [ ] Customer Lifetime Value (`/customer-lifetime-value`)
- [ ] Customer Segmentation (`/customer-segmentation`)
- [ ] Engagement Classifier (`/engagement-classifier`)
- [ ] Next Purchase Prediction (`/next-purchase`)
- [ ] Anomaly Detection (`/anomaly-detection`)
- [ ] Performance Deviation (`/performance-deviation`)
- [ ] Transaction Patterns (`/transaction-patterns`)

---

## 1. Visual Standards & Layout

### 1.1 Title Positioning

**Requirement**: All chart/graph titles must be positioned ABOVE their containing cards using h3 tags, NOT inside the card as a title prop.

#### Desktop View (1920px width)

- [ ] All chart titles are rendered as `<h3>` tags positioned ABOVE ChartCard components
- [ ] No titles appear inside cards using `title` prop on Card/ChartCard components
- [ ] Title styling follows EXACT standard: `text-base sm:text-lg font-semibold text-foreground mb-4`
  - `text-base` - Base font size for mobile (16px)
  - `sm:text-lg` - Larger font size for desktop (18px)
  - `font-semibold` - Semi-bold weight (600)
  - `text-foreground` - Theme-aware text color
  - `mb-4` - Consistent bottom margin (1rem / 16px)
- [ ] Title margins are consistent: `mb-4` (1rem / 16px bottom margin)
- [ ] Titles are left-aligned with their respective cards
- [ ] Chart.js titles are DISABLED in options: `plugins: { title: { display: false } }`

#### Tablet View (768px width)

- [ ] Title positioning remains above cards (not shifted or misaligned)
- [ ] Title text wraps properly if needed
- [ ] Bottom margin (`mb-4`) remains consistent

#### Mobile View (375px width)

- [ ] Title positioning remains above cards
- [ ] Titles remain readable and not truncated
- [ ] Alignment stays consistent with card edges

**Example of Correct Pattern**:
```tsx
<h3 className="text-lg font-semibold text-foreground mb-4">
  Risk Distribution
</h3>
<ChartCard>
  {/* Chart content */}
</ChartCard>
```

### 1.2 Section Title Usage

**Requirement**: ONLY the KPI section should have a section title. All other sections must NOT have section titles.

- [ ] "Key Metrics" section uses: `<DashboardSection title="Key Metrics">`
- [ ] All chart sections use: `<DashboardSection>` (NO title prop)
- [ ] No unwanted section titles like "Risk Analysis", "AI Insights", "Trends", etc.
- [ ] Section titles are NOT used for tables, charts, or other groupings

**Examples**:
- ✅ CORRECT: `<DashboardSection title="Key Metrics">`
- ❌ INCORRECT: `<DashboardSection title="Risk Analysis">`
- ❌ INCORRECT: `<DashboardSection title="Trends">`

### 1.3 Component Spacing & Alignment

- [ ] KPI cards have consistent spacing using `<KPIRow>` component
- [ ] Chart grids use proper responsive layout: `grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6`
- [ ] Full-width charts use: `col-span-1 xl:col-span-2`
- [ ] All cards have consistent padding and rounded corners
- [ ] No visual overlaps or cut-off content
- [ ] Consistent vertical spacing between sections

### 1.4 Responsive Behavior

#### Desktop (1920px)
- [ ] All charts and components render properly
- [ ] No horizontal scrolling
- [ ] Proper use of available space

#### Tablet (768px)
- [ ] Grid layouts collapse appropriately (2 columns → 1 column)
- [ ] Charts remain readable and functional
- [ ] Navigation drawer works correctly
- [ ] FABs (Floating Action Buttons) remain accessible

#### Mobile (375px)
- [ ] All content fits without horizontal scroll
- [ ] Touch targets are appropriately sized (minimum 44px)
- [ ] Text remains readable (no font too small)
- [ ] Filters stack vertically
- [ ] Tables are scrollable horizontally if needed

---

## 2. Filter Functionality

### 2.1 Single Filter Location (No Duplicates)

**Requirement**: Filters must appear ONLY ONCE per dashboard. No duplicate filter components in both layout.tsx and page.tsx.

- [ ] Dashboard has filters in ONLY one location (typically page.tsx with FilterBar component)
- [ ] No duplicate filter sets appearing twice on the page
- [ ] All filters in the set are unique (no repeated filter types)
- [ ] Filters are from the shared `FilterBar` component (`components/index`)

**Check these files**:
- `apps/frontend/src/app/[dashboard-name]/page.tsx` - Should contain FilterBar
- `apps/frontend/src/app/[dashboard-name]/layout.tsx` - Should NOT contain custom filter components

### 2.2 Filter Wrapping & Dropdown Behavior

**Requirement**: When filters wrap to multiple lines, dropdowns from top-row filters must appear ABOVE bottom-row filters without being cut off or blended.

#### Test Scenario: Reduce Window Width
1. Start at desktop width (1920px)
2. Gradually reduce browser width until filters wrap to 2+ rows
3. Open dropdown from a filter in the TOP row

**Checklist**:
- [ ] Filters wrap to multiple lines when window is resized (expected behavior)
- [ ] Opening dropdown from top-row filter displays dropdown ABOVE all other filters
- [ ] Dropdown is fully visible (not cut off, half-visible, or blended)
- [ ] Dropdown items are clickable and functional
- [ ] Dropdown appears with proper z-index (should be z-[100] globally)
- [ ] No stacking context issues (container should NOT have z-index)

#### Test Each Filter Type

**Date Range Filter**:
- [ ] Calendar dropdown appears above all content when filter wraps to top row
- [ ] Date selection works correctly
- [ ] Start and end dates display properly

**Multi-Select Filters** (Regions, Customer Types, etc.):
- [ ] Dropdown appears above all content when filter wraps to top row
- [ ] Checkboxes are clickable
- [ ] "Select All" / "Clear All" buttons work
- [ ] Selected badges display correctly in filter button
- [ ] "+X more" badge appears when selection exceeds maxDisplay

**Single-Select Filters**:
- [ ] Dropdown appears above all content when filter wraps to top row
- [ ] Options are clickable
- [ ] Selected value displays in button

### 2.3 Filter State Management

- [ ] Changing filter values updates the dashboard data correctly
- [ ] Multiple filter changes work together (combined filtering)
- [ ] Filter state persists during active session (refresh keeps filters)
- [ ] Opening dashboard in new tab/window starts fresh (no persisted filters from other session)

### 2.4 Date Range Filter

**Requirement**: Default date range must be 2017-01-01 to 2021-12-31 for consistency.

- [ ] Initial page load shows date range: 2017-01-01 to 2021-12-31
- [ ] Date picker opens when clicking date range filter
- [ ] Selecting custom date range updates dashboard
- [ ] Date range displays in format: "MMM DD, YYYY - MMM DD, YYYY"

### 2.5 Multi-Select Filters

- [ ] Filter displays placeholder when no selections made (e.g., "Select regions...")
- [ ] Selecting items shows badges with selected values
- [ ] Remove icon (×) on badges removes individual selections
- [ ] "Select All" button selects all non-disabled options
- [ ] "Clear All" button removes all selections
- [ ] Disabled options are grayed out and not clickable
- [ ] Maximum display count (e.g., 2 badges + "+X more") works correctly

### 2.6 Filter Reset

**Requirement**: Reset button must clear ALL filters AND clear localStorage to ensure fresh start.

- [ ] "Reset Filters" button is visible and accessible
- [ ] Clicking reset clears all filter selections
- [ ] Date range resets to default (2017-01-01 to 2021-12-31)
- [ ] Multi-select filters reset to empty arrays
- [ ] Dashboard data refreshes with default/unfiltered data
- [ ] localStorage is cleared (verify in browser DevTools → Application → Local Storage)
- [ ] After reset, refreshing page shows default state (not previous filters)

**Verify localStorage Clear**:
1. Open DevTools → Application → Local Storage
2. Find key matching the dashboard-specific naming convention (see below)
3. Click reset button
4. Verify localStorage key is removed

**localStorage Key Naming Convention**:
- Churn Prediction: `churnFilters` and `churnTimeRange`
- Customer Segmentation: `segmentation_filters`
- Customer Lifetime Value: `ltv_filters`
- Customer Behavior: `behaviorFilters`
- Anomaly Detection: `anomalyFilters`
- Engagement Classifier: `engagement_classifier_filters`
- Transaction Patterns: `transactionFilters`
- Performance Deviation: `performance_deviation_filters`
- Next Purchase: `next_purchase_filters` (if applicable)

---

## 3. Table Functionality

### 3.1 DataTable Component Usage

**Requirement**: All dashboard tables must use the shared `DataTable` component from `components/index`.

- [ ] Table uses `DataTable` component (not custom table markup)
- [ ] Table renders with proper columns and data
- [ ] No console errors related to table rendering

### 3.2 Table Features

#### Search Functionality
- [ ] Search input is visible at top of table (if searchable=true)
- [ ] Typing in search filters rows in real-time
- [ ] Search is case-insensitive
- [ ] Search works across all text columns
- [ ] Clearing search shows all rows again

#### Sorting
- [ ] Sortable columns show sort indicator in header
- [ ] Clicking sortable column header sorts ascending
- [ ] Clicking again sorts descending
- [ ] Sort arrow icon updates to reflect direction
- [ ] Sorting works correctly with search/filter applied

#### Pagination
- [ ] Pagination controls appear at bottom (if showPagination=true and data > pageSize)
- [ ] "Showing X to Y of Z entries" text is accurate
- [ ] "Previous" button is disabled on first page
- [ ] "Next" button is disabled on last page
- [ ] Page number buttons (1, 2, 3...) display correctly
- [ ] Current page is highlighted
- [ ] Clicking page numbers navigates correctly

#### Empty State
- [ ] When no data, table shows empty message
- [ ] Empty message is clear and user-friendly

#### Loading State
- [ ] While loading, table shows loading indicator (if implemented)
- [ ] Table doesn't flash empty state before data loads

### 3.3 Table Row Shift-Click

**Requirement**: Shift-clicking table rows must add the row to multi-point selection for the Business Intelligence panel. Regular clicks can trigger other actions (like detail modals).

#### Test Shift-Click
1. Hold Shift key
2. Click on a table row

**Checklist**:
- [ ] Shift + Click on row adds point to selection manager
- [ ] Selected point appears in Business Intelligence panel
- [ ] Point label is meaningful (e.g., "Customer: John Doe")
- [ ] Point value contains relevant metrics (e.g., "Risk: High (85%), Spend: $50K")
- [ ] Source attribution is correct (e.g., "Churn Dashboard - Customer Table")
- [ ] Multiple shift-clicks accumulate selections (don't replace)

#### Test Regular Click
1. Click on a table row WITHOUT holding Shift

**Checklist**:
- [ ] Regular click triggers default action (if defined)
- [ ] Examples: Opens detail modal, navigates to detail page, selects row
- [ ] Regular click does NOT add to shift-click selection
- [ ] If no default action, clicking row does nothing (acceptable)

#### Test Event Propagation
- [ ] `onRowClick` handler receives event object as second parameter
- [ ] Handler checks `event?.shiftKey` to distinguish shift-click from regular click
- [ ] Clicking checkbox (if selectable table) doesn't trigger row click

**Code Verification** (check in table component file):
```typescript
onRowClick={(row, event) => {
  if (event?.shiftKey) {
    shiftClickManager.addPoint({
      label: `Customer: ${row.name}`,
      value: `Relevant metrics here`,
      source: 'Dashboard Name - Table Name'
    }, event.nativeEvent);
  } else {
    // Regular click action (optional)
  }
}}
```

### 3.4 Table Rendering Quality

- [ ] Column headers are properly aligned with data
- [ ] Text in cells doesn't overflow or get cut off
- [ ] Long text wraps or truncates appropriately
- [ ] Numbers are formatted consistently (currency, percentages, etc.)
- [ ] Row hover effect works (background color change)
- [ ] Borders and spacing are consistent

---

## 4. Shift-Click Multi-Selection System

**Requirement**: All interactive components (KPIs, charts, chart points, table rows) must support shift-click for adding to Business Intelligence panel context.

### 4.1 KPI Card Shift-Click

#### Test Each KPI Card
1. Hold Shift key
2. Click on a KPI card

**Checklist**:
- [ ] Shift + Click on KPI card adds point to selection
- [ ] Point appears in BI panel with correct label
- [ ] Label matches KPI title (e.g., "Overall Churn Risk")
- [ ] Value shows KPI metric (e.g., "45.2%")
- [ ] Source is clear (e.g., "Churn Dashboard - KPIs")
- [ ] Multiple KPI shift-clicks accumulate

### 4.2 Chart Card Shift-Click

#### Test Each Chart Card
1. Hold Shift key
2. Click on chart card background (not data point)

**Checklist**:
- [ ] Shift + Click on chart card adds point to selection
- [ ] Point label identifies the chart (e.g., "Risk Distribution Chart")
- [ ] Value provides chart summary or key insight
- [ ] Source attribution is correct
- [ ] Visual feedback on shift-click (optional: brief highlight)

### 4.3 Chart Data Point Shift-Click

#### Test Chart Libraries

**Recharts (Line, Bar, Area, Scatter, Pie)**:
1. Hold Shift key
2. Click on individual data point in chart

**Checklist**:
- [ ] Shift + Click on data point adds point to selection
- [ ] Point label identifies what was clicked (e.g., "January 2021" or "High Risk Segment")
- [ ] Value shows data point metrics (e.g., "Revenue: $50K, Orders: 120")
- [ ] Source identifies chart and dashboard
- [ ] Clicking multiple points accumulates selection

**Chart.js (if used)**:
- [ ] Same behavior as Recharts above

### 4.4 Business Intelligence Panel Integration

**Open BI Panel**:
1. Shift-click several items (KPIs, charts, table rows)
2. Click BI panel FAB (floating action button) or toggle

**Checklist**:
- [ ] BI panel opens showing selected points
- [ ] All shift-clicked items appear in "Selected Data Points" section
- [ ] Each point shows: Label, Value, Source
- [ ] Point count badge shows correct number
- [ ] "Clear Selection" button is visible
- [ ] Clicking "Clear Selection" removes all points and updates count to 0
- [ ] Panel displays insights related to selected data
- [ ] Panel remains functional when additional points are added

### 4.5 Selection Manager State

- [ ] Selection persists when navigating between components on same dashboard
- [ ] Selection clears when navigating to different dashboard (expected)
- [ ] Multiple rapid shift-clicks don't cause duplicate entries
- [ ] No console errors when shift-clicking

---

## 5. Component Standards Compliance

### 5.1 KPIRow Component

**Requirement**: All KPI sections must use shared `KPIRow` component with standardized configuration.

- [ ] KPIs render using `<KPIRow kpis={kpis} columns={5} animationDelay={50} />`
- [ ] KPI cards have consistent width and height
- [ ] All KPI cards use glass-card styling with gradient overlay
- [ ] KPI titles use: `text-sm font-medium text-muted`
- [ ] KPI values use: `text-2xl sm:text-3xl font-bold text-foreground`
- [ ] Number formatting is correct:
  - Currency: Compact notation (e.g., "$30M" not "$30,054,281")
  - Number: Compact notation (e.g., "150K" not "150,000")
  - Percentage: Fixed 1 decimal (e.g., "15.5%")
- [ ] Animated count-up effect on initial load
- [ ] Hover effect works (subtle lift with `-translate-y-1`)
- [ ] Cards are responsive and wrap correctly on smaller screens

### 5.2 ChartCard Component

**Requirement**: All charts must be wrapped in shared `ChartCard` component.

- [ ] Charts use `<ChartCard>` wrapper (not plain `<Card>`)
- [ ] ChartCard has NO title prop (titles are h3 tags above card)
- [ ] Charts render inside ChartCard with proper height (e.g., `h-96`, `h-[500px]`)
- [ ] ChartCard styling is consistent across all charts
- [ ] Shift-click on ChartCard works (if implemented)

### 5.3 FilterBar Component

**Requirement**: All filters must use shared `FilterBar` component with standardized config.

- [ ] Filters use `<FilterBar config={...} onReset={...} />`
- [ ] FilterBar config includes all required filter types
- [ ] Date range config uses standardized structure:
  ```typescript
  dateRange: {
    enabled: true,
    value: { from: Date, to: Date },
    onChange: (range) => { ... }
  }
  ```
- [ ] Multi-select config uses array structure:
  ```typescript
  multiSelect: [
    {
      id: 'filterName',
      label: 'Filter Label',
      options: [...],
      value: filters.filterName || [],
      onChange: (values) => setFilters({ ...filters, filterName: values })
    }
  ]
  ```
- [ ] Reset handler clears localStorage
- [ ] Reset handler sets defaults correctly

### 5.4 DashboardSection Component

- [ ] KPI section uses: `<DashboardSection title="Key Metrics">`
- [ ] All other sections use: `<DashboardSection>` (no title prop)
- [ ] Sections have proper spacing and padding
- [ ] Nested content renders correctly

---

## 6. Navigation & Layout

### 6.1 Navigation Panel

**Open Navigation Panel**:
1. Click hamburger icon or navigation trigger

**Checklist**:
- [ ] Navigation drawer slides in from left
- [ ] Navigation has proper z-index (z-50)
- [ ] Blur overlay appears behind navigation (z-40)
- [ ] Navigation contains all dashboard links
- [ ] "Home" button/link is present (NOT on Enterprise-IQ dashboard)
- [ ] Current dashboard is highlighted in navigation
- [ ] Clicking dashboard link navigates correctly
- [ ] Clicking overlay closes navigation

### 6.2 Floating Action Buttons (FABs)

**With Navigation Closed**:
- [ ] FABs are visible in bottom-right corner
- [ ] FABs have proper z-index (z-[60])
- [ ] Chat FAB is present and clickable
- [ ] BI FAB is present and clickable
- [ ] FABs show correct icons
- [ ] Hover effect works on FABs

**With Navigation Open**:
- [ ] FABs become blurred (`blur-sm`)
- [ ] FABs become semi-transparent (`opacity-30`)
- [ ] FABs are non-interactive (`pointer-events-none`)
- [ ] User cannot click FABs while navigation is open

**Close Navigation**:
- [ ] FABs return to normal state (no blur, full opacity, clickable)

### 6.3 Chat Panel

**Open Chat Panel** (Click Chat FAB):
- [ ] Chat panel slides in from right
- [ ] Panel has proper width (responsive)
- [ ] Chat interface is visible with input and messages
- [ ] "Close" button (×) works
- [ ] Can type and send messages
- [ ] Messages appear in chat history
- [ ] Selected data points context is visible (if points selected)
- [ ] "Clear Selection" works in chat panel
- [ ] Chat panel doesn't overlap main content awkwardly

### 6.4 Business Intelligence Panel

**Open BI Panel** (Click BI FAB):
- [ ] BI panel slides in from right
- [ ] Panel has proper width (responsive)
- [ ] Panel shows insights and selected data points
- [ ] "Close" button (×) works
- [ ] Selected points are listed with labels, values, sources
- [ ] Insights are displayed (rule-based and/or AI-generated)
- [ ] "Clear Selection" button works
- [ ] Panel updates when new points are shift-clicked

### 6.5 Panel Interactions

**Both Panels Closed**:
- [ ] Main content uses full width
- [ ] FABs are fully visible

**Chat Panel Open**:
- [ ] Main content width adjusts (if implemented)
- [ ] BI FAB is still accessible
- [ ] Opening BI panel shows both panels side-by-side OR replaces chat (depends on implementation)

**BI Panel Open**:
- [ ] Main content width adjusts (if implemented)
- [ ] Chat FAB is still accessible
- [ ] Opening chat panel shows both panels side-by-side OR replaces BI (depends on implementation)

**Both Panels Open** (if supported):
- [ ] Both panels are visible without overlap
- [ ] Main content is still partially visible
- [ ] Panels are scrollable independently
- [ ] Closing one panel leaves the other open

---

## 7. Insights & AI Integration

### 7.1 Unified Insights Display

**Requirement**: Backend returns combined rule-based + AI insights in a single unified `insights` array. Frontend should not have separate handling for different insight types.

#### Business Intelligence Panel

- [ ] Open BI panel and verify insights are displayed
- [ ] Insights appear as a unified list (not separated into rule-based vs AI sections)
- [ ] Each insight has clear priority label (CRITICAL, HIGH, MODERATE, INFO)
- [ ] Insights are well-formatted with 2-3 sentences
- [ ] Action recommendations are included where appropriate
- [ ] No emojis in insights (text labels only for professional appearance)

#### Insights Metadata

**Check API Response** (DevTools Network tab):
1. Open Network tab
2. Filter to dashboard summary endpoint
3. Inspect response JSON

**Checklist**:
- [ ] Response contains single `insights` array (NOT separate `insights` and `ai_insights`)
- [ ] Response includes `insights_metadata` object with:
  - `total_count`: Total number of insights
  - `rule_based_count`: Number of rule-based insights
  - `ai_count`: Number of AI-generated insights
  - `insights_version`: Should be "unified_v2" or similar
- [ ] Combined count matches metadata: `total_count = rule_based_count + ai_count`

#### Performance

- [ ] Dashboard loads quickly (< 500ms with cache, < 1000ms cache miss)
- [ ] AI insights do NOT block dashboard loading
- [ ] No noticeable delay when opening BI panel

### 7.2 Insights Quality

- [ ] Rule-based insights are present even if AI fails
- [ ] Insights are relevant to the dashboard context
- [ ] Insights reference specific metrics and data from the dashboard
- [ ] Priority labels match the severity of the observation
- [ ] Recommendations are actionable and specific

---

## 8. Frontend Caching (React Query)

**Requirement**: All dashboards should use React Query for automatic caching to reduce redundant API calls and improve performance.

### 8.1 QueryProvider Configuration

**Verify Provider Setup**:
- [ ] `QueryProvider` is present in root `layout.tsx`
- [ ] Wraps all dashboard content
- [ ] Configuration includes:
  - `staleTime: 5 * 60 * 1000` (5 minutes, matches backend cache)
  - `gcTime: 10 * 60 * 1000` (10 minutes garbage collection)
  - `retry: 1` (retry failed requests once)
  - `refetchOnWindowFocus: false` (don't refetch on tab switch)

### 8.2 Cache Behavior Testing

#### Test 1: Initial Load (Cache Miss)
1. Clear browser cache and reload page
2. Open DevTools Network tab
3. Apply filters and load data

**Checklist**:
- [ ] API call is made to summary endpoint
- [ ] Dashboard displays loaded data
- [ ] Loading indicators appear during fetch

#### Test 2: Same Filters (Cache Hit)
1. Keep same filters
2. Navigate to different section and back
3. Or close and reopen BI panel

**Checklist**:
- [ ] NO new API call is made (check Network tab)
- [ ] Data appears instantly from cache
- [ ] No loading indicators (data already available)

#### Test 3: Different Filters (New Cache Entry)
1. Change filter values (e.g., select different date range)
2. Observe Network tab

**Checklist**:
- [ ] New API call is made for new filter combination
- [ ] Previous filter data still cached (can switch back instantly)
- [ ] Each unique filter set has its own cache entry

#### Test 4: Stale-While-Revalidate
1. Wait 5+ minutes with dashboard open
2. Interact with dashboard (change view, open panel, etc.)

**Checklist**:
- [ ] Cached (stale) data displays immediately
- [ ] Background refetch starts (check Network tab)
- [ ] Optional: "Updating..." indicator appears (if implemented)
- [ ] Data updates smoothly when background fetch completes

#### Test 5: Request Deduplication
1. Have multiple components using same data hook on same page
2. Observe Network tab on initial load

**Checklist**:
- [ ] Only ONE API call is made for all components
- [ ] All components receive the same data
- [ ] No duplicate requests

### 8.3 DevTools Verification

**Install React Query DevTools** (if available in dev mode):
- [ ] React Query DevTools panel is accessible
- [ ] Can view active queries and their cache status
- [ ] Can see stale/fresh status of each query
- [ ] Can manually trigger refetch or invalidate cache

### 8.4 Performance Comparison

**Measure Load Times**:
1. Clear cache, measure first load time
2. Navigate away and back, measure cached load time
3. Change filters, measure different filter load time
4. Return to original filters, measure cache hit time

**Expected Performance**:
- [ ] First load (cache miss): 400-1000ms (depending on data size)
- [ ] Cached load (cache hit): < 50ms (instant)
- [ ] Different filters: 400-1000ms (new cache entry)
- [ ] Return to cached filters: < 50ms (instant)

**Performance is acceptable if**:
- Initial loads are < 2 seconds
- Cached loads feel instant (< 100ms)
- No unnecessary re-fetching occurs

---

## 9. Data Consistency & States

### 9.1 Loading States

**Initial Page Load**:
- [ ] Dashboard shows loading indicators (spinners, skeletons, or loading text)
- [ ] KPI cards show loading state
- [ ] Charts show loading state or placeholder
- [ ] Tables show loading state
- [ ] Loading states are consistent in styling
- [ ] No content flash (empty → loaded) without transition

**Filter Changes**:
- [ ] Changing filters triggers loading state
- [ ] Data updates after loading completes
- [ ] Loading state doesn't cause layout shift

### 9.2 Empty States

**No Data Scenarios**:
1. Apply filters that result in no matching data

**Checklist**:
- [ ] KPIs show appropriate zero or N/A values
- [ ] Charts show "No data available" message
- [ ] Tables show empty state message
- [ ] Empty messages are user-friendly and helpful
- [ ] Layout doesn't break with empty data

### 9.3 Error Handling

**Simulate Errors** (if possible):
- [ ] API errors show user-friendly error messages
- [ ] Errors don't crash the page
- [ ] Error messages provide context
- [ ] User can recover from error (retry, refresh, etc.)

### 9.4 Data Accuracy

**Verify Data Calculations**:
- [ ] KPI metrics match expected calculations
- [ ] Chart data points are accurate
- [ ] Table data matches source
- [ ] Aggregations (sums, averages, counts) are correct
- [ ] Filtering doesn't lose or duplicate data
- [ ] Date filtering respects selected date range

---

## 10. Performance & Console

### 10.1 Console Errors

**Open DevTools Console**:
- [ ] No console errors on page load
- [ ] No console errors when interacting with filters
- [ ] No console errors when shift-clicking
- [ ] No console errors when opening/closing panels
- [ ] No React hydration warnings
- [ ] No missing key warnings in lists
- [ ] No deprecated API warnings

### 10.2 Performance

- [ ] Page loads in reasonable time (< 3 seconds)
- [ ] Filter changes update quickly (< 1 second)
- [ ] Charts render smoothly without lag
- [ ] Scrolling is smooth (no jank)
- [ ] Animations are smooth (no stuttering)
- [ ] No memory leaks (check DevTools → Memory during extended use)

### 10.3 Network Requests

**Open DevTools Network Tab**:
- [ ] API requests complete successfully (200 status)
- [ ] No unnecessary duplicate requests
- [ ] Failed requests are handled gracefully
- [ ] Request payloads contain correct filter parameters

---

## 11. Cross-Dashboard Consistency

### 11.1 Visual Consistency

**Compare Multiple Dashboards Side-by-Side**:
- [ ] All dashboards use same color scheme
- [ ] KPI card styling is identical across dashboards
- [ ] Chart card styling is identical
- [ ] Filter styling is identical
- [ ] Table styling is identical
- [ ] Font sizes and weights are consistent
- [ ] Spacing and padding are consistent

### 11.2 Behavioral Consistency

- [ ] Shift-click works the same way across all dashboards
- [ ] Filter reset works the same way
- [ ] Panel interactions work the same way
- [ ] Navigation works the same way
- [ ] Error handling is consistent

### 11.3 Component Reuse Verification

**Verify Shared Components**:
- [ ] All dashboards use `KPIRow` from `components/index`
- [ ] All dashboards use `ChartCard` from `components/index`
- [ ] All dashboards use `FilterBar` from `components/index`
- [ ] All dashboards use `DataTable` from `components/index`
- [ ] All dashboards use `DashboardSection` from `components/index`

---

## 12. Accessibility (Optional but Recommended)

### 12.1 Keyboard Navigation

- [ ] Can navigate filters using Tab key
- [ ] Can open dropdowns using Enter/Space
- [ ] Can navigate dropdown options using arrow keys
- [ ] Can close dropdowns using Escape
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are visible

### 12.2 Screen Reader Compatibility

- [ ] Buttons have proper aria-labels
- [ ] Form inputs have associated labels
- [ ] Charts have descriptive titles/captions
- [ ] Table headers are properly marked
- [ ] Loading states announce to screen readers

### 12.3 Color Contrast

- [ ] Text has sufficient contrast against backgrounds
- [ ] Chart colors are distinguishable
- [ ] Interactive elements are clearly visible

---

## 13. Edge Cases & Stress Testing

### 13.1 Large Datasets

**Test with Maximum Data**:
- [ ] Tables with 1000+ rows paginate correctly
- [ ] Charts with many data points render without crashing
- [ ] Filters with many options (100+) remain usable
- [ ] Performance remains acceptable

### 13.2 Extreme Filters

**Apply Edge Case Filters**:
- [ ] Select all options in multi-select (if many options)
- [ ] Select single day date range
- [ ] Select entire dataset date range
- [ ] Combine all filters to maximum restriction
- [ ] Dashboard handles each case gracefully

### 13.3 Rapid Interactions

**Stress Test Interactions**:
- [ ] Rapidly change filters multiple times
- [ ] Rapidly shift-click many items
- [ ] Quickly open/close panels multiple times
- [ ] Switch between dashboards rapidly
- [ ] No crashes or unexpected behavior

---

## 14. Mobile-Specific Tests

### 14.1 Touch Interactions

**Test on Mobile Device or Emulator**:
- [ ] Tap targets are large enough (minimum 44x44px)
- [ ] Dropdowns open on tap
- [ ] Dropdowns close when tapping outside
- [ ] Scrolling works smoothly
- [ ] Pinch-to-zoom works (if enabled)

### 14.2 Mobile Layout

- [ ] Filters stack vertically
- [ ] Charts scale to mobile width
- [ ] Tables are horizontally scrollable
- [ ] Text remains readable (no font too small)
- [ ] KPI cards stack in single column
- [ ] Navigation drawer works on mobile
- [ ] FABs don't overlap critical content

### 14.3 Mobile Shift-Click Alternative

**Note**: Shift-click doesn't exist on touch devices.
- [ ] Alternative interaction exists for mobile (long-press, menu, etc.) OR
- [ ] Feature is desktop-only and gracefully unavailable on mobile

---

## 15. Browser Compatibility

### 15.1 Test in Multiple Browsers

**Chrome**:
- [ ] All features work as expected
- [ ] Layout renders correctly
- [ ] No browser-specific console errors

**Firefox**:
- [ ] All features work as expected
- [ ] Layout renders correctly
- [ ] No browser-specific console errors

**Safari**:
- [ ] All features work as expected
- [ ] Layout renders correctly
- [ ] Date pickers work (Safari has unique date input handling)
- [ ] No browser-specific console errors

**Edge**:
- [ ] All features work as expected
- [ ] Layout renders correctly
- [ ] No browser-specific console errors

---

## 16. Final Verification

### 16.1 Implementation Guide Compliance

**Reference**: `DASHBOARD_IMPLEMENTATION_GUIDE.md`

- [ ] Dashboard follows metadata-only visualization pattern
- [ ] Component registry includes all dashboard components
- [ ] Prop mappers transform data correctly
- [ ] KPI cards follow standard structure
- [ ] Charts use correct libraries (Recharts, Chart.js)
- [ ] Filters follow single-location rule
- [ ] Filter dropdowns have correct z-index (z-[100] on dropdown, no z-index on container)
- [ ] Tables pass event object to onRowClick
- [ ] Shift-click pattern is implemented consistently
- [ ] Default date range is 2017-01-01 to 2021-12-31
- [ ] localStorage is cleared on filter reset
- [ ] Section titles follow rules (only "Key Metrics")
- [ ] Chart titles are h3 tags above cards

### 16.2 Code Quality

**Review Dashboard Code**:
- [ ] No TypeScript errors
- [ ] No unused imports
- [ ] Consistent code formatting
- [ ] Proper error boundaries
- [ ] Appropriate loading states
- [ ] Clean, readable code structure

### 16.3 Documentation

- [ ] Dashboard has clear comments where needed
- [ ] Complex logic is explained
- [ ] Component prop types are defined
- [ ] API endpoints are documented

---

## Testing Notes Template

Use this template to document findings for each dashboard:

```markdown
## Dashboard: [Name]
**Tested By**: [Your Name]
**Date**: [YYYY-MM-DD]
**Browser**: [Chrome/Firefox/Safari/Edge] [Version]
**Screen Size**: [Desktop/Tablet/Mobile] ([Width]px)

### Issues Found:
1. **Issue Title**
   - **Severity**: Critical / High / Medium / Low
   - **Category**: Visual / Functionality / Performance / Accessibility
   - **Description**: [Detailed description]
   - **Steps to Reproduce**:
     1. [Step 1]
     2. [Step 2]
   - **Expected Behavior**: [What should happen]
   - **Actual Behavior**: [What actually happens]
   - **Screenshot**: [Link or embedded image]
   - **Related Code**: [File path:line number]

### Passed Tests:
- [List of test categories that passed]

### Notes:
- [Any additional observations or recommendations]
```

---

## Summary Report Template

After testing all dashboards, use this to summarize findings:

```markdown
# Dashboard Testing Summary

**Testing Period**: [Start Date] - [End Date]
**Dashboards Tested**: [8/8]
**Total Issues Found**: [X]

## Critical Issues:
- [List critical issues affecting functionality]

## High Priority Issues:
- [List high priority issues affecting UX]

## Medium Priority Issues:
- [List medium priority issues]

## Low Priority Issues:
- [List low priority issues]

## Recommendations:
1. [Recommendation 1]
2. [Recommendation 2]

## Overall Compliance:
- ✅ Visual Standards: [Pass/Fail]
- ✅ Filter Functionality: [Pass/Fail]
- ✅ Table Functionality: [Pass/Fail]
- ✅ Shift-Click System: [Pass/Fail]
- ✅ Component Standards: [Pass/Fail]
- ✅ Navigation & Layout: [Pass/Fail]
- ✅ Data Consistency: [Pass/Fail]
- ✅ Cross-Dashboard Consistency: [Pass/Fail]
```

---

## Quick Reference Checklist

Use this condensed checklist for rapid verification:

### Per Dashboard (15-20 minutes)

**Visual** (2 min):
- [ ] Titles above cards
- [ ] Only "Key Metrics" has section title
- [ ] Consistent spacing

**Filters** (3 min):
- [ ] No duplicates
- [ ] Dropdowns appear above all when wrapped
- [ ] Reset clears localStorage

**Table** (3 min):
- [ ] Search works
- [ ] Sorting works
- [ ] Pagination works
- [ ] Shift-click adds to BI panel
- [ ] Regular click works (if implemented)

**Shift-Click** (3 min):
- [ ] KPIs add to selection
- [ ] Charts add to selection
- [ ] Chart points add to selection
- [ ] Table rows add to selection
- [ ] BI panel shows all selected

**Components** (2 min):
- [ ] Uses KPIRow
- [ ] Uses ChartCard
- [ ] Uses FilterBar
- [ ] Uses DataTable

**Navigation** (2 min):
- [ ] Home button present
- [ ] FABs blur when nav open
- [ ] Panels open/close correctly

**Console** (1 min):
- [ ] No errors

---

**End of Checklist**

For questions or updates, refer to `DASHBOARD_IMPLEMENTATION_GUIDE.md` or contact the development team.

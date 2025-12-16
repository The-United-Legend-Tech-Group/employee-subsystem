# ATS Frontend - CV Analysis System

## Overview

Frontend implementation of the AI-powered CV Analysis System integrated into the employee portal.

## Features Implemented

### 1. **Upload CV Tab**

- ✅ Drag & drop file upload
- ✅ File validation (PDF, DOCX, DOC, TXT only, max 10MB)
- ✅ Optional fields:
  - Candidate ID (link CV to candidate)
  - Job Description (for relevance scoring)
- ✅ Real-time upload progress
- ✅ Automatic analysis trigger

### 2. **CV History Tab**

- ✅ DataGrid with all CV records
- ✅ Columns: Filename, Status, Score, Upload Date, Process Date
- ✅ Status chips with color coding:
  - 🟢 Green (Completed)
  - 🔵 Blue (Processing)
  - 🟡 Yellow (Pending)
  - 🔴 Red (Failed)
- ✅ Score chips with color coding:
  - 🟢 80-100 (Excellent)
  - 🟡 60-79 (Good)
  - 🔴 0-59 (Needs Improvement)
- ✅ Actions: View Details, Delete
- ✅ Refresh button

### 3. **Analysis Results View**

- ✅ **Overall Score** with circular progress indicator
- ✅ **Score Breakdown** with progress bars:
  - Contact Information
  - Professional Summary
  - Work Experience
  - Education
  - Skills
  - Certifications
- ✅ **Relevance Score** chip (if job description provided)
- ✅ **Suggestions for Improvement** (5-10 actionable items)
- ✅ **Strengths** list with checkmarks
- ✅ **Areas for Improvement** list with warnings
- ✅ **Detailed Issues**:
  - Grammar & Spelling issues
  - Formatting issues

### 4. **UI/UX Features**

- ✅ Follows existing Material-UI theme
- ✅ Responsive design (mobile & desktop)
- ✅ Loading states with spinners
- ✅ Error handling with alerts
- ✅ Success notifications
- ✅ Confirmation dialogs for delete
- ✅ Full-screen modal for analysis results

## File Structure

```
frontend/src/app/employee/(protected)/ats/
├── page.tsx                          # Main ATS page with tabs
├── components/
│   ├── CVUploadSection.tsx           # Upload component with drag & drop
│   ├── CVAnalysisResults.tsx         # Results display with visualizations
│   └── CVListSection.tsx             # DataGrid for CV history
└── services/
    └── atsService.ts                 # API service layer
```

## Navigation

The ATS module is accessible from the sidebar menu:

- **Menu Item**: "CV Analysis (ATS)"
- **Icon**: Document icon
- **Route**: `/employee/ats`

## Components

### CVUploadSection

**Props:**

- `onUploadSuccess: (cvId: string) => void` - Callback after successful upload
- `employeeId: string` - Current employee ID

**Features:**

- Drag & drop zone
- File type & size validation
- Optional candidate ID field
- Optional job description textarea
- Upload progress indicator

### CVAnalysisResults

**Props:**

- `filename: string` - CV filename
- `score: number` - Overall score (0-100)
- `analysis: CVAnalysisResult` - Full analysis object
- `status: string` - Processing status

**Features:**

- Circular score gauge
- Completeness bars for each section
- Collapsible suggestions, strengths, weaknesses
- Grammar & formatting issues list

### CVListSection

**Props:**

- `cvRecords: CVRecord[]` - Array of CV records
- `onViewDetails: (cvId: string) => void` - View details callback
- `onDelete: (cvId: string) => void` - Delete callback
- `onRefresh: () => void` - Refresh data callback
- `loading: boolean` - Loading state

**Features:**

- Sortable & filterable DataGrid
- Pagination (10, 25, 50 rows)
- Status & score chips
- Action buttons (view, delete)

## API Service

**atsService.ts** provides:

- `uploadCV()` - Upload CV file
- `getCVStatus()` - Get processing status
- `getCVAnalysis()` - Get full analysis
- `getAllCVs()` - List all CVs
- `getCVsByCandidate()` - Filter by candidate
- `reanalyzeCV()` - Re-run analysis
- `deleteCV()` - Delete record

## Usage Flow

1. **User uploads CV**

   - Drags file or clicks to browse
   - Optionally adds candidate ID & job description
   - Clicks "Upload & Analyze"

2. **Processing**

   - Status: Pending → Processing → Completed
   - Takes 10-30 seconds
   - User can switch tabs or refresh

3. **View Results**

   - Click "View" in history table
   - Modal opens with full analysis
   - See score, suggestions, strengths, weaknesses

4. **Take Action**
   - Download suggestions (future)
   - Re-analyze with different job description (future)
   - Delete record

## Theme Integration

The ATS module uses the existing Material-UI theme:

- **Primary Color**: Matches app theme
- **Typography**: Roboto font family
- **Spacing**: 8px grid system
- **Components**: Cards, Chips, DataGrid, Dialogs
- **Icons**: Material Icons

## Responsive Design

- **Desktop (>960px)**: Full DataGrid, side-by-side cards
- **Tablet (600-960px)**: Stacked cards, condensed DataGrid
- **Mobile (<600px)**: Single column, simplified view

## Error Handling

- **Network Errors**: Alert with retry option
- **Validation Errors**: Inline error messages
- **API Errors**: Toast notifications
- **Loading States**: Spinners and progress bars

## Future Enhancements

### Phase 2 (Planned)

- [ ] Export analysis as PDF
- [ ] Email analysis results
- [ ] Bulk upload (multiple CVs)
- [ ] CV comparison tool
- [ ] Advanced filters (score range, date range, status)
- [ ] Analytics dashboard (charts, trends)
- [ ] Auto-refresh when processing

### Phase 3 (Future)

- [ ] Candidate profile integration
- [ ] Application workflow integration
- [ ] Template suggestions
- [ ] AI chat for CV improvement
- [ ] Skills gap analysis
- [ ] Salary recommendation

## Testing

### Manual Testing Checklist

- [ ] Upload PDF CV
- [ ] Upload DOCX CV
- [ ] Upload TXT CV
- [ ] Upload with job description
- [ ] Upload with candidate ID
- [ ] View completed analysis
- [ ] View pending analysis
- [ ] Delete CV record
- [ ] Refresh list
- [ ] Check responsive layout
- [ ] Test error cases (large file, wrong type)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Initial load: < 2s
- CV upload: Depends on file size
- Analysis display: < 500ms
- DataGrid rendering: < 1s for 100 rows

## Accessibility

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA labels
- ✅ Focus indicators
- ✅ Color contrast (WCAG AA)

## Screenshots

### Upload Tab

- Drag & drop zone with file info
- Optional fields for candidate & job description
- Upload button with progress bar

### History Tab

- DataGrid with all CV records
- Status & score chips
- Action buttons

### Analysis Results

- Circular score gauge (120px diameter)
- Progress bars for each section
- Suggestions, strengths, weaknesses cards
- Grammar & formatting issues

## Support

For issues or questions:

- Check browser console for errors
- Verify API endpoint is running (http://localhost:50000)
- Check network tab for API responses
- Review backend logs for processing errors

---

**Built with:**

- Next.js 14
- React 18
- Material-UI v5
- TypeScript
- MUI X DataGrid

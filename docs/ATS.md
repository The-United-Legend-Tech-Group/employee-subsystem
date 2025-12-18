# ATS (Applicant Tracking System) Module

## Overview
The ATS module provides AI-powered CV/Resume analysis using Google Gemini API. It automatically analyzes uploaded CVs, provides scoring, and offers actionable suggestions for improvement.

## Features
- 📄 **Multi-format Support**: PDF, DOCX, DOC, and TXT files
- 🤖 **AI-Powered Analysis**: Uses Google Gemini 1.5 Flash for intelligent CV analysis
- 📊 **Comprehensive Scoring**: 
  - Completeness Score (30%)
  - Relevance to Job Description (30%)
  - Grammar & Readability (20%)
  - Formatting & ATS-friendliness (20%)
- 💡 **Actionable Suggestions**: Get 5-10 specific improvement recommendations
- 🎯 **Strengths & Weaknesses**: Identifies what's working and what needs improvement
- 🔄 **Re-analysis**: Update job description and re-analyze existing CVs
- 📁 **Secure Storage**: Automatic file management in dedicated cv folder

## API Endpoints

### 1. Upload CV
**POST** `/recruitment/ats/upload?uploadedBy={employeeId}`

Upload a CV file for analysis.

**Request:**
- Form-data with `file` (PDF/DOCX/TXT, max 10MB)
- Optional: `candidateId`, `applicationId`, `jobDescription`

**Response:**
```json
{
  "id": "676...",
  "filename": "john_doe_cv.pdf",
  "status": "pending",
  "uploadedBy": "507f1f77bcf86cd799439011",
  "createdAt": "2025-12-16T...",
  "message": "CV uploaded successfully. Analysis is in progress."
}
```

### 2. Get CV Status
**GET** `/recruitment/ats/:id/status`

Check processing status of a CV.

**Response:**
```json
{
  "id": "676...",
  "filename": "john_doe_cv.pdf",
  "status": "completed",
  "uploadedAt": "2025-12-16T...",
  "processedAt": "2025-12-16T..."
}
```

### 3. Get Full Analysis
**GET** `/recruitment/ats/:id/analysis`

Retrieve complete AI analysis results.

**Response:**
```json
{
  "id": "676...",
  "filename": "john_doe_cv.pdf",
  "status": "completed",
  "score": 78,
  "analysis": {
    "sections": {
      "contact": { "present": true, "details": "Email and phone provided" },
      "summary": "Experienced software engineer...",
      "experience": [...],
      "education": [...],
      "skills": ["JavaScript", "Python", "React", ...],
      "certifications": [...]
    },
    "completeness": {
      "contact": 1.0,
      "summary": 0.9,
      "experience": 0.85,
      "education": 0.8,
      "skills": 0.9,
      "certifications": 0.6
    },
    "relevanceScore": 75,
    "overallScore": 78,
    "suggestions": [
      "Add more quantifiable achievements with metrics",
      "Include specific project outcomes and impact",
      "Consider adding certifications relevant to the role",
      ...
    ],
    "strengths": [
      "Strong technical skills section",
      "Clear experience progression",
      "Good formatting and readability"
    ],
    "weaknesses": [
      "Limited certifications",
      "Could add more metrics to achievements",
      "Summary could be more tailored to target role"
    ],
    "grammarIssues": [...],
    "formattingIssues": [...]
  },
  "createdAt": "2025-12-16T...",
  "processedAt": "2025-12-16T..."
}
```

### 4. Get CVs by Candidate
**GET** `/recruitment/ats/candidate/:candidateId`

Retrieve all CVs for a specific candidate.

### 5. Get CVs by Application
**GET** `/recruitment/ats/application/:applicationId`

Retrieve all CVs for a specific job application.

### 6. Get All CVs
**GET** `/recruitment/ats?limit=50&skip=0`

Paginated list of all CV records.

### 7. Re-analyze CV
**POST** `/recruitment/ats/:id/reanalyze`

Re-run analysis with updated job description.

**Request Body:**
```json
{
  "jobDescription": "Looking for a senior full-stack developer with 5+ years experience..."
}
```

### 8. Delete CV
**DELETE** `/recruitment/ats/:id`

Permanently delete CV record and file.

## Usage Examples

### Using cURL

```bash
# Upload CV
curl -X POST "http://localhost:50000/recruitment/ats/upload?uploadedBy=507f1f77bcf86cd799439011" \
  -F "file=@/path/to/cv.pdf" \
  -F "jobDescription=Looking for a software engineer with React experience"

# Check status
curl "http://localhost:50000/recruitment/ats/676.../status"

# Get analysis
curl "http://localhost:50000/recruitment/ats/676.../analysis"
```

### Using Postman

1. Create a new POST request to `/recruitment/ats/upload`
2. Add query parameter: `uploadedBy` = your employee ID
3. In Body tab, select "form-data"
4. Add key `file` (type: File) and select CV file
5. Optionally add `jobDescription`, `candidateId`, `applicationId`
6. Send request

## Processing Flow

1. **Upload** → CV file saved to `backend/src/Recruitment/ats/cv/`
2. **Status: PENDING** → Database record created
3. **Status: PROCESSING** → Text extraction begins
   - PDF: Uses pdfjs-dist
   - DOCX: Uses mammoth
   - TXT: Direct read
4. **AI Analysis** → Sends extracted text to Google Gemini
5. **Status: COMPLETED** → Results stored in database
6. **Status: FAILED** → If any error occurs (with error message)

## Scoring Breakdown

**Overall Score (0-100):**
- **Completeness (30%)**: Are all key sections present and well-filled?
- **Relevance (30%)**: How well does it match the job description?
- **Grammar & Readability (20%)**: Is it well-written and easy to read?
- **Formatting (20%)**: Is it ATS-friendly and professionally formatted?

Each section is scored individually:
- Contact Info
- Summary/Objective
- Work Experience
- Education
- Skills
- Certifications

## Configuration

Required environment variable in `.env`:
```
GOOGLE_GEMINI_API_KEY=AIzaSyCXs1zV8qIVa-c8QJLu0MeKuGG4dt-N9SA
```

## File Storage

CVs are stored in: `backend/src/Recruitment/ats/cv/`

Files are named: `{timestamp}-{original_filename}`

## Error Handling

Common errors:
- **400 Bad Request**: Invalid file type, missing file, or file too large
- **404 Not Found**: CV record doesn't exist
- **500 Internal Server Error**: Text extraction or Gemini API failure

If analysis fails, the CV status will be `failed` with an error message explaining what went wrong.

## Integration with Recruitment Module

The ATS module is integrated into the Recruitment module and can be linked to:
- **Candidates**: Associate CVs with candidate profiles
- **Applications**: Link CVs to specific job applications
- **Job Descriptions**: Provide context for relevance scoring

## Next Steps

1. **Frontend Integration**: Build upload UI and results dashboard
2. **Queue System**: Add BullMQ for production-scale async processing
3. **Webhooks**: Notify when analysis completes
4. **Enhanced OCR**: Add Google Vision API for scanned CVs
5. **CV Templates**: Suggest formatted CV templates based on analysis
6. **Bulk Upload**: Process multiple CVs simultaneously
7. **Comparison**: Compare multiple candidates' CVs side-by-side

## Support

For issues or questions, check:
- Swagger docs: `http://localhost:50000/api`
- Logs: Check console output for detailed processing logs
- Error messages: Review the `errorMessage` field in failed CV records

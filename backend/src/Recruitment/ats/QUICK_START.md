# 🚀 Quick Start Guide - ATS CV Analysis

## Prerequisites

- Node.js installed
- MongoDB running
- Google Gemini API key (already configured)

## Step 1: Start the Backend

```bash
cd backend
npm run start:dev
```

The server will start on `http://localhost:50000`

## Step 2: Access Swagger Documentation

Open in browser: **http://localhost:50000/api**

Navigate to the **"ATS - CV Analysis"** section to see all available endpoints.

## Step 3: Test CV Upload

### Option A: Using Swagger UI

1. Go to `http://localhost:50000/api`
2. Find **POST /recruitment/ats/upload**
3. Click "Try it out"
4. Fill in:
   - `uploadedBy` (query param): Your employee MongoDB ID
   - `file`: Select a CV file (PDF, DOCX, or TXT)
   - `jobDescription` (optional): Paste job description
5. Click "Execute"
6. Copy the `id` from the response

### Option B: Using cURL

```bash
# Replace YOUR_EMPLOYEE_ID and /path/to/cv.pdf
curl -X POST "http://localhost:50000/recruitment/ats/upload?uploadedBy=YOUR_EMPLOYEE_ID" \
  -F "file=@/path/to/cv.pdf" \
  -F "jobDescription=Looking for a senior software engineer with React and Node.js experience"
```

### Option C: Using Postman

1. Import the collection: `backend/src/Recruitment/ats/ATS_API.postman_collection.json`
2. Set the variable `uploadedBy` to your employee ID
3. Run the "Upload CV" request
4. Update file path in the form-data

## Step 4: Check Processing Status

```bash
# Replace CV_RECORD_ID with the ID from upload response
curl http://localhost:50000/recruitment/ats/CV_RECORD_ID/status
```

Status will be one of:

- `pending` - Just uploaded
- `processing` - AI is analyzing
- `completed` - Analysis done ✅
- `failed` - Error occurred ❌

## Step 5: Get Analysis Results

Once status is `completed`:

```bash
curl http://localhost:50000/recruitment/ats/CV_RECORD_ID/analysis
```

You'll receive:

- **Overall Score** (0-100)
- **Section-by-section analysis** (contact, experience, education, skills)
- **Completeness scores** for each section
- **Relevance score** (if job description provided)
- **5-10 Suggestions** for improvement
- **Strengths** (3-5 points)
- **Weaknesses** (3-5 points)
- **Grammar issues** detected
- **Formatting issues** detected

## Example Response

```json
{
  "id": "67606a1b2f0a4c001f123456",
  "filename": "john_doe_cv.pdf",
  "status": "completed",
  "score": 78,
  "analysis": {
    "overallScore": 78,
    "relevanceScore": 75,
    "completeness": {
      "contact": 1.0,
      "summary": 0.9,
      "experience": 0.85,
      "education": 0.8,
      "skills": 0.9,
      "certifications": 0.6
    },
    "suggestions": [
      "Add quantifiable achievements with metrics (e.g., 'Increased performance by 40%')",
      "Include specific technologies and frameworks for each project",
      "Add certifications relevant to your target role",
      "Expand professional summary to highlight key achievements",
      "Use action verbs at the start of each bullet point"
    ],
    "strengths": [
      "Strong technical skills section with relevant technologies",
      "Clear progression in job titles showing career growth",
      "Good formatting and easy to read",
      "Relevant work experience for the role"
    ],
    "weaknesses": [
      "Limited certifications compared to industry standards",
      "Some experience descriptions lack specific metrics",
      "Professional summary could be more targeted"
    ],
    "grammarIssues": [],
    "formattingIssues": []
  },
  "createdAt": "2025-12-16T10:30:00Z",
  "processedAt": "2025-12-16T10:30:15Z"
}
```

## Common Tasks

### Link CV to a Candidate

```bash
curl -X POST "http://localhost:50000/recruitment/ats/upload?uploadedBy=EMPLOYEE_ID" \
  -F "file=@cv.pdf" \
  -F "candidateId=CANDIDATE_MONGODB_ID"
```

### Link CV to an Application

```bash
curl -X POST "http://localhost:50000/recruitment/ats/upload?uploadedBy=EMPLOYEE_ID" \
  -F "file=@cv.pdf" \
  -F "applicationId=APPLICATION_MONGODB_ID" \
  -F "jobDescription=Job requirements here..."
```

### Re-analyze with Different Job Description

```bash
curl -X POST "http://localhost:50000/recruitment/ats/CV_ID/reanalyze" \
  -H "Content-Type: application/json" \
  -d '{"jobDescription": "New job requirements..."}'
```

### Get All CVs for a Candidate

```bash
curl http://localhost:50000/recruitment/ats/candidate/CANDIDATE_ID
```

### Delete a CV

```bash
curl -X DELETE http://localhost:50000/recruitment/ats/CV_ID
```

## Troubleshooting

### "CV analysis is not yet completed"

- Wait a few seconds and check status again
- Processing typically takes 5-15 seconds depending on CV length

### "Failed to extract text from PDF"

- Ensure the PDF is not password-protected
- Try converting scanned images to text format first

### "Gemini analysis failed"

- Check that GOOGLE_GEMINI_API_KEY is set in .env
- Verify API key is valid and has quota remaining
- Check backend logs for detailed error message

### "File size exceeds 10MB limit"

- Compress the PDF or reduce image quality
- Use text-only format if possible

## File Locations

- **Uploaded CVs**: `backend/src/Recruitment/ats/cv/`
- **Logs**: Check console output when running in dev mode
- **Database**: MongoDB collection `cvrecords`

## Next Steps

1. **Build Frontend UI** for CV upload and results display
2. **Add Queue System** (BullMQ) for production-scale processing
3. **Implement Webhooks** for real-time notifications
4. **Add Bulk Upload** capability
5. **Create CV Comparison** feature

## Support

- Full API documentation: http://localhost:50000/api
- Module README: `backend/src/Recruitment/ats/README.md`
- Implementation summary: `docs/ATS_IMPLEMENTATION_SUMMARY.md`

## Environment Variables

Ensure these are set in `backend/.env`:

```env
GOOGLE_GEMINI_API_KEY=AIzaSyCXs1zV8qIVa-c8QJLu0MeKuGG4dt-N9SA
MONGO_URI=mongodb+srv://...
PORT=50000
```

---

**Ready to analyze CVs! 🎯**

# AI-Enhanced Security Scanning with PDF Reports

## New Features

### 1. **Gemini AI Enhancement** 🤖
Scan results are now automatically enhanced with Google's Gemini AI to provide:
- Professional, detailed security descriptions
- Business impact analysis
- Step-by-step remediation instructions
- Prevention tips and best practices

### 2. **PDF Report Generation** 📄
Download comprehensive security reports in PDF format including:
- Executive summary
- Vulnerability statistics
- Severity breakdowns
- Detailed findings with remediation steps
- Professional formatting with color-coded severity levels

## Setup Instructions

### 1. Install New Dependencies
```bash
cd backend/python
pip install -r requirements.txt
```

This will install:
- `google-generativeai` - Gemini AI SDK
- `reportlab` - PDF generation library

### 2. Configure Gemini API Key (Optional)

1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env` file in `backend/python/`:
```bash
cp .env.example .env
```
3. Add your API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

**Note:** The scanner works without Gemini, but AI enhancement will be disabled.

### 3. Restart Python Backend
```bash
cd backend/python
python app.py
```

## How It Works

### Workflow
1. **User triggers scan** → AWS credentials sent to Python backend
2. **Scanner runs** → Collects security findings from AWS services
3. **Gemini AI enhances** → Adds professional descriptions and remediation (if API key configured)
4. **Results sent to frontend** → Displayed in dashboard
5. **User clicks "Download Report"** → PDF generated with full details

### Architecture
```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│  Frontend   │─────>│  Node.js API │─────>│  Python API  │
│  (React)    │<─────│  (Express)   │<─────│  (Flask)     │
└─────────────┘      └──────────────┘      └──────────────┘
                                                   │
                                                   v
                                            ┌──────────────┐
                                            │   Gemini AI  │
                                            │  (Optional)  │
                                            └──────────────┘
                                                   │
                                                   v
                                            ┌──────────────┐
                                            │ PDF Generator│
                                            │ (ReportLab)  │
                                            └──────────────┘
```

### API Endpoints

#### Enhanced Scan Endpoint
```http
POST http://localhost:5001/api/scan
Content-Type: application/json

{
  "aws_access_key_id": "YOUR_KEY",
  "aws_secret_access_key": "YOUR_SECRET",
  "region": "us-east-1"
}
```

**Response:**
```json
{
  "success": true,
  "scan_id": 1,
  "data": {
    "total_issues": 15,
    "severity_breakdown": {
      "critical": 2,
      "high": 5,
      "medium": 6,
      "low": 2
    },
    "findings": [
      {
        "service": "s3",
        "resource": "my-bucket",
        "issue": "Public Access Enabled",
        "description": "Detailed AI-generated description...",
        "enhanced_description": "Professional description from Gemini...",
        "business_impact": "Could lead to data breaches...",
        "remediation": "Step-by-step fix...",
        "detailed_remediation": "Enhanced remediation from AI...",
        "prevention_tips": "Best practices to avoid...",
        "severity": "CRITICAL",
        "ai_enhanced": true
      }
    ],
    "executive_summary": "AI-generated executive summary...",
    "ai_enhanced_count": 7
  }
}
```

#### PDF Download Endpoint
```http
GET http://localhost:5001/api/scan/{scan_id}/download
```

**Response:** Binary PDF file

### Frontend Changes

#### New Download Button
After a scan completes, a **"Download Security Report (PDF)"** button appears below the statistics cards. Clicking it:
1. Fetches the PDF from Python backend
2. Automatically downloads the file
3. Names it with scan ID and timestamp

#### Code Example
```javascript
const downloadReport = async () => {
  const response = await axios.get(
    `http://localhost:5001/api/scan/${scanId}/download`,
    { responseType: 'blob' }
  );
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `security_report_${scanId}.pdf`);
  link.click();
};
```

## Files Added

### Backend (Python)
- `gemini_enhancer.py` - Gemini AI integration for enhancing findings
- `pdf_generator.py` - PDF report generation with ReportLab
- `reports/` - Directory for generated PDF reports (auto-created)

### Updated Files
- `app.py` - Added Gemini enhancement and PDF download endpoint
- `requirements.txt` - Added new dependencies
- `.env.example` - Added Gemini API key configuration
- `frontend/src/pages/Dashboard.jsx` - Added download button and functionality

## Benefits

### For Users
- **Professional Reports**: Get executive-ready security reports
- **Better Understanding**: AI explains vulnerabilities in clear language
- **Actionable Remediation**: Step-by-step instructions to fix issues
- **Shareable**: PDF format easy to share with teams

### For Development
- **Modular**: Gemini enhancement is optional
- **Extensible**: Easy to add more AI features
- **Scalable**: Caches reports for repeated downloads

## Troubleshooting

### PDF Generation Fails
**Error:** `ModuleNotFoundError: No module named 'reportlab'`
**Fix:** 
```bash
pip install reportlab==4.0.9
```

### Gemini API Not Working
**Error:** `Gemini API key not found`
**Fix:** Add `GEMINI_API_KEY` to `.env` file. Scanner still works without it.

### PDF Download Shows 404
**Error:** `404 Not Found`
**Fix:** Make sure Python backend is running on port 5001:
```bash
cd backend/python
python app.py
```

## Future Enhancements
- [ ] Custom report templates
- [ ] Multiple report formats (Excel, CSV)
- [ ] Scheduled scans with auto-reports
- [ ] Email reports directly from backend
- [ ] Historical comparison reports

## Example Report Structure

```
┌─────────────────────────────────────┐
│   AWS Security Scan Report          │
│   Generated: Jan 25, 2026           │
└─────────────────────────────────────┘

Executive Summary
─────────────────
[AI-generated professional summary of findings]

Scan Overview
─────────────
Total Issues:     15
Critical:         2
High:             5
Medium:           6
Low:              2

Critical Severity Issues (2)
────────────────────────────
Issue #1: S3 Bucket Public Access
Service:    S3
Resource:   my-production-bucket
Severity:   CRITICAL
Description: [Detailed AI-enhanced explanation]
Business Impact: [Risk assessment]
Remediation: [Step-by-step instructions]
Prevention: [Best practices]

[... more findings ...]
```

## Support
For issues or questions:
1. Check the troubleshooting section
2. Review Python backend logs
3. Ensure all dependencies are installed
4. Verify Gemini API key (if using AI features)

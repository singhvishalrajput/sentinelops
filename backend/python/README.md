# SentinelOps Python Backend

Python backend service for AWS security scanning functionality in SentinelOps.

## Features

- 🔍 AWS Security Scanning (S3, EC2, IAM, RDS)
- 🔐 Dynamic credential management (user-provided)
- 📊 Detailed vulnerability reporting
- 🎯 RESTful API integration
- 📈 Scan history tracking

## Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Navigate to the Python backend directory:**
   ```bash
   cd backend/python
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # Activate on Windows
   venv\Scripts\activate
   
   # Activate on macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment (optional):**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

## Running the Server

### Development Mode

```bash
python app.py
```

The server will start on `http://localhost:5001`

### Production Mode

```bash
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

## API Endpoints

### Health Check
```
GET /health
```
Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "sentinelops-python-backend",
  "timestamp": "2026-01-24T10:30:00"
}
```

### Test AWS Connection
```
POST /api/test-connection
```
Test AWS credentials before running a full scan.

**Request Body:**
```json
{
  "aws_access_key_id": "AKIA...",
  "aws_secret_access_key": "...",
  "region": "us-east-1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AWS credentials are valid"
}
```

### Trigger Security Scan
```
POST /api/scan
```
Perform a full AWS security scan.

**Request Body:**
```json
{
  "aws_access_key_id": "AKIA...",
  "aws_secret_access_key": "...",
  "region": "us-east-1"
}
```

**Response:**
```json
{
  "success": true,
  "scan_id": 1,
  "data": {
    "timestamp": "2026-01-24T10:30:00",
    "region": "us-east-1",
    "total_issues": 15,
    "severity_breakdown": {
      "critical": 3,
      "high": 5,
      "medium": 4,
      "low": 3
    },
    "service_breakdown": {
      "S3": 5,
      "EC2": 4,
      "IAM": 3,
      "RDS": 3
    },
    "findings": [...]
  }
}
```

### Get Scan History
```
GET /api/scan/history
```
Retrieve all scan history.

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

### Get Specific Scan
```
GET /api/scan/:scan_id
```
Get details of a specific scan by ID.

## Security Checks Performed

### S3 Buckets
- ✅ Public access block configuration
- ✅ Encryption at rest
- ✅ Versioning enabled
- ✅ Bucket policies

### EC2 Security Groups
- ✅ Overly permissive rules (0.0.0.0/0)
- ✅ Critical port exposure (SSH, RDP, databases)
- ✅ Security group best practices

### IAM Users
- ✅ MFA enabled
- ✅ Admin policy attachments
- ✅ Access key age (90+ days)
- ✅ Least privilege principle

### RDS Instances
- ✅ Public accessibility
- ✅ Encryption at rest
- ✅ Backup retention period
- ✅ VPC configuration

## Integration with Node.js Backend

The Python backend can be called from your Node.js backend:

```javascript
const axios = require('axios');

async function triggerAWSScan(credentials) {
  try {
    const response = await axios.post('http://localhost:5001/api/scan', {
      aws_access_key_id: credentials.accessKey,
      aws_secret_access_key: credentials.secretKey,
      region: credentials.region || 'us-east-1'
    });
    
    return response.data;
  } catch (error) {
    console.error('Scan failed:', error);
    throw error;
  }
}
```

## Frontend Integration

Call from your React frontend:

```javascript
const runSecurityScan = async (credentials) => {
  try {
    const response = await fetch('http://localhost:5001/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aws_access_key_id: credentials.accessKeyId,
        aws_secret_access_key: credentials.secretAccessKey,
        region: credentials.region || 'us-east-1'
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Scan failed:', error);
  }
};
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing credentials)
- `401` - Unauthorized (invalid credentials)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include details:

```json
{
  "success": false,
  "error": "Error message here"
}
```

## AWS Permissions Required

The AWS credentials provided should have the following permissions:

- `s3:ListBuckets`
- `s3:GetBucketPublicAccessBlock`
- `s3:GetBucketEncryption`
- `s3:GetBucketVersioning`
- `ec2:DescribeSecurityGroups`
- `iam:ListUsers`
- `iam:ListMFADevices`
- `iam:ListAttachedUserPolicies`
- `iam:ListAccessKeys`
- `rds:DescribeDBInstances`

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5001
netstat -ano | findstr :5001

# Kill the process or change port in app.py
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### AWS Credentials Issues
- Ensure credentials have proper IAM permissions
- Test with `/api/test-connection` endpoint first
- Check AWS region availability

## Development

### Adding New Scanners

1. Add scanning method to `scanner.py`:
```python
def scan_lambda_functions(self):
    """Scan Lambda functions"""
    # Implementation
    pass
```

2. Call it in `run_scan()`:
```python
try:
    self.scan_lambda_functions()
except Exception as e:
    logger.error(f"Lambda scan failed: {e}")
```

### Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:5001/health

# Test connection
curl -X POST http://localhost:5001/api/test-connection \
  -H "Content-Type: application/json" \
  -d '{"aws_access_key_id":"AKIA...","aws_secret_access_key":"...","region":"us-east-1"}'

# Run scan
curl -X POST http://localhost:5001/api/scan \
  -H "Content-Type: application/json" \
  -d '{"aws_access_key_id":"AKIA...","aws_secret_access_key":"...","region":"us-east-1"}'
```

## License

Part of SentinelOps project.

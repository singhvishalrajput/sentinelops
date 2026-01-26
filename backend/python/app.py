from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import logging
import os
from datetime import datetime
from dotenv import load_dotenv
from scanner import AWSSecurityScanner
from azure_scanner import AzureSecurityScanner
from gcp_scanner import GCPSecurityScanner
from mistral_enhancer import MistralEnhancer
from pdf_generator import PDFReportGenerator

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Mistral enhancer and PDF generator
mistral_enhancer = MistralEnhancer()
pdf_generator = PDFReportGenerator()

# Store scan history (in production, use a database)
scan_history = []

# Create reports directory if it doesn't exist
REPORTS_DIR = os.path.join(os.path.dirname(__file__), 'reports')
if not os.path.exists(REPORTS_DIR):
    os.makedirs(REPORTS_DIR)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'sentinelops-python-backend',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/scan', methods=['POST'])
def trigger_scan():
    """
    Trigger AWS security scan with provided credentials
    
    Expected payload:
    {
        "aws_access_key_id": "...",
        "aws_secret_access_key": "...",
        "region": "us-east-1"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('aws_access_key_id') or not data.get('aws_secret_access_key'):
            return jsonify({
                'success': False,
                'error': 'Missing required AWS credentials'
            }), 400
        
        # Extract credentials
        aws_access_key_id = data.get('aws_access_key_id')
        aws_secret_access_key = data.get('aws_secret_access_key')
        region = data.get('region', 'us-east-1')
        
        logger.info(f"Starting AWS security scan for region: {region}")
        
        # Initialize scanner with provided credentials
        scanner = AWSSecurityScanner(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region=region
        )
        
        # Run the scan
        scan_results = scanner.run_scan()
        
        # FAST AI: Only generate executive summary (skips individual findings for speed)
        logger.info("Generating AI summary (fast mode)...")
        executive_summary = mistral_enhancer.generate_executive_summary(scan_results)
        scan_results['executive_summary'] = executive_summary
        
        # Add cloud provider identifier
        scan_results['cloudProvider'] = 'AWS'
        
        # Store in history
        scan_record = {
            'id': len(scan_history) + 1,
            'timestamp': datetime.now().isoformat(),
            'region': region,
            'results': scan_results
        }
        scan_history.append(scan_record)
        
        logger.info(f"Scan completed. Found {scan_results['total_issues']} issues")
        
        return jsonify({
            'success': True,
            'scan_id': scan_record['id'],
            'data': scan_results
        }), 200
        
    except Exception as e:
        logger.error(f"Error during scan: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/scan/history', methods=['GET'])
def get_scan_history():
    """Get all scan history"""
    try:
        return jsonify({
            'success': True,
            'data': scan_history
        }), 200
    except Exception as e:
        logger.error(f"Error fetching scan history: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/scan/<int:scan_id>', methods=['GET'])
def get_scan_by_id(scan_id):
    """Get specific scan result by ID"""
    try:
        scan = next((s for s in scan_history if s['id'] == scan_id), None)
        
        if not scan:
            return jsonify({
                'success': False,
                'error': 'Scan not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': scan
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching scan: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/scan/<int:scan_id>/download', methods=['GET'])
def download_scan_report(scan_id):
    """
    Generate and download PDF report for a specific scan
    """
    try:
        # Find the scan
        scan = next((s for s in scan_history if s['id'] == scan_id), None)
        
        if not scan:
            return jsonify({
                'success': False,
                'error': 'Scan not found'
            }), 404
        
        # Generate PDF
        filename = f"security_report_{scan_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        output_path = os.path.join(REPORTS_DIR, filename)
        
        logger.info(f"Generating PDF report: {filename}")
        pdf_generator.generate_report(scan['results'], output_path)
        
        # Send file
        return send_file(
            output_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        logger.error(f"Error generating PDF report: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf_from_results():
    """
    Generate PDF report from provided scan results
    This endpoint accepts scan results directly from frontend based on current panel view
    """
    try:
        data = request.json
        scan_results = data.get('scanResults')
        cloud_provider = data.get('cloudProvider', 'aws')
        timestamp = data.get('timestamp', datetime.now().isoformat())
        
        if not scan_results:
            return jsonify({
                'success': False,
                'error': 'No scan results provided'
            }), 400
        
        # Add cloud provider info to results if not present
        if 'cloudProvider' not in scan_results:
            scan_results['cloudProvider'] = cloud_provider.upper()
        
        # Generate PDF filename
        filename = f"{cloud_provider}_security_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        output_path = os.path.join(REPORTS_DIR, filename)
        
        logger.info(f"Generating PDF report for {cloud_provider.upper()}: {filename}")
        logger.info(f"Scan results summary - Risk Score: {scan_results.get('riskScore', 'N/A')}, "
                   f"Critical: {scan_results.get('criticalCount', 0)}, "
                   f"High: {scan_results.get('highCount', 0)}")
        
        # Generate PDF using existing generator
        pdf_generator.generate_report(scan_results, output_path)
        
        # Send file
        return send_file(
            output_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        logger.error(f"Error generating PDF from results: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/test-connection', methods=['POST'])
def test_aws_connection():
    """
    Test AWS connection with provided credentials
    
    Expected payload:
    {
        "aws_access_key_id": "...",
        "aws_secret_access_key": "...",
        "region": "us-east-1"
    }
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('aws_access_key_id') or not data.get('aws_secret_access_key'):
            return jsonify({
                'success': False,
                'error': 'Missing required AWS credentials'
            }), 400
        
        aws_access_key_id = data.get('aws_access_key_id')
        aws_secret_access_key = data.get('aws_secret_access_key')
        region = data.get('region', 'us-east-1')
        
        # Test connection
        scanner = AWSSecurityScanner(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region=region
        )
        
        is_valid = scanner.test_connection()
        
        if is_valid:
            return jsonify({
                'success': True,
                'message': 'AWS credentials are valid'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid AWS credentials or insufficient permissions'
            }), 401
            
    except Exception as e:
        logger.error(f"Error testing connection: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/azure/scan', methods=['POST'])
def trigger_azure_scan():
    """
    Trigger Azure security scan with provided credentials
    
    Expected payload:
    {
        "subscription_id": "...",
        "client_id": "...",
        "tenant_id": "...",
        "client_secret": "..."
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['subscription_id', 'client_id', 'tenant_id', 'client_secret']
        if not data or not all(data.get(field) for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required Azure credentials'
            }), 400
        
        # Extract credentials
        subscription_id = data.get('subscription_id')
        client_id = data.get('client_id')
        tenant_id = data.get('tenant_id')
        client_secret = data.get('client_secret')
        
        logger.info(f"Starting Azure security scan for subscription: {subscription_id}")
        
        # Initialize scanner with provided credentials
        scanner = AzureSecurityScanner(
            subscription_id=subscription_id,
            client_id=client_id,
            tenant_id=tenant_id,
            client_secret=client_secret
        )
        
        # Run the scan
        scan_results = scanner.run_scan()
        
        # FAST AI: Only generate executive summary (skips individual findings for speed)
        logger.info("Generating AI summary (fast mode)...")
        executive_summary = mistral_enhancer.generate_executive_summary(scan_results)
        scan_results['executive_summary'] = executive_summary
        
        # Store in history
        scan_record = {
            'id': len(scan_history) + 1,
            'timestamp': datetime.now().isoformat(),
            'subscriptionId': subscription_id,
            'cloudProvider': 'Azure',
            'results': scan_results
        }
        scan_history.append(scan_record)
        
        logger.info(f"Azure scan completed. Found {scan_results['total_issues']} issues")
        
        return jsonify({
            'success': True,
            'scan_id': scan_record['id'],
            'data': scan_results
        }), 200
        
    except Exception as e:
        logger.error(f"Error during Azure scan: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/azure/test-connection', methods=['POST'])
def test_azure_connection():
    """
    Test Azure connection with provided credentials
    
    Expected payload:
    {
        "subscription_id": "...",
        "client_id": "...",
        "tenant_id": "...",
        "client_secret": "..."
    }
    """
    try:
        data = request.get_json()
        
        required_fields = ['subscription_id', 'client_id', 'tenant_id', 'client_secret']
        if not data or not all(data.get(field) for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required Azure credentials'
            }), 400
        
        subscription_id = data.get('subscription_id')
        client_id = data.get('client_id')
        tenant_id = data.get('tenant_id')
        client_secret = data.get('client_secret')
        
        # Test connection
        scanner = AzureSecurityScanner(
            subscription_id=subscription_id,
            client_id=client_id,
            tenant_id=tenant_id,
            client_secret=client_secret
        )
        
        is_valid = scanner.test_connection()
        
        if is_valid:
            return jsonify({
                'success': True,
                'message': 'Azure credentials are valid'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid Azure credentials or insufficient permissions'
            }), 401
            
    except Exception as e:
        logger.error(f"Error testing Azure connection: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gcp/scan', methods=['POST'])
def scan_gcp():
    """
    Perform security scan on GCP project
    
    Expected payload:
    {
        "project_id": "...",
        "service_account_json": {...},
        "region": "..."
    }
    """
    try:
        data = request.get_json()
        
        required_fields = ['project_id', 'service_account_json']
        if not data or not all(data.get(field) for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required GCP credentials'
            }), 400
        
        project_id = data.get('project_id')
        service_account_json = data.get('service_account_json')
        region = data.get('region', 'us-central1')
        
        logger.info(f"Starting GCP security scan for project: {project_id}")
        
        # Initialize scanner
        scanner = GCPSecurityScanner(
            project_id=project_id,
            service_account_json=service_account_json,
            region=region
        )
        
        # Run the scan
        scan_results = scanner.run_scan()
        
        # FAST AI: Only generate executive summary (skips individual findings for speed)
        logger.info("Generating AI summary (fast mode)...")
        executive_summary = mistral_enhancer.generate_executive_summary(scan_results)
        scan_results['executive_summary'] = executive_summary
        
        # Add cloud provider identifier
        scan_results['cloudProvider'] = 'GCP'
        
        # Normalize response to match AWS/Azure format for frontend compatibility
        scan_results['criticalCount'] = scan_results.get('severity_breakdown', {}).get('critical', 0)
        scan_results['highCount'] = scan_results.get('severity_breakdown', {}).get('high', 0)
        scan_results['mediumCount'] = scan_results.get('severity_breakdown', {}).get('medium', 0)
        scan_results['lowCount'] = scan_results.get('severity_breakdown', {}).get('low', 0)
        scan_results['totalAssets'] = len(scan_results.get('service_breakdown', {}))
        scan_results['complianceScore'] = max(0, 100 - (scan_results['total_issues'] * 5))  # Simple calculation
        
        # Store in history
        scan_record = {
            'id': len(scan_history) + 1,
            'timestamp': datetime.now().isoformat(),
            'projectId': project_id,
            'cloudProvider': 'GCP',
            'results': scan_results
        }
        scan_history.append(scan_record)
        
        logger.info(f"GCP scan completed. Found {scan_results['total_issues']} issues")
        
        return jsonify({
            'success': True,
            'data': scan_results
        }), 200
        
    except Exception as e:
        logger.error(f"Error during GCP scan: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gcp/test-connection', methods=['POST'])
def test_gcp_connection():
    """
    Test GCP connection with provided credentials
    
    Expected payload:
    {
        "project_id": "...",
        "service_account_json": {...},
        "region": "..."
    }
    """
    try:
        data = request.get_json()
        
        required_fields = ['project_id', 'service_account_json']
        if not data or not all(data.get(field) for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required GCP credentials'
            }), 400
        
        project_id = data.get('project_id')
        service_account_json = data.get('service_account_json')
        region = data.get('region', 'us-central1')
        
        # Test connection
        scanner = GCPSecurityScanner(
            project_id=project_id,
            service_account_json=service_account_json,
            region=region
        )
        
        is_valid = scanner.test_connection()
        
        if is_valid:
            return jsonify({
                'success': True,
                'message': 'GCP credentials are valid'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid GCP credentials or insufficient permissions'
            }), 401
            
    except Exception as e:
        logger.error(f"Error testing GCP connection: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

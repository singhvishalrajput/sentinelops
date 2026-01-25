from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import logging
import os
from datetime import datetime
from dotenv import load_dotenv
from scanner import AWSSecurityScanner
from gemini_enhancer import GeminiEnhancer
from pdf_generator import PDFReportGenerator

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini enhancer and PDF generator
gemini_enhancer = GeminiEnhancer()
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
        
        # Enhance with Gemini AI (if API key is configured)
        logger.info("Enhancing scan results with Gemini AI...")
        scan_results = gemini_enhancer.enhance_scan_results(scan_results)
        
        # Generate executive summary
        executive_summary = gemini_enhancer.generate_executive_summary(scan_results)
        scan_results['executive_summary'] = executive_summary
        
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

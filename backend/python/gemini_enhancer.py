import os
import logging
import time
from datetime import datetime
import google.generativeai as genai

logger = logging.getLogger(__name__)

class GeminiEnhancer:
    def __init__(self, api_key=None):
        """Initialize Gemini AI enhancer"""
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.request_count = 0
        self.last_request_time = 0
        self.requests_per_minute = 4  # Stay under 5 request limit with buffer
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # Using latest free Gemini model (gemini-flash-latest -> gemini-3-flash-preview)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None
            logger.warning("Gemini API key not found. AI enhancement will be disabled.")
    
    def _rate_limit(self):
        """Implement rate limiting to stay within free tier limits"""
        current_time = time.time()
        
        # Reset counter every 60 seconds
        if current_time - self.last_request_time > 60:
            self.request_count = 0
            self.last_request_time = current_time
        
        # If we've hit the limit, wait
        if self.request_count >= self.requests_per_minute:
            wait_time = 60 - (current_time - self.last_request_time)
            if wait_time > 0:
                logger.info(f"Rate limit reached. Waiting {wait_time:.1f}s...")
                time.sleep(wait_time)
                self.request_count = 0
                self.last_request_time = time.time()
        
        self.request_count += 1
    
    def enhance_findings_batch(self, findings):
        """Enhance multiple findings in a single API call to save quota"""
        if not self.model or not findings:
            return findings
        
        try:
            self._rate_limit()
            
            # Prepare batch prompt with all findings
            findings_text = ""
            for idx, finding in enumerate(findings, 1):
                findings_text += f"""
Finding {idx}:
- Service: {finding['service']}
- Resource: {finding['resource']}
- Issue: {finding['issue']}
- Current Description: {finding.get('description', 'No description')}
- Severity: {finding['severity']}

"""
            
            prompt = f"""
You are a cybersecurity expert. Enhance these {len(findings)} AWS security findings with professional, concise content.

{findings_text}

For each finding, provide:
1. Enhanced description (2 sentences max)
2. Business impact (1 sentence)
3. Remediation steps (bullet points, 3-4 steps max)
4. Prevention tip (1 sentence)

Format your response as JSON array with this structure for each finding:
[
  {{
    "finding_number": 1,
    "enhanced_description": "...",
    "business_impact": "...",
    "remediation": "...",
    "prevention": "..."
  }}
]

Keep responses concise and professional.
"""
            
            logger.info(f"Enhancing {len(findings)} findings in batch...")
            response = self.model.generate_content(prompt)
            enhanced_text = response.text
            
            # Parse JSON response
            import json
            json_start = enhanced_text.find('[')
            json_end = enhanced_text.rfind(']') + 1
            
            if json_start != -1 and json_end > json_start:
                enhanced_data = json.loads(enhanced_text[json_start:json_end])
                
                # Apply enhancements to findings
                for idx, enhancement in enumerate(enhanced_data):
                    if idx < len(findings):
                        findings[idx]['enhanced_description'] = enhancement.get('enhanced_description', findings[idx].get('description'))
                        findings[idx]['business_impact'] = enhancement.get('business_impact', 'Security risk identified')
                        findings[idx]['detailed_remediation'] = enhancement.get('remediation', findings[idx].get('remediation'))
                        findings[idx]['prevention_tips'] = enhancement.get('prevention', 'Follow security best practices')
                        findings[idx]['ai_enhanced'] = True
                
                logger.info(f"Successfully enhanced {len(enhanced_data)} findings")
            else:
                logger.warning("Could not parse AI response as JSON")
                
        except Exception as e:
            logger.error(f"Error batch enhancing findings: {e}")
        
        return findings
        """Enhance a single finding with professional AI-generated content"""
        if not self.model:
            return finding
        
        try:
            prompt = f"""
You are a cybersecurity expert. Enhance this AWS security finding with professional, detailed explanations.

Current Finding:
- Service: {finding['service']}
- Resource: {finding['resource']}
- Issue: {finding['issue']}
- Description: {finding.get('description', 'No description')}
- Severity: {finding['severity']}
- Remediation: {finding.get('remediation', 'No remediation provided')}

Please provide:
1. A professional, detailed description of the security issue (2-3 sentences)
2. Potential business impact and risks
3. Detailed step-by-step remediation instructions
4. Best practices to prevent this issue in the future

Format your response as JSON with keys: enhanced_description, business_impact, detailed_remediation, prevention_tips
"""
            
            response = self.model.generate_content(prompt)
            enhanced_text = response.text
            
            # Try to parse the response as JSON
            import json
            try:
                # Extract JSON from response
                json_start = enhanced_text.find('{')
                json_end = enhanced_text.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    enhanced_data = json.loads(enhanced_text[json_start:json_end])
                    
                    finding['enhanced_description'] = enhanced_data.get('enhanced_description', finding.get('description'))
                    finding['business_impact'] = enhanced_data.get('business_impact', 'Could lead to security breaches and data exposure')
                    finding['detailed_remediation'] = enhanced_data.get('detailed_remediation', finding.get('remediation'))
                    finding['prevention_tips'] = enhanced_data.get('prevention_tips', 'Follow AWS security best practices')
                    finding['ai_enhanced'] = True
            except:
                # If JSON parsing fails, use the text as enhanced description
                finding['enhanced_description'] = enhanced_text
                finding['ai_enhanced'] = True
                
        except Exception as e:
            logger.error(f"Error enhancing finding with Gemini: {e}")
            finding['ai_enhanced'] = False
        
        return finding
    
    def enhance_scan_results(self, scan_results):
        """Enhance all findings in scan results using batch processing"""
        if not self.model:
            logger.info("Gemini not configured, returning original results")
            return scan_results
        
        logger.info("Enhancing scan results with Gemini AI...")
        
        findings = scan_results.get('findings', [])
        
        # Filter critical and high severity findings for AI enhancement
        priority_findings = [f for f in findings if f['severity'] in ['CRITICAL', 'HIGH']]
        
        if priority_findings:
            # Process in batches of 3 to stay within rate limits
            batch_size = 3
            enhanced_count = 0
            
            for i in range(0, len(priority_findings), batch_size):
                batch = priority_findings[i:i + batch_size]
                self.enhance_findings_batch(batch)
                enhanced_count += len(batch)
                
                # Add small delay between batches
                if i + batch_size < len(priority_findings):
                    time.sleep(2)
            
            logger.info(f"Enhanced {enhanced_count} priority findings with AI")
            scan_results['ai_enhanced_count'] = enhanced_count
        else:
            logger.info("No priority findings to enhance")
            scan_results['ai_enhanced_count'] = 0
        
        return scan_results
    
    def generate_executive_summary(self, scan_results):
        """Generate professional executive summary using Gemini"""
        if not self.model:
            return self._generate_basic_summary(scan_results)
        
        try:
            self._rate_limit()
            
            severity_breakdown = scan_results.get('severity_breakdown', {})
            total_issues = scan_results.get('total_issues', 0)
            service_breakdown = scan_results.get('service_breakdown', {})
            
            prompt = f"""
You are a cybersecurity consultant. Generate a concise executive summary (2-3 short paragraphs max).

Scan Overview:
- Total Issues: {total_issues}
- Critical: {severity_breakdown.get('critical', 0)}
- High: {severity_breakdown.get('high', 0)}
- Medium: {severity_breakdown.get('medium', 0)}
- Low: {severity_breakdown.get('low', 0)}

Services: {', '.join([f"{s}: {c}" for s, c in service_breakdown.items()])}

Summarize:
1. Overall security posture
2. Top concerns requiring immediate attention
3. Recommended priority actions

Keep it professional, concise, and business-focused.
"""
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"Error generating executive summary: {e}")
            return self._generate_basic_summary(scan_results)
    
    def _generate_basic_summary(self, scan_results):
        """Generate basic summary without AI"""
        severity_breakdown = scan_results.get('severity_breakdown', {})
        total_issues = scan_results.get('total_issues', 0)
        
        summary = f"""
Security Scan Summary

This report identifies {total_issues} security issues across your AWS infrastructure.

Critical Findings: {severity_breakdown.get('critical', 0)}
High Severity: {severity_breakdown.get('high', 0)}
Medium Severity: {severity_breakdown.get('medium', 0)}
Low Severity: {severity_breakdown.get('low', 0)}

Immediate action is required for all critical and high severity findings to maintain security posture.
"""
        return summary

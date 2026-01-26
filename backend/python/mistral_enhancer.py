"""
SentinelOps - Mistral LLM Enhancer
Uses local Mistral LLM for AI-powered security findings enhancement
Replaces Gemini API to avoid rate limits and keep data local
"""

import os
import logging
import requests
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class MistralEnhancer:
    def __init__(self, base_url=None):
        """Initialize Mistral AI enhancer"""
        self.base_url = base_url or os.getenv('MISTRAL_API_URL', 'http://localhost:11434/api/generate')
        enable_ai_env = os.getenv('ENABLE_AI_ENHANCEMENT', 'true')
        logger.info(f"ENABLE_AI_ENHANCEMENT env value: '{enable_ai_env}'")
        self.enabled = enable_ai_env.lower() == 'true'
        logger.info(f"AI Enhancement enabled: {self.enabled}")
        logger.info(f"Using Mistral LLM at: {self.base_url}")
        
        # Test connection to Mistral
        if self.enabled:
            self.test_connection()
    
    def test_connection(self):
        """Test if Mistral LLM is accessible"""
        try:
            response = requests.post(
                self.base_url,
                json={
                    'model': 'mistral',
                    'prompt': 'Test',
                    'stream': False,
                    'options': {
                        'num_predict': 10
                    }
                },
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                if 'response' in data:
                    logger.info("✓ Successfully connected to Mistral LLM")
                    logger.info(f"✓ Mistral test response: {data['response'][:50]}...")
                    return True
                else:
                    logger.warning(f"Unexpected Mistral response format: {data}")
                    return False
            else:
                logger.warning(f"Mistral LLM responded with status {response.status_code}")
                logger.warning(f"Response: {response.text}")
                return False
        except requests.exceptions.Timeout:
            logger.error("Mistral LLM connection timeout (>10s)")
            logger.warning("AI enhancement will be disabled. Ensure Ollama is running: ollama serve")
            self.enabled = False
            return False
        except requests.exceptions.ConnectionError:
            logger.error("Cannot connect to Mistral LLM - connection refused")
            logger.warning("AI enhancement will be disabled. Start Ollama with: ollama serve")
            self.enabled = False
            return False
        except Exception as e:
            logger.error(f"Failed to connect to Mistral LLM: {e}")
            logger.warning("AI enhancement will be disabled")
            self.enabled = False
            return False
    
    def _call_mistral(self, prompt, system_prompt=None):
        """Make API call to local Mistral LLM"""
        try:
            # Combine system prompt with user prompt if provided
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            
            payload = {
                'model': 'mistral',
                'prompt': full_prompt,
                'stream': False,
                'options': {
                    'temperature': 0.5,  # Lower = faster, more focused
                    'num_predict': 150,   # DRASTICALLY reduced for speed
                    'num_ctx': 512        # Smaller context window
                }
            }
            
            logger.debug(f"Calling Mistral with prompt length: {len(full_prompt)}")
            
            response = requests.post(
                self.base_url,
                json=payload,
                timeout=30  # Fast timeout for quick summaries only
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result.get('response', '')
                logger.debug(f"Mistral response length: {len(ai_response)}")
                return ai_response
            else:
                logger.error(f"Mistral API error: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return None
                
        except requests.exceptions.Timeout:
            logger.error("Mistral API timeout (>30s) - using basic summary")
            return None
        except requests.exceptions.ConnectionError:
            logger.error("Mistral connection error - is Ollama running?")
            return None
        except Exception as e:
            logger.error(f"Error calling Mistral LLM: {e}")
            return None
    
    def enhance_findings_batch(self, findings):
        """Enhance multiple findings in a single API call"""
        if not self.enabled or not findings:
            return findings
        
        try:
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
            
            system_prompt = "You are a cloud security expert. Provide concise security analysis in JSON format only."
            
            prompt = f"""
Enhance {len(findings)} security findings:

{findings_text}

For each, provide:
1. Enhanced description (1-2 sentences)
2. Business impact (1 sentence)
3. Remediation (3 bullet points)
4. Prevention (1 sentence)

JSON format:
[
  {{
    "finding_number": 1,
    "enhanced_description": "...",
    "business_impact": "...",
    "remediation": "...",
    "prevention": "..."
  }}
]

JSON only, no extra text.
"""
            
            logger.info(f"Enhancing {len(findings)} findings with Mistral LLM...")
            response_text = self._call_mistral(prompt, system_prompt)
            
            if not response_text:
                logger.warning("No response from Mistral LLM")
                return findings
            
            # Parse JSON response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start != -1 and json_end > json_start:
                enhanced_data = json.loads(response_text[json_start:json_end])
                
                # Apply enhancements to findings
                for idx, enhancement in enumerate(enhanced_data):
                    if idx < len(findings):
                        findings[idx]['enhanced_description'] = enhancement.get('enhanced_description', findings[idx].get('description'))
                        findings[idx]['business_impact'] = enhancement.get('business_impact', 'Security risk identified')
                        findings[idx]['detailed_remediation'] = enhancement.get('remediation', findings[idx].get('remediation'))
                        findings[idx]['prevention_tips'] = enhancement.get('prevention', 'Follow security best practices')
                        findings[idx]['ai_enhanced'] = True
                
                logger.info(f"✓ Successfully enhanced {len(enhanced_data)} findings")
            else:
                logger.warning("Could not parse Mistral response as JSON")
                
        except Exception as e:
            logger.error(f"Error batch enhancing findings: {e}")
        
        return findings
    
    def enhance_scan_results(self, scan_results):
        """SPEED OPTIMIZED: Skip individual finding enhancement to avoid timeouts"""
        if not self.enabled:
            logger.info("Mistral enhancer not enabled, returning original results")
            return scan_results
        
        logger.info("FAST MODE: Skipping individual finding enhancement for speed")
        
        # Skip batch enhancement entirely for speed
        # Only generate executive summary (much faster)
        scan_results['ai_enhanced_count'] = 0
        
        return scan_results
    
    def generate_executive_summary(self, scan_results):
        """ULTRA-FAST: Generate minimal executive summary"""
        if not self.enabled:
            return self._generate_basic_summary(scan_results)
        
        try:
            severity_breakdown = scan_results.get('severity_breakdown', {})
            total_issues = scan_results.get('total_issues', 0)
            cloud_provider = scan_results.get('cloudProvider', 'Cloud')
            critical = severity_breakdown.get('critical', 0)
            high = severity_breakdown.get('high', 0)
            
            # ULTRA-MINIMAL PROMPT for max speed
            prompt = f"{cloud_provider} scan: {total_issues} issues ({critical} critical, {high} high). Write 2 sentences: security status and top action. Be concise."
            
            logger.info("Fast executive summary generation...")
            response = self._call_mistral(prompt, "You are a cloud security expert. Be extremely concise.")
            
            if response and len(response) > 20:
                logger.info("✓ Generated fast summary")
                return response
            else:
                return self._generate_basic_summary(scan_results)
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return self._generate_basic_summary(scan_results)
    
    def _generate_basic_summary(self, scan_results):
        """Generate basic summary without AI"""
        severity_breakdown = scan_results.get('severity_breakdown', {})
        total_issues = scan_results.get('total_issues', 0)
        cloud_provider = scan_results.get('cloudProvider', 'Cloud')
        
        summary = f"""
{cloud_provider} Security Scan Summary

This report identifies {total_issues} security issues across your {cloud_provider} infrastructure.

Critical Findings: {severity_breakdown.get('critical', 0)}
High Severity: {severity_breakdown.get('high', 0)}
Medium Severity: {severity_breakdown.get('medium', 0)}
Low Severity: {severity_breakdown.get('low', 0)}

Immediate action is required for all critical and high severity findings to maintain security posture.
"""
        return summary

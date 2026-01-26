"""
SentinelOps - GCP Security Scanner
Scans GCP project for security vulnerabilities and misconfigurations
"""

from google.cloud import compute_v1
from google.cloud import storage
from google.cloud import container_v1
from google.oauth2 import service_account
from datetime import datetime
import logging
import os
import json
import tempfile

logger = logging.getLogger(__name__)

class GCPSecurityScanner:
    def __init__(self, project_id, service_account_json, region='us-central1'):
        """Initialize GCP Security Scanner with provided credentials"""
        self.project_id = project_id
        self.region = region
        self.findings = []
        
        # Create temporary file for service account JSON
        self.temp_creds_file = None
        try:
            # Parse JSON string to credentials
            if isinstance(service_account_json, str):
                creds_data = json.loads(service_account_json)
            else:
                creds_data = service_account_json
            
            # Create temp file
            self.temp_creds_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json')
            json.dump(creds_data, self.temp_creds_file)
            self.temp_creds_file.close()
            
            # Load credentials
            self.credentials = service_account.Credentials.from_service_account_file(
                self.temp_creds_file.name,
                scopes=['https://www.googleapis.com/auth/cloud-platform']
            )
            logger.info(f"GCP credentials loaded for project: {project_id}")
        except Exception as e:
            logger.error(f"Failed to load GCP credentials: {e}")
            raise

    def __del__(self):
        """Cleanup temporary credentials file"""
        if self.temp_creds_file and os.path.exists(self.temp_creds_file.name):
            try:
                os.unlink(self.temp_creds_file.name)
            except:
                pass

    def test_connection(self):
        """Test if GCP credentials are valid"""
        try:
            client = compute_v1.InstancesClient(credentials=self.credentials)
            # Try to list instances to verify credentials
            request = compute_v1.AggregatedListInstancesRequest(project=self.project_id)
            list(client.aggregated_list(request=request))
            return True
        except Exception as e:
            logger.error(f"GCP connection test failed: {e}")
            return False

    def scan_compute_instances(self):
        """Scan Compute Engine instances for security issues"""
        logger.info("Scanning GCP Compute Engine Instances...")
        try:
            client = compute_v1.InstancesClient(credentials=self.credentials)
            request = compute_v1.AggregatedListInstancesRequest(project=self.project_id)
            agg_list = client.aggregated_list(request=request)
            
            for zone, response in agg_list:
                if response.instances:
                    for instance in response.instances:
                        # Check for public IP
                        has_public_ip = any(
                            access_config.nat_i_p 
                            for iface in instance.network_interfaces 
                            for access_config in iface.access_configs
                        )
                        if has_public_ip:
                            self.findings.append({
                                'service': 'Compute Engine',
                                'resource': instance.name,
                                'issue': 'Instance Has Public IP Address',
                                'description': f'VM instance "{instance.name}" has a public IP address which may expose it to internet threats.',
                                'severity': 'MEDIUM',
                                'remediation': 'Use Cloud NAT or remove external IP if not required for internet access.'
                            })
                        
                        # Check for OS Login
                        metadata_items = instance.metadata.items if instance.metadata else []
                        os_login_enabled = any(
                            item.key == "enable-oslogin" and item.value == "TRUE"
                            for item in metadata_items
                        )
                        if not os_login_enabled:
                            self.findings.append({
                                'service': 'Compute Engine',
                                'resource': instance.name,
                                'issue': 'OS Login Not Enabled',
                                'description': f'VM instance "{instance.name}" does not have OS Login enabled for enhanced access control.',
                                'severity': 'MEDIUM',
                                'remediation': 'Enable OS Login in instance metadata for better SSH key management and access control.'
                            })
                        
                        # Check for serial port access
                        serial_port = any(
                            item.key == "serial-port-enable" and item.value == "1"
                            for item in metadata_items
                        )
                        if serial_port:
                            self.findings.append({
                                'service': 'Compute Engine',
                                'resource': instance.name,
                                'issue': 'Serial Port Access Enabled',
                                'description': f'VM instance "{instance.name}" has serial port access enabled which can be a security risk.',
                                'severity': 'CRITICAL',
                                'remediation': 'Disable serial port access unless absolutely necessary for debugging.'
                            })
        except Exception as e:
            logger.error(f"Error scanning Compute instances: {e}")

    def scan_storage_buckets(self):
        """Scan Cloud Storage buckets for security issues"""
        logger.info("Scanning GCP Cloud Storage Buckets...")
        try:
            client = storage.Client(project=self.project_id, credentials=self.credentials)
            buckets = client.list_buckets()
            
            for bucket in buckets:
                # Check for public access
                policy = bucket.get_iam_policy()
                for binding in policy.bindings:
                    if "allUsers" in binding["members"] or "allAuthenticatedUsers" in binding["members"]:
                        self.findings.append({
                            'service': 'Cloud Storage',
                            'resource': bucket.name,
                            'issue': 'Bucket is Publicly Accessible',
                            'description': f'Storage bucket "{bucket.name}" allows public access which may expose sensitive data.',
                            'severity': 'CRITICAL',
                            'remediation': 'Remove allUsers and allAuthenticatedUsers from the bucket IAM policy.'
                        })
                
                # Check for uniform bucket-level access
                if not bucket.iam_configuration.uniform_bucket_level_access_enabled:
                    self.findings.append({
                        'service': 'Cloud Storage',
                        'resource': bucket.name,
                        'issue': 'Uniform Bucket-Level Access Not Enabled',
                        'description': f'Bucket "{bucket.name}" uses ACLs instead of uniform bucket-level access.',
                        'severity': 'MEDIUM',
                        'remediation': 'Enable uniform bucket-level access for consistent permission management.'
                    })
                
                # Check for versioning
                if not bucket.versioning_enabled:
                    self.findings.append({
                        'service': 'Cloud Storage',
                        'resource': bucket.name,
                        'issue': 'Versioning Not Enabled',
                        'description': f'Bucket "{bucket.name}" does not have versioning enabled.',
                        'severity': 'LOW',
                        'remediation': 'Enable versioning to protect against accidental deletion or overwrites.'
                    })
        except Exception as e:
            logger.error(f"Error scanning Storage buckets: {e}")

    def scan_gke_clusters(self):
        """Scan GKE clusters for security issues"""
        logger.info("Scanning GKE Clusters...")
        try:
            client = container_v1.ClusterManagerClient(credentials=self.credentials)
            parent = f"projects/{self.project_id}/locations/-"
            response = client.list_clusters(parent=parent)
            
            for cluster in response.clusters:
                # Check for legacy authorization
                if cluster.legacy_abac.enabled:
                    self.findings.append({
                        'service': 'GKE',
                        'resource': cluster.name,
                        'issue': 'Legacy ABAC Enabled',
                        'description': f'GKE cluster "{cluster.name}" has legacy ABAC enabled instead of RBAC.',
                        'severity': 'CRITICAL',
                        'remediation': 'Disable legacy ABAC and use RBAC for better security and control.'
                    })
                
                # Check for network policy
                if not cluster.network_policy or not cluster.network_policy.enabled:
                    self.findings.append({
                        'service': 'GKE',
                        'resource': cluster.name,
                        'issue': 'Network Policy Not Enabled',
                        'description': f'GKE cluster "{cluster.name}" does not have network policy enabled.',
                        'severity': 'HIGH',
                        'remediation': 'Enable network policy addon for pod-to-pod traffic control.'
                    })
                
                # Check for private cluster
                if not cluster.private_cluster_config or not cluster.private_cluster_config.enable_private_nodes:
                    self.findings.append({
                        'service': 'GKE',
                        'resource': cluster.name,
                        'issue': 'Not Configured as Private Cluster',
                        'description': f'GKE cluster "{cluster.name}" nodes are not private.',
                        'severity': 'CRITICAL',
                        'remediation': 'Enable private nodes to isolate cluster from public internet.'
                    })
                
                # Check for workload identity
                if not cluster.workload_identity_config or not cluster.workload_identity_config.workload_pool:
                    self.findings.append({
                        'service': 'GKE',
                        'resource': cluster.name,
                        'issue': 'Workload Identity Not Enabled',
                        'description': f'GKE cluster "{cluster.name}" does not use Workload Identity.',
                        'severity': 'HIGH',
                        'remediation': 'Enable Workload Identity for secure pod authentication to GCP services.'
                    })
        except Exception as e:
            logger.error(f"Error scanning GKE clusters: {e}")

    def scan_firewall_rules(self):
        """Scan VPC firewall rules for security issues"""
        logger.info("Scanning Firewall Rules...")
        try:
            client = compute_v1.FirewallsClient(credentials=self.credentials)
            request = compute_v1.ListFirewallsRequest(project=self.project_id)
            firewalls = client.list(request=request)
            
            for firewall in firewalls:
                # Check for overly permissive rules
                if firewall.source_ranges and "0.0.0.0/0" in firewall.source_ranges:
                    for allowed in firewall.allowed:
                        dangerous_ports = ['22', '3389', '1433', '3306', '5432']
                        if allowed.ports:
                            for port in allowed.ports:
                                if any(dp in str(port) for dp in dangerous_ports):
                                    self.findings.append({
                                        'service': 'VPC Firewall',
                                        'resource': firewall.name,
                                        'issue': f'Port {port} Open to Internet',
                                        'description': f'Firewall rule "{firewall.name}" allows {allowed.i_p_protocol} port {port} from anywhere (0.0.0.0/0).',
                                        'severity': 'CRITICAL',
                                        'remediation': 'Restrict source IP ranges to specific trusted networks only.'
                                    })
        except Exception as e:
            logger.error(f"Error scanning Firewall rules: {e}")

    def run_scan(self):
        """Run complete security scan"""
        logger.info("Starting GCP Security Scan")
        
        self.scan_compute_instances()
        self.scan_storage_buckets()
        self.scan_gke_clusters()
        self.scan_firewall_rules()
        
        # Calculate summary statistics
        severity_breakdown = {
            'critical': sum(1 for f in self.findings if f['severity'] == 'CRITICAL'),
            'high': sum(1 for f in self.findings if f['severity'] == 'HIGH'),
            'medium': sum(1 for f in self.findings if f['severity'] == 'MEDIUM'),
            'low': sum(1 for f in self.findings if f['severity'] == 'LOW')
        }
        
        service_breakdown = {}
        for finding in self.findings:
            service = finding['service']
            service_breakdown[service] = service_breakdown.get(service, 0) + 1
        
        logger.info(f"Scan completed. Found {len(self.findings)} issues")
        
        return {
            'findings': self.findings,
            'total_issues': len(self.findings),
            'severity_breakdown': severity_breakdown,
            'service_breakdown': service_breakdown,
            'scan_timestamp': datetime.now().isoformat(),
            'project_id': self.project_id,
            'region': self.region
        }

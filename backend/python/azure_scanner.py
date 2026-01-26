"""
SentinelOps - Azure Security Scanner
Scans Azure subscription for security vulnerabilities and misconfigurations
"""

from azure.identity import ClientSecretCredential
from azure.mgmt.storage import StorageManagementClient
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.network import NetworkManagementClient
from azure.mgmt.authorization import AuthorizationManagementClient
from azure.mgmt.resource import ResourceManagementClient
from azure.mgmt.resource import ManagementLockClient
from azure.storage.blob import BlobServiceClient
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AzureSecurityScanner:
    def __init__(self, subscription_id, client_id, tenant_id, client_secret):
        """Initialize Azure Security Scanner with provided credentials"""
        self.subscription_id = subscription_id
        
        # Create credential
        self.credential = ClientSecretCredential(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret
        )
        
        # Initialize Azure clients
        self.storage_client = StorageManagementClient(self.credential, subscription_id)
        self.compute_client = ComputeManagementClient(self.credential, subscription_id)
        self.network_client = NetworkManagementClient(self.credential, subscription_id)
        self.auth_client = AuthorizationManagementClient(self.credential, subscription_id)
        self.resource_client = ResourceManagementClient(self.credential, subscription_id)
        self.lock_client = ManagementLockClient(self.credential, subscription_id)
        
        self.findings = []

    def test_connection(self):
        """Test if Azure credentials are valid"""
        try:
            # Try to list resource groups as a simple auth test
            list(self.resource_client.resource_groups.list())
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False

    def add_finding(self, service, resource, issue, description, severity, remediation=''):
        """Add a finding to the results"""
        finding = {
            'service': service,
            'resource': resource,
            'issue': issue,
            'description': description,
            'severity': severity,
            'remediation': remediation,
            'timestamp': datetime.now().isoformat()
        }
        self.findings.append(finding)

    def scan_storage_accounts(self):
        """Scan all storage accounts for security issues"""
        logger.info("Scanning Storage Accounts...")
        
        try:
            storage_accounts = list(self.storage_client.storage_accounts.list())
            logger.info(f"Found {len(storage_accounts)} storage account(s)")
            
            for account in storage_accounts:
                account_name = account.name
                resource_group = account.id.split('/')[4]
                
                # Check 1: Public blob access enabled
                if hasattr(account, 'allow_blob_public_access') and account.allow_blob_public_access:
                    self.add_finding(
                        'Azure Storage',
                        account_name,
                        'Public Blob Access Enabled',
                        f'Storage account "{account_name}" allows public blob access, potentially exposing sensitive data to unauthorized users.',
                        'CRITICAL',
                        'Disable public blob access: Go to Storage Account → Configuration → Allow Blob public access → Disabled'
                    )
                
                # Check 2: Blob encryption
                if hasattr(account, 'encryption'):
                    if not account.encryption.services.blob.enabled:
                        self.add_finding(
                            'Azure Storage',
                            account_name,
                            'Blob Encryption Disabled',
                            f'Blob encryption is disabled for storage account "{account_name}". Data at rest is not encrypted.',
                            'HIGH',
                            'Enable blob encryption: Go to Storage Account → Encryption → Enable blob encryption'
                        )
                
                # Check 3: HTTPS only
                if not account.enable_https_traffic_only:
                    self.add_finding(
                        'Azure Storage',
                        account_name,
                        'HTTP Traffic Allowed',
                        f'Storage account "{account_name}" allows HTTP traffic. Data in transit is not encrypted.',
                        'MEDIUM',
                        'Require HTTPS only: Go to Storage Account → Configuration → Secure transfer required → Enabled'
                    )
                
                # Check 4: Minimum TLS version
                if hasattr(account, 'minimum_tls_version'):
                    if account.minimum_tls_version != 'TLS1_2':
                        self.add_finding(
                            'Azure Storage',
                            account_name,
                            'Weak TLS Version',
                            f'Storage account "{account_name}" uses weak TLS version: {account.minimum_tls_version}',
                            'MEDIUM',
                            'Update TLS version: Go to Storage Account → Configuration → Minimum TLS version → TLS 1.2'
                        )
                
                # Check 5: Public containers
                try:
                    containers = self.storage_client.blob_containers.list(resource_group, account_name)
                    for container in containers:
                        if container.public_access and container.public_access != 'None':
                            self.add_finding(
                                'Azure Storage',
                                f'{account_name}/{container.name}',
                                'Public Blob Container',
                                f'Container "{container.name}" has {container.public_access} access level, allowing public access to blobs.',
                                'CRITICAL',
                                f'Set container access to private: Go to Storage Account → Containers → {container.name} → Change access level → Private'
                            )
                except Exception as e:
                    logger.warning(f"Could not scan containers for {account_name}: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Error scanning storage accounts: {str(e)}")

    def scan_virtual_machines(self):
        """Scan all virtual machines for security issues"""
        logger.info("Scanning Virtual Machines...")
        
        try:
            vms = list(self.compute_client.virtual_machines.list_all())
            logger.info(f"Found {len(vms)} virtual machine(s)")
            
            for vm in vms:
                vm_name = vm.name
                resource_group = vm.id.split('/')[4]
                
                # Check for unencrypted disks
                if vm.storage_profile and vm.storage_profile.os_disk:
                    os_disk = vm.storage_profile.os_disk
                    if not (hasattr(os_disk, 'encryption_settings') and os_disk.encryption_settings):
                        self.add_finding(
                            'Azure Compute',
                            vm_name,
                            'Unencrypted VM Disk',
                            f'VM "{vm_name}" OS disk is not encrypted. Sensitive data on disk is vulnerable if physical media is compromised.',
                            'HIGH',
                            'Enable Azure Disk Encryption: Use Azure Disk Encryption or enable encryption at host'
                        )
                
        except Exception as e:
            logger.error(f"Error scanning VMs: {str(e)}")

    def scan_network_security_groups(self):
        """Scan Network Security Groups for dangerous rules"""
        logger.info("Scanning Network Security Groups...")
        
        try:
            nsgs = list(self.network_client.network_security_groups.list_all())
            logger.info(f"Found {len(nsgs)} Network Security Group(s)")
            
            for nsg in nsgs:
                nsg_name = nsg.name
                resource_group = nsg.id.split('/')[4]
                
                # Check security rules
                if nsg.security_rules:
                    for rule in nsg.security_rules:
                        # Check for rules allowing traffic from anywhere
                        if rule.direction == 'Inbound' and rule.access == 'Allow':
                            dangerous_sources = ['*', '0.0.0.0/0', 'Internet', 'any']
                            
                            if rule.source_address_prefix in dangerous_sources or \
                               (hasattr(rule, 'source_address_prefixes') and 
                                any(src in dangerous_sources for src in (rule.source_address_prefixes or []))):
                                
                                # Determine severity based on port
                                port_info = rule.destination_port_range or 'Multiple'
                                
                                dangerous_ports = {
                                    '22': ('SSH', 'CRITICAL'),
                                    '3389': ('RDP', 'CRITICAL'),
                                    '23': ('Telnet', 'CRITICAL'),
                                    '21': ('FTP', 'HIGH'),
                                    '3306': ('MySQL', 'HIGH'),
                                    '5432': ('PostgreSQL', 'HIGH'),
                                    '1433': ('SQL Server', 'HIGH'),
                                    '27017': ('MongoDB', 'HIGH'),
                                    '6379': ('Redis', 'HIGH'),
                                    '80': ('HTTP', 'MEDIUM'),
                                    '443': ('HTTPS', 'LOW'),
                                    '*': ('All Ports', 'CRITICAL')
                                }
                                
                                port_desc = 'Unknown'
                                severity = 'CRITICAL'
                                for port, (desc, sev) in dangerous_ports.items():
                                    if str(port_info) == port:
                                        port_desc = desc
                                        severity = sev
                                        break
                                
                                self.add_finding(
                                    'Azure Network',
                                    f'{nsg_name}/{rule.name}',
                                    f'Port {port_info} Open to Internet',
                                    f'NSG rule "{rule.name}" allows {port_desc} (port {port_info}) access from the internet (0.0.0.0/0). This creates a potential entry point for attackers.',
                                    severity,
                                    f'Restrict source IP: Go to NSG → {rule.name} → Change Source to specific IP addresses or Service Tag'
                                )
                
        except Exception as e:
            logger.error(f"Error scanning NSGs: {str(e)}")

    def scan_iam_roles(self):
        """Scan for overly permissive IAM role assignments"""
        logger.info("Scanning IAM Role Assignments...")
        
        try:
            # Get all role assignments at subscription scope
            scope = f'/subscriptions/{self.subscription_id}'
            role_assignments = list(self.auth_client.role_assignments.list_for_scope(scope))
            logger.info(f"Found {len(role_assignments)} role assignment(s)")
            
            # Dangerous roles to flag
            dangerous_roles = {
                'Owner': 'CRITICAL',
                'Contributor': 'HIGH',
                'User Access Administrator': 'CRITICAL'
            }
            
            # Get role definitions
            role_definitions = {rd.id: rd for rd in self.auth_client.role_definitions.list(scope)}
            
            for assignment in role_assignments:
                role_def = role_definitions.get(assignment.role_definition_id)
                if role_def:
                    role_name = role_def.role_name
                    
                    # Check if it's a dangerous role
                    for dangerous_role, severity in dangerous_roles.items():
                        if dangerous_role.lower() in role_name.lower():
                            # Determine scope level
                            scope_level = 'Unknown'
                            if '/subscriptions/' in assignment.scope and assignment.scope.count('/') == 2:
                                scope_level = 'Subscription'
                            elif '/resourceGroups/' in assignment.scope:
                                scope_level = 'Resource Group'
                            else:
                                scope_level = 'Resource'
                            
                            self.add_finding(
                                'Azure IAM',
                                role_name,
                                'Overly Permissive Role Assignment',
                                f'Privileged role "{role_name}" is assigned at {scope_level} scope. This grants excessive permissions that violate principle of least privilege.',
                                severity,
                                f'Review and reduce scope or use more restrictive role. Apply principle of least privilege.'
                            )
            
        except Exception as e:
            logger.error(f"Error scanning IAM roles: {str(e)}")

    def scan_resource_groups(self):
        """Scan resource groups for security issues"""
        logger.info("Scanning Resource Groups...")
        
        try:
            resource_groups = list(self.resource_client.resource_groups.list())
            logger.info(f"Found {len(resource_groups)} resource group(s)")
            
            for rg in resource_groups:
                # Check for resource locks
                try:
                    locks = list(self.lock_client.management_locks.list_at_resource_group_level(rg.name))
                    if len(locks) == 0:
                        self.add_finding(
                            'Azure Resource Management',
                            rg.name,
                            'No Resource Lock',
                            f'Resource group "{rg.name}" has no locks to prevent accidental deletion or modification.',
                            'LOW',
                            'Add resource lock: Go to Resource Group → Locks → Add lock → CanNotDelete or ReadOnly'
                        )
                except Exception as lock_error:
                    logger.warning(f"Could not check locks for resource group {rg.name}: {str(lock_error)}")
                    
        except Exception as e:
            logger.error(f"Error scanning resource groups: {str(e)}")

    def run_scan(self):
        """Run all security scans and return results"""
        logger.info(f"Starting Azure security scan for subscription: {self.subscription_id}")
        
        # Test connection first
        if not self.test_connection():
            raise Exception("Failed to connect to Azure. Please check credentials.")
        
        # Run all scans
        self.scan_storage_accounts()
        self.scan_virtual_machines()
        self.scan_network_security_groups()
        self.scan_iam_roles()
        self.scan_resource_groups()
        
        # Calculate statistics
        total_issues = len(self.findings)
        critical_count = len([f for f in self.findings if f['severity'] == 'CRITICAL'])
        high_count = len([f for f in self.findings if f['severity'] == 'HIGH'])
        medium_count = len([f for f in self.findings if f['severity'] == 'MEDIUM'])
        low_count = len([f for f in self.findings if f['severity'] == 'LOW'])
        
        # Calculate risk score (0-100)
        risk_score = min(100, (critical_count * 20 + high_count * 10 + medium_count * 5 + low_count * 2))
        
        # Calculate compliance score (inverse of risk)
        compliance_score = max(0, 100 - risk_score)
        
        # Count total Azure assets scanned
        total_assets = len(self.findings)  # Simplified - in real scenario, count actual resources
        
        logger.info(f"Scan completed. Found {total_issues} issues")
        
        return {
            'findings': self.findings,
            'total_issues': total_issues,
            'criticalCount': critical_count,
            'highCount': high_count,
            'mediumCount': medium_count,
            'lowCount': low_count,
            'riskScore': risk_score,
            'complianceScore': compliance_score,
            'totalAssets': total_assets,
            'cloudProvider': 'Azure',
            'subscriptionId': self.subscription_id,
            'timestamp': datetime.now().isoformat()
        }

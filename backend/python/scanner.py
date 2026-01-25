import boto3
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AWSSecurityScanner:
    def __init__(self, aws_access_key_id, aws_secret_access_key, region='us-east-1'):
        """Initialize AWS Security Scanner with provided credentials"""
        self.session = boto3.Session(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region
        )
        self.findings = []
        self.region = region
    
    def test_connection(self):
        """Test if AWS credentials are valid"""
        try:
            sts = self.session.client('sts')
            sts.get_caller_identity()
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False
    
    def scan_s3_buckets(self):
        """Scan S3 buckets for public access and encryption issues"""
        logger.info("Scanning S3 Buckets...")
        s3 = self.session.client('s3')
        
        try:
            buckets = s3.list_buckets()['Buckets']
            
            for bucket in buckets:
                bucket_name = bucket['Name']
                
                # Check public access block
                try:
                    public_block = s3.get_public_access_block(Bucket=bucket_name)
                    config = public_block['PublicAccessBlockConfiguration']
                    
                    if not all(config.values()):
                        self.findings.append({
                            'service': 'S3',
                            'resource': bucket_name,
                            'issue': 'Public Access Not Fully Blocked',
                            'description': f'S3 bucket "{bucket_name}" does not have all public access block settings enabled. This could allow unintended public access to your data.',
                            'severity': 'CRITICAL',
                            'remediation': 'Enable all public access block settings: Block Public ACLs, Ignore Public ACLs, Block Public Policy, and Restrict Public Buckets',
                            'timestamp': datetime.now().isoformat()
                        })
                except:
                    self.findings.append({
                        'service': 'S3',
                        'resource': bucket_name,
                        'issue': 'No Public Access Block Configuration',
                        'description': f'S3 bucket "{bucket_name}" has no public access block configuration. Without this protection, the bucket could be accidentally exposed to the internet.',
                        'severity': 'CRITICAL',
                        'remediation': 'Configure public access block settings for this bucket to prevent accidental public exposure. Go to S3 console → Select bucket → Permissions → Block public access',
                        'timestamp': datetime.now().isoformat()
                    })
                
                # Check encryption
                try:
                    s3.get_bucket_encryption(Bucket=bucket_name)
                except:
                    self.findings.append({
                        'service': 'S3',
                        'resource': bucket_name,
                        'issue': 'Bucket Encryption Not Enabled',
                        'description': f'S3 bucket "{bucket_name}" does not have default encryption enabled. Data at rest is not encrypted, which may violate compliance requirements.',
                        'severity': 'HIGH',
                        'remediation': 'Enable default encryption (AES-256 or AWS KMS). Go to S3 console → Select bucket → Properties → Default encryption → Enable',
                        'timestamp': datetime.now().isoformat()
                    })
                
                # Check versioning
                try:
                    versioning = s3.get_bucket_versioning(Bucket=bucket_name)
                    if versioning.get('Status') != 'Enabled':
                        self.findings.append({
                            'service': 'S3',
                            'resource': bucket_name,
                            'issue': 'Versioning Not Enabled',
                            'description': f'S3 bucket "{bucket_name}" does not have versioning enabled. Without versioning, deleted or overwritten objects cannot be recovered.',
                            'severity': 'MEDIUM',
                            'remediation': 'Enable bucket versioning for data recovery and protection against accidental deletion. Go to S3 console → Select bucket → Properties → Versioning → Enable',
                            'timestamp': datetime.now().isoformat()
                        })
                except Exception as e:
                    pass
                    
        except Exception as e:
            logger.error(f"Error scanning S3: {e}")
            raise
    
    def scan_ec2_security_groups(self):
        """Scan EC2 security groups for overly permissive rules"""
        logger.info("Scanning EC2 Security Groups...")
        ec2 = self.session.client('ec2')
        
        try:
            security_groups = ec2.describe_security_groups()['SecurityGroups']
            
            for sg in security_groups:
                sg_id = sg['GroupId']
                sg_name = sg['GroupName']
                
                for rule in sg.get('IpPermissions', []):
                    # Check for 0.0.0.0/0 (open to world)
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            from_port = rule.get('FromPort', 'N/A')
                            to_port = rule.get('ToPort', 'N/A')
                            
                            # Critical: SSH, RDP, Databases
                            if from_port in [22, 3389, 3306, 5432, 1433, 27017]:
                                port_names = {22: 'SSH', 3389: 'RDP', 3306: 'MySQL', 5432: 'PostgreSQL', 1433: 'SQL Server', 27017: 'MongoDB'}
                                self.findings.append({
                                    'service': 'EC2',
                                    'resource': f'{sg_name} ({sg_id})',
                                    'issue': f'Critical Port {from_port} ({port_names.get(from_port, "Unknown")}) Open to Internet',
                                    'description': f'Security group "{sg_name}" ({sg_id}) allows {port_names.get(from_port, "unknown")} access (port {from_port}) from any IP address (0.0.0.0/0). This exposes your servers to brute force attacks and unauthorized access.',
                                    'severity': 'CRITICAL',
                                    'remediation': f'Restrict port {from_port} access to specific IP ranges only. Use VPN or bastion hosts for administrative access. Never expose {port_names.get(from_port, "sensitive")} ports to the entire internet.',
                                    'timestamp': datetime.now().isoformat()
                                })
                            else:
                                self.findings.append({
                                    'service': 'EC2',
                                    'resource': f'{sg_name} ({sg_id})',
                                    'issue': f'Port {from_port} Open to Internet',
                                    'description': f'Security group "{sg_name}" ({sg_id}) allows traffic on port {from_port} from any IP address (0.0.0.0/0). This creates an unnecessarily broad attack surface.',
                                    'severity': 'HIGH',
                                    'remediation': f'Restrict port {from_port} to specific IP ranges that require access. Follow the principle of least privilege and only allow necessary sources.',
                                    'timestamp': datetime.now().isoformat()
                                })
        except Exception as e:
            logger.error(f"Error scanning EC2: {e}")
            raise
    
    def scan_iam_users(self):
        """Scan IAM users for security issues"""
        logger.info("Scanning IAM Users...")
        iam = self.session.client('iam')
        
        try:
            users = iam.list_users()['Users']
            
            for user in users:
                username = user['UserName']
                
                # Check MFA
                try:
                    mfa_devices = iam.list_mfa_devices(UserName=username)
                    if not mfa_devices['MFADevices']:
                        self.findings.append({
                            'service': 'IAM',
                            'resource': username,
                            'issue': 'MFA Not Enabled',
                            'description': f'IAM user "{username}" does not have Multi-Factor Authentication (MFA) enabled. Without MFA, the account is vulnerable to credential theft and unauthorized access.',
                            'severity': 'HIGH',
                            'remediation': 'Enable MFA for this user account. Use virtual MFA (Google Authenticator, Authy) or hardware MFA device. This adds an essential second layer of security.',
                            'timestamp': datetime.now().isoformat()
                        })
                except:
                    pass
                
                # Check for admin access
                try:
                    policies = iam.list_attached_user_policies(UserName=username)
                    for policy in policies['AttachedPolicies']:
                        if 'Admin' in policy['PolicyName']:
                            self.findings.append({
                                'service': 'IAM',
                                'resource': username,
                                'issue': f'User Has Administrator Access',
                                'description': f'IAM user "{username}" has administrator policy "{policy["PolicyName"]}" attached. This grants full access to all AWS services and resources, which violates the principle of least privilege.',
                                'severity': 'CRITICAL',
                                'remediation': 'Remove administrator access and grant only the specific permissions needed for the user\'s role. Create custom policies with minimal required permissions. Use IAM roles for EC2 instances instead of embedding credentials.',
                                'timestamp': datetime.now().isoformat()
                            })
                except:
                    pass
                
                # Check access key age
                try:
                    access_keys = iam.list_access_keys(UserName=username)
                    for key in access_keys['AccessKeyMetadata']:
                        key_age = (datetime.now(key['CreateDate'].tzinfo) - key['CreateDate']).days
                        if key_age > 90:
                            self.findings.append({
                                'service': 'IAM',
                                'resource': username,
                                'issue': f'Access Key Older Than 90 Days',
                                'description': f'IAM user "{username}" has an access key that is {key_age} days old. Old credentials increase the risk of compromise and make credential leaks more dangerous.',
                                'severity': 'MEDIUM',
                                'remediation': f'Rotate access keys regularly (every 90 days maximum). Deactivate old key, create new key, update applications, then delete old key. Consider using IAM roles instead of long-term credentials.',
                                'timestamp': datetime.now().isoformat()
                            })
                except:
                    pass
                    
        except Exception as e:
            logger.error(f"Error scanning IAM: {e}")
            raise
    
    def scan_rds_instances(self):
        """Scan RDS instances for security issues"""
        logger.info("Scanning RDS Instances...")
        rds = self.session.client('rds')
        
        try:
            instances = rds.describe_db_instances()['DBInstances']
            
            for instance in instances:
                db_id = instance['DBInstanceIdentifier']
                
                # Check public accessibility
                if instance.get('PubliclyAccessible'):
                    self.findings.append({
                        'service': 'RDS',
                        'resource': db_id,
                        'issue': 'Database is Publicly Accessible',
                        'description': f'RDS instance "{db_id}" is configured to be publicly accessible from the internet. This exposes your database to potential attacks and unauthorized access attempts.',
                        'severity': 'CRITICAL',
                        'remediation': 'Disable public accessibility and place database in a private subnet. Use VPC peering, VPN, or AWS PrivateLink for secure access. Databases should never be directly exposed to the internet.',
                        'timestamp': datetime.now().isoformat()
                    })
                
                # Check encryption
                if not instance.get('StorageEncrypted'):
                    self.findings.append({
                        'service': 'RDS',
                        'resource': db_id,
                        'issue': 'Storage Encryption Not Enabled',
                        'description': f'RDS instance "{db_id}" does not have encryption at rest enabled. Database data is stored unencrypted on disk, which may violate compliance requirements (HIPAA, PCI-DSS, etc.).',
                        'severity': 'HIGH',
                        'remediation': 'Enable encryption at rest for the database. Note: You cannot enable encryption on an existing unencrypted database. You must create a snapshot, copy it with encryption, and restore from the encrypted snapshot.',
                        'timestamp': datetime.now().isoformat()
                    })
                
                # Check backup retention
                if instance.get('BackupRetentionPeriod', 0) < 7:
                    self.findings.append({
                        'service': 'RDS',
                        'resource': db_id,
                        'issue': 'Insufficient Backup Retention',
                        'description': f'RDS instance "{db_id}" has backup retention set to {instance.get("BackupRetentionPeriod", 0)} days (less than 7 days). This provides insufficient protection against data loss and may not meet recovery objectives.',
                        'severity': 'MEDIUM',
                        'remediation': 'Set backup retention period to at least 7 days (recommended: 7-35 days depending on compliance requirements). Enable automated backups and test restore procedures regularly.',
                        'timestamp': datetime.now().isoformat()
                    })
                    
        except Exception as e:
            logger.error(f"Error scanning RDS: {e}")
            raise
    
    def run_scan(self):
        """Run all scans and return results"""
        logger.info("Starting AWS Security Scan")
        
        # Reset findings
        self.findings = []
        
        # Run all scans
        try:
            self.scan_s3_buckets()
        except Exception as e:
            logger.error(f"S3 scan failed: {e}")
        
        try:
            self.scan_ec2_security_groups()
        except Exception as e:
            logger.error(f"EC2 scan failed: {e}")
        
        try:
            self.scan_iam_users()
        except Exception as e:
            logger.error(f"IAM scan failed: {e}")
        
        try:
            self.scan_rds_instances()
        except Exception as e:
            logger.error(f"RDS scan failed: {e}")
        
        # Generate summary
        results = self._generate_summary()
        
        logger.info(f"Scan completed. Found {results['total_issues']} issues")
        
        return results
    
    def _generate_summary(self):
        """Generate summary of findings"""
        # Count by severity
        critical = [f for f in self.findings if f['severity'] == 'CRITICAL']
        high = [f for f in self.findings if f['severity'] == 'HIGH']
        medium = [f for f in self.findings if f['severity'] == 'MEDIUM']
        low = [f for f in self.findings if f['severity'] == 'LOW']
        
        # Count by service
        service_counts = {}
        for finding in self.findings:
            service = finding['service']
            service_counts[service] = service_counts.get(service, 0) + 1
        
        return {
            'timestamp': datetime.now().isoformat(),
            'region': self.region,
            'total_issues': len(self.findings),
            'severity_breakdown': {
                'critical': len(critical),
                'high': len(high),
                'medium': len(medium),
                'low': len(low)
            },
            'service_breakdown': service_counts,
            'findings': self.findings,
            'summary': {
                'critical_findings': critical,
                'high_findings': high,
                'medium_findings': medium,
                'low_findings': low
            }
        }

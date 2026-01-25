from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image, KeepTogether
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime
import os
import logging

logger = logging.getLogger(__name__)

class PDFReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='MainTitle',
            parent=self.styles['Heading1'],
            fontSize=32,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            leading=38
        ))
        
        self.styles.add(ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Normal'],
            fontSize=16,
            textColor=colors.HexColor('#6b7280'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica',
            leading=20
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold',
            alignment=TA_LEFT
        ))
        
        self.styles.add(ParagraphStyle(
            name='FindingTitle',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#dc2626'),
            spaceAfter=6,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='FieldLabel',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#374151'),
            fontName='Helvetica-Bold',
            leftIndent=15,
            spaceAfter=4
        ))
        
        self.styles.add(ParagraphStyle(
            name='FieldValue',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#1f2937'),
            fontName='Helvetica',
            leftIndent=30,
            rightIndent=15,
            spaceAfter=8,
            alignment=TA_JUSTIFY
        ))
    
    def generate_report(self, scan_results, output_path='security_report.pdf'):
        """Generate comprehensive PDF security report"""
        try:
            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                rightMargin=60,
                leftMargin=60,
                topMargin=60,
                bottomMargin=60,
            )
            
            story = []
            
            # Title Page with Header
            story.append(Spacer(1, 1.5*inch))
            
            # Main Header
            story.append(Paragraph("SentinelOps", self.styles['MainTitle']))
            story.append(Paragraph("Cloud Security Intelligence", self.styles['Subtitle']))
            
            story.append(Spacer(1, 0.5*inch))
            
            # Report Title
            story.append(Paragraph("AWS Security Scan Report", self.styles['CustomTitle']))
            story.append(Spacer(1, 0.3*inch))
            story.append(Paragraph(
                f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
                ParagraphStyle(
                    name='DateStyle',
                    parent=self.styles['Normal'],
                    alignment=TA_CENTER,
                    fontSize=11,
                    textColor=colors.HexColor('#6b7280')
                )
            ))
            story.append(Spacer(1, 0.5*inch))
            
            # Executive Summary
            if scan_results.get('executive_summary'):
                story.append(Paragraph("Executive Summary", self.styles['SectionHeading']))
                story.append(Spacer(1, 0.15*inch))
                for para in scan_results['executive_summary'].split('\n\n'):
                    if para.strip():
                        story.append(Paragraph(para, ParagraphStyle(
                            name='SummaryText',
                            parent=self.styles['Normal'],
                            fontSize=11,
                            alignment=TA_JUSTIFY,
                            leftIndent=20,
                            rightIndent=20,
                            spaceAfter=10
                        )))
            
            story.append(PageBreak())
            
            # Overview Statistics
            story.append(Paragraph("Scan Overview", self.styles['SectionHeading']))
            story.append(Spacer(1, 0.2*inch))
            
            overview_data = [
                ['Metric', 'Value'],
                ['Total Issues Found', str(scan_results.get('total_issues', 0))],
                ['Critical Severity', str(scan_results.get('severity_breakdown', {}).get('critical', 0))],
                ['High Severity', str(scan_results.get('severity_breakdown', {}).get('high', 0))],
                ['Medium Severity', str(scan_results.get('severity_breakdown', {}).get('medium', 0))],
                ['Low Severity', str(scan_results.get('severity_breakdown', {}).get('low', 0))],
                ['Scan Region', scan_results.get('region', 'N/A')],
                ['Scan Timestamp', scan_results.get('timestamp', 'N/A')]
            ]
            
            overview_table = Table(overview_data, colWidths=[3.25*inch, 3.25*inch])
            overview_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 0), (-1, 0), 12),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9fafb')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            story.append(overview_table)
            story.append(Spacer(1, 0.4*inch))
            
            # Service Breakdown
            if scan_results.get('service_breakdown'):
                story.append(Paragraph("Findings by Service", self.styles['SectionHeading']))
                story.append(Spacer(1, 0.2*inch))
                
                service_data = [['Service', 'Issues Found']]
                for service, count in scan_results['service_breakdown'].items():
                    service_data.append([service.upper(), str(count)])
                
                service_table = Table(service_data, colWidths=[3.25*inch, 3.25*inch])
                service_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('TOPPADDING', (0, 0), (-1, 0), 12),
                    ('LEFTPADDING', (0, 0), (-1, -1), 15),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9fafb')),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                
                story.append(service_table)
            
            story.append(PageBreak())
            
            # Detailed Findings
            story.append(Paragraph("Detailed Findings", self.styles['SectionHeading']))
            story.append(Spacer(1, 0.3*inch))
            
            findings = scan_results.get('findings', [])
            
            # Group by severity
            severity_order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
            for severity in severity_order:
                severity_findings = [f for f in findings if f['severity'] == severity]
                
                if severity_findings:
                    # Severity section header
                    severity_color = self._get_severity_color(severity)
                    story.append(Paragraph(
                        f"{severity} Severity Issues ({len(severity_findings)})",
                        self.styles['SectionHeading']
                    ))
                    story.append(Spacer(1, 0.2*inch))
                    
                    for idx, finding in enumerate(severity_findings, 1):
                        # Create finding content with proper indentation
                        finding_content = []
                        
                        # Issue Title
                        finding_content.append(Paragraph(
                            f"<b>Issue #{idx}: {finding.get('issue', 'Security Issue')}</b>",
                            ParagraphStyle(
                                name='IssueTitle',
                                parent=self.styles['Normal'],
                                fontSize=12,
                                textColor=severity_color,
                                fontName='Helvetica-Bold',
                                leftIndent=10,
                                spaceAfter=10
                            )
                        ))
                        
                        # Service
                        finding_content.append(Paragraph(
                            f"<b>Service:</b> {finding.get('service', 'N/A')}",
                            self.styles['FieldLabel']
                        ))
                        
                        # Resource
                        finding_content.append(Paragraph(
                            f"<b>Resource:</b> {finding.get('resource', 'N/A')}",
                            self.styles['FieldLabel']
                        ))
                        
                        # Severity
                        finding_content.append(Paragraph(
                            f"<b>Severity:</b> {finding.get('severity', 'N/A')}",
                            self.styles['FieldLabel']
                        ))
                        
                        finding_content.append(Spacer(1, 0.1*inch))
                        
                        # Description
                        description = finding.get('enhanced_description') or finding.get('description', 'No description available')
                        finding_content.append(Paragraph(
                            f"<b>Description:</b>",
                            self.styles['FieldLabel']
                        ))
                        finding_content.append(Paragraph(
                            description,
                            self.styles['FieldValue']
                        ))
                        
                        # Business Impact
                        if finding.get('business_impact'):
                            finding_content.append(Paragraph(
                                f"<b>Business Impact:</b>",
                                self.styles['FieldLabel']
                            ))
                            finding_content.append(Paragraph(
                                finding['business_impact'],
                                self.styles['FieldValue']
                            ))
                        
                        # Remediation
                        remediation = finding.get('detailed_remediation') or finding.get('remediation', 'No remediation provided')
                        finding_content.append(Paragraph(
                            f"<b>Remediation Steps:</b>",
                            self.styles['FieldLabel']
                        ))
                        finding_content.append(Paragraph(
                            remediation,
                            self.styles['FieldValue']
                        ))
                        
                        # Prevention Tips
                        if finding.get('prevention_tips'):
                            finding_content.append(Paragraph(
                                f"<b>Prevention Tips:</b>",
                                self.styles['FieldLabel']
                            ))
                            finding_content.append(Paragraph(
                                finding['prevention_tips'],
                                self.styles['FieldValue']
                            ))
                        
                        # AI Enhanced Badge
                        if finding.get('ai_enhanced'):
                            finding_content.append(Spacer(1, 0.05*inch))
                            finding_content.append(Paragraph(
                                "✨ <i>Enhanced with AI</i>",
                                ParagraphStyle(
                                    name='AIBadge',
                                    parent=self.styles['Normal'],
                                    fontSize=9,
                                    textColor=colors.HexColor('#7c3aed'),
                                    fontName='Helvetica-Oblique',
                                    leftIndent=15,
                                    spaceAfter=5
                                )
                            ))
                        
                        # Wrap in KeepTogether to prevent page breaks within a finding
                        finding_box = KeepTogether(finding_content)
                        
                        # Add to story
                        story.append(finding_box)
                        story.append(Spacer(1, 0.15*inch))
                        
                        # Add separator line
                        separator = Table([['']], colWidths=[6.5*inch])
                        separator.setStyle(TableStyle([
                            ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#e5e7eb')),
                        ]))
                        story.append(separator)
                        story.append(Spacer(1, 0.15*inch))
                        
                        # Add page break after each issue for better readability
                        if idx < len(severity_findings):  # Don't add page break after last issue
                            story.append(PageBreak())
                    
                    # Page break between severity sections
                    if severity != severity_order[-1] and severity_findings:
                        story.append(PageBreak())
            
            # Build PDF
            doc.build(story)
            logger.info(f"PDF report generated successfully: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error generating PDF report: {e}")
            raise
    
    def _get_severity_color(self, severity):
        """Get color based on severity level"""
        colors_map = {
            'CRITICAL': colors.HexColor('#7f1d1d'),
            'HIGH': colors.HexColor('#dc2626'),
            'MEDIUM': colors.HexColor('#f59e0b'),
            'LOW': colors.HexColor('#10b981')
        }
        return colors_map.get(severity, colors.grey)

import os
from datetime import datetime

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'database', 'gst_tracking.accdb')
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # GST Return Configuration
    GST_RETURNS = {
        'GSTR-1': {
            'frequency': 'Monthly',
            'due_date': 11,
            'applicable_taxpayer': 'Monthly'
        },
        'GSTR-3B': {
            'frequency': 'Monthly',
            'due_date': 20,
            'applicable_taxpayer': 'Monthly'
        },
        'IFF': {
            'frequency': 'Monthly',
            'due_date': 13,
            'applicable_taxpayer': 'Quarterly'
        },
        'PMT-06': {
            'frequency': 'Monthly',
            'due_date': 25,
            'applicable_taxpayer': 'Quarterly'
        },
        'GSTR-3B (Q)': {
            'frequency': 'Quarterly',
            'due_date': 22,
            'applicable_taxpayer': 'Quarterly'
        },
        'GSTR-9': {
            'frequency': 'Annually',
            'due_date': '31-12',
            'applicable_taxpayer': 'Monthly/Quarterly'
        },
        'GSTR-9C': {
            'frequency': 'Annually',
            'due_date': '31-12',
            'applicable_taxpayer': 'Monthly'
        },
        'CMP-08': {
            'frequency': 'Quarterly',
            'due_date': 18,
            'applicable_taxpayer': 'Composition'
        },
        'GSTR-4': {
            'frequency': 'Annually',
            'due_date': '30-06',
            'applicable_taxpayer': 'Composition'
        }
    }
    
    TAXPAYER_TYPES = ['Monthly', 'Quarterly', 'Composition']
    RETURN_STATUS = ['Data Received', 'Saved', 'Payment Issued', 'Submitted', 'Filed']
    QUARTERS = ['Apr-Jun', 'Jul-Sep', 'Oct-Dec', 'Jan-Mar']
    # Use three-letter month codes
    MONTHS = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    
    @staticmethod
    def get_financial_years():
        current_year = datetime.now().year
        return [f"{year}-{str(year+1)[-2:]}" for year in range(2024, 2036)]

from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from database import DatabaseConnection
from config import Config

class Client:
    def __init__(self):
        self.db = DatabaseConnection()
    
    def get_next_client_code(self):
        """Generate next client code"""
        self.db.connect()
        result = self.db.fetch_one("SELECT MAX(ClientCode) as MaxCode FROM ClientMaster")
        self.db.disconnect()
        
        if result and result[0]:
            return result[0] + 1
        return 1
    
    def create_client(self, client_data):
        """Create new client"""
        self.db.connect()
        
        query = """
            INSERT INTO ClientMaster (
                ClientName, DateOfRegistration, EffectiveDateOfCancellation,
                GSTIN, TaxpayerType, GSTPortalUserID, GSTPortalPassword,
                EWAYBillUserID, EWAYBillPassword, ClientEmailID, MobileNo, EmailPassword
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        params = (
            client_data['client_name'],
            client_data['date_of_registration'],
            client_data.get('effective_date_of_cancellation'),
            client_data['gstin'],
            client_data['taxpayer_type'],
            client_data['gst_portal_userid'],
            client_data['gst_portal_password'],
            client_data.get('eway_bill_userid'),
            client_data.get('eway_bill_password'),
            client_data['client_email_id'],
            client_data['mobile_no'],
            client_data.get('email_password')
        )
        
        result = self.db.execute_non_query(query, params)
        self.db.disconnect()
        return result
    
    def get_all_clients(self):
        """Get all clients"""
        self.db.connect()
        query = """
            SELECT ClientCode, ClientName, DateOfRegistration, EffectiveDateOfCancellation,
                   GSTIN, TaxpayerType, GSTPortalUserID, GSTPortalPassword,
                   EWAYBillUserID, EWAYBillPassword, ClientEmailID, MobileNo, EmailPassword
            FROM ClientMaster
            ORDER BY ClientName
        """
        result = self.db.fetch_all(query)
        self.db.disconnect()
        return result
    
    def get_client_by_code(self, client_code):
        """Get client by code"""
        self.db.connect()
        query = """
            SELECT ClientCode, ClientName, DateOfRegistration, EffectiveDateOfCancellation,
                   GSTIN, TaxpayerType, GSTPortalUserID, GSTPortalPassword,
                   EWAYBillUserID, EWAYBillPassword, ClientEmailID, MobileNo, EmailPassword
            FROM ClientMaster
            WHERE ClientCode = ?
        """
        result = self.db.fetch_one(query, (client_code,))
        self.db.disconnect()
        return result
    
    # In models.py - Client class - update_client method
    def update_client(self, client_code, client_data):
        """Update client"""
        self.db.connect()
        
        # Fixed query with square brackets around field names
        query = """
            UPDATE ClientMaster SET
                [ClientName] = ?, [DateOfRegistration] = ?, [EffectiveDateOfCancellation] = ?,
                [GSTIN] = ?, [TaxpayerType] = ?, [GSTPortalUserID] = ?, [GSTPortalPassword] = ?,
                [EWAYBillUserID] = ?, [EWAYBillPassword] = ?, [ClientEmailID] = ?, [MobileNo] = ?,
                [EmailPassword] = ?
            WHERE [ClientCode] = ?
        """
        
        params = (
            client_data['client_name'],
            client_data['date_of_registration'],
            client_data.get('effective_date_of_cancellation'),
            client_data['gstin'],
            client_data['taxpayer_type'],
            client_data['gst_portal_userid'],
            client_data['gst_portal_password'],
            client_data.get('eway_bill_userid'),
            client_data.get('eway_bill_password'),
            client_data['client_email_id'],
            client_data['mobile_no'],
            client_data.get('email_password'),
            client_code
        )
        
        result = self.db.execute_non_query(query, params)
        self.db.disconnect()
        return result

    
    def delete_client(self, client_code):
        """Delete client"""
        self.db.connect()
        
        # First delete related return data
        self.db.execute_non_query("DELETE FROM GSTReturnData WHERE ClientCode = ?", (client_code,))
        
        # Then delete client
        result = self.db.execute_non_query("DELETE FROM ClientMaster WHERE ClientCode = ?", (client_code,))
        self.db.disconnect()
        return result

class GSTReturn:
    def __init__(self):
        self.db = DatabaseConnection()
    
    def get_applicable_clients(self, return_type, period):
        """Get clients applicable for specific return type and period"""
        self.db.connect()
        
        # Get return configuration
        return_config = Config.GST_RETURNS.get(return_type)
        if not return_config:
            return []
        
        applicable_taxpayer = return_config['applicable_taxpayer']
        
        # Build query based on taxpayer type
        if applicable_taxpayer == 'Monthly':
            taxpayer_condition = "TaxpayerType = 'Monthly'"
        elif applicable_taxpayer == 'Quarterly':
            taxpayer_condition = "TaxpayerType = 'Quarterly'"
        elif applicable_taxpayer == 'Composition':
            taxpayer_condition = "TaxpayerType = 'Composition'"
        elif applicable_taxpayer == 'Monthly/Quarterly':
            taxpayer_condition = "TaxpayerType IN ('Monthly', 'Quarterly')"
        else:
            taxpayer_condition = "1=1"
        
        query = f"""
            SELECT ClientCode, ClientName, GSTIN, TaxpayerType, 
                   DateOfRegistration, EffectiveDateOfCancellation
            FROM ClientMaster
            WHERE {taxpayer_condition}
            ORDER BY ClientName
        """
        
        clients = self.db.fetch_all(query)
        self.db.disconnect()
        
        # Filter clients based on registration and cancellation dates
        filtered_clients = []
        for client in clients:
            if self.is_client_applicable(client, return_type, period):
                filtered_clients.append(client)
        
        return filtered_clients
    
    def is_client_applicable(self, client, return_type, period):
        """Check if client is applicable for specific return and period"""
        registration_date = client[4]  # DateOfRegistration
        cancellation_date = client[5]  # EffectiveDateOfCancellation
        
        # Calculate first and last return periods
        first_period = self.calculate_first_return_period(registration_date, return_type)
        last_period = self.calculate_last_return_period(cancellation_date, return_type) if cancellation_date else None
        
        # Check if current period is within applicable range
        if self.compare_periods(period, first_period) < 0:
            return False
        
        if last_period and self.compare_periods(period, last_period) > 0:
            return False
        
        return True
    
    def calculate_first_return_period(self, registration_date, return_type):
        """Calculate first return period based on registration date and return type"""
        if not registration_date:
            return None
        
        reg_date = registration_date if isinstance(registration_date, date) else datetime.strptime(registration_date, '%Y-%m-%d').date()
        
        if return_type in ['GSTR-1', 'GSTR-3B']:
            return reg_date.strftime('%b-%Y')
        elif return_type in ['IFF', 'PMT-06']:
            return reg_date.strftime('%b-%Y')
        elif return_type == 'GSTR-3B (Q)':
            # Get quarter end month
            quarter_end = self.get_quarter_end_month(reg_date)
            return quarter_end.strftime('%b-%Y')
        elif return_type in ['GSTR-9', 'GSTR-9C']:
            # Financial year starting from April
            if reg_date.month >= 4:
                return f"{reg_date.year}-{str(reg_date.year + 1)[-2:]}"
            else:
                return f"{reg_date.year - 1}-{str(reg_date.year)[-2:]}"
        elif return_type == 'CMP-08':
            quarter_end = self.get_quarter_end_month(reg_date)
            return quarter_end.strftime('%b-%Y')
        elif return_type == 'GSTR-4':
            if reg_date.month >= 4:
                return f"{reg_date.year}-{str(reg_date.year + 1)[-2:]}"
            else:
                return f"{reg_date.year - 1}-{str(reg_date.year)[-2:]}"
        
        return None
    
    def calculate_last_return_period(self, cancellation_date, return_type):
        """Calculate last return period based on cancellation date and return type"""
        if not cancellation_date:
            return None
        
        cancel_date = cancellation_date if isinstance(cancellation_date, date) else datetime.strptime(cancellation_date, '%Y-%m-%d').date()
        
        if return_type in ['GSTR-1', 'GSTR-3B']:
            return cancel_date.strftime('%b-%Y')
        elif return_type == 'IFF':
            # IFF for one month after cancellation
                # next_month = cancel_date + relativedelta(months=1)
                # return next_month.strftime('%b-%Y')
            quarter_end = self.get_quarter_end_month(cancel_date)
            return quarter_end.strftime('%b-%Y')
        elif return_type == 'PMT-06':
            return cancel_date.strftime('%b-%Y')
        elif return_type == 'GSTR-3B (Q)':
            quarter_end = self.get_quarter_end_month(cancel_date)
            return quarter_end.strftime('%b-%Y')
        elif return_type in ['GSTR-9', 'GSTR-9C']:
            if cancel_date.month >= 4:
                return f"{cancel_date.year}-{str(cancel_date.year + 1)[-2:]}"
            else:
                return f"{cancel_date.year - 1}-{str(cancel_date.year)[-2:]}"
        elif return_type == 'CMP-08':
            quarter_end = self.get_quarter_end_month(cancel_date)
            return quarter_end.strftime('%b-%Y')
        elif return_type == 'GSTR-4':
            if cancel_date.month >= 4:
                return f"{cancel_date.year}-{str(cancel_date.year + 1)[-2:]}"
            else:
                return f"{cancel_date.year - 1}-{str(cancel_date.year)[-2:]}"
        
        return None
    
    def get_quarter_end_month(self, date_obj):
        """Get quarter end month for a given date"""
        month = date_obj.month
        if month <= 3:
            return date_obj.replace(month=3)
        elif month <= 6:
            return date_obj.replace(month=6)
        elif month <= 9:
            return date_obj.replace(month=9)
        else:
            return date_obj.replace(month=12)
    
    def compare_periods(self, period1, period2):
        if not period1 or not period2:
            return 0
        try:
            if '-' in period1 and len(period1.split('-')[1]) == 2:
                year1 = int(period1.split('-')[0])
                year2 = int(period2.split('-')[0])
                return (year1 > year2) - (year1 < year2)
            else:
                date1 = datetime.strptime(period1, '%b-%Y')
                date2 = datetime.strptime(period2, '%b-%Y')
                return (date1 > date2) - (date1 < date2)
        except Exception as ex:
            print(f"[debug] compare_periods error: '{period1}' vs '{period2}': {ex}")
            return -1  # Exclude if parsing fails
    
    def get_return_data(self, client_code, return_type, period):
        """Get return data for specific client, return type and period"""
        self.db.connect()
        
        query = """
            SELECT ReturnID, ClientCode, ReturnType, Period, DateOfFiling, 
                   Status, ARN, Remarks
            FROM GSTReturnData
            WHERE ClientCode = ? AND ReturnType = ? AND Period = ?
        """
        
        result = self.db.fetch_one(query, (client_code, return_type, period))
        self.db.disconnect()
        return result
    
    def save_return_data(self, return_data):
        """Save or update return data"""
        self.db.connect()
        
        # Check if record exists
        existing = self.get_return_data(
            return_data['client_code'],
            return_data['return_type'],
            return_data['period']
        )
        
        if existing:
            # Update existing record
            query = """
                UPDATE GSTReturnData SET
                    [DateOfFiling] = ?, [Status] = ?, [ARN] = ?, [Remarks] = ?
                WHERE [ClientCode] = ? AND [ReturnType] = ? AND [Period] = ?
            """
            params = (
                return_data.get('date_of_filing'),
                return_data['status'],
                return_data.get('arn'),
                return_data.get('remarks'),
                return_data['client_code'],
                return_data['return_type'],
                return_data['period']
            )
        else:
            # Insert new record
            query = """
                INSERT INTO GSTReturnData (
                    ClientCode, ReturnType, Period, DateOfFiling, Status, ARN, Remarks
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            params = (
                return_data['client_code'],
                return_data['return_type'],
                return_data['period'],
                return_data.get('date_of_filing'),
                return_data['status'],
                return_data.get('arn'),
                return_data.get('remarks')
            )
        
        result = self.db.execute_non_query(query, params)
        self.db.disconnect()
        return result
    
    def get_return_dashboard_data(self, return_type, period):
        """Get dashboard data for specific return type and period"""
        applicable_clients = self.get_applicable_clients(return_type, period)
        total_clients = len(applicable_clients)
        
        # Get filed returns count
        self.db.connect()
        query = """
            SELECT COUNT(*) as FiledCount
            FROM GSTReturnData
            WHERE ReturnType = ? AND Period = ? AND (ARN IS NOT NULL OR DateOfFiling IS NOT NULL)
        """
        result = self.db.fetch_one(query, (return_type, period))
        filed_count = result[0] if result else 0
        
        self.db.disconnect()
        
        pending_count = total_clients - filed_count
        
        return {
            'total_clients': total_clients,
            'filed_returns': filed_count,
            'pending_returns': pending_count
        }

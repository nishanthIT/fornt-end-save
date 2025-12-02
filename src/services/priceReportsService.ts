const API_BASE = 'http://localhost:3000/api';

export interface PriceReport {
  id: string;
  reporterId: number;
  productId: string;
  shopId: string;
  currentPrice: number;
  reportedPrice: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  pointsAwarded: boolean;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reporter: {
    id: number;
    name: string;
    email: string;
  };
  product: {
    id: string;
    title: string;
    barcode?: string;
    img?: string;
  };
  shop: {
    id: string;
    name: string;
    address: string;
    mobile: string;
  };
}

export interface PriceReportsStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

class PriceReportsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getPendingReports(): Promise<{ reports: PriceReport[] }> {
    const response = await fetch(`${API_BASE}/price-reports/admin/pending`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch pending reports: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getAllReports(status?: 'PENDING' | 'APPROVED' | 'REJECTED', limit: number = 100): Promise<{ reports: PriceReport[] }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    
    const response = await fetch(`${API_BASE}/price-reports/admin/all?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch all reports: ${response.statusText}`);
    }
    
    return response.json();
  }

  async approveReport(reportId: string, adminNotes?: string): Promise<{ message: string; pointsAwarded: number; priceUpdated: boolean }> {
    const response = await fetch(`${API_BASE}/price-reports/admin/approve/${reportId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ adminNotes })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to approve report: ${response.statusText}`);
    }
    
    return response.json();
  }

  async rejectReport(reportId: string, adminNotes?: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/price-reports/admin/reject/${reportId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ adminNotes })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to reject report: ${response.statusText}`);
    }
    
    return response.json();
  }

  calculateStats(reports: PriceReport[] | undefined): PriceReportsStats {
    const safeReports = reports || [];
    return {
      pending: safeReports.filter(r => r.status === 'PENDING').length,
      approved: safeReports.filter(r => r.status === 'APPROVED').length,
      rejected: safeReports.filter(r => r.status === 'REJECTED').length,
      total: safeReports.length
    };
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined) return 'N/A';
    return `£${Number(price).toFixed(2)}`;
  }
}

export const priceReportsService = new PriceReportsService();
export default priceReportsService;
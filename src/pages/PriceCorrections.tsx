import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, User, Package, Store, Phone, Calendar, ArrowRight, RefreshCw } from "lucide-react";
import { getImageUrl } from "@/utils/imageUtils";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/api";

interface PriceReport {
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

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const PriceCorrections: React.FC = () => {
  const [pendingReports, setPendingReports] = useState<PriceReport[]>([]);
  const [allReports, setAllReports] = useState<PriceReport[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<PriceReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const API_BASE = API_CONFIG.BASE_URL;
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadPendingReports(),
      loadAllReports(),
    ]);
    setLoading(false);
  };

  const loadPendingReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/price-reports/admin/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle array response directly
        setPendingReports(Array.isArray(data) ? data : data.reports || []);
      }
    } catch (error) {
      console.error('Error loading pending reports:', error);
      toast.error('Failed to load pending reports');
    }
  };

  const loadAllReports = async () => {
    try {
      console.log('🔄 Loading all reports from:', `${API_BASE}/price-reports/admin/all?limit=50`);
      
      // Try the working admin/all endpoint first
      const response = await fetch(`${API_BASE}/price-reports/admin/all?limit=50`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Admin/all response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Admin/all response data:', data);
        
        const reports = data.reports || [];
        
        // Calculate stats from all reports
        const statsData = {
          pending: reports.filter((r: PriceReport) => r.status === 'PENDING').length,
          approved: reports.filter((r: PriceReport) => r.status === 'APPROVED').length,
          rejected: reports.filter((r: PriceReport) => r.status === 'REJECTED').length,
          total: reports.length
        };
        
        console.log('📊 Calculated stats:', statsData);
        
        setAllReports(reports);
        setStats(statsData);
      } else {
        console.error('❌ Admin/all endpoint failed:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        toast.error('Failed to load reports');
      }
      
    } catch (error) {
      console.error('💥 Error loading all reports:', error);
      toast.error('Failed to load reports');
    }
  };

  const approveReport = async (reportId: string, notes: string) => {
    setProcessingId(reportId);
    
    try {
      console.log('🔄 Approving report:', reportId, 'with notes:', notes);
      console.log('🔗 API URL:', `${API_BASE}/price-reports/admin/approve/${reportId}`);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_BASE}/price-reports/admin/approve/${reportId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNotes: notes })
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response OK:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Success response:', result);
        toast.success('✅ Report approved! Price updated and 1 point awarded to reporter.');
        
        // Update the pending reports list immediately by removing the approved report
        setPendingReports(prev => prev.filter(r => r.id !== reportId));
        
        // Reload all data to get updated stats
        await loadData();
        setSelectedReport(null);
        setAdminNotes('');
      } else {
        const error = await response.json();
        console.error('❌ Error response:', error);
        toast.error(`Failed to approve report: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Network error approving report:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectReport = async (reportId: string, notes: string) => {
    setProcessingId(reportId);
    
    try {
      const response = await fetch(`${API_BASE}/price-reports/admin/reject/${reportId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNotes: notes })
      });
      
      if (response.ok) {
        toast.success('❌ Report rejected. No points awarded.');
        
        // Update the pending reports list immediately by removing the rejected report
        setPendingReports(prev => prev.filter(r => r.id !== reportId));
        
        // Reload all data to get updated stats
        await loadData();
        setSelectedReport(null);
        setAdminNotes('');
      } else {
        const error = await response.json();
        toast.error(`Failed to reject report: ${error.error}`);
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error('Error rejecting report:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'N/A';
    return numPrice.toFixed(2);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      APPROVED: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      REJECTED: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    };
    
    const { variant, icon: Icon, color } = config[status as keyof typeof config];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon size={12} />
        {status}
      </Badge>
    );
  };

  const ReportCard: React.FC<{ report: PriceReport; showActions?: boolean }> = ({ 
    report, 
    showActions = false 
  }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Report #{report.id.slice(-8)}
              {getStatusBadge(report.status)}
            </CardTitle>
            <CardDescription>
              <Calendar size={14} className="inline mr-1" />
              {new Date(report.createdAt).toLocaleString()}
            </CardDescription>
          </div>
          {report.product.img && (
            <img 
              src={getImageUrl(report.product.img)} 
              alt={report.product.title}
              className="w-16 h-16 object-cover rounded"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Product Info */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <Package size={16} />
              Product
            </h4>
            <p className="font-medium">{report.product.title}</p>
            {report.product.barcode && (
              <p className="text-sm text-muted-foreground">
                Barcode: {report.product.barcode}
              </p>
            )}
          </div>
          
          {/* Shop Info */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <Store size={16} />
              Shop
            </h4>
            <p className="font-medium">{report.shop.name}</p>
            <p className="text-sm text-muted-foreground">{report.shop.address}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone size={12} />
              {report.shop.mobile}
            </p>
          </div>
        </div>
        
        {/* Reporter Info */}
        <div className="mb-4">
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <User size={16} />
            Reporter
          </h4>
          <p className="text-sm">{report.reporter.name} ({report.reporter.email})</p>
        </div>
        
        {/* Price Comparison */}
        <div className="bg-muted p-4 rounded-lg mb-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-bold">£{formatPrice(report.currentPrice)}</p>
            </div>
            <ArrowRight className="text-muted-foreground" size={24} />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Reported Price</p>
              <p className="text-2xl font-bold text-primary">£{formatPrice(report.reportedPrice)}</p>
            </div>
          </div>
        </div>
        
        {/* Admin Notes */}
        {report.adminNotes && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Admin Notes</h4>
            <p className="text-sm bg-muted p-2 rounded">{report.adminNotes}</p>
          </div>
        )}
        
        {/* Actions for Pending Reports */}
        {showActions && report.status === 'PENDING' && (
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1" 
                  disabled={processingId === report.id}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Approve & Update Price
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Price Report</DialogTitle>
                  <DialogDescription>
                    This will update the product price and award 1 point to the reporter.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    defaultValue="Report approved - price looks correct"
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add approval notes..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        console.log('Approving report:', report.id);
                        approveReport(report.id, adminNotes || 'Report approved - price looks correct');
                      }}
                      className="flex-1"
                      disabled={processingId === report.id}
                    >
                      {processingId === report.id ? (
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                      ) : (
                        <CheckCircle size={16} className="mr-2" />
                      )}
                      Confirm Approval
                    </Button>
                    <DialogTrigger asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogTrigger>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  disabled={processingId === report.id}
                >
                  <XCircle size={16} className="mr-2" />
                  Reject Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Price Report</DialogTitle>
                  <DialogDescription>
                    This will reject the report and no points will be awarded.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    defaultValue="Report rejected - price appears incorrect"
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add rejection reason..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        console.log('Rejecting report:', report.id);
                        rejectReport(report.id, adminNotes || 'Report rejected - price appears incorrect');
                      }}
                      className="flex-1"
                      disabled={processingId === report.id}
                    >
                      {processingId === report.id ? (
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                      ) : (
                        <XCircle size={16} className="mr-2" />
                      )}
                      Confirm Rejection
                    </Button>
                    <DialogTrigger asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogTrigger>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin mr-2" size={24} />
        Loading price reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Price Corrections</h1>
        <p className="text-muted-foreground">
          Manage customer-reported price corrections and updates
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="text-yellow-500" size={20} />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-500" size={20} />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="text-red-500" size={20} />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="text-blue-500" size={20} />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Reports ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Reports ({stats.total})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {(pendingReports?.length || 0) === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
                <h3 className="text-lg font-semibold mb-2">No Pending Reports</h3>
                <p className="text-muted-foreground">
                  All price reports have been processed!
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingReports?.map((report) => (
              <ReportCard 
                key={report.id} 
                report={report} 
                showActions={true}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          {(allReports?.length || 0) === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
                <p className="text-muted-foreground">
                  No price reports have been submitted yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            allReports?.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PriceCorrections;
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const SubscriptionInfoCard = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            30-Day Free Trial System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {/* During Trial */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-green-700 mb-2">During Free Trial</h3>
              <ul className="text-sm space-y-1 text-green-600">
                <li>✓ Create unlimited lists</li>
                <li>✓ Add products to lists</li>
                <li>✓ Price comparison features</li>
                <li>✓ Access to all premium features</li>
                <li>✓ View lowest prices</li>
              </ul>
              <Badge className="mt-2 bg-green-500">Full Access</Badge>
            </div>

            {/* Trial Expiring */}
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-700 mb-2">Trial Expiring (≤7 days)</h3>
              <ul className="text-sm space-y-1 text-orange-600">
                <li>⚠️ Limited time remaining</li>
                <li>✓ Still full access to features</li>
                <li>📧 Email reminders sent</li>
                <li>🎯 Upgrade prompts shown</li>
                <li>💎 Premium offers available</li>
              </ul>
              <Badge variant="outline" className="mt-2 border-orange-500 text-orange-600">
                Expiring Soon
              </Badge>
            </div>

            {/* After Trial Expires */}
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold text-red-700 mb-2">After Trial Expires</h3>
              <ul className="text-sm space-y-1 text-red-600">
                <li>❌ Cannot create new lists</li>
                <li>❌ Cannot add products to lists</li>
                <li>❌ No price comparison features</li>
                <li>👁️ Can view existing lists (read-only)</li>
                <li>🔒 Premium features locked</li>
              </ul>
              <Badge variant="destructive" className="mt-2">
                Limited Access
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What Customers Can Do After Trial Expires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Still Available (Read-Only)
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  View existing shopping lists
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Browse saved products
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  See previously saved prices
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Access account settings
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Premium Features (Locked)
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Creating new shopping lists
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Adding products to existing lists
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Real-time price comparisons
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Accessing lowest price features
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Deleting lists or products
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Management Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-2">Upgrade to Premium</h4>
              <p className="text-sm text-blue-600 mb-2">
                Grant full access to all features
              </p>
              <Badge className="bg-blue-500">Permanent Access</Badge>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-700 mb-2">Extend Trial</h4>
              <p className="text-sm text-purple-600 mb-2">
                Add 30 more days to free trial
              </p>
              <Badge className="bg-purple-500">+30 Days</Badge>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Process Expired</h4>
              <p className="text-sm text-gray-600 mb-2">
                Update status of expired trials
              </p>
              <Badge variant="outline">Bulk Action</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionInfoCard;
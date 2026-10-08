import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, User, ChevronDown, Trash  } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import useEmployeeData from "@/hooks/useEmployeeData"; // Adjust the import pat
import { adminListItemsService, ListItemUpdateLog, ListItemUpdateSummary } from "@/services/adminListItemsService";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { API_CONFIG, getAdminUrl } from "@/config/api";
import { COMPANY_PERMISSION_OPTIONS, DEFAULT_STAFF_PERMISSIONS, permissionLabel } from "@/config/permissions";
import { PermissionChecklist } from "@/components/PermissionChecklist";
import { AccessReview, AccessReviewDialog, ReviewAction } from "@/components/AccessReviewDialog";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const PermissionPicker = ({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) => (
  <PermissionChecklist title="Company permissions" options={COMPANY_PERMISSION_OPTIONS} value={value} onChange={onChange} />
);


interface Employee {
  id: number;
  name: string;
  phoneNo: string;
  email:string;
  password?: string;
  role?: string | null;
  permissions?: string[];
  status?: string | null;
}

interface ProductActivity {
  date: string;
  totalProducts: number;
  hourlyBreakdown: {
    hour: string;
    count: number;
  }[];
}
const Employees = () => {


  const { employees:mockEmployees, activityData:mockActivityData, loading, reload } = useEmployeeData();
  const { user } = useAuth();
  const isSuperAdmin = user?.userType === "ADMIN";
  const [reviews, setReviews] = useState<AccessReview[]>([]);
  const [reviewsVersion, setReviewsVersion] = useState(0);
  const [reviewAction, setReviewAction] = useState<{ review: AccessReview; action: ReviewAction } | null>(null);


  const [employees, setEmployees] = useState(mockEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showHourlyBreakdown, setShowHourlyBreakdown] = useState(false);
  const [listItemUpdates, setListItemUpdates] = useState<ListItemUpdateLog[]>([]);
  const [listItemUpdateSummary, setListItemUpdateSummary] = useState<ListItemUpdateSummary | null>(null);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "id">>({
    name: "",
    phoneNo: "",
    email:"",
    password: "",
    permissions: DEFAULT_STAFF_PERMISSIONS,
  });

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetch(`${API_BASE}${API_CONFIG.ADMIN.ACCESS_REVIEWS}?status=OPEN`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((body) => setReviews(body?.success ? body.data : []))
      .catch(() => setReviews([]));
  }, [isSuperAdmin, reviewsVersion]);

  const resolveReview = (review: AccessReview, action: ReviewAction) => setReviewAction({ review, action });

  useEffect(() => {
    setEmployees(mockEmployees);
  }, [mockEmployees]); // This will rerun whenever mockEmployees changes


  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditing(true);
  };

  const validateEmployeeData = (employee: Omit<Employee, "id">) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/; // Adjust based on your phone number format
  
    if (!employee.name.trim()) {
      toast.error("Name is required");
      return false;
    }
  
    if (!emailRegex.test(employee.email)) {
      toast.error("Invalid email format");
      return false;
    }
  
    if (!phoneRegex.test(employee.phoneNo)) {
      toast.error("Invalid phone number");
      return false;
    }
  
    if (employee.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return false;
    }
  
    return true;
  };



  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Remove this person's company staff access? Their account and any shop membership or lists are kept.");
    if (confirmDelete) {
      try {
        const response = await fetch(`${API_BASE}/deleteEmployee/${id}`, {
          method: "DELETE",
          headers: authHeaders(),
          credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        reload();
        toast.success("Company access removed");
      } catch (error) {
        console.error("Error removing company access:", error);
        toast.error("Failed to remove company access. Please try again.");
      }
    }
  };

  // const handleSave = () => {
  //   if (editingEmployee) {
  //     setEmployees(employees.map(e => 
  //       e.id === editingEmployee.id ? editingEmployee : e
  //     ));
  //     toast.success("Employee details updated successfully!");
  //     setIsEditing(false);
  //   }
  // };

  // const handleAdd = () => {
  //   const newId = Math.max(...employees.map(e => e.id)) + 1;
  //   setEmployees([...employees, { ...newEmployee, id: newId }]);
  //   setNewEmployee({ name: "", phone: "" });
  //   setIsAdding(false);
  //   toast.success("Employee added successfully!");
  // };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE}/updateEmployee/${editingEmployee.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editingEmployee.name,
          phoneNo: editingEmployee.phoneNo,
          email: editingEmployee.email,
          ...(editingEmployee.password ? { password: editingEmployee.password } : {}),
          permissions: editingEmployee.permissions ?? [],
          status: editingEmployee.status ?? 'ACTIVE',
        }),
         credentials: 'include'
      });
  
      if (response.ok) {
        reload();
        toast.success('Company staff member updated');
      } else {
        const body = await response.json().catch(() => null);
        toast.error(body?.error || 'Failed to update staff member.');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsEditing(false);
      setEditingEmployee(null);
    }
  };



  const handleAdd = async () => {
    try {
      const response = await fetch(`${API_BASE}/addEmployee`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: newEmployee.name,
          phoneNo: newEmployee.phoneNo,
          email: newEmployee.email,
          password: newEmployee.password,
          permissions: newEmployee.permissions,
        }),
         credentials: 'include'
      });
      const body = await response.json().catch(() => null);
  
      if (response.ok) {
        reload();
        toast.success('Company staff member added');
      } else if (response.status === 409 && body?.code === 'ACCOUNT_EXISTS') {
        // An existing (e.g. shop employee) account needs an explicit, separate company grant.
        const grant = window.confirm(
          'An employee account with this email already exists. Grant it company staff access with the selected permissions? Any shop membership stays unchanged.'
        );
        if (grant) {
          const res = await fetch(getAdminUrl(API_CONFIG.ADMIN.STAFF_GRANT), {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ employeeId: body.employeeId, permissions: newEmployee.permissions }),
          });
          if (res.ok) {
            reload();
            toast.success('Company access granted');
          } else {
            toast.error('Failed to grant company access');
          }
        }
      } else {
        toast.error(body?.error || 'Failed to add staff member. Please try again.');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsAdding(false);
      setNewEmployee({ name: '', phoneNo: '', email: '', password: '', permissions: DEFAULT_STAFF_PERMISSIONS });
    }
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedDate(null);
    setShowHourlyBreakdown(false);
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setShowHourlyBreakdown(true);
  };

  const getEmployeeActivity = (employeeId: number) => {
    return mockActivityData[employeeId] || [];
  };

  const getHourlyBreakdown = (employeeId: number, date: string) => {
    const activities = mockActivityData[employeeId] || [];
    const dayActivity = activities.find(a => a.date === date);
    return dayActivity?.hourlyBreakdown || [];
  };

  const getUpdateSummary = (update: ListItemUpdateLog) => {
    const beforeProduct = (update.beforeData as { product?: Record<string, unknown> })?.product || {};
    const afterProduct = (update.afterData as { product?: Record<string, unknown> })?.product || {};
    const beforeShop = (update.beforeData as { productAtShop?: Record<string, unknown> })?.productAtShop || {};
    const afterShop = (update.afterData as { productAtShop?: Record<string, unknown> })?.productAtShop || {};

    const changes: string[] = [];
    const productFields: Array<[string, string]> = [
      ['title', 'Name'],
      ['barcode', 'Barcode'],
      ['caseBarcode', 'Case Barcode'],
      ['caseSize', 'Case Size'],
      ['packetSize', 'Packet Size'],
      ['retailSize', 'Retail Size'],
      ['rrp', 'RRP'],
      ['category', 'Category'],
    ];

    productFields.forEach(([field, label]) => {
      const beforeValue = beforeProduct[field];
      const afterValue = afterProduct[field];
      if (beforeValue !== undefined && afterValue !== undefined && beforeValue !== afterValue) {
        changes.push(`${label}: ${beforeValue ?? '—'} → ${afterValue ?? '—'}`);
      }
    });

    if (beforeShop.price !== undefined && afterShop.price !== undefined && beforeShop.price !== afterShop.price) {
      changes.push(`Price: ${beforeShop.price ?? '—'} → ${afterShop.price ?? '—'}`);
    }

    if (changes.length === 0) return 'No field changes captured.';
    return changes.join(' · ');
  };

  useEffect(() => {
    if (!selectedEmployee) {
      setListItemUpdates([]);
      setListItemUpdateSummary(null);
      return;
    }

    const fetchUpdates = async () => {
      try {
        setUpdatesLoading(true);
        const response = await adminListItemsService.getEmployeeListItemUpdates(selectedEmployee.id, 50, 30);
        setListItemUpdates(response.logs);
        setListItemUpdateSummary(response.summary);
      } catch (error) {
        console.error("Failed to fetch employee list item updates:", error);
        setListItemUpdates([]);
        setListItemUpdateSummary(null);
      } finally {
        setUpdatesLoading(false);
      }
    };

    fetchUpdates();
  }, [selectedEmployee]);

if(loading) {
  return <p>Loading...</p>
}

  return (



    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">Company Staff</h1>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Company Staff
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Your own employees and their company permissions. Shop Employees created by customers are shown under
        Customers → Customer details → Employees and never appear here.
      </p>

      {isSuperAdmin && reviews.length > 0 && (
        <Card className="mb-6 border-orange-300">
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold">Needs review ({reviews.length})</h2>
            <p className="text-sm text-muted-foreground">
              These accounts could not be safely classified by the access migration and currently have no company or
              shop access.
            </p>
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-md p-3 text-sm space-y-2">
                <div className="font-medium">
                  {review.employee.name} · {review.employee.email}
                </div>
                <div className="text-muted-foreground">
                  {review.reason} — {String(review.evidence?.detail ?? "")} · catalog actions:{" "}
                  {String(review.evidence?.wholesaleCatalogActions ?? 0)} · lists: {String(review.evidence?.listCount ?? 0)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => resolveReview(review, "GRANT_COMPANY")}>
                    Grant company access
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => resolveReview(review, "ASSIGN_SHOP")}>
                    Assign to customer shop
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => resolveReview(review, "NO_ACCESS")}>
                    Keep without access
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AccessReviewDialog
        review={reviewAction?.review ?? null}
        action={reviewAction?.action ?? null}
        onClose={() => setReviewAction(null)}
        onResolved={() => {
          setReviewsVersion((v) => v + 1);
          reload();
        }}
      />

      {/* <div className="space-y-4">
        {employees.map((employee) => (
          <Card key={employee.id} className="w-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center space-x-4 cursor-pointer"
                  onClick={() => handleEmployeeClick(employee)}
                >
                  <User className="h-8 w-8 text-gray-400" />
                  <div>
  <div className="flex items-center mb-2">
    <label className="font-bold text-gray-700 mr-2">Name:</label>
    <h3 className="font-semibold">{employee.name}</h3>
  </div>
  <div className="flex items-center mb-2">
    <label className="font-bold text-gray-700 mr-2">Phone:</label>
    <p className="text-sm text-gray-500">{employee.phoneNo || "Not Provided"}</p>
  </div>
  <div className="flex items-center mb-2">
    <label className="font-bold text-gray-700 mr-2">Email:</label>
    <p className="text-sm text-gray-500">{employee.email || "Not Provided"}</p>
  </div>

</div>

                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(employee);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                


              </div>
            </CardContent>
          </Card>
        ))}
      </div> */}

<div className="space-y-4">
  {employees.map((employee) => (
    <Card key={employee.id} className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-4 cursor-pointer"
            onClick={() => handleEmployeeClick(employee)}
          >
            <User className="h-8 w-8 text-gray-400" />
            <div>
              <div className="flex items-center mb-2">
                <label className="font-bold text-gray-700 mr-2">Name:</label>
                <h3 className="font-semibold">{employee.name}</h3>
              </div>
              <div className="flex items-center mb-2">
                <label className="font-bold text-gray-700 mr-2">Phone:</label>
                <p className="text-sm text-gray-500">{employee.phoneNo || "Not Provided"}</p>
              </div>
              <div className="flex items-center mb-2">
                <label className="font-bold text-gray-700 mr-2">Email:</label>
                <p className="text-sm text-gray-500">{employee.email || "Not Provided"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant={employee.status === "ACTIVE" ? "default" : "outline"}>
                  {(employee.status || "unknown").toLowerCase()}
                </Badge>
                {employee.role === "MANAGER" && <Badge variant="secondary">manager</Badge>}
                {(employee.permissions ?? []).map((p) => (
                  <Badge key={p} variant="secondary">{permissionLabel(p)}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Edit Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(employee);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(employee.id);
              }}
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>




      {/* Activity Dialog */}
      <Dialog open={selectedEmployee !== null} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg">
              {selectedEmployee?.name}'s Product Activity
            </DialogTitle>
          </DialogHeader>
          
          {!showHourlyBreakdown ? (
            <div className="space-y-3 sm:space-y-4 flex flex-col flex-1 min-h-0">
              <h3 className="text-base sm:text-lg font-semibold flex-shrink-0">Daily Product Updates</h3>
              <div className="overflow-auto flex-1 -mx-2 px-2">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm">Total Products</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEmployee && getEmployeeActivity(selectedEmployee.id).map((activity) => (
                      <TableRow key={activity.date} className="cursor-pointer hover:bg-muted/50" onClick={() => handleDateClick(activity.date)}>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4">{format(new Date(activity.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4">{activity.totalProducts}</TableCell>
                        <TableCell className="py-2 sm:py-4">
                          <ChevronDown className="h-4 w-4" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-semibold">List Item Update History</h3>
                {listItemUpdateSummary && (
                  <div className="rounded-md border p-3 text-xs sm:text-sm text-muted-foreground">
                    <div className="font-semibold text-sm text-foreground">
                      Unique updates (last {listItemUpdateSummary.rangeDays} days): {listItemUpdateSummary.totalUnique}
                    </div>
                    {listItemUpdateSummary.byDate.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {listItemUpdateSummary.byDate.map((entry) => (
                          <div key={entry.date} className="flex items-center justify-between">
                            <span>{format(new Date(entry.date), 'MMM dd, yyyy')}</span>
                            <span>{entry.uniqueProducts} unique · {entry.totalEdits} edits</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2">No updates in this period.</div>
                    )}
                  </div>
                )}
                {updatesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading updates...</p>
                ) : listItemUpdates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No list item updates found.</p>
                ) : (
                  <div className="space-y-2">
                    {listItemUpdates.map((update) => (
                      <Card key={update.id}>
                        <CardContent className="p-3">
                          <div className="text-sm font-semibold">{update.product?.title || "Unnamed Item"}</div>
                          <div className="text-xs text-muted-foreground">
                            {update.product?.barcode || update.product?.caseBarcode || "No barcode"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {update.shop?.name || "Unknown shop"} · {format(new Date(update.timestamp), 'MMM dd, yyyy HH:mm')}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getUpdateSummary(update)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 flex flex-col flex-1 min-h-0">
              <Button 
                variant="ghost" 
                onClick={() => setShowHourlyBreakdown(false)}
                className="mb-2 sm:mb-4 w-fit text-sm"
                size="sm"
              >
                ← Back to Daily View
              </Button>
              <h3 className="text-base sm:text-lg font-semibold flex-shrink-0">
                Hourly Breakdown for {selectedDate && format(new Date(selectedDate), 'MMM dd, yyyy')}
              </h3>
              <div className="overflow-auto flex-1 -mx-2 px-2">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Hour</TableHead>
                      <TableHead className="text-xs sm:text-sm">Products Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEmployee && selectedDate && 
                      getHourlyBreakdown(selectedEmployee.id, selectedDate).map((hourData) => (
                        <TableRow key={hourData.hour}>
                          <TableCell className="text-xs sm:text-sm py-2 sm:py-4">{hourData.hour}</TableCell>
                          <TableCell className="text-xs sm:text-sm py-2 sm:py-4">{hourData.count}</TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {/* <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editingEmployee.name}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  value={editingEmployee.phone}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog> */}
     <Dialog open={isEditing} onOpenChange={setIsEditing}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Company Staff</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input
          value={editingEmployee?.name || ''}
          onChange={(e) =>
            setEditingEmployee({ ...editingEmployee, name: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Phone Number</label>
        <Input
          value={editingEmployee?.phoneNo || ''}
          onChange={(e) =>
            setEditingEmployee({
              ...editingEmployee,
              phoneNo: e.target.value,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input
          value={editingEmployee?.email || ''}
          onChange={(e) =>
            setEditingEmployee({
              ...editingEmployee,
              email: e.target.value,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input
          type="password"
         // value={editingEmployee?.password || ''}
          onChange={(e) =>
            setEditingEmployee({
              ...editingEmployee,
              password: e.target.value,
            })
          }
        />
      </div>
      <PermissionPicker
        value={editingEmployee?.permissions ?? []}
        onChange={(permissions) => setEditingEmployee({ ...editingEmployee, permissions })}
      />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={(editingEmployee?.status ?? "ACTIVE") === "ACTIVE"}
          onCheckedChange={(checked) =>
            setEditingEmployee({ ...editingEmployee, status: checked ? "ACTIVE" : "INACTIVE" })
          }
        />
        Company access active
      </label>
      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  </DialogContent>
</Dialog>




      {/* Add Dialog */}
      {/* <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={newEmployee.phone}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    phone: e.target.value,
                  })
                }
              />
            </div>
            <Button onClick={handleAdd} className="w-full">
              Add Employee
            </Button>
          </div>
        </DialogContent>
      </Dialog> */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Company Staff</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input
          value={newEmployee.name}
          onChange={(e) =>
            setNewEmployee({
              ...newEmployee,
              name: e.target.value,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Phone Number</label>
        <Input
          value={newEmployee.phoneNo}
          onChange={(e) =>
            setNewEmployee({
              ...newEmployee,
              phoneNo: e.target.value,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input
          value={newEmployee.email || ''}
          onChange={(e) =>
            setNewEmployee({
              ...newEmployee,
              email: e.target.value,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input
          type="password"
          value={newEmployee.password || ''}
          onChange={(e) =>
            setNewEmployee({
              ...newEmployee,
              password: e.target.value,
            })
          }
        />
      </div>
      <PermissionPicker
        value={newEmployee.permissions ?? []}
        onChange={(permissions) => setNewEmployee({ ...newEmployee, permissions })}
      />
      <Button onClick={handleAdd} className="w-full">
        Add Company Staff
      </Button>
    </div>
  </DialogContent>
</Dialog>





    </div>
  );
};

export default Employees;

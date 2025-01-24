import { useState } from "react";
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
import { Edit, Plus, User, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Employee {
  id: number;
  name: string;
  phone: string;
}

interface ProductActivity {
  date: string;
  totalProducts: number;
  hourlyBreakdown: {
    hour: string;
    count: number;
  }[];
}

const mockEmployees: Employee[] = [
  { id: 1, name: "Alice Johnson", phone: "+1 234-567-8902" },
  { id: 2, name: "Bob Wilson", phone: "+1 234-567-8903" },
];

// Mock activity data
const mockActivityData: Record<number, ProductActivity[]> = {
  1: [
    {
      date: "2024-01-16",
      totalProducts: 120,
      hourlyBreakdown: [
        { hour: "9:00", count: 15 },
        { hour: "10:00", count: 25 },
        { hour: "11:00", count: 30 },
        { hour: "12:00", count: 20 },
        { hour: "13:00", count: 10 },
        { hour: "14:00", count: 20 },
      ],
    },
    {
      date: "2024-01-15",
      totalProducts: 95,
      hourlyBreakdown: [
        { hour: "9:00", count: 10 },
        { hour: "10:00", count: 20 },
        { hour: "11:00", count: 25 },
        { hour: "12:00", count: 15 },
        { hour: "13:00", count: 15 },
        { hour: "14:00", count: 10 },
      ],
    },
  ],
  2: [
    {
      date: "2024-01-16",
      totalProducts: 85,
      hourlyBreakdown: [
        { hour: "9:00", count: 10 },
        { hour: "10:00", count: 15 },
        { hour: "11:00", count: 20 },
        { hour: "12:00", count: 15 },
        { hour: "13:00", count: 15 },
        { hour: "14:00", count: 10 },
      ],
    },
  ],
};

const Employees = () => {
  const [employees, setEmployees] = useState(mockEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showHourlyBreakdown, setShowHourlyBreakdown] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "id">>({
    name: "",
    phone: "",
  });

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editingEmployee) {
      setEmployees(employees.map(e => 
        e.id === editingEmployee.id ? editingEmployee : e
      ));
      toast.success("Employee details updated successfully!");
      setIsEditing(false);
    }
  };

  const handleAdd = () => {
    const newId = Math.max(...employees.map(e => e.id)) + 1;
    setEmployees([...employees, { ...newEmployee, id: newId }]);
    setNewEmployee({ name: "", phone: "" });
    setIsAdding(false);
    toast.success("Employee added successfully!");
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

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
                    <h3 className="font-semibold">{employee.name}</h3>
                    <p className="text-sm text-gray-500">{employee.phone}</p>
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
      </div>

      {/* Activity Dialog */}
      <Dialog open={selectedEmployee !== null} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee?.name}'s Product Activity
            </DialogTitle>
          </DialogHeader>
          
          {!showHourlyBreakdown ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Daily Product Updates</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Products</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEmployee && getEmployeeActivity(selectedEmployee.id).map((activity) => (
                    <TableRow key={activity.date} className="cursor-pointer hover:bg-muted/50" onClick={() => handleDateClick(activity.date)}>
                      <TableCell>{format(new Date(activity.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{activity.totalProducts}</TableCell>
                      <TableCell>
                        <ChevronDown className="h-4 w-4" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowHourlyBreakdown(false)}
                className="mb-4"
              >
                Back to Daily View
              </Button>
              <h3 className="text-lg font-semibold">
                Hourly Breakdown for {selectedDate && format(new Date(selectedDate), 'MMM dd, yyyy')}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hour</TableHead>
                    <TableHead>Products Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEmployee && selectedDate && 
                    getHourlyBreakdown(selectedEmployee.id, selectedDate).map((hourData) => (
                      <TableRow key={hourData.hour}>
                        <TableCell>{hourData.hour}</TableCell>
                        <TableCell>{hourData.count}</TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
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
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
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
      </Dialog>
    </div>
  );
};

export default Employees;
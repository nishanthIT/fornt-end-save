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


interface Employee {
  id: number;
  name: string;
  phoneNo: string;
  email:string;
  password: string;
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


  const { employees:mockEmployees, activityData:mockActivityData, loading } = useEmployeeData();


  const [employees, setEmployees] = useState(mockEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showHourlyBreakdown, setShowHourlyBreakdown] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "id">>({
    name: "",
    phoneNo: "",
    email:"",
    password: "",
  });

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
    const confirmDelete = window.confirm("Are you sure you want to delete this employee?");
    if (confirmDelete) {
      try {
        // Send a DELETE request to the server
        await fetch(`http://localhost:3000/api/deleteEmployee/${id}`, {
          method: "DELETE",
        });
  
        // Update the state to remove the deleted employee from the UI
        setEmployees((prevEmployees) => prevEmployees.filter((employee) => employee.id !== id));
  
        alert("Employee deleted successfully!");
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Failed to delete the employee. Please try again.");
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
      const response = await fetch(`http://localhost:3000/api/updateEmployee/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingEmployee),
      });
  
      if (response.ok) {
        const updatedEmployee = await response.json();
        setEmployees(
          employees.map((emp) =>
            emp.id === updatedEmployee.id ? updatedEmployee : emp
          )
        );
        toast.success('Employee updated successfully!');
      } else {
        toast.error('Failed to update employee.');
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
      const response = await fetch(' http://localhost:3000/api/addEmployee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newEmployee.name,
          phoneNo: newEmployee.phoneNo,
          email: newEmployee.email,
          password: newEmployee.password,
        }),
      });
  
      if (response.ok) {
        const addedEmployee = await response.json();
        setEmployees([...employees, addedEmployee]);
        toast.success('Employee added successfully!');
      } else {
        toast.error('Failed to add employee. Please try again.');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsAdding(false);
      setNewEmployee({ name: '', phoneNo: '', email: '', password: '' });
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

if(loading) {
  return <p>Loading...</p>
}

  return (



    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

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
      <DialogTitle>Edit Employee</DialogTitle>
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
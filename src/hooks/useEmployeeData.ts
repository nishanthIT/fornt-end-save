import { useState, useEffect, useCallback } from "react";

type ProductActivity = {
  date: string;
  totalProducts: number;
  hourlyBreakdown: {
    hour: string;
    count: number;
  }[];
};

type Employee = {
  id: number;
  name: string;
  phoneNo: string;
  email: string;
  password?: string;
  role?: string | null;
  permissions?: string[];
  status?: string | null;
};

type EmployeeWithActivity = Employee & {
  activities: ProductActivity[];
};

const useEmployeeData = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activityData, setActivityData] = useState<Record<number, ProductActivity[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const fetchData = async () => {
      const authToken = localStorage.getItem("auth_token");
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/getallemploy`,{
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
           credentials: 'include'
        });
        const data = await response.json();

        // Process the fetched data
        const { employees, activityData } = transformData(data);

        // Set the state with the transformed data
        setEmployees(employees);
        setActivityData(activityData);
        setLoading(false);
      } catch (error) {
        console.log("Can't fetch data");
        console.error("Error fetching employee data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [version]);

  const transformData = (data: any) => {
    if (!data.success || !Array.isArray(data.data)) {
      console.warn("Invalid data format");
      return { employees: [], activityData: {} };
    }

    const employees: Employee[] = data.data.map((emp: any) => ({
      id: emp.id,
      name: emp.name,
      phoneNo: emp.phoneNo || emp.phone || '',
      email: emp.email || '',
      role: emp.role ?? null,
      permissions: emp.permissions ?? [],
      status: emp.status ?? null,
    }));

    const activityData: Record<number, ProductActivity[]> = {};

    data.data.forEach((emp: any) => {
      const employeeId = emp.id;
      const activities: ProductActivity[] = emp.activities.map((activity: any) => ({
        date: activity.date,
        totalProducts: activity.totalProducts,
        hourlyBreakdown: activity.hourlyBreakdown.map((hourly: any) => ({
          hour: hourly.hour,
          count: hourly.count,
        })),
      }));

      activityData[employeeId] = activities;
    });
    console.log(activityData);
    console.log(employees);

    return { employees, activityData };
  };

  return {
    employees,
    activityData,
    loading,
    reload,
  };
};

export default useEmployeeData;

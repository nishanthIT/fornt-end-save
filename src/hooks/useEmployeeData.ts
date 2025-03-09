import { useState, useEffect } from "react";
import { PassThrough } from "stream";

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
  phone: string;
};

type EmployeeWithActivity = Employee & {
  activities: ProductActivity[];
};

const useEmployeeData = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activityData, setActivityData] = useState<Record<number, ProductActivity[]>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const authToken = localStorage.getItem("auth_token");
      try {
        const response = await fetch("https://backend.h7tex.com/api/getallemploy",{
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
  }, []);

  const transformData = (data: any) => {
    if (!data.success || !Array.isArray(data.data)) {
      console.warn("Invalid data format");
      return { employees: [], activityData: {} };
    }

    const employees: Employee[] = data.data.map((emp: any) => ({
      id: emp.id,
      name: emp.name,
      phoneNo: emp.phone,
      email:emp.email,
      password: emp.password
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
  };
};

export default useEmployeeData;

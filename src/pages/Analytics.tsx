
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BarChart3, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock data for demonstration
const mockData = [
  { name: "Development", lowStress: 4, mediumStress: 2, highStress: 1 },
  { name: "QA", lowStress: 3, mediumStress: 3, highStress: 2 },
  { name: "DevOps", lowStress: 2, mediumStress: 1, highStress: 3 },
  { name: "Design", lowStress: 5, mediumStress: 3, highStress: 0 },
  { name: "Product", lowStress: 3, mediumStress: 4, highStress: 1 },
];

const mockEmployeeData = [
  { id: "1", name: "John Smith", email: "john@company.com", avgStress: 35, department: "Development", highStressRecords: 0 },
  { id: "2", name: "Emily Johnson", email: "emily@company.com", avgStress: 65, department: "QA", highStressRecords: 2 },
  { id: "3", name: "Michael Brown", email: "michael@company.com", avgStress: 78, department: "DevOps", highStressRecords: 3 },
  { id: "4", name: "Sarah Wilson", email: "sarah@company.com", avgStress: 42, department: "Design", highStressRecords: 1 },
];

const Analytics = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect non-admin users
  useState(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      navigate("/dashboard");
    }
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Stress level analysis across departments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">+5 from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Stress Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48%</div>
              <p className="text-xs text-muted-foreground">-3% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Stress Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Stress Distribution by Department</CardTitle>
            <CardDescription>
              Number of employees by stress category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="lowStress" stackId="a" name="Low Stress" fill="#10b981" />
                  <Bar dataKey="mediumStress" stackId="a" name="Medium Stress" fill="#f59e0b" />
                  <Bar dataKey="highStress" stackId="a" name="High Stress" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees with High Stress</CardTitle>
            <CardDescription>
              Employees with concerning stress levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockEmployeeData
                .filter(emp => emp.avgStress > 65)
                .map((employee) => (
                  <div key={employee.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                        <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          {employee.avgStress}% Stress
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{employee.department}</span>
                      </div>
                      <p className="text-sm mt-1">
                        <span className="font-medium">{employee.highStressRecords}</span> high stress records in the last 30 days
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

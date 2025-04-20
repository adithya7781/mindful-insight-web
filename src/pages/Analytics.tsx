
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BarChart3, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const Analytics = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [departmentData, setDepartmentData] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    avgStressLevel: 0,
    highStressCases: 0
  });
  const [dataLoading, setDataLoading] = useState(true);
  
  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(3000),
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setDepartmentData(data.departmentData || []);
          setEmployeeData(data.employeeData || []);
          setStats(data.stats || {
            totalEmployees: 0,
            avgStressLevel: 0,
            highStressCases: 0
          });
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        toast.error("Failed to load analytics", {
          description: "Please try again later or contact support."
        });
      } finally {
        setDataLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchAnalytics();
    }
  }, [user]);

  if (isLoading || dataLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

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
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Stress Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgStressLevel}%</div>
              <p className="text-xs text-muted-foreground">Company-wide average</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Stress Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highStressCases}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
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
              {departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentData}
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
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No department data available</p>
                  </div>
                </div>
              )}
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
              {employeeData.length > 0 ? (
                employeeData.map((employee) => (
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
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No high stress cases found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

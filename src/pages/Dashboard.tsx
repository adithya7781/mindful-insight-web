import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Activity, AlertTriangle, BarChart4, Calendar, Camera, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  pendingApprovals: number;
  highStressUsers: number;
  mediumStressUsers: number;
  averageStressLevel: number;
}

interface UserStats {
  stressLevel: number;
  lastScan: string;
  scanCount: number;
  highStressIncidents: number;
  approved: boolean;
}

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    highStressUsers: 0,
    mediumStressUsers: 0,
    averageStressLevel: 0,
  });
  
  const [userStats, setUserStats] = useState<UserStats>({
    stressLevel: 0,
    lastScan: "",
    scanCount: 0,
    highStressIncidents: 0,
    approved: false,
  });
  
  const [pendingUsers, setPendingUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    registeredAt: string;
  }>>([]);
  
  const [highStressUsers, setHighStressUsers] = useState<Array<{
    id: string;
    name: string;
    stressLevel: number;
  }>>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
    
    if (user) {
      setUserStats(prev => ({
        ...prev,
        approved: user.isApproved
      }));
      
      if (user.isApproved) {
        fetchUserData();
      }
      
      if (user.role === 'admin') {
        fetchAdminData();
      }
    }
  }, [user, isLoading, navigate]);
  
  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/stress/results`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(3000),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results) {
          const results = data.results;
          const highStressCount = results.filter((r: any) => r.stressLevel === 'high').length;
          const latestScan = results.length > 0 ? results[0].createdAt : '';
          const latestStressLevel = results.length > 0 ? results[0].score : 0;
          
          setUserStats({
            stressLevel: latestStressLevel,
            lastScan: latestScan,
            scanCount: results.length,
            highStressIncidents: highStressCount,
            approved: user.isApproved,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    }
  };
  
  const fetchAdminData = async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const pendingResponse = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/users/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(3000),
      });
      
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        if (pendingData.success && pendingData.users) {
          setPendingUsers(pendingData.users);
        }
      }
      
      const statsResponse = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/users/high-stress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(3000),
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setHighStressUsers(statsData.users);
          setAdminStats({
            totalUsers: statsData.totalUsers || 0,
            pendingApprovals: pendingUsers.length,
            highStressUsers: statsData.users.length,
            mediumStressUsers: statsData.mediumStressUsers || 0,
            averageStressLevel: statsData.averageStressLevel || 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    }
  };
  
  const approveUser = async (userId: string) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/users/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      });
      
      if (response.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        setAdminStats(prev => ({
          ...prev,
          pendingApprovals: prev.pendingApprovals - 1,
          totalUsers: prev.totalUsers + 1
        }));
      }
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };
  
  const handleTakeScan = () => {
    navigate("/dashboard/scan");
  };
  
  const handleViewReports = () => {
    navigate("/dashboard/results");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const isAdmin = user.role === "admin";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin 
              ? "Monitor and manage workplace wellness across your organization." 
              : "Track and manage your stress levels for better workplace wellness."}
          </p>
        </div>

        {isAdmin ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{adminStats.totalUsers}</div>
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{adminStats.pendingApprovals}</div>
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    High Stress Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-stress-high">{adminStats.highStressUsers}</div>
                    <AlertTriangle className="h-6 w-6 text-stress-high" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Stress Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{adminStats.averageStressLevel}%</div>
                    <Activity className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>New Users Requiring Approval</CardTitle>
                  <CardDescription>
                    Review and approve new user registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingUsers.length > 0 ? (
                    <div className="space-y-4">
                      {pendingUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Registered: {new Date(user.registeredAt).toLocaleString()}
                            </p>
                          </div>
                          <Button onClick={() => approveUser(user.id)}>Approve</Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No pending approvals</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>High Stress Alerts</CardTitle>
                  <CardDescription>
                    Users with consistently high stress levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {highStressUsers.length > 0 ? (
                    <div className="space-y-4">
                      {highStressUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-stress-high rounded-full h-3 w-3"></div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Stress Level: {user.stressLevel}%
                              </p>
                            </div>
                          </div>
                          <Button>Contact</Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No high stress users</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            {!userStats.approved ? (
              <Card>
                <CardHeader>
                  <CardTitle>Account Pending Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6">
                    <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-center mb-2">
                      Your account is currently pending approval from an administrator.
                    </p>
                    <p className="text-sm text-muted-foreground text-center mb-6">
                      You'll be able to use the stress detection features once your account is approved.
                    </p>
                    <Button variant="outline">Contact Support</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Current Stress Level
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">{userStats.stressLevel}%</div>
                        <div className={`h-6 w-6 rounded-full ${userStats.stressLevel < 50 ? 'bg-stress-low' : userStats.stressLevel < 75 ? 'bg-stress-medium' : 'bg-stress-high'}`}></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Scans
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">{userStats.scanCount}</div>
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        High Stress Incidents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">{userStats.highStressIncidents}</div>
                        <AlertTriangle className="h-6 w-6 text-stress-high" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Last Scan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {userStats.lastScan ? new Date(userStats.lastScan).toLocaleDateString() : "No scans yet"}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Recent Stress Readings</CardTitle>
                      <CardDescription>
                        Your stress levels over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center">
                        {userStats.scanCount > 0 ? (
                          <div className="w-full h-full">
                            <div className="h-full flex items-center justify-center">
                              <BarChart4 className="h-16 w-16 text-muted-foreground" />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <BarChart4 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No stress readings yet</p>
                            <p className="text-xs text-muted-foreground mt-2">Take your first scan to see results here</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>
                        Monitor and manage your workplace wellness
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        <Button className="w-full" size="lg" onClick={handleTakeScan}>
                          <Camera className="mr-2 h-4 w-4" />
                          Take New Scan
                        </Button>
                        <Button className="w-full" variant="outline" size="lg" onClick={handleViewReports}>
                          <BarChart4 className="mr-2 h-4 w-4" />
                          View Detailed Reports
                        </Button>
                        <Button className="w-full" variant="outline" size="lg">
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Routine Check
                        </Button>
                        <Button className="w-full" variant="ghost" size="lg">
                          <Users className="mr-2 h-4 w-4" />
                          Connect with Wellness Team
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

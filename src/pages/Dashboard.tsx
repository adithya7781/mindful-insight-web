
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Activity, AlertTriangle, BarChart4, Calendar, Camera, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

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

  // Example stats for the admin dashboard
  const adminStats = {
    totalUsers: 48,
    pendingApprovals: 3,
    highStressUsers: 7,
    mediumStressUsers: 15,
    averageStressLevel: 42,
  };

  // Example stats for the user dashboard
  const userStats = {
    stressLevel: 38,
    lastScan: "2023-04-14T15:30:00",
    scanCount: 12,
    highStressIncidents: 2,
    approved: user.isApproved,
  };

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
                  {adminStats.pendingApprovals > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">Sarah Johnson</p>
                          <p className="text-sm text-muted-foreground">
                            sarah.johnson@company.com
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Registered: 2 hours ago
                          </p>
                        </div>
                        <Button>Approve</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">Michael Chen</p>
                          <p className="text-sm text-muted-foreground">
                            michael.chen@company.com
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Registered: 5 hours ago
                          </p>
                        </div>
                        <Button>Approve</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">Alex Rodriguez</p>
                          <p className="text-sm text-muted-foreground">
                            alex.r@company.com
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Registered: 1 day ago
                          </p>
                        </div>
                        <Button>Approve</Button>
                      </div>
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-stress-high rounded-full h-3 w-3"></div>
                        <div>
                          <p className="font-medium">David Wilson</p>
                          <p className="text-sm text-muted-foreground">
                            Stress Level: 87%
                          </p>
                        </div>
                      </div>
                      <Button>Contact</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-stress-high rounded-full h-3 w-3"></div>
                        <div>
                          <p className="font-medium">Emma Thompson</p>
                          <p className="text-sm text-muted-foreground">
                            Stress Level: 82%
                          </p>
                        </div>
                      </div>
                      <Button>Contact</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-stress-high rounded-full h-3 w-3"></div>
                        <div>
                          <p className="font-medium">James Miller</p>
                          <p className="text-sm text-muted-foreground">
                            Stress Level: 79%
                          </p>
                        </div>
                      </div>
                      <Button>Contact</Button>
                    </div>
                  </div>
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
                        {new Date(userStats.lastScan).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Recent Stress Readings</CardTitle>
                      <CardDescription>
                        Your stress levels over the past week
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="text-center">
                          <BarChart4 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Stress level chart will appear here</p>
                        </div>
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
                        <Button className="w-full" size="lg">
                          <Camera className="mr-2 h-4 w-4" />
                          Take New Scan
                        </Button>
                        <Button className="w-full" variant="outline" size="lg">
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

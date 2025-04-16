
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BarChart4, 
  Camera, 
  Home, 
  LogOut, 
  Menu, 
  Settings, 
  User, 
  Users 
} from "lucide-react";

import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/login");
  };

  // Generate user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const nameParts = user.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`;
    }
    return nameParts[0][0];
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar for desktop */}
        <Sidebar className="hidden md:flex">
          <SidebarHeader className="px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <BarChart4 className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">StressDetect</h1>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/dashboard">
                        <Home />
                        <span>Home</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {user?.role === "user" && (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <a href="/dashboard/scan">
                            <Camera />
                            <span>Scan</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <a href="/dashboard/results">
                            <BarChart4 />
                            <span>My Results</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </>
                  )}
                  
                  {user?.role === "admin" && (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <a href="/dashboard/users">
                            <Users />
                            <span>Manage Users</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <a href="/dashboard/analytics">
                            <BarChart4 />
                            <span>Analytics</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/dashboard/profile">
                        <User />
                        <span>Profile</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/dashboard/settings">
                        <Settings />
                        <span>Settings</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src="" alt={user?.name || "User"} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === "admin" ? "HR Admin" : "IT Professional"}
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </SidebarFooter>
        </Sidebar>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile header */}
          <header className="bg-background border-b md:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <BarChart4 className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">StressDetect</h1>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}>
                <Menu />
              </Button>
            </div>
            
            {/* Mobile sidebar menu */}
            {isMobileSidebarOpen && (
              <div className="p-4 bg-background border-b">
                <nav className="flex flex-col space-y-4">
                  <a href="/dashboard" className="flex items-center gap-2 p-2 hover:bg-muted rounded-md">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </a>
                  
                  {user?.role === "user" && (
                    <>
                      <a href="/dashboard/scan" className="flex items-center gap-2 p-2 hover:bg-muted rounded-md">
                        <Camera className="h-4 w-4" />
                        <span>Scan</span>
                      </a>
                      <a href="/dashboard/results" className="flex items-center gap-2 p-2 hover:bg-muted rounded-md">
                        <BarChart4 className="h-4 w-4" />
                        <span>My Results</span>
                      </a>
                    </>
                  )}
                  
                  {user?.role === "admin" && (
                    <>
                      <a href="/dashboard/users" className="flex items-center gap-2 p-2 hover:bg-muted rounded-md">
                        <Users className="h-4 w-4" />
                        <span>Manage Users</span>
                      </a>
                      <a href="/dashboard/analytics" className="flex items-center gap-2 p-2 hover:bg-muted rounded-md">
                        <BarChart4 className="h-4 w-4" />
                        <span>Analytics</span>
                      </a>
                    </>
                  )}
                  
                  <Separator />
                  
                  <a href="/dashboard/profile" className="flex items-center gap-2 p-2 hover:bg-muted rounded-md">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </a>
                  <a href="/dashboard/settings" className="flex items-center gap-2 p-2 hover:bg-muted rounded-md">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </a>
                  
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </nav>
              </div>
            )}
          </header>
          
          {/* Page content */}
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;

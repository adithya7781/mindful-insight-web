
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Mail, Search, UserCheck, UserX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types";
import { useToast } from "@/components/ui/use-toast";

// Mock users data
const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@company.com",
    role: "user",
    isApproved: true,
    createdAt: new Date("2023-01-15"),
  },
  {
    id: "2",
    name: "Sara Johnson",
    email: "sara.j@company.com",
    role: "user",
    isApproved: true,
    createdAt: new Date("2023-02-20"),
  },
  {
    id: "3",
    name: "Michael Chen",
    email: "m.chen@company.com",
    role: "user",
    isApproved: false,
    createdAt: new Date("2023-04-10"),
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.d@company.com",
    role: "user",
    isApproved: true,
    createdAt: new Date("2023-03-05"),
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david.w@company.com",
    role: "user",
    isApproved: true,
    createdAt: new Date("2023-01-30"),
  },
  {
    id: "6",
    name: "Rachel Green",
    email: "rachel.g@company.com",
    role: "user",
    isApproved: false,
    createdAt: new Date("2023-04-12"),
  },
  {
    id: "7",
    name: "Alex Rodriguez",
    email: "alex.r@company.com",
    role: "user",
    isApproved: false,
    createdAt: new Date("2023-04-14"),
  },
];

const ManageUsers = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(MOCK_USERS);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    // Filter users based on search query
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleApprove = (userId: string) => {
    // Update user approval status
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, isApproved: true } : u
    );
    setUsers(updatedUsers);
    
    toast({
      title: "User Approved",
      description: "The user can now access the stress detection features.",
    });
  };

  const handleSendEmail = (userId: string) => {
    // In a real application, this would send an email through the backend
    const userToEmail = users.find((u) => u.id === userId);
    
    if (userToEmail) {
      toast({
        title: "Email Sent",
        description: `An email has been sent to ${userToEmail.name}.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground mt-1">
            Review, approve and manage user accounts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Approve new users and manage existing accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">
                Filter
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          {user.isApproved ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!user.isApproved && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 gap-1"
                                onClick={() => handleApprove(user.id)}
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                  Approve
                                </span>
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 gap-1"
                              onClick={() => handleSendEmail(user.id)}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Email
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              New users waiting for account approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.filter((u) => !u.isApproved).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending approvals</p>
                </div>
              ) : (
                filteredUsers
                  .filter((u) => !u.isApproved)
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Registered: {user.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleApprove(user.id)}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button variant="outline" onClick={() => handleSendEmail(user.id)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;

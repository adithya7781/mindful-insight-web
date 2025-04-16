
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, BarChart3, Calendar, Check, XCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StressResult } from "@/types";

// Mock data for demonstration purposes
const mockResults: StressResult[] = [
  {
    id: "1",
    userId: "user1",
    stressLevel: "low",
    score: 25,
    createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
    notes: "Feeling relaxed after weekend"
  },
  {
    id: "2",
    userId: "user1",
    stressLevel: "medium",
    score: 60,
    createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
    notes: "Project deadline approaching"
  },
  {
    id: "3",
    userId: "user1",
    stressLevel: "high",
    score: 85,
    createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
    notes: "Critical issue with production server"
  }
];

const Results = () => {
  const { user } = useAuth();
  const [results] = useState<StressResult[]>(mockResults);
  
  const getStressIcon = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low":
        return <Check className="h-6 w-6 text-green-500" />;
      case "medium":
        return <AlertCircle className="h-6 w-6 text-amber-500" />;
      case "high":
        return <XCircle className="h-6 w-6 text-red-500" />;
    }
  };
  
  const getStressColor = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "high":
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stress Results</h1>
          <p className="text-muted-foreground mt-1">
            View your stress analysis history
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Stress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{
                Math.round(results.reduce((acc, result) => acc + result.score, 0) / results.length)
              }%</div>
              <p className="text-xs text-muted-foreground">Over the last {results.length} scans</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Latest Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results[0]?.score || 0}%</div>
              <p className="text-xs text-muted-foreground">{
                results[0]?.createdAt ? new Date(results[0].createdAt).toLocaleDateString() : "N/A"
              }</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stress History</CardTitle>
            <CardDescription>
              Your stress levels over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.length > 0 ? (
                results.map((result) => (
                  <div key={result.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                      {getStressIcon(result.stressLevel)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStressColor(result.stressLevel)}`}>
                            {result.stressLevel.toUpperCase()} - {result.score}%
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(result.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {result.notes && (
                        <p className="text-sm mt-2">{result.notes}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No results yet</h3>
                  <p className="text-muted-foreground">
                    Complete your first stress scan to see results here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Results;

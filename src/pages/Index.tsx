
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ActivitySquare, BarChart3, BrainCircuit, Camera, ChevronRight, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b py-4 px-6 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">StressDetect</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Log in
            </Button>
            <Button onClick={() => navigate("/register")}>Sign up</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                AI-Powered Workplace Stress Detection
              </h1>
              <p className="text-xl text-muted-foreground max-w-prose">
                Monitor and manage workplace stress levels with our advanced ML algorithm. Achieve 85-90% accuracy in real-time stress detection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Button size="lg" onClick={() => navigate("/register")}>
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-md aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                <div className="relative w-4/5 aspect-video bg-card rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
                  <div className="z-10 flex flex-col items-center gap-2">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <BrainCircuit className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-semibold text-center">Stress Analysis Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Advanced Stress Detection Features
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Our platform provides comprehensive tools for both IT professionals and HR administrators to monitor and manage workplace stress.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real-time Analysis</h3>
                <p className="text-muted-foreground">
                  Analyze stress levels through facial expressions and physical indicators using our advanced machine learning algorithms.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Detailed Analytics</h3>
                <p className="text-muted-foreground">
                  View comprehensive reports and trends to identify patterns and take proactive measures for workplace wellness.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Alert System</h3>
                <p className="text-muted-foreground">
                  Automated notifications for HR when employees show signs of severe stress, enabling timely intervention.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Role Section */}
      <section className="py-16 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Designed for Multiple Roles
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Our platform caters to both IT professionals and HR administrators with specialized features for each role.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-accent/30 text-accent-foreground flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">IT Professionals</h3>
                </div>
                <ul className="space-y-3 mt-4">
                  <li className="flex gap-2">
                    <ActivitySquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Monitor personal stress levels in real-time</span>
                  </li>
                  <li className="flex gap-2">
                    <ActivitySquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Track progress and identify stress triggers</span>
                  </li>
                  <li className="flex gap-2">
                    <ActivitySquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Receive notifications for high stress levels</span>
                  </li>
                  <li className="flex gap-2">
                    <ActivitySquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Access resources for stress management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-secondary/30 text-secondary-foreground flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">HR Administrators</h3>
                </div>
                <ul className="space-y-3 mt-4">
                  <li className="flex gap-2">
                    <ActivitySquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Oversee organization-wide stress levels</span>
                  </li>
                  <li className="flex gap-2">
                    <ActivitySquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Manage user access and permissions</span>
                  </li>
                  <li className="flex gap-2">
                    <ActivitySquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Receive alerts for employees with high stress</span>
                  </li>
                  <li className="flex gap-2">
                    <ActivitySquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Generate comprehensive analytics reports</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-b from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Start Monitoring Workplace Wellness Today
            </h2>
            <p className="text-muted-foreground mb-8">
              Join organizations that prioritize employee wellbeing with our cutting-edge stress detection technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/register")}>
                Create Account
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                <Lock className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-3">StressDetect</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    News
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Contact</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Sales
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Partnerships
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t text-center text-muted-foreground">
            <p>© 2023 StressDetect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

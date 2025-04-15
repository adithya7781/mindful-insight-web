
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";

const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container max-w-screen-lg px-4 py-8 grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex flex-col space-y-4">
          <h1 className="text-4xl font-bold text-secondary">
            Workplace Wellness
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor and manage your stress levels for a more balanced work life.
          </p>
          <div className="flex flex-col gap-4 max-w-md mt-4">
            <div className="p-4 bg-card rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-1">Real-time Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Get accurate stress level assessment through advanced image processing.
              </p>
            </div>
            <div className="p-4 bg-card rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-1">Early Intervention</h3>
              <p className="text-sm text-muted-foreground">
                Receive timely notifications when stress levels become concerning.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;

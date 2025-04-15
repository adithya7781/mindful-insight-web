
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import RegisterForm from "@/components/auth/RegisterForm";

const Register = () => {
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
            Join Our Wellness Platform
          </h1>
          <p className="text-xl text-muted-foreground">
            Create an account to begin monitoring and managing your workplace stress.
          </p>
          <div className="flex flex-col gap-4 max-w-md mt-4">
            <div className="p-4 bg-card rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-1">For IT Professionals</h3>
              <p className="text-sm text-muted-foreground">
                Track your stress levels and receive personalized recommendations for maintaining wellbeing.
              </p>
            </div>
            <div className="p-4 bg-card rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-1">85-90% Accuracy</h3>
              <p className="text-sm text-muted-foreground">
                Our advanced algorithms ensure reliable stress detection and analysis.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register;

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-semibold">Page not found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>
        <Button onClick={() => navigate("/")} className="gap-2 bg-gradient-calm hover:opacity-90">
          <Home className="w-4 h-4" />
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

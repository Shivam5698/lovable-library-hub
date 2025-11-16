import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Library, Users, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-library-cream via-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-gradient">
              LibraryHub
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your digital gateway to thousands of books. Borrow, read, and manage your library experience seamlessly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="btn-gradient text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
              onClick={() => navigate("/inventory")}
            >
              Browse Collection
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="card-elevated p-6 space-y-3 text-center">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <Library className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Vast Collection</h3>
            <p className="text-muted-foreground">
              Access thousands of books across multiple genres and categories
            </p>
          </div>

          <div className="card-elevated p-6 space-y-3 text-center">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mx-auto">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold">Easy Management</h3>
            <p className="text-muted-foreground">
              Track your loans, due dates, and reading history in one place
            </p>
          </div>

          <div className="card-elevated p-6 space-y-3 text-center">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto">
              <Clock className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Flexible Borrowing</h3>
            <p className="text-muted-foreground">
              14-day loan periods with automatic renewal notifications
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

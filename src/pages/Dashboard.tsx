import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, AlertCircle, Library } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Loan {
  id: number;
  due_date: string;
  status: string;
  books: {
    title: string;
    author: string;
    cover_image_url: string | null;
  };
}

interface Profile {
  first_name: string;
  last_name: string;
  library_card_id: string;
  total_fines: number;
  account_status: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();

      if (profileData) setProfile(profileData);

      // Fetch active loans
      const { data: loansData } = await supabase
        .from("loans")
        .select(`
          id,
          due_date,
          status,
          books (
            title,
            author,
            cover_image_url
          )
        `)
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("due_date", { ascending: true });

      if (loansData) setLoans(loansData as any);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">
              Welcome back, {profile?.first_name}!
            </h1>
            <p className="text-muted-foreground">
              Card ID: <span className="font-mono font-medium">{profile?.library_card_id}</span>
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loans.length}</div>
                <p className="text-xs text-muted-foreground">Books currently borrowed</p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{profile?.total_fines?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground">Outstanding balance</p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                <Library className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={profile?.account_status === "active" ? "default" : "destructive"}>
                    {profile?.account_status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Your account standing</p>
              </CardContent>
            </Card>
          </div>

          {/* Current Loans */}
          <Card>
            <CardHeader>
              <CardTitle>Current Loans</CardTitle>
              <CardDescription>Books you've borrowed</CardDescription>
            </CardHeader>
            <CardContent>
              {loans.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active loans</p>
                  <Button onClick={() => navigate("/inventory")} className="mt-4">
                    Browse Books
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {loans.map((loan) => {
                    const daysUntilDue = getDaysUntilDue(loan.due_date);
                    return (
                      <div key={loan.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                        <div className="h-20 w-16 bg-muted rounded flex-shrink-0 overflow-hidden">
                          {loan.books.cover_image_url ? (
                            <img src={loan.books.cover_image_url} alt={loan.books.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{loan.books.title}</h4>
                          <p className="text-sm text-muted-foreground">{loan.books.author}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span className={daysUntilDue < 3 ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {daysUntilDue > 0 ? `${daysUntilDue} days left` : "Overdue"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

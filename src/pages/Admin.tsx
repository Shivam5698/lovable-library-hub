import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: number;
  name: string;
}

interface Loan {
  id: number;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  books: { title: string; author: string };
  profiles: { first_name: string; last_name: string; email: string };
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Add Book Form State
  const [bookForm, setBookForm] = useState({
    isbn: "",
    title: "",
    author: "",
    category_id: "",
    description: "",
    publication_year: "",
    total_copies: "1",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .single();

      if (error) throw error;

      if (data?.role === "admin") {
        setIsAdmin(true);
        fetchAdminData();
      } else {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (categoriesData) setCategories(categoriesData);

      // Fetch all loans
      const { data: loansData } = await supabase
        .from("loans")
        .select(`
          *,
          books (title, author),
          profiles (first_name, last_name, email)
        `)
        .order("issue_date", { ascending: false })
        .limit(50);

      if (loansData) setLoans(loansData as any);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from("books").insert([
        {
          ...bookForm,
          category_id: parseInt(bookForm.category_id),
          publication_year: parseInt(bookForm.publication_year),
          total_copies: parseInt(bookForm.total_copies),
          available_copies: parseInt(bookForm.total_copies),
        },
      ]);

      if (error) throw error;

      toast({
        title: "Book added successfully!",
        description: `${bookForm.title} has been added to the library.`,
      });

      // Reset form
      setBookForm({
        isbn: "",
        title: "",
        author: "",
        category_id: "",
        description: "",
        publication_year: "",
        total_copies: "1",
      });
    } catch (error: any) {
      toast({
        title: "Error adding book",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReturnBook = async (loanId: number) => {
    try {
      const { data, error } = await supabase.rpc("return_book_transaction", {
        p_loan_id: loanId,
      });

      if (error) throw error;

      const result = data as { success: boolean; fine: number; message?: string };

      if (result.success) {
        toast({
          title: "Book returned successfully!",
          description: result.fine > 0 ? `Fine: £${result.fine.toFixed(2)}` : "No fine incurred.",
        });
        fetchAdminData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage library operations</p>
          </div>

          <Tabs defaultValue="books" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="books" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Books
              </TabsTrigger>
              <TabsTrigger value="loans" className="gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Loans
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="books" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Book</CardTitle>
                  <CardDescription>Add a book to the library inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddBook} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="isbn">ISBN</Label>
                        <Input
                          id="isbn"
                          value={bookForm.isbn}
                          onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={bookForm.title}
                          onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author">Author</Label>
                        <Input
                          id="author"
                          value={bookForm.author}
                          onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={bookForm.category_id} onValueChange={(value) => setBookForm({ ...bookForm, category_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Publication Year</Label>
                        <Input
                          id="year"
                          type="number"
                          value={bookForm.publication_year}
                          onChange={(e) => setBookForm({ ...bookForm, publication_year: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="copies">Total Copies</Label>
                        <Input
                          id="copies"
                          type="number"
                          min="1"
                          value={bookForm.total_copies}
                          onChange={(e) => setBookForm({ ...bookForm, total_copies: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={bookForm.description}
                        onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="btn-gradient">Add Book</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="loans">
              <Card>
                <CardHeader>
                  <CardTitle>Loan Management</CardTitle>
                  <CardDescription>View and manage all book loans</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book</TableHead>
                          <TableHead>Borrower</TableHead>
                          <TableHead>Issue Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loans.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{loan.books.title}</div>
                                <div className="text-sm text-muted-foreground">{loan.books.author}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div>{loan.profiles.first_name} {loan.profiles.last_name}</div>
                                <div className="text-sm text-muted-foreground">{loan.profiles.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{new Date(loan.issue_date).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(loan.due_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={loan.status === "active" ? "default" : "secondary"}>
                                {loan.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {loan.status === "active" && (
                                <Button size="sm" onClick={() => handleReturnBook(loan.id)}>
                                  Process Return
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage library members</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">User management features coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;

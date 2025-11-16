import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// ------------------------------------------------------------------
// ⚠️ IMPORTANT INSTRUCTION FOR YOUR PROJECT:
// 1. Jab aap isse apne VS Code mein dalein, toh niche wali 2 lines ko UNCOMMENT karein:
// import { useAuth } from "@/hooks/useAuth";
// import { supabase } from "@/integrations/supabase/client";
//
// 2. Aur niche jo "MOCK DATA FOR PREVIEW" section hai, usse DELETE kar dein.
// ------------------------------------------------------------------

// --- START: MOCK DATA FOR PREVIEW (Delete this in your real project) ---
const useAuth = () => ({ user: { id: "test-user" }, loading: false });

// Fake Supabase Client for Demo
const supabase = {
  from: (table: string) => ({
    select: (cols: string) => ({
      order: () => Promise.resolve({ 
        data: [
          { id: 1, title: "System Design", author: "Alex Xu", available_copies: 5, total_copies: 5, publication_year: 2024, description: "Learn how to design scalable systems." },
          { id: 2, title: "React for Beginners", author: "Bob Smith", available_copies: 2, total_copies: 3, publication_year: 2023, description: "Master React basics." }
        ], 
        error: null 
      })
    })
  }),
  rpc: (funcName: string, params: any) => {
    console.log("Calling SQL Function:", funcName, params);
    return Promise.resolve({ 
      data: { success: true, message: "Book borrowed successfully!" }, 
      error: null 
    });
  }
};
// --- END MOCK DATA ---

interface Book {
  id: number;
  title: string;
  author: string;
  available_copies: number;
  total_copies: number;
  category_id: number;
  description: string;
  publication_year: number;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [borrowingId, setBorrowingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      // navigate("/auth"); // Commented for demo
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("title");
    
    if (error) {
      console.error("Error fetching books:", error);
    } else {
      setBooks(data as any || []);
    }
    setLoading(false);
  };

  const handleBorrow = async (book: Book) => {
    if (!user) return;
    setBorrowingId(book.id);

    // Demo UX: Show loading state
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Call the SQL function we created
      const { data, error } = await supabase.rpc("borrow_book", {
        p_book_id: book.id,
        p_user_id: user.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };

      if (result.success) {
        toast({
          title: "Success!",
          description: `You have borrowed "${book.title}". Due in 14 days.`,
        });
        
        // OPTIMISTIC UPDATE: UI ko turant update karte hain taaki user ko wait na karna pade
        // (Real project mein fetchBooks() bhi chalega, par ye faster feel deta hai)
        setBooks(books.map(b => 
          b.id === book.id 
            ? { ...b, available_copies: b.available_copies - 1 } 
            : b
        ));

      } else {
        toast({
          title: "Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBorrowingId(null);
    }
  };

  // Filter books based on search
  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-12 w-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
       <Header />
      <main className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Library Catalog</h1>
            <p className="text-muted-foreground">Browse and borrow books</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title or author..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No books found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant={book.available_copies > 0 ? "outline" : "destructive"} className="mb-2">
                      {book.available_copies > 0 ? "Available" : "Out of Stock"}
                    </Badge>
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {book.description || "No description available."}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Published: {book.publication_year || "N/A"}</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-medium">
                      Stock: <span className={book.available_copies < 2 ? "text-red-500 font-bold" : ""}>{book.available_copies}</span> / {book.total_copies}
                    </span>
                    <Button 
                      onClick={() => handleBorrow(book)} 
                      disabled={book.available_copies <= 0 || borrowingId === book.id}
                      className="btn-gradient"
                      size="sm"
                    >
                      {borrowingId === book.id ? "Processing..." : "Borrow Now"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

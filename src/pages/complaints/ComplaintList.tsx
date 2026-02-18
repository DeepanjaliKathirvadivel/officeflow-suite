import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, PlusCircle, Search } from "lucide-react";

const priorityColor = (p: string) => {
  switch (p) { case "high": return "destructive"; case "medium": return "secondary"; default: return "outline"; }
};
const statusColor = (s: string) => {
  switch (s) { case "open": return "destructive"; case "in_progress": return "secondary"; default: return "default"; }
};

export default function ComplaintList() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("complaints").select("*, complaint_assignments(assigned_department)").order("created_at", { ascending: false }).then(({ data }) => setComplaints(data || []));
  }, []);

  const filtered = complaints.filter(
    (c) => c.description.toLowerCase().includes(search.toLowerCase()) || c.category.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Complaints</h2>
        </div>
        <Link to="/complaints/new"><Button><PlusCircle className="mr-2 h-4 w-4" />New Complaint</Button></Link>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search complaints..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No complaints found.</p>
        ) : (
          filtered.map((c) => (
            <Link key={c.id} to={`/complaints/${c.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer mb-3">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.description.slice(0, 80)}{c.description.length > 80 ? "..." : ""}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-1">
                      {c.category} · {(c.complaint_assignments as any)?.[0]?.assigned_department || "Unassigned"}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={priorityColor(c.priority) as any} className="capitalize text-xs">{c.priority}</Badge>
                    <Badge variant={statusColor(c.status) as any} className="capitalize text-xs">{c.status.replace("_", " ")}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

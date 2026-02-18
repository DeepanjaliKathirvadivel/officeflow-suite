import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box, PlusCircle, Search } from "lucide-react";

export default function AssetList() {
  const { hasRole } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("assets").select("*").order("created_at", { ascending: false }).then(({ data }) => setAssets(data || []));
  }, []);

  const filtered = assets.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.asset_code.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) => {
    switch (s) {
      case "available": return "default";
      case "issued": return "secondary";
      case "overdue": return "destructive";
      case "damaged": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Box className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Assets</h2>
        </div>
        {hasRole("admin") && (
          <Link to="/assets/register"><Button><PlusCircle className="mr-2 h-4 w-4" />Register Asset</Button></Link>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <Link key={a.id} to={`/assets/${a.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 space-y-2">
                {a.image_url && <img src={a.image_url} alt={a.name} className="h-32 w-full object-cover rounded-lg" />}
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.asset_code} · {a.asset_type}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{a.department}</span>
                  <Badge variant={statusColor(a.status) as any} className="capitalize text-xs">{a.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No assets found.</p>}
    </div>
  );
}

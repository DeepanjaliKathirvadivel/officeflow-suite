import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, PlusCircle, Search } from "lucide-react";

export default function CourierList() {
  const { hasRole } = useAuth();
  const [couriers, setCouriers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCouriers = async () => {
      const { data: courierData } = await supabase.from("couriers").select("*, courier_vendors(name)").order("created_at", { ascending: false });
      if (!courierData) { setCouriers([]); return; }
      const userIds = [...new Set(courierData.map((c) => c.assigned_to))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.full_name]));
      setCouriers(courierData.map((c) => ({ ...c, assigned_name: profileMap[c.assigned_to] || "Unknown" })));
    };
    fetchCouriers();
  }, []);

  const filtered = couriers.filter(
    (c) =>
      c.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      (c.courier_vendors as any)?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const isReception = hasRole("reception") || hasRole("admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Courier Parcels</h2>
        </div>
        {isReception && (
          <Link to="/couriers/new">
            <Button><PlusCircle className="mr-2 h-4 w-4" />New Entry</Button>
          </Link>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search tracking number or vendor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No courier entries found.</p>
        ) : (
          filtered.map((c) => (
            <Link key={c.id} to={`/couriers/${c.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{c.tracking_number}</p>
                    <p className="text-sm text-muted-foreground">{(c.courier_vendors as any)?.name} → {c.assigned_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={c.status === "collected" ? "default" : "secondary"} className="capitalize">
                    {c.status.replace("_", " ")}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

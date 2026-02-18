import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function CourierDashboard() {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const monthlyRef = useRef<HTMLCanvasElement>(null);
  const vendorRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    supabase.from("couriers").select("*, courier_vendors(name), courier_acknowledgements(acknowledged_at)").then(({ data }) => setCouriers(data || []));
    supabase.from("courier_vendors").select("*").then(({ data }) => setVendors(data || []));
  }, []);

  useEffect(() => {
    if (!couriers.length) return;
    drawMonthlyChart();
    drawVendorChart();
  }, [couriers]);

  const drawMonthlyChart = () => {
    const canvas = monthlyRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const months: Record<string, number> = {};
    couriers.forEach((c) => {
      const m = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[m] = (months[m] || 0) + 1;
    });

    const keys = Object.keys(months).slice(-6);
    const vals = keys.map((k) => months[k]);
    const max = Math.max(...vals, 1);
    const barW = (w - 80) / keys.length;

    ctx.fillStyle = "hsl(var(--muted-foreground))";
    ctx.font = "11px sans-serif";
    keys.forEach((k, i) => {
      const barH = (vals[i] / max) * (h - 60);
      ctx.fillStyle = "hsl(var(--primary))";
      ctx.fillRect(50 + i * barW + 5, h - 30 - barH, barW - 10, barH);
      ctx.fillStyle = "hsl(var(--muted-foreground))";
      ctx.fillText(k, 50 + i * barW + 5, h - 15);
      ctx.fillText(String(vals[i]), 50 + i * barW + barW / 2 - 5, h - 35 - barH);
    });
  };

  const drawVendorChart = () => {
    const canvas = vendorRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const vendorCounts: Record<string, number> = {};
    couriers.forEach((c) => {
      const name = (c.courier_vendors as any)?.name || "Unknown";
      vendorCounts[name] = (vendorCounts[name] || 0) + 1;
    });

    const entries = Object.entries(vendorCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = Math.max(...entries.map((e) => e[1]), 1);
    const barH = (h - 40) / entries.length;
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

    entries.forEach(([name, count], i) => {
      const barW = (count / max) * (w - 150);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(120, 10 + i * barH + 5, barW, barH - 10);
      ctx.fillStyle = "hsl(var(--muted-foreground))";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(name.slice(0, 15), 115, 10 + i * barH + barH / 2 + 4);
      ctx.textAlign = "left";
      ctx.fillText(String(count), 125 + barW, 10 + i * barH + barH / 2 + 4);
    });
  };

  const totalParcels = couriers.length;
  const collected = couriers.filter((c) => c.status === "collected").length;
  const delayed = couriers.filter((c) => {
    if (c.status === "collected") return false;
    const created = new Date(c.created_at);
    return Date.now() - created.getTime() > 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Courier Dashboard</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalParcels}</p><p className="text-xs text-muted-foreground">Total Parcels</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{collected}</p><p className="text-xs text-muted-foreground">Collected</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalParcels - collected}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{delayed}</p><p className="text-xs text-muted-foreground">Delayed (24h+)</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Parcels</CardTitle></CardHeader>
          <CardContent><canvas ref={monthlyRef} width={400} height={250} className="w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Vendor Performance</CardTitle></CardHeader>
          <CardContent><canvas ref={vendorRef} width={400} height={250} className="w-full" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

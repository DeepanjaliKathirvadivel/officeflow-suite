import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3 } from "lucide-react";

export default function ComplaintDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const categoryRef = useRef<HTMLCanvasElement>(null);
  const priorityRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let query = supabase.from("complaints").select("*").order("created_at", { ascending: false });
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");
    query.then(({ data }) => setComplaints(data || []));
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!complaints.length) return;
    drawBarChart(categoryRef, groupBy(complaints, "category"), "Category");
    drawBarChart(priorityRef, groupBy(complaints, "priority"), "Priority");
    drawPieChart(statusRef, groupBy(complaints, "status"));
  }, [complaints]);

  const groupBy = (arr: any[], key: string) => {
    const m: Record<string, number> = {};
    arr.forEach((c) => { m[c[key]] = (m[c[key]] || 0) + 1; });
    return m;
  };

  const drawBarChart = (ref: React.RefObject<HTMLCanvasElement | null>, data: Record<string, number>, label: string) => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const entries = Object.entries(data);
    const max = Math.max(...entries.map((e) => e[1]), 1);
    const barW = (w - 80) / entries.length;
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

    entries.forEach(([key, val], i) => {
      const barH = (val / max) * (h - 60);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(50 + i * barW + 5, h - 30 - barH, barW - 10, barH);
      ctx.fillStyle = "hsl(var(--muted-foreground))";
      ctx.font = "10px sans-serif";
      ctx.fillText(key.slice(0, 10), 50 + i * barW + 5, h - 15);
      ctx.fillText(String(val), 50 + i * barW + barW / 2 - 5, h - 35 - barH);
    });
  };

  const drawPieChart = (ref: React.RefObject<HTMLCanvasElement | null>, data: Record<string, number>) => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const entries = Object.entries(data);
    const total = entries.reduce((s, e) => s + e[1], 0);
    if (total === 0) return;
    const colors = ["#ef4444", "#f59e0b", "#10b981"];
    let start = 0;
    const cx = w / 2 - 40, cy = h / 2, r = Math.min(cx, cy) - 10;

    entries.forEach(([key, val], i) => {
      const angle = (val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      start += angle;
    });

    // Legend
    entries.forEach(([key, val], i) => {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(w - 110, 20 + i * 22, 12, 12);
      ctx.fillStyle = "hsl(var(--muted-foreground))";
      ctx.font = "11px sans-serif";
      ctx.fillText(`${key} (${val})`, w - 92, 31 + i * 22);
    });
  };

  const open = complaints.filter((c) => c.status === "open").length;
  const closed = complaints.filter((c) => c.status === "closed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Complaint Dashboard</h2>
      </div>

      <div className="flex gap-4 items-end">
        <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" /></div>
        <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" /></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{complaints.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{open}</p><p className="text-xs text-muted-foreground">Open</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{closed}</p><p className="text-xs text-muted-foreground">Closed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{complaints.filter((c) => c.priority === "high").length}</p><p className="text-xs text-muted-foreground">High Priority</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle className="text-base">By Category</CardTitle></CardHeader><CardContent><canvas ref={categoryRef} width={350} height={220} className="w-full" /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">By Priority</CardTitle></CardHeader><CardContent><canvas ref={priorityRef} width={350} height={220} className="w-full" /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Open vs Closed</CardTitle></CardHeader><CardContent><canvas ref={statusRef} width={350} height={220} className="w-full" /></CardContent></Card>
      </div>
    </div>
  );
}

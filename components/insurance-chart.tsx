"use client";

import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { riskData, spendingData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const colors = ["#2f7df6", "#14b8a6", "#111827", "#f59e0b", "#ef4444"];

export function SpendingChart() {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Premiums and Claims</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spendingData} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="premium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2f7df6" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#2f7df6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="claims" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.38} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="premium" stroke="#2f7df6" fill="url(#premium)" strokeWidth={2} />
            <Area type="monotone" dataKey="claims" stroke="#14b8a6" fill="url(#claims)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RiskChart() {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Risk Mix</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
              {riskData.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

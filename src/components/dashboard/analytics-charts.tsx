"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyData {
  month: string;
  total: number;
  accepted: number;
  acceptanceRate: number;
  totalAmount: number;
  grossProfit: number;
}

interface CategoryData {
  name: string;
  revenue: number;
  cost: number;
  profit: number;
  count: number;
}

interface Props {
  monthlyData: MonthlyData[];
  categoryData: CategoryData[];
  showCost: boolean;
}

function formatYen(value: number): string {
  if (value >= 10000000) return `${Math.round(value / 10000000)}千万`;
  if (value >= 10000) return `${Math.round(value / 10000)}万`;
  return `¥${value}`;
}

export function AnalyticsCharts({ monthlyData, categoryData, showCost }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Monthly trend - estimate count */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">月別見積数・受注数</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="見積数" fill="#94a3b8" radius={[2, 2, 0, 0]} />
              <Bar dataKey="accepted" name="受注数" fill="#22c55e" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly trend - amount */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">月別見積金額推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatYen} />
              <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="totalAmount" name="見積総額" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              {showCost && (
                <Line type="monotone" dataKey="grossProfit" name="粗利" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Acceptance rate trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">月別受注率推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line type="monotone" dataKey="acceptanceRate" name="受注率" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category performance */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">カテゴリ別受注実績</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatYen} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" name="売上" fill="#3b82f6" radius={[0, 2, 2, 0]} />
                {showCost && (
                  <Bar dataKey="profit" name="粗利" fill="#22c55e" radius={[0, 2, 2, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

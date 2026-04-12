"use client";

import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface AiPerformanceChartsProps {
  accuracyData: any[];
  confidenceData: any[];
  volumeData: any[];
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export function AiPerformanceCharts({ accuracyData, confidenceData, volumeData }: AiPerformanceChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Accuracy / Override Rate */}
      <Card className="col-span-2 md:col-span-1">
        <CardHeader>
          <CardTitle>AI Acceptance vs Override Rate</CardTitle>
          <CardSubtitle>How often HR accepted vs rejected the AI's proposal</CardSubtitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={accuracyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {accuracyData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name ?? index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Average Confidence Score */}
      <Card className="col-span-2 md:col-span-1">
        <CardHeader>
          <CardTitle>Average AI Confidence</CardTitle>
          <CardSubtitle>Model confidence score over time</CardSubtitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={confidenceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
              <Tooltip formatter={(value) => [`${Math.round(Number(value) * 100)}%`, "Confidence"]} />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volume of AI Evaluations */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>AI Evaluation Volume</CardTitle>
          <CardSubtitle>Number of incidents processed by AI</CardSubtitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Evaluations" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

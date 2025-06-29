
"use client";

import React, { useMemo } from 'react';
import type { UserSettings, LifespanMetrics } from '@/lib/types';
import { calculateLifespanMetrics } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, PieChart, ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, Legend, Pie, Cell } from 'recharts';
import { Settings2 } from 'lucide-react';
import { Button } from '../ui/button';

interface LifespanVisualizerProps {
  settings: UserSettings;
  onOpenSettings: () => void;
}

const CHART_COLORS_BASE = ['primary', 'accent', 'secondary'] as const; // Using theme variable names

const LifespanVisualizer: React.FC<LifespanVisualizerProps> = ({ settings, onOpenSettings }) => {
  const metrics = useMemo(() => {
    try {
      return calculateLifespanMetrics(settings.dob, settings.expectedLifespan, settings.allocations);
    } catch (e) {
      console.error("Error calculating lifespan metrics:", e);
      return null;
    }
  }, [settings.dob, settings.expectedLifespan, settings.allocations]);
  
  const chartColors = useMemo(() => {
    if (typeof window === "undefined") { // Guard against SSR
        return CHART_COLORS_BASE.map(c => `hsl(var(--${c}))`); // Default if CSS vars not loaded
    }
    // Dynamically get colors from CSS variables
    return CHART_COLORS_BASE.map(name => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim());
  }, []);


  if (!metrics) {
     return (
        <div className="text-center py-10">
            <p className="text-destructive text-lg">Could not calculate lifespan data. Please check your Date of Birth in settings.</p>
            <Button onClick={onOpenSettings} variant="link" className="text-accent mt-4">
                <Settings2 className="mr-2 h-4 w-4" /> Go to Settings
            </Button>
        </div>
    );
  }

  const allocationData = Object.entries(metrics.allocatedTime)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      years: parseFloat(value.toFixed(1)),
    }))
    .filter(item => item.years > 0);

  const totalDots = metrics.totalYears;
  const livedDots = metrics.yearsLived;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-popover text-popover-foreground border border-border rounded-md shadow-lg">
          <p className="label font-semibold">{`${label} : ${payload[0].value.toFixed(1)} years`}</p>
          <p className="desc text-xs">{`(${((payload[0].payload.payload?.years / metrics.yearsRemaining) * 100).toFixed(1)}% of remaining)`}</p>
        </div>
      );
    }
    return null;
  };
  
  const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, years }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55; // Position label inside slice
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent * 100 < 5) return null; // Don't render label for very small slices

    return (
        <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
            {`${name} ${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


  return (
    <div className="space-y-8 p-4 md:p-6">
      <Card className="shadow-xl bg-card/90 backdrop-blur-md border-primary/30">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-foreground">Your Finite Existence</CardTitle>
          <CardDescription className="text-muted-foreground">
            You have lived {metrics.yearsLived} years ({metrics.monthsLived} months) of your expected {metrics.totalYears} years.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-accent mb-1">Life Timeline</h3>
            <Progress value={metrics.percentageLived} className="w-full h-4 bg-muted/50" indicatorClassName="bg-primary" />
            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
              <span>{metrics.yearsLived} Years Lived</span>
              <span>{metrics.yearsRemaining} Years Remaining</span>
            </div>
          </div>
          <p className="text-xl text-center text-foreground">
            You have approximately <span className="font-bold text-accent">{metrics.monthsRemaining.toLocaleString()}</span> months remaining.
          </p>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg bg-card/90 backdrop-blur-md border-primary/30">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-foreground">Remaining Time Allocation (Years)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                    data={allocationData} 
                    dataKey="years" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={120} 
                    labelLine={false}
                    label={<PieLabel />}
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} stroke={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--popover), 0.5)' }} />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-card/90 backdrop-blur-md border-primary/30">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-foreground">Years by Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allocationData} layout="vertical" margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}}/>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--popover), 0.5)' }} />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }}/>
                <Bar dataKey="years" radius={[0, 5, 5, 0]}>
                   {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg bg-card/90 backdrop-blur-md border-primary/30">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground">Life in Dots ({totalDots} Years)</CardTitle>
          <CardDescription className="text-muted-foreground">Each dot represents one year of your expected lifespan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1.5 p-3 bg-background/50 rounded-md max-h-96 overflow-y-auto">
            {Array.from({ length: totalDots }).map((_, index) => (
              <div
                key={index}
                className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border border-border/30 transition-all duration-300
                  ${index < livedDots ? 'bg-muted-foreground/70 animate-pulse' : 'bg-primary/70 hover:bg-accent'}`}
                title={`Year ${index + 1}${index < livedDots ? ' (Lived)' : ' (Remaining)'}`}
                data-ai-hint="life dot"
              />
            ))}
          </div>
        </CardContent>
      </Card>
        <div className="text-center mt-6">
            <Button onClick={onOpenSettings} variant="outline" className="text-accent border-accent hover:bg-accent/10 hover:text-accent-foreground">
                <Settings2 className="mr-2 h-4 w-4" /> Adjust Lifespan Settings
            </Button>
        </div>
    </div>
  );
};

export default LifespanVisualizer;


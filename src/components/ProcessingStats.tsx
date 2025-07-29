import React from 'react';
import { ProcessingStats as Stats } from '../types/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ProcessingStatsProps {
  stats: Stats;
}

export const ProcessingStats: React.FC<ProcessingStatsProps> = ({ stats }) => {
  const statItems = [
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-muted-foreground'
    },
    {
      label: 'Processing',
      value: stats.processing,
      icon: Loader2,
      color: 'text-processing'
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-success'
    },
    {
      label: 'Error',
      value: stats.error,
      icon: XCircle,
      color: 'text-destructive'
    }
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Processing Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="text-center space-y-2">
              <div className={`flex justify-center ${item.color}`}>
                <item.icon className={`h-6 w-6 ${item.label === 'Processing' ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
        
        {stats.total > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span>Total Images:</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Success Rate:</span>
              <span className="font-medium">
                {((stats.completed / stats.total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
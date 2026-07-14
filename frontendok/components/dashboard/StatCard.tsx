import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-slate-500 text-sm font-medium tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className="p-3.5 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300 shadow-sm border border-slate-100/50">
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-6 flex items-center gap-2">
          <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-lg ${
            trend.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
          }`}>
            {trend.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trend.value}
          </div>
          <span className="text-slate-400 text-sm font-medium">vs last month</span>
        </div>
      )}
    </div>
  );
}

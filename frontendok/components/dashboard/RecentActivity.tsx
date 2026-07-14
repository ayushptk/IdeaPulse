import { MoreHorizontal } from 'lucide-react';

export function RecentActivity() {
  const activities = [
    { id: 1, user: 'Sarah Jenkins', action: 'purchased', item: 'Wireless Headphones Pro', time: '2 mins ago', amount: '$299', status: 'completed' },
    { id: 2, user: 'Mike Ross', action: 'added to cart', item: 'Mechanical Keyboard', time: '1 hour ago', amount: '$150', status: 'pending' },
    { id: 3, user: 'Emily Chen', action: 'reviewed', item: '4K Gaming Monitor', time: '3 hours ago', amount: '5 stars', status: 'neutral' },
    { id: 4, user: 'David Kim', action: 'purchased', item: 'Ergonomic Mouse', time: '5 hours ago', amount: '$89', status: 'completed' },
    { id: 5, user: 'Alex Foster', action: 'refunded', item: 'USB-C Hub', time: '1 day ago', amount: '-$45', status: 'failed' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
          <p className="text-sm text-slate-500 mt-1">Latest transactions and events</p>
        </div>
        <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      <div className="divide-y divide-slate-100 flex-1 overflow-auto">
        {activities.map((activity) => (
          <div key={activity.id} className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100/50 shadow-sm group-hover:scale-105 transition-transform">
                {activity.user.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm text-slate-800">
                  <span className="font-semibold text-slate-900">{activity.user}</span> {activity.action} <span className="font-medium text-slate-600">{activity.item}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1 font-medium">{activity.time}</p>
              </div>
            </div>
            <div className={`text-sm font-bold ${
              activity.status === 'completed' ? 'text-emerald-600' : 
              activity.status === 'failed' ? 'text-red-600' : 
              'text-slate-700'
            }`}>
              {activity.amount}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button className="w-full py-2.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors">
          View All Activity
        </button>
      </div>
    </div>
  );
}

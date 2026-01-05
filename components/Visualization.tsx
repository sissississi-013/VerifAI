import React from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartType, FactCardData } from '../types';

interface VisualizationProps {
  vizData: FactCardData['visualization'];
}

// More vibrant palette
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const Visualization: React.FC<VisualizationProps> = ({ vizData }) => {
  if (!vizData || !vizData.data || vizData.data.length === 0) return null;

  const tooltipStyle = { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: '8px', 
    border: 'none', 
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    fontSize: '12px',
    color: '#334155'
  };

  const renderChart = () => {
    switch (vizData.type) {
      case ChartType.BAR:
        return (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={vizData.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{fontSize: 9, fill: '#64748b'}} interval={0} />
              <YAxis tick={{fontSize: 9, fill: '#64748b'}} width={30} />
              <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(99, 102, 241, 0.1)'}} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                {vizData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case ChartType.AREA:
        return (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={vizData.data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{fontSize: 9, fill: '#64748b'}} />
              <YAxis tick={{fontSize: 9, fill: '#64748b'}} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case ChartType.LINE:
        return (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={vizData.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{fontSize: 9, fill: '#64748b'}} />
              <YAxis tick={{fontSize: 9, fill: '#64748b'}} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={3} dot={{r: 3, strokeWidth: 0, fill: '#ec4899'}} activeDot={{r: 5}} />
            </LineChart>
          </ResponsiveContainer>
        );
      case ChartType.PIE:
        return (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={vizData.data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {vizData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{fontSize: '10px', color: '#64748b'}} />
            </PieChart>
          </ResponsiveContainer>
        );
      case ChartType.STAT:
        const mainStat = vizData.data[0];
        return (
            <div className="flex flex-col items-center justify-center h-[160px] w-full rounded-lg bg-gradient-to-br from-white/40 to-white/10 border border-white/20">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm">{mainStat.value}</span>
                <span className="text-xs text-slate-600 mt-2 font-semibold text-center px-4 uppercase tracking-wide">{mainStat.name}</span>
            </div>
        )
      default:
        return null;
    }
  };

  return (
    <div className="w-full mt-2 rounded-lg p-1">
      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">{vizData.title}</h4>
      {renderChart()}
    </div>
  );
};

export default Visualization;
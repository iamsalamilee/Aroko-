'use client';

import React, { useMemo, useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AIChartData } from '@/lib/ai/analyze-chart';
import { Trash2, Maximize2, Minimize2 } from 'lucide-react';

type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

const CHART_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

export default function ChartNodeView({ node, deleteNode, selected }: NodeViewProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Parse chart data from node attributes
    const chartData: AIChartData | null = useMemo(() => {
        try {
            const data = node.attrs.chartData;
            if (typeof data === 'string') {
                return JSON.parse(data);
            }
            return data;
        } catch (e) {
            console.error('Failed to parse chart data:', e);
            return null;
        }
    }, [node.attrs.chartData]);

    if (!chartData) {
        return (
            <NodeViewWrapper className="chart-node">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                    <p className="text-red-600 text-sm">Failed to load chart data</p>
                </div>
            </NodeViewWrapper>
        );
    }

    const { chartData: data, seriesNames, chartType, title } = chartData;

    const renderChart = () => {
        const height = isExpanded ? 400 : 250;

        switch (chartType as ChartType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            {seriesNames.map((name, i) => (
                                <Bar key={name} dataKey={name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            {seriesNames.map((name, i) => (
                                <Line
                                    key={name}
                                    type="monotone"
                                    dataKey={name}
                                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                const pieData = data.map((d, i) => ({
                    name: String(d.name),
                    value: Number(d[seriesNames[0]]) || 0,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                }));

                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={isExpanded ? 120 : 80}
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                                {pieData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'scatter':
                if (seriesNames.length >= 2) {
                    const scatterData = data.map((d) => ({
                        x: Number(d[seriesNames[0]]) || 0,
                        y: Number(d[seriesNames[1]]) || 0,
                        name: d.name,
                    }));

                    return (
                        <ResponsiveContainer width="100%" height={height}>
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="x" name={seriesNames[0]} tick={{ fontSize: 12 }} />
                                <YAxis type="number" dataKey="y" name={seriesNames[1]} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Legend />
                                <Scatter
                                    name={`${seriesNames[0]} vs ${seriesNames[1]}`}
                                    data={scatterData}
                                    fill={CHART_COLORS[0]}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    );
                } else {
                    const scatterData = data.map((d, i) => ({
                        x: i + 1,
                        y: Number(d[seriesNames[0]]) || 0,
                        name: d.name,
                    }));

                    return (
                        <ResponsiveContainer width="100%" height={height}>
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="x" name="Index" tick={{ fontSize: 12 }} />
                                <YAxis type="number" dataKey="y" name={seriesNames[0]} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name={seriesNames[0]} data={scatterData} fill={CHART_COLORS[0]} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    );
                }

            default:
                return <div className="p-4 text-gray-500 text-center">Unsupported chart type</div>;
        }
    };

    return (
        <NodeViewWrapper className="chart-node my-4">
            <div
                className={`relative border rounded-lg overflow-hidden bg-white transition-all ${selected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-sm'
                    }`}
            >
                {/* Chart Header - Clean look */}
                <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-sm text-gray-800">{title}</h3>
                        <p className="text-xs text-gray-500">{chartType?.toUpperCase()} • {seriesNames?.join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-500"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                        <button
                            onClick={deleteNode}
                            className="p-1.5 hover:bg-red-100 hover:text-red-600 rounded transition-colors text-gray-500"
                            title="Delete chart"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Chart Content */}
                <div className="p-4 bg-white">
                    {renderChart()}
                </div>
            </div>
        </NodeViewWrapper>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, PieChart as PieChartIcon, ScatterChart as ScatterIcon, Sparkles, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { generateChartDataWithAI, AIChartData, RechartsDataPoint } from '@/lib/ai/analyze-chart';
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

// Default colors for chart series
const CHART_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

interface ChartGeneratorProps {
    tableHTML: string;
    onInsert: (chartData: AIChartData) => void;
    onClose: () => void;
}

export default function ChartGenerator({ tableHTML, onInsert, onClose }: ChartGeneratorProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<AIChartData | null>(null);
    const [selectedType, setSelectedType] = useState<ChartType>('bar');
    const [selectedPieSeries, setSelectedPieSeries] = useState<string>('');

    // AI generates chart data on mount
    useEffect(() => {
        const generate = async () => {
            setIsLoading(true);
            setError(null);

            const result = await generateChartDataWithAI(tableHTML);

            if (result.success && result.data) {
                setChartData(result.data);
                setSelectedType(result.data.chartType);
                // Default to first series for pie chart
                if (result.data.seriesNames.length > 0) {
                    setSelectedPieSeries(result.data.seriesNames[0]);
                }
            } else {
                setError(result.error || 'Failed to analyze table data');
            }

            setIsLoading(false);
        };

        generate();
    }, [tableHTML]);

    const handleInsert = () => {
        if (chartData) {
            // Update chart type if user changed it
            const finalData = { ...chartData, chartType: selectedType };
            onInsert(finalData);
            onClose();
        }
    };

    const chartTypes = [
        { type: 'bar' as ChartType, label: 'Bar', icon: <BarChart3 size={20} /> },
        { type: 'line' as ChartType, label: 'Line', icon: <TrendingUp size={20} /> },
        { type: 'pie' as ChartType, label: 'Pie', icon: <PieChartIcon size={20} /> },
        { type: 'scatter' as ChartType, label: 'Scatter', icon: <ScatterIcon size={20} /> },
    ];

    const renderChart = () => {
        if (!chartData) return null;

        const { chartData: data, seriesNames } = chartData;

        switch (selectedType) {
            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {seriesNames.map((name, i) => (
                            <Bar key={name} dataKey={name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {seriesNames.map((name, i) => (
                            <Line key={name} type="monotone" dataKey={name} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} />
                        ))}
                    </LineChart>
                );

            case 'pie':
                // Pie chart uses selected series (user can pick which one)
                const activeSeries = selectedPieSeries || seriesNames[0];
                const pieData = data.map((d, i) => ({
                    name: String(d.name),
                    value: Number(d[activeSeries]) || 0,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                }));

                return (
                    <PieChart>
                        <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                            {pieData.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );

            case 'scatter':
                // Scatter plot: if we have 2 series, use them as x/y
                // Otherwise, use index as x and first series as y
                if (seriesNames.length >= 2) {
                    // Use first series as X, second series as Y
                    const scatterData = data.map((d) => ({
                        x: Number(d[seriesNames[0]]) || 0,
                        y: Number(d[seriesNames[1]]) || 0,
                        name: d.name,
                    }));

                    return (
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="x" name={seriesNames[0]} />
                            <YAxis type="number" dataKey="y" name={seriesNames[1]} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Legend />
                            <Scatter
                                name={`${seriesNames[0]} vs ${seriesNames[1]}`}
                                data={scatterData}
                                fill={CHART_COLORS[0]}
                            />
                        </ScatterChart>
                    );
                } else {
                    // Single series - use index as X
                    const scatterData = data.map((d, i) => ({
                        x: i + 1,
                        y: Number(d[seriesNames[0]]) || 0,
                        name: d.name,
                    }));

                    return (
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="x" name="Index" />
                            <YAxis type="number" dataKey="y" name={seriesNames[0]} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name={seriesNames[0]} data={scatterData} fill={CHART_COLORS[0]} />
                        </ScatterChart>
                    );
                }
        }
    };

    // Get chart warnings
    const getChartWarning = () => {
        if (!chartData) return null;

        if (selectedType === 'pie' && chartData.seriesNames.length > 1) {
            return `Pie chart shows one series at a time. Showing: ${selectedPieSeries || chartData.seriesNames[0]}`;
        }

        if (selectedType === 'scatter' && chartData.seriesNames.length >= 2) {
            return `Scatter shows ${chartData.seriesNames[0]} (X) vs ${chartData.seriesNames[1]} (Y) correlation`;
        }

        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-purple-600" size={20} />
                        <h2 className="text-lg font-semibold text-gray-800">AI Chart Generator</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 size={40} className="animate-spin text-purple-600 mb-4" />
                            <p className="text-gray-600 font-medium">AI is analyzing your table...</p>
                            <p className="text-gray-400 text-sm">Understanding data structure and optimal visualization</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <AlertCircle size={40} className="text-red-500 mb-4" />
                            <p className="text-gray-800 font-medium">Failed to Generate Chart</p>
                            <p className="text-red-600 text-sm mt-2">{error}</p>
                            <button
                                onClick={onClose}
                                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                            >
                                Close
                            </button>
                        </div>
                    )}

                    {/* Chart Content */}
                    {chartData && !isLoading && (
                        <>
                            {/* AI Insight */}
                            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Sparkles size={16} className="text-purple-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-purple-800">AI Analysis</p>
                                        <p className="text-sm text-purple-600 mt-1">{chartData.insight}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Title & Labels */}
                            <div className="mb-4">
                                <p className="text-lg font-semibold text-gray-800 text-center">{chartData.title}</p>
                                <p className="text-xs text-gray-400 text-center mt-1">
                                    X-Axis: {chartData.xAxisLabel} | Y-Axis: {chartData.yAxisLabel}
                                </p>
                            </div>

                            {/* Chart Type Selector */}
                            <div className="flex justify-center gap-2 mb-4">
                                {chartTypes.map(({ type, label, icon }) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedType(type)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${selectedType === type
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            } ${chartData.chartType === type ? 'ring-2 ring-purple-300' : ''}`}
                                    >
                                        {icon}
                                        <span className="text-sm font-medium">{label}</span>
                                        {chartData.chartType === type && (
                                            <span className="text-xs bg-purple-500 text-white px-1.5 rounded-full">AI</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Pie Chart Series Selector */}
                            {selectedType === 'pie' && chartData.seriesNames.length > 1 && (
                                <div className="mb-4 flex justify-center gap-2">
                                    <span className="text-sm text-gray-500">Show series:</span>
                                    {chartData.seriesNames.map((name) => (
                                        <button
                                            key={name}
                                            onClick={() => setSelectedPieSeries(name)}
                                            className={`px-3 py-1 text-sm rounded-lg border ${selectedPieSeries === name
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Chart Warning */}
                            {getChartWarning() && (
                                <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-amber-600" />
                                    <p className="text-xs text-amber-700">{getChartWarning()}</p>
                                </div>
                            )}

                            {/* Chart Preview */}
                            <div className="border rounded-lg p-4 bg-white">
                                <ResponsiveContainer width="100%" height={300}>
                                    {renderChart()}
                                </ResponsiveContainer>
                            </div>

                            {/* Data Table Preview */}
                            <div className="mt-4">
                                <p className="text-xs font-medium text-gray-500 mb-2">Data ({chartData.chartData.length} points)</p>
                                <div className="border rounded-lg overflow-hidden text-xs max-h-32 overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-1 text-left">Name</th>
                                                {chartData.seriesNames.map(s => (
                                                    <th key={s} className="px-2 py-1 text-left">{s}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {chartData.chartData.map((row, i) => (
                                                <tr key={i} className="border-t">
                                                    <td className="px-2 py-1">{row.name}</td>
                                                    {chartData.seriesNames.map(s => (
                                                        <td key={s} className="px-2 py-1">{row[s]}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleInsert}
                        disabled={!chartData || isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        Insert Chart
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TableData, toRechartsData, toPieChartData, CHART_COLORS } from '@/lib/utils/table-parser';

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

interface EditableChartProps {
    data: TableData;
    chartType: ChartType;
    title?: string;
    width?: number;
    height?: number;
    onDataChange?: (newData: TableData) => void;
    editable?: boolean;
}

export default function EditableChart({
    data,
    chartType,
    title,
    width = 500,
    height = 300,
    onDataChange,
    editable = true,
}: EditableChartProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editableData, setEditableData] = useState(data);

    const chartData = toRechartsData(editableData);
    const pieData = toPieChartData(editableData);

    const handleCellEdit = (rowIndex: number, colIndex: number, value: string) => {
        const newRows = [...editableData.rows];
        newRows[rowIndex] = [...newRows[rowIndex]];
        newRows[rowIndex][colIndex] = value;

        // Recalculate datasets
        const newDatasets = newRows.map((row, index) => ({
            name: row[0] || `Series ${index + 1}`,
            data: row.slice(1).map(val => parseFloat(val) || 0),
            color: CHART_COLORS[index % CHART_COLORS.length],
        }));

        const newData = { ...editableData, rows: newRows, datasets: newDatasets };
        setEditableData(newData);
        onDataChange?.(newData);
    };

    const renderChart = () => {
        switch (chartType) {
            case 'bar':
                return (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {editableData.datasets.map((dataset, index) => (
                            <Bar
                                key={dataset.name}
                                dataKey={dataset.name}
                                fill={dataset.color || CHART_COLORS[index]}
                            />
                        ))}
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {editableData.datasets.map((dataset, index) => (
                            <Line
                                key={dataset.name}
                                type="monotone"
                                dataKey={dataset.name}
                                stroke={dataset.color || CHART_COLORS[index]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                            />
                        ))}
                    </LineChart>
                );

            case 'pie':
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
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );

            case 'scatter':
                return (
                    <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="x" type="number" name="X" />
                        <YAxis dataKey="y" type="number" name="Y" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend />
                        {editableData.datasets.map((dataset, index) => (
                            <Scatter
                                key={dataset.name}
                                name={dataset.name}
                                data={dataset.data.map((y, i) => ({ x: i + 1, y }))}
                                fill={dataset.color || CHART_COLORS[index]}
                            />
                        ))}
                    </ScatterChart>
                );

            default:
                return <div>Unsupported chart type</div>;
        }
    };

    return (
        <div className="chart-container border rounded-lg p-4 bg-white shadow-sm">
            {title && (
                <h4 className="text-sm font-semibold text-center text-gray-700 mb-2">{title}</h4>
            )}

            <ResponsiveContainer width="100%" height={height}>
                {renderChart()}
            </ResponsiveContainer>

            {editable && (
                <div className="mt-3 flex justify-center gap-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                    >
                        {isEditing ? 'Done Editing' : 'Edit Data'}
                    </button>
                </div>
            )}

            {isEditing && (
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr>
                                {editableData.headers.map((header, i) => (
                                    <th key={i} className="border px-2 py-1 bg-gray-50">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {editableData.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, colIndex) => (
                                        <td key={colIndex} className="border px-1 py-1">
                                            <input
                                                type="text"
                                                value={cell}
                                                onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                                                className="w-full px-1 py-0.5 text-center border-0 focus:ring-1 focus:ring-blue-300"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/**
 * Utility to convert Recharts charts to PNG images for export
 * This allows charts to be embedded as images in DOCX exports that Word can render
 */

import { AIChartData, RechartsDataPoint } from '@/lib/ai/analyze-chart';

// Chart colors matching ChartNodeView
const CHART_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

/**
 * Generate an SVG string for a chart based on its data
 */
export function generateChartSVG(chartData: AIChartData, width = 600, height = 300): string {
    const { chartData: data, seriesNames, chartType, title } = chartData;
    const padding = { top: 40, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    switch (chartType) {
        case 'bar':
            return generateBarChartSVG(data, seriesNames, title, width, height, padding, chartWidth, chartHeight);
        case 'line':
            return generateLineChartSVG(data, seriesNames, title, width, height, padding, chartWidth, chartHeight);
        case 'pie':
            return generatePieChartSVG(data, seriesNames, title, width, height);
        case 'scatter':
            return generateScatterChartSVG(data, seriesNames, title, width, height, padding, chartWidth, chartHeight);
        default:
            return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" text-anchor="middle">Chart</text></svg>`;
    }
}

function generateBarChartSVG(
    data: RechartsDataPoint[],
    seriesNames: string[],
    title: string,
    width: number,
    height: number,
    padding: { top: number; right: number; bottom: number; left: number },
    chartWidth: number,
    chartHeight: number
): string {
    const maxValue = Math.max(...data.flatMap(d => seriesNames.map(s => Number(d[s]) || 0))) || 1;
    const barGroupWidth = chartWidth / data.length;
    const barWidth = (barGroupWidth * 0.8) / seriesNames.length;
    const barGap = barGroupWidth * 0.1;

    let bars = '';
    data.forEach((d, i) => {
        seriesNames.forEach((series, j) => {
            const value = Number(d[series]) || 0;
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding.left + i * barGroupWidth + barGap + j * barWidth;
            const y = padding.top + chartHeight - barHeight;
            bars += `<rect x="${x}" y="${y}" width="${barWidth - 2}" height="${barHeight}" fill="${CHART_COLORS[j % CHART_COLORS.length]}" />`;
        });
    });

    let labels = '';
    data.forEach((d, i) => {
        const x = padding.left + i * barGroupWidth + barGroupWidth / 2;
        labels += `<text x="${x}" y="${height - 25}" text-anchor="middle" font-size="10" font-family="Arial">${d.name}</text>`;
    });

    const yAxis = `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="#ccc" stroke-width="1"/>`;
    const xAxis = `<line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="#ccc" stroke-width="1"/>`;

    let legend = '';
    seriesNames.forEach((s, i) => {
        const lx = padding.left + i * 100;
        legend += `<rect x="${lx}" y="${height - 12}" width="12" height="12" fill="${CHART_COLORS[i % CHART_COLORS.length]}"/>`;
        legend += `<text x="${lx + 16}" y="${height - 2}" font-size="10" font-family="Arial">${s}</text>`;
    });

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="${width / 2}" y="24" text-anchor="middle" font-weight="bold" font-size="14" font-family="Arial">${title}</text>
        ${yAxis}${xAxis}${bars}${labels}${legend}
    </svg>`;
}

function generateLineChartSVG(
    data: RechartsDataPoint[],
    seriesNames: string[],
    title: string,
    width: number,
    height: number,
    padding: { top: number; right: number; bottom: number; left: number },
    chartWidth: number,
    chartHeight: number
): string {
    const maxValue = Math.max(...data.flatMap(d => seriesNames.map(s => Number(d[s]) || 0))) || 1;
    const stepX = chartWidth / (data.length - 1 || 1);

    let lines = '';
    seriesNames.forEach((series, j) => {
        const points = data.map((d, i) => {
            const value = Number(d[series]) || 0;
            const x = padding.left + i * stepX;
            const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
            return `${x},${y}`;
        }).join(' ');
        lines += `<polyline points="${points}" fill="none" stroke="${CHART_COLORS[j % CHART_COLORS.length]}" stroke-width="2"/>`;

        data.forEach((d, i) => {
            const value = Number(d[series]) || 0;
            const x = padding.left + i * stepX;
            const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
            lines += `<circle cx="${x}" cy="${y}" r="4" fill="${CHART_COLORS[j % CHART_COLORS.length]}"/>`;
        });
    });

    let labels = '';
    data.forEach((d, i) => {
        const x = padding.left + i * stepX;
        labels += `<text x="${x}" y="${height - 25}" text-anchor="middle" font-size="10" font-family="Arial">${d.name}</text>`;
    });

    const yAxis = `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="#ccc"/>`;
    const xAxis = `<line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="#ccc"/>`;

    let legend = '';
    seriesNames.forEach((s, i) => {
        const lx = padding.left + i * 100;
        legend += `<line x1="${lx}" y1="${height - 6}" x2="${lx + 20}" y2="${height - 6}" stroke="${CHART_COLORS[i % CHART_COLORS.length]}" stroke-width="2"/>`;
        legend += `<text x="${lx + 24}" y="${height - 2}" font-size="10" font-family="Arial">${s}</text>`;
    });

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="${width / 2}" y="24" text-anchor="middle" font-weight="bold" font-size="14" font-family="Arial">${title}</text>
        ${yAxis}${xAxis}${lines}${labels}${legend}
    </svg>`;
}

function generatePieChartSVG(
    data: RechartsDataPoint[],
    seriesNames: string[],
    title: string,
    width: number,
    height: number
): string {
    const cx = width / 2;
    const cy = height / 2 + 15;
    const radius = Math.min(width, height) / 3;

    const total = data.reduce((sum, d) => sum + (Number(d[seriesNames[0]]) || 0), 0) || 1;
    let startAngle = -Math.PI / 2;

    let slices = '';
    let labels = '';

    data.forEach((d, i) => {
        const value = Number(d[seriesNames[0]]) || 0;
        const angle = (value / total) * Math.PI * 2;
        const endAngle = startAngle + angle;

        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);

        const largeArc = angle > Math.PI ? 1 : 0;

        slices += `<path d="M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z" fill="${CHART_COLORS[i % CHART_COLORS.length]}"/>`;

        const labelAngle = startAngle + angle / 2;
        const labelRadius = radius * 1.25;
        const lx = cx + labelRadius * Math.cos(labelAngle);
        const ly = cy + labelRadius * Math.sin(labelAngle);
        const percent = ((value / total) * 100).toFixed(0);
        labels += `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="9" font-family="Arial">${d.name}: ${percent}%</text>`;

        startAngle = endAngle;
    });

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="${width / 2}" y="24" text-anchor="middle" font-weight="bold" font-size="14" font-family="Arial">${title}</text>
        ${slices}${labels}
    </svg>`;
}

function generateScatterChartSVG(
    data: RechartsDataPoint[],
    seriesNames: string[],
    title: string,
    width: number,
    height: number,
    padding: { top: number; right: number; bottom: number; left: number },
    chartWidth: number,
    chartHeight: number
): string {
    if (seriesNames.length < 2) {
        return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial">Scatter requires 2 series</text></svg>`;
    }

    const xValues = data.map(d => Number(d[seriesNames[0]]) || 0);
    const yValues = data.map(d => Number(d[seriesNames[1]]) || 0);
    const maxX = Math.max(...xValues) || 1;
    const maxY = Math.max(...yValues) || 1;

    let dots = '';
    data.forEach((d) => {
        const x = padding.left + ((Number(d[seriesNames[0]]) || 0) / maxX) * chartWidth;
        const y = padding.top + chartHeight - ((Number(d[seriesNames[1]]) || 0) / maxY) * chartHeight;
        dots += `<circle cx="${x}" cy="${y}" r="6" fill="${CHART_COLORS[0]}"/>`;
    });

    const yAxis = `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="#ccc"/>`;
    const xAxis = `<line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="#ccc"/>`;

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="${width / 2}" y="24" text-anchor="middle" font-weight="bold" font-size="14" font-family="Arial">${title}</text>
        <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="10" font-family="Arial">${seriesNames[0]}</text>
        ${yAxis}${xAxis}${dots}
    </svg>`;
}

/**
 * Convert SVG string to PNG base64 data URL using Canvas
 */
async function svgToPng(svgString: string, width = 600, height = 300): Promise<string> {
    return new Promise((resolve, reject) => {
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.width = width;
        img.height = height;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            try {
                const pngDataUrl = canvas.toDataURL('image/png');
                URL.revokeObjectURL(url);
                resolve(pngDataUrl);
            } catch (e) {
                URL.revokeObjectURL(url);
                reject(e);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG image'));
        };

        img.src = url;
    });
}

/**
 * Convert chart nodes in HTML to PNG images for export (async)
 * Returns HTML with charts replaced by img tags with base64 PNG data
 */
export async function convertChartsToPNG(html: string): Promise<string> {
    // Match chartNode divs - look for data-chart-node attribute
    const chartNodeRegex = /<div[^>]*data-chart-node[^>]*>/g;
    const matches = [...html.matchAll(chartNodeRegex)];

    if (matches.length === 0) {
        return html;
    }

    let result = html;

    // Process each chart node
    for (const match of matches) {
        // Find the data-chart attribute value
        const fullMatch = match[0];
        const chartDataMatch = fullMatch.match(/data-chart="([^"]*)"/);

        if (chartDataMatch) {
            try {
                const decodedData = chartDataMatch[1]
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .replace(/&#39;/g, "'")
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>');

                const chartData: AIChartData = JSON.parse(decodedData);
                const svg = generateChartSVG(chartData);
                const pngDataUrl = await svgToPng(svg);

                // Find the full chart node element and replace it
                const startIndex = result.indexOf(fullMatch);
                if (startIndex !== -1) {
                    // Find closing tag - look for next </div> that closes this element
                    let depth = 1;
                    let endIndex = startIndex + fullMatch.length;
                    while (depth > 0 && endIndex < result.length) {
                        const nextOpen = result.indexOf('<div', endIndex);
                        const nextClose = result.indexOf('</div>', endIndex);

                        if (nextClose === -1) break;

                        if (nextOpen !== -1 && nextOpen < nextClose) {
                            depth++;
                            endIndex = nextOpen + 4;
                        } else {
                            depth--;
                            endIndex = nextClose + 6;
                        }
                    }

                    // Replace the entire chart node with an image
                    const replacement = `<div style="text-align: center; margin: 20px 0;">
                        <p style="font-weight: bold; margin-bottom: 10px; text-indent: 0;">${chartData.title}</p>
                        <img src="${pngDataUrl}" alt="${chartData.title}" style="max-width: 100%; height: auto;" />
                    </div>`;

                    result = result.substring(0, startIndex) + replacement + result.substring(endIndex);
                }
            } catch (e) {
                console.error('Failed to convert chart to PNG:', e);
            }
        }
    }

    return result;
}

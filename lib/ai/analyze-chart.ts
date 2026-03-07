'use server';

import { generateText } from 'ai';
import { getTextModel } from './models';
import { ChartType } from '@/components/editor/EditableChart';

// The format Recharts expects
export interface RechartsDataPoint {
    name: string;
    [key: string]: string | number;
}

export interface AIChartData {
    chartData: RechartsDataPoint[];
    seriesNames: string[];
    chartType: ChartType;
    title: string;
    xAxisLabel: string;
    yAxisLabel: string;
    insight: string;
}

/**
 * AI analyzes raw table HTML/text and returns properly structured chart data
 * This replaces the dumb regex parser with intelligent understanding
 */
export async function generateChartDataWithAI(
    tableHTML: string
): Promise<{ success: boolean; data?: AIChartData; error?: string }> {
    try {
        const prompt = `You are a data visualization expert. Analyze this HTML table and convert it to chart-ready JSON.

TABLE HTML:
${tableHTML}

TASK: Parse this table and return a JSON object that can be used with Recharts library.

RULES:
1. Identify what should be the X-axis (usually time periods, categories, or labels)
2. Identify data series (the numeric columns that should be plotted)
3. Handle any formatting issues (duplicate headers, mixed data types)
4. Choose the best chart type based on the data

RESPOND WITH ONLY VALID JSON (no markdown, no explanation, just JSON):
{
  "chartData": [
    { "name": "x-axis-value-1", "series1": 123, "series2": 456 },
    { "name": "x-axis-value-2", "series1": 789, "series2": 012 }
  ],
  "seriesNames": ["series1", "series2"],
  "chartType": "line",
  "title": "Descriptive Title",
  "xAxisLabel": "X Axis Label",
  "yAxisLabel": "Y Axis Label",
  "insight": "One sentence describing what this data shows"
}

CHART TYPE OPTIONS: "bar", "line", "pie", "scatter"
- Use "line" for trends over time
- Use "bar" for comparing discrete categories
- Use "pie" for proportions (only for single series)
- Use "scatter" for correlations

IMPORTANT: 
- All numeric values must be actual numbers, not strings
- "name" field is always the X-axis label
- seriesNames must match the keys in chartData objects`;

        const { text } = await generateText({
            model: getTextModel(),
            prompt,
            temperature: 0.1,  // Very low for consistent JSON output
        });

        // Clean up response - remove markdown code blocks and any surrounding text
        let jsonStr = text.trim();
        // Remove markdown code blocks
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        jsonStr = jsonStr.trim();

        // If response still has non-JSON content, try to extract JSON object
        if (!jsonStr.startsWith('{')) {
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }
        }

        // Parse and validate JSON
        let parsed: AIChartData;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('AI returned invalid JSON:', jsonStr);
            return { success: false, error: 'AI returned invalid JSON format' };
        }

        // Validate required fields
        if (!parsed.chartData || !Array.isArray(parsed.chartData) || parsed.chartData.length === 0) {
            return { success: false, error: 'AI did not return valid chart data' };
        }

        if (!parsed.seriesNames || !Array.isArray(parsed.seriesNames) || parsed.seriesNames.length === 0) {
            // Try to extract series names from first data point
            const firstPoint = parsed.chartData[0];
            parsed.seriesNames = Object.keys(firstPoint).filter(k => k !== 'name');
        }

        // Validate chart type
        const validTypes: ChartType[] = ['bar', 'line', 'pie', 'scatter'];
        if (!validTypes.includes(parsed.chartType)) {
            parsed.chartType = 'bar'; // Default fallback
        }

        // Ensure all data points have numeric values
        parsed.chartData = parsed.chartData.map(point => {
            const cleaned: RechartsDataPoint = { name: String(point.name) };
            for (const key of parsed.seriesNames) {
                cleaned[key] = typeof point[key] === 'number' ? point[key] : parseFloat(String(point[key])) || 0;
            }
            return cleaned;
        });

        console.log('📊 AI Generated Chart Data:', parsed);
        return { success: true, data: parsed };

    } catch (error: any) {
        console.error('AI chart generation error:', error);
        return { success: false, error: error.message };
    }
}

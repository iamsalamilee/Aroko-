/**
 * Table Parser Utility
 * Extracts data from HTML table elements and converts to chart-compatible format
 */

export interface TableData {
    headers: string[];      // Column headers (e.g., ["Year", "2020", "2021", "2022"])
    rows: string[][];       // Row data (e.g., [["Yield", "45", "52", "58"]])
    labels: string[];       // X-axis labels (headers without first column)
    datasets: Dataset[];    // Chart datasets
}

export interface Dataset {
    name: string;           // Series name (first cell of each row)
    data: number[];         // Numeric values
    color?: string;         // Optional color for this series
}

// Chart-compatible format for Recharts
export interface ChartDataPoint {
    name: string;           // X-axis value (e.g., "2020")
    [key: string]: string | number;  // Dynamic keys for each series
}

// Default colors for chart series
const CHART_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
];

/**
 * Parse HTML table element to extract data
 */
export function parseTableElement(table: HTMLTableElement): TableData | null {
    try {
        // Get headers from first row (th or first tr)
        const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
        if (!headerRow) return null;

        const headers: string[] = [];
        headerRow.querySelectorAll('th, td').forEach(cell => {
            headers.push(cell.textContent?.trim() || '');
        });

        if (headers.length < 2) return null; // Need at least 2 columns

        // Get data rows
        const rows: string[][] = [];
        const dataRows = table.querySelectorAll('tbody tr') ||
            Array.from(table.querySelectorAll('tr')).slice(1);

        dataRows.forEach(row => {
            const rowData: string[] = [];
            row.querySelectorAll('td').forEach(cell => {
                rowData.push(cell.textContent?.trim() || '');
            });
            if (rowData.length > 0) {
                rows.push(rowData);
            }
        });

        if (rows.length === 0) return null;

        // Extract labels (all headers except first)
        const labels = headers.slice(1);

        // Convert rows to datasets
        const datasets: Dataset[] = rows.map((row, index) => ({
            name: row[0] || `Series ${index + 1}`,
            data: row.slice(1).map(val => parseFloat(val) || 0),
            color: CHART_COLORS[index % CHART_COLORS.length],
        }));

        return { headers, rows, labels, datasets };
    } catch (error) {
        console.error('Failed to parse table:', error);
        return null;
    }
}

/**
 * Convert TableData to Recharts-compatible format
 * Recharts expects: [{ name: "2020", Yield: 45, Rain: 120 }, ...]
 */
export function toRechartsData(tableData: TableData): ChartDataPoint[] {
    const { labels, datasets } = tableData;

    return labels.map((label, index) => {
        const point: ChartDataPoint = { name: label };
        datasets.forEach(dataset => {
            point[dataset.name] = dataset.data[index] || 0;
        });
        return point;
    });
}

/**
 * Convert TableData to Pie chart format
 * Pie charts need: [{ name: "Category", value: 100 }, ...]
 */
export function toPieChartData(tableData: TableData): { name: string; value: number; fill: string }[] {
    const { labels, datasets } = tableData;

    // For pie charts, use first dataset's values with labels as names
    const firstDataset = datasets[0];
    if (!firstDataset) return [];

    return labels.map((label, index) => ({
        name: label,
        value: firstDataset.data[index] || 0,
        fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
}

/**
 * Validate if table data is suitable for charts
 */
export function validateTableData(tableData: TableData): { valid: boolean; error?: string } {
    if (!tableData) {
        return { valid: false, error: 'Could not parse table data' };
    }

    if (tableData.labels.length < 1) {
        return { valid: false, error: 'Table needs at least 2 columns' };
    }

    if (tableData.datasets.length === 0) {
        return { valid: false, error: 'Table needs at least 1 data row' };
    }

    // Check if there are numeric values
    const hasNumbers = tableData.datasets.some(ds =>
        ds.data.some(val => !isNaN(val) && val !== 0)
    );

    if (!hasNumbers) {
        return { valid: false, error: 'Table needs numeric values for chart' };
    }

    return { valid: true };
}

/**
 * Parse table from TipTap editor HTML string
 */
export function parseTableFromHTML(html: string): TableData | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');

    if (!table) return null;
    return parseTableElement(table);
}

export { CHART_COLORS };

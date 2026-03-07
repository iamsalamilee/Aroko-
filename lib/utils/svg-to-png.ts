/**
 * Convert SVG string to PNG base64 data URL using Canvas
 * This works in browser and produces images that Word can render
 */
export async function svgToPng(svgString: string, width = 600, height = 300): Promise<string> {
    return new Promise((resolve, reject) => {
        // Create a blob from the SVG string
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        // Create an image element
        const img = new Image();
        img.width = width;
        img.height = height;

        img.onload = () => {
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // Draw white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);

            // Draw the SVG image
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to PNG base64
            try {
                const pngDataUrl = canvas.toDataURL('image/png');
                URL.revokeObjectURL(url);
                resolve(pngDataUrl);
            } catch (e) {
                URL.revokeObjectURL(url);
                reject(e);
            }
        };

        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG image'));
        };

        img.src = url;
    });
}

/**
 * Generate chart as PNG data URL (async version that renders properly in Word)
 */
export async function generateChartPng(chartData: any, width = 600, height = 300): Promise<string> {
    const { generateChartSVG } = await import('./chart-to-svg');
    const svgString = generateChartSVG(chartData, width, height);
    return svgToPng(svgString, width, height);
}

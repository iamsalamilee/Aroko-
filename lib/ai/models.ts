// AI Model configuration - Amazon Nova via AWS Bedrock
import { bedrock } from '@ai-sdk/amazon-bedrock';

// Primary model (Nova Lite - fast, cost-effective for everyday tasks)
export const primaryModel = bedrock('amazon.nova-lite-v1:0');

// Higher quality model (Nova Pro - better reasoning, use when needed)
export const proModel = bedrock('amazon.nova-pro-v1:0');

// Get model for text generation
export function getTextModel() {
    const hasAWSKey = !!process.env.AWS_ACCESS_KEY_ID;

    if (hasAWSKey) {
        console.log('🚀 Using Amazon Nova Lite');
        return primaryModel;
    }

    // No keys found (will likely throw error later)
    console.error('❌ No AWS credentials found (AWS_ACCESS_KEY_ID)');
    return primaryModel;
}

// Alias for backward compatibility
export const getModel = getTextModel;

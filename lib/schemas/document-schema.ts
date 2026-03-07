import { z } from "zod";

// The "Cookie Cutter" for the AI
// It must output a list of blocks, each with content and styling.
export const DocumentSchema = z.object({
    blocks: z.array(
        z.object({
            type: z.enum(["heading", "paragraph", "bullet_list", "blockquote"]),
            content: z.string(),
            style: z.object({
                level: z.number().optional(), // For headings (1, 2, 3)
                bold: z.boolean().optional(),
                italic: z.boolean().optional(),
                lineSpacing: z.number().optional(),
                fontFamily: z.enum(["Inter", "Times New Roman", "Arial"]).optional(),
                fontSize: z.number().optional(),
            }).optional(),
        })
    )
});

export type DocumentStructure = z.infer<typeof DocumentSchema>;

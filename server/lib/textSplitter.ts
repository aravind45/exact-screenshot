
export class SimpleRecursiveSplitter {
    chunkSize: number;
    chunkOverlap: number;
    separators: string[];

    constructor(options: { chunkSize?: number; chunkOverlap?: number; separators?: string[] } = {}) {
        this.chunkSize = options.chunkSize || 1000;
        this.chunkOverlap = options.chunkOverlap || 200;
        this.separators = options.separators || ["\n\n", "\n", " ", ""];
    }

    async createDocuments(texts: string[]) {
        const docs: { pageContent: string; metadata: any }[] = [];
        for (const text of texts) {
            const chunks = this.splitText(text);
            for (const chunk of chunks) {
                docs.push({ pageContent: chunk, metadata: { loc: { lines: { from: 0, to: 0 } } } });
            }
        }
        return docs;
    }

    splitText(text: string): string[] {
        const finalChunks: string[] = [];
        let goodSplits: string[] = [];

        // Find best separator
        let separator = this.separators[this.separators.length - 1];
        for (const s of this.separators) {
            if (text.includes(s)) {
                separator = s;
                break;
            }
        }

        // Split
        const splits = separator ? text.split(separator) : [text];

        let currentChunk: string[] = [];
        let currentLength = 0;

        for (const split of splits) {
            const splitLen = split.length;
            if (currentLength + splitLen + (currentChunk.length > 0 ? separator.length : 0) > this.chunkSize) {
                if (currentChunk.length > 0) {
                    const joined = currentChunk.join(separator);
                    finalChunks.push(joined);
                    // Handle overlap? 
                    // Simplified overlap: keep last N chars? Or re-add last item?
                    // For now, no sophisticated overlap in this simple implementation, just split.
                    // Or keep last checked item as overlap if small.
                    // Recurse? If single split > chunk size, recurse on it.
                    currentChunk = [];
                    currentLength = 0;
                }

                if (splitLen > this.chunkSize) {
                    // Recurse on this big chunk with next separator
                    const subSplits = this.splitTextRecursive(split, this.separators.indexOf(separator) + 1);
                    finalChunks.push(...subSplits);
                } else {
                    currentChunk.push(split);
                    currentLength += splitLen;
                }
            } else {
                currentChunk.push(split);
                currentLength += splitLen + (currentChunk.length > 0 ? separator.length : 0);
            }
        }

        if (currentChunk.length > 0) {
            finalChunks.push(currentChunk.join(separator));
        }

        return finalChunks;
    }

    splitTextRecursive(text: string, separatorIndex: number): string[] {
        const finalChunks: string[] = [];
        if (separatorIndex >= this.separators.length) {
            // No more separators, force split by char
            for (let i = 0; i < text.length; i += this.chunkSize) {
                finalChunks.push(text.slice(i, i + this.chunkSize));
            }
            return finalChunks;
        }

        const separator = this.separators[separatorIndex];
        const splits = separator ? text.split(separator) : [text];

        let currentChunk: string[] = [];
        let currentLength = 0;

        for (const split of splits) {
            const splitLen = split.length;
            if (currentLength + splitLen > this.chunkSize) { // Simplified check
                if (currentChunk.length > 0) {
                    finalChunks.push(currentChunk.join(separator));
                    currentChunk = [];
                    currentLength = 0;
                }
                if (splitLen > this.chunkSize) {
                    finalChunks.push(...this.splitTextRecursive(split, separatorIndex + 1));
                } else {
                    currentChunk.push(split);
                    currentLength += splitLen;
                }
            } else {
                currentChunk.push(split);
                currentLength += splitLen + (currentChunk.length > 0 ? separator.length : 0);
            }
        }
        if (currentChunk.length > 0) finalChunks.push(currentChunk.join(separator));

        return finalChunks;
    }
}

import { create } from 'ipfs-http-client';

const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

export async function uploadEvidence(file: File): Promise<string> {
    const { cid } = await ipfs.add(file);
    return `https://ipfs.io/ipfs/${cid.toString()}`;
}

export async function uploadEvidenceWithMetadata(
    file: File,
    metadata: {
        caseId: string;
        reporter: string;
        scamAddress: string;
        description: string;
        timestamp: number;
    }
): Promise<{ fileUrl: string; metadataUrl: string }> {
    try {
        // Upload the evidence file
        const fileResult = await ipfs.add(file);
        const fileUrl = `https://ipfs.io/ipfs/${fileResult.cid.toString()}`;

        // Create metadata object
        const metadataObject = {
            ...metadata,
            evidenceFile: {
                name: file.name,
                type: file.type,
                size: file.size,
                ipfsCid: fileResult.cid.toString(),
                url: fileUrl,
            },
            uploadedAt: Date.now(),
        };

        // Upload metadata as JSON
        const metadataBlob = new Blob([JSON.stringify(metadataObject, null, 2)], {
            type: 'application/json',
        });
        const metadataResult = await ipfs.add(metadataBlob);
        const metadataUrl = `https://ipfs.io/ipfs/${metadataResult.cid.toString()}`;

        return { fileUrl, metadataUrl };
    } catch (error) {
        console.error('IPFS upload error:', error);
        throw new Error('Failed to upload evidence to IPFS');
    }
}

export async function uploadJSON(data: object): Promise<string> {
    try {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
        });
        const result = await ipfs.add(blob);
        return `https://ipfs.io/ipfs/${result.cid.toString()}`;
    } catch (error) {
        console.error('IPFS JSON upload error:', error);
        throw new Error('Failed to upload JSON to IPFS');
    }
}

export async function fetchFromIPFS(cid: string): Promise<any> {
    try {
        const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
        if (!response.ok) {
            throw new Error('Failed to fetch from IPFS');
        }
        return await response.json();
    } catch (error) {
        console.error('IPFS fetch error:', error);
        throw new Error('Failed to fetch data from IPFS');
    }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback } from 'react';
import Spinner from './Spinner';
import UploadCloudIcon from './icons/UploadCloudIcon';
import CarIcon from './icons/CarIcon';
import WashingMachineIcon from './icons/WashingMachineIcon';
import TrashIcon from './icons/TrashIcon';
import ProgressBar from './ProgressBar';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => Promise<void>;
    uploadProgress: { current: number; total: number; message?: string; fileName?: string; } | null;
}

const sampleDocuments = [
    {
        name: 'Hyundai i10 Manual',
        details: '562 pages, PDF',
        url: 'https://www.hyundai.com/content/dam/hyundai/in/en/data/connect-to-service/owners-manual/2025/i20&i20nlineFromOct2023-Present.pdf',
        icon: <CarIcon />,
        fileName: 'hyundai-i10-manual.pdf'
    },
    {
        name: 'LG Washer Manual',
        details: '36 pages, PDF',
        url: 'https://www.lg.com/us/support/products/documents/WM2077CW.pdf',
        icon: <WashingMachineIcon />,
        fileName: 'lg-washer-manual.pdf'
    }
];

const UploadModal: React.FC<UploadModalProps> = ({ 
    isOpen, onClose, onUpload, uploadProgress
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [loadingSample, setLoadingSample] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
        }
    };
    
    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files) {
            setFiles(prev => [...prev, ...Array.from(event.dataTransfer.files)]);
        }
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);
    
    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleSelectSample = async (name: string, url: string, fileName: string) => {
        if (loadingSample) return;
        setLoadingSample(name);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${name}: ${response.statusText}. This may be a CORS issue.`);
            }
            const blob = await response.blob();
            const file = new File([blob], fileName, { type: blob.type });
            setFiles(prev => [...prev, file]);
        } catch (error) {
            console.error("Error fetching sample file:", error);
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                alert(`Could not fetch the sample document. Please try uploading a local file instead.`);
            }
        } finally {
            setLoadingSample(null);
        }
    };

    const handleConfirmUpload = async () => {
        if (files.length === 0) return;
        try {
            await onUpload(files);
            setFiles([]); // Clear on successful start
        } catch (error) {
            console.error("Upload process failed:", error);
        }
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const handleClose = () => {
        if (uploadProgress) return; // Don't close during upload
        setFiles([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div className="bg-gem-slate p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col text-gem-offwhite" onClick={e => e.stopPropagation()}>
                {uploadProgress ? (
                     <ProgressBar 
                        progress={uploadProgress.current} 
                        total={uploadProgress.total} 
                        message={uploadProgress.message || "Preparing your chat..."} 
                        fileName={uploadProgress.fileName}
                    />
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Upload Your Documents</h1>
                            <p className="text-gem-offwhite/70">
                                Powered by <strong className="font-semibold text-gem-offwhite">FileSearch</strong>. Upload a manual to see RAG in action.
                            </p>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                             <div 
                                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${isDragging ? 'border-gem-blue bg-gem-onyx/50' : 'border-gem-mist/50'}`}
                                onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <UploadCloudIcon />
                                    <p className="mt-4 text-lg text-gem-offwhite/80">Drag & drop your PDF, .txt, or .md file here.</p>
                                    <input id="file-upload-modal" type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.txt,.md"/>
                                     <label htmlFor="file-upload-modal" className="mt-4 cursor-pointer px-6 py-2 bg-gem-blue text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">
                                        Or Browse Files
                                    </label>
                                </div>
                            </div>
                            
                            {files.length > 0 && (
                                <div className="w-full max-w-xl mx-auto mb-4 text-left">
                                    <h4 className="font-semibold mb-2">Selected Files ({files.length}):</h4>
                                    <ul className="max-h-28 overflow-y-auto space-y-1 pr-2">
                                        {files.map((file, index) => (
                                            <li key={`${file.name}-${index}`} className="text-sm bg-gem-onyx p-2 rounded-md flex justify-between items-center group">
                                                <span className="truncate" title={file.name}>{file.name}</span>
                                                <div className="flex items-center flex-shrink-0">
                                                    <span className="text-xs text-gem-offwhite/50 ml-2">{(file.size / 1024).toFixed(2)} KB</span>
                                                    <button onClick={() => handleRemoveFile(index)} className="ml-2 p-1 text-red-400 hover:text-red-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remove ${file.name}`} title="Remove this file">
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                             <div className="flex items-center my-6">
                                <div className="flex-grow border-t border-gem-mist"></div>
                                <span className="flex-shrink mx-4 text-gem-offwhite/60">OR</span>
                                <div className="flex-grow border-t border-gem-mist"></div>
                            </div>

                             <div className="text-left mb-3">
                                <p className="text-gem-offwhite/80">Try an example:</p>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {sampleDocuments.map(doc => (
                                    <button
                                        key={doc.name}
                                        onClick={() => handleSelectSample(doc.name, doc.url, doc.fileName)}
                                        disabled={!!loadingSample}
                                        className="bg-gem-onyx p-4 rounded-lg border border-gem-mist/30 hover:border-gem-blue/50 hover:bg-gem-mist/10 transition-all text-left flex items-center space-x-4 disabled:opacity-50 disabled:cursor-wait"
                                        title={`Chat with the ${doc.name}`}
                                    >
                                        <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 bg-gem-mist/20 rounded-lg">
                                            {loadingSample === doc.name ? <Spinner /> : doc.icon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gem-offwhite">{doc.name}</p>
                                            <p className="text-sm text-gem-offwhite/60">{doc.details}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gem-mist">
                            <button onClick={handleClose} className="px-6 py-2 rounded-md bg-gem-mist hover:bg-gem-mist/70 transition-colors">
                                Cancel
                            </button>
                             <button 
                                onClick={handleConfirmUpload}
                                disabled={files.length === 0}
                                className="px-6 py-2 rounded-md bg-gem-blue hover:bg-blue-500 text-white font-bold transition-colors disabled:bg-gem-mist/50 disabled:cursor-not-allowed"
                                title={files.length === 0 ? "Please select a file first" : "Start chat session"}
                            >
                                Upload and Chat
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UploadModal;

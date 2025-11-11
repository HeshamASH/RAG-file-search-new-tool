/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { AppStatus, ChatMessage, SearchSource } from './types';
import * as geminiService from './services/geminiService';
import Spinner from './components/Spinner';
import UploadModal from './components/UploadModal';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>(AppStatus.Initializing);
    const [searchSource, setSearchSource] = useState<SearchSource>(SearchSource.FileSearch);
    const [error, setError] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number, message?: string, fileName?: string } | null>(null);
    const [activeRagStoreName, setActiveRagStoreName] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isQueryLoading, setIsQueryLoading] = useState(false);
    const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
    const [documentName, setDocumentName] = useState<string>('');
    const ragStoreNameRef = useRef(activeRagStoreName);

    useEffect(() => {
        ragStoreNameRef.current = activeRagStoreName;
    }, [activeRagStoreName]);
    
    useEffect(() => {
        geminiService.initialize();
        setStatus(AppStatus.Chatting);
    }, []);

    useEffect(() => {
        const handleUnload = () => {
            if (ragStoreNameRef.current) {
                geminiService.deleteRagStore(ragStoreNameRef.current)
                    .catch(err => console.error("Error deleting RAG store on unload:", err));
            }
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, []);


    const handleError = (message: string, err: any) => {
        console.error(message, err);
        setError(`${message}${err ? `: ${err instanceof Error ? err.message : String(err)}` : ''}`);
        setStatus(AppStatus.Error);
    };

    const clearError = () => {
        setError(null);
        setStatus(AppStatus.Chatting); // Return to the main chat view
    }

    const handleUploadAndStartChat = async (files: File[]) => {
        if (files.length === 0) return;
        
        setStatus(AppStatus.Uploading);
        const totalSteps = files.length + 2;
        setUploadProgress({ current: 0, total: totalSteps, message: "Creating document index..." });

        try {
            const storeName = `chat-session-${Date.now()}`;
            const ragStoreName = await geminiService.createRagStore(storeName);
            
            setUploadProgress({ current: 1, total: totalSteps, message: "Generating embeddings..." });

            for (let i = 0; i < files.length; i++) {
                setUploadProgress(prev => ({ 
                    ...(prev!),
                    current: i + 1,
                    message: "Generating embeddings...",
                    fileName: `(${i + 1}/${files.length}) ${files[i].name}`
                }));
                await geminiService.uploadToRagStore(ragStoreName, files[i]);
            }
            
            setUploadProgress({ current: files.length + 1, total: totalSteps, message: "Generating suggestions...", fileName: "" });
            const questions = await geminiService.generateExampleQuestions(ragStoreName);
            setExampleQuestions(questions);

            setUploadProgress({ current: totalSteps, total: totalSteps, message: "All set!", fileName: "" });
            
            await new Promise(resolve => setTimeout(resolve, 500)); 

            let docName = '';
            if (files.length === 1) {
                docName = files[0].name;
            } else if (files.length === 2) {
                docName = `${files[0].name} & ${files[1].name}`;
            } else {
                docName = `${files.length} documents`;
            }
            setDocumentName(docName);

            setActiveRagStoreName(ragStoreName);
            setChatHistory([]);
            setStatus(AppStatus.Chatting);
            setIsUploadModalOpen(false);
        } catch (err) {
            handleError("Failed to start chat session", err);
        } finally {
            setUploadProgress(null);
            if (status !== AppStatus.Error) {
                setStatus(AppStatus.Chatting);
            }
        }
    };

    const handleEndChat = () => {
        if (activeRagStoreName) {
            geminiService.deleteRagStore(activeRagStoreName).catch(err => {
                console.error("Failed to delete RAG store in background", err);
            });
        }
        setActiveRagStoreName(null);
        setChatHistory([]);
        setExampleQuestions([]);
        setDocumentName('');
        setSearchSource(SearchSource.FileSearch);
        setStatus(AppStatus.Chatting);
    };

    const handleFileSearchClick = () => {
        // If there's an active chat session (either FileSearch or GoogleSearch),
        // end it to ensure a clean state before starting a new file upload.
        if (activeRagStoreName || searchSource === SearchSource.GoogleSearch) {
            handleEndChat();
        }
        // handleEndChat resets the searchSource to FileSearch, preparing for the new session.
        setIsUploadModalOpen(true);
    };

    const handleSendMessage = async (message: string) => {
        if (searchSource === SearchSource.FileSearch && !activeRagStoreName) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
        setChatHistory(prev => [...prev, userMessage]);
        setIsQueryLoading(true);

        try {
            let result;
            if (searchSource === SearchSource.FileSearch) {
                result = await geminiService.fileSearch(activeRagStoreName!, message);
            } else {
                result = await geminiService.googleSearch(message);
            }
            
            const modelMessage: ChatMessage = {
                role: 'model',
                parts: [{ text: result.text }],
                groundingChunks: result.groundingChunks
            };
            setChatHistory(prev => [...prev, modelMessage]);
        } catch (err) {
            const errorMessage: ChatMessage = {
                role: 'model',
                parts: [{ text: "Sorry, I encountered an error. Please try again." }]
            };
            setChatHistory(prev => [...prev, errorMessage]);
            handleError("Failed to get response", err);
        } finally {
            setIsQueryLoading(false);
        }
    };

    const handleSwitchSource = async (source: SearchSource) => {
        if (source === searchSource) return;

        handleEndChat(); // Clear existing session
        setSearchSource(source);

        if (source === SearchSource.GoogleSearch) {
            setIsQueryLoading(true);
            try {
                const questions = await geminiService.generateGoogleSearchQuestions();
                setExampleQuestions(questions);
            } catch (err) {
                console.error("Failed to get Google Search questions", err);
            } finally {
                setIsQueryLoading(false);
            }
        }
    };
    
    const renderContent = () => {
        switch(status) {
            case AppStatus.Initializing:
                return (
                    <div className="flex items-center justify-center h-screen">
                        <Spinner /> <span className="ml-4 text-xl">Initializing...</span>
                    </div>
                );
            case AppStatus.Chatting:
            case AppStatus.Uploading: // Keep ChatInterface visible during upload
                 return (
                    <>
                        <ChatInterface 
                            documentName={searchSource === SearchSource.FileSearch ? documentName : 'Google Search'}
                            history={chatHistory}
                            isQueryLoading={isQueryLoading}
                            onSendMessage={handleSendMessage}
                            onNewChat={handleEndChat}
                            exampleQuestions={exampleQuestions}
                            onSwitchSource={handleSwitchSource}
                            searchSource={searchSource}
                            isChatActive={!!activeRagStoreName || searchSource === SearchSource.GoogleSearch}
                            onFileSearchClick={handleFileSearchClick}
                        />
                        <UploadModal
                            isOpen={isUploadModalOpen}
                            onClose={() => setIsUploadModalOpen(false)}
                            onUpload={handleUploadAndStartChat}
                            uploadProgress={uploadProgress}
                        />
                    </>
                 );
            case AppStatus.Error:
                 return (
                    <div className="flex flex-col items-center justify-center h-screen bg-red-900/20 text-red-300">
                        <h1 className="text-3xl font-bold mb-4">Application Error</h1>
                        <p className="max-w-md text-center mb-4">{error}</p>
                        <button onClick={clearError} className="px-4 py-2 rounded-md bg-gem-mist hover:bg-gem-mist/70 transition-colors" title="Return to the welcome screen">
                           Try Again
                        </button>
                    </div>
                );
            default:
                 return null;
        }
    }

    return (
        <main className="min-h-screen text-gem-offwhite">
            {renderContent()}
        </main>
    );
};

export default App;

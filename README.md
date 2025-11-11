# MnemoMind: Your Personal Document Chatbot

MnemoMind is a powerful demonstration of Retrieval-Augmented Generation (RAG) using the Google Gemini API's `FileSearch` tool. Simply upload any text-based document—from dense product manuals to lengthy reports—and start a conversation. MnemoMind intelligently searches your documents to provide precise, context-aware answers.

The application also features a seamless integration with `GoogleSearch`, allowing you to switch from querying your private documents to asking questions about the world, with answers grounded in up-to-date web results.

![MnemoMind Screenshot](https://storage.googleapis.com/aistudio-ux-team/samples/misc/mnemomind.png)

## ✨ Features

*   **Document Upload**: Supports PDF, TXT, and Markdown files.
*   **Sample Documents**: Instantly start chatting with pre-loaded examples (Hyundai i10 & LG Washer manuals).
*   **File-Based Chat**: Leverages the `FileSearch` tool to perform RAG on your uploaded content.
*   **Web-Based Chat**: Switch to `GoogleSearch` for real-time, web-grounded answers.
*   **Source Citing**:
    *   **FileSearch**: View the exact text chunks from your document that were used to generate the answer.
    *   **GoogleSearch**: Get direct links to the web pages that sourced the information.
*   **Dynamic Suggestions**: Automatically generates relevant example questions based on your document's content to help you get started.
*   **Clean & Responsive UI**: A modern, intuitive chat interface built for a seamless user experience.
*   **Automatic Cleanup**: All uploaded documents and their indexes are automatically deleted when you end the chat or close the browser tab, ensuring privacy and cost-efficiency.

## 🚀 Core Technologies

*   **AI & Backend**:
    *   [Google Gemini API (`@google/genai`)](https://ai.google.dev/): The core of the application.
    *   **`FileSearch` Tool**: Manages document chunking, embedding, indexing, and retrieval for the RAG pipeline.
    *   **`GoogleSearch` Tool**: Provides web search capabilities for grounded, up-to-date answers.

*   **Frontend**:
    *   [React](https://react.dev/): A JavaScript library for building user interfaces.
    *   [TypeScript](https://www.typescriptlang.org/): For static typing and improved developer experience.
    *   [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapid UI development.

## ⚙️ How It Works: The RAG Pipeline

MnemoMind provides a simplified and powerful RAG experience by abstracting away the complexities of the pipeline.

1.  **Ephemeral Index Creation**: When you upload documents, the app creates a temporary `FileSearchStore` via the Gemini API. This store acts as a private, short-term index for your chat session.
2.  **Document Processing**: The files are uploaded to this store. The `FileSearch` service automatically handles:
    *   **Chunking**: Breaking the documents into smaller, semantically meaningful pieces.
    *   **Embedding**: Converting each chunk into a numerical vector that captures its meaning.
    *   **Indexing**: Storing these vectors in a way that allows for efficient similarity searching.
3.  **Querying**: When you ask a question:
    *   Your query is sent to the Gemini model with the `FileSearch` tool configured to use your session's store.
    *   The tool performs a vector search to find the most relevant document chunks related to your question.
4.  **Augmented Generation**: The model receives your question *plus* the relevant chunks as context. It uses this augmented information to generate a highly accurate and relevant answer.
5.  **Session Teardown**: The `FileSearchStore` is automatically deleted when you click "New Chat" or close the browser, ensuring your data is not persisted.

## 📁 Project Structure

```
.
├── public/
│   └── index.css             # Custom CSS styles (scrollbar, settings menu)
├── src/
│   ├── components/           # Reusable React components
│   │   ├── ChatInterface.tsx   # The main chat UI
│   │   ├── UploadModal.tsx     # File upload and sample selection modal
│   │   ├── icons/              # SVG icon components
│   │   └── ...                 # Other UI components
│   ├── services/
│   │   └── geminiService.ts    # All communication with the Gemini API
│   ├── App.tsx                 # Main application component, state management
│   ├── index.tsx               # Application entry point
│   └── types.ts                # TypeScript type definitions
├── index.html                  # Main HTML file with Tailwind CSS config
├── metadata.json               # Application metadata
└── README.md                   # You are here!
```

## ⚖️ License

This project is licensed under the Apache-2.0 License. See the `LICENSE` file for details.

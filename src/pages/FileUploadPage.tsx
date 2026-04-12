import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

export default function FileUploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (up to 500MB)
    if (selectedFile.size > 500 * 1024 * 1024) {
      setError('File too large. Maximum 500MB allowed.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const uploadedFile = await response.json();
      setFiles((prev) => [uploadedFile, ...prev]);
      setSuccess(`✓ ${selectedFile.name} uploaded successfully`);

      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/upload/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Upload LLM Outputs</h1>

        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 mb-8">
          <div className="flex flex-col items-center justify-center">
            <Upload className="text-blue-400 mb-4" size={48} />
            <label className="cursor-pointer">
              <input
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
                accept=".txt,.json,.md,.pdf,.csv"
              />
              <span className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg inline-block transition">
                {uploading ? 'Uploading...' : 'Choose File (up to 500MB)'}
              </span>
            </label>
            <p className="text-slate-400 text-sm mt-3">
              Supported: TXT, JSON, MD, PDF, CSV
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-green-200">{success}</p>
          </div>
        )}

        {files.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Uploaded Files ({files.length})</h2>
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-slate-400 text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)}MB • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-red-400 hover:text-red-300 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

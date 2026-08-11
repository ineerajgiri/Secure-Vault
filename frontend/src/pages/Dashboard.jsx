import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, Trash2, FileText, LogOut, Search, X, Loader2, Eye } from 'lucide-react';
import { listDocuments, uploadDocument, downloadDocument, viewDocument, deleteDocument } from '../api/documents';

export default function Dashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tags, setTags] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const fetchDocuments = async (tag = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await listDocuments(tag);
      setDocuments(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load documents. Try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setSuccess('');
    try {
      await uploadDocument(selectedFile, tags);
      setSelectedFile(null);
      setTags('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSuccess('Document uploaded successfully.');
      fetchDocuments(activeFilter);
    } catch (err) {
      const data = err.response?.data;
      const fileError = Array.isArray(data?.file) ? data.file[0] : data?.file;
      const tagsError = Array.isArray(data?.tags) ? data.tags[0] : data?.tags;
      setError(fileError || tagsError || data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id, filename) => {
    setDownloadingId(id);
    setError('');
    try {
      const res = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          setError(json.detail || 'Download failed.');
        } catch {
          setError('Download failed.');
        }
      } else {
        setError('Download failed.');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleView = async (id) => {
    setViewingId(id);
    setError('');
    try {
      const res = await viewDocument(id);
      const contentType = res.headers['content-type'] || 'application/pdf';
      const url = window.URL.createObjectURL(new Blob([res.data], { type: contentType }));
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          setError(json.detail || 'Could not open document.');
        } catch {
          setError('Could not open document.');
        }
      } else {
        setError('Could not open document.');
      }
    } finally {
      setViewingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document permanently?')) return;
    setDeletingId(id);
    setError('');
    setSuccess('');
    try {
      await deleteDocument(id);
      setSuccess('Document deleted.');
      fetchDocuments(activeFilter);
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setActiveFilter(filterTag.trim());
    fetchDocuments(filterTag.trim());
  };

  const handleClearFilter = () => {
    setFilterTag('');
    setActiveFilter('');
    fetchDocuments('');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          Your Documents
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <form
        onSubmit={handleUpload}
        className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setSelectedFile(e.target.files[0])}
            disabled={uploading}
            className="w-full text-sm text-slate-700 dark:text-slate-300 sm:w-auto"
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={uploading}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:w-56"
          />
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleFilterSubmit}
        className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-600 sm:w-64">
          <Search size={14} className="shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by tag..."
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-700 outline-none dark:text-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Filter
          </button>
          {activeFilter && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              Tag: {activeFilter}
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <p className="text-slate-500">
          {activeFilter ? `No documents found with tag "${activeFilter}".` : 'No documents yet. Upload one above.'}
        </p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const isDownloading = downloadingId === doc.id;
            const isViewing = viewingId === doc.id;
            const isDeleting = deletingId === doc.id;
            const rowBusy = isDownloading || isViewing || isDeleting;

            return (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <FileText size={20} className="shrink-0 text-blue-600" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-white" title={doc.filename}>
                      {doc.filename}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {Array.isArray(doc.tags) && doc.tags.length > 0 ? doc.tags.join(', ') : 'No tags'} · {new Date(doc.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleView(doc.id)}
                    disabled={rowBusy}
                    className="rounded-lg border border-slate-300 p-2 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-800"
                    aria-label="View"
                  >
                    {isViewing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDownload(doc.id, doc.filename)}
                    disabled={rowBusy}
                    className="rounded-lg border border-slate-300 p-2 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-800"
                    aria-label="Download"
                  >
                    {isDownloading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={rowBusy}
                    className="rounded-lg border border-red-300 p-2 text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:hover:bg-red-950"
                    aria-label="Delete"
                  >
                    {isDeleting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
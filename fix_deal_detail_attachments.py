import os

with open(r'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target_imports = '''import { Loader2, Calendar, FileText, Check, X, Pencil, Trash2 } from 'lucide-react';'''
replacement_imports = '''import { Loader2, Calendar, FileText, Check, X, Pencil, Trash2, Paperclip, Download } from 'lucide-react';'''
if target_imports in text:
    text = text.replace(target_imports, replacement_imports)
else:
    text = text.replace("import { Loader2, Calendar, FileText, Check, X, Pencil", "import { Loader2, Calendar, FileText, Check, X, Pencil, Paperclip, Download")

target_query = '''  const { data: notes, isLoading: isLoadingNotes, isError: isErrorNotes, error: errorNotes } = useQuery({'''
replacement_query = '''  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: attachmentsData, isLoading: isLoadingAttachments } = useQuery({
    queryKey: ['attachments', deal?.id],
    queryFn: async () => {
      if (!deal?.id) return { data: [] };
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/attachments`);
      if (!res.ok) throw new Error('Failed to fetch attachments');
      return res.json();
    },
    enabled: isOpen && !!deal
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/attachments`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload attachment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', deal?.id] });
      toast.success('File attached successfully');
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload attachment');
      setUploadingFile(false);
    }
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete attachment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', deal?.id] });
      toast.success('Attachment deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete attachment');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingFile(true);
      uploadAttachmentMutation.mutate(e.target.files[0]);
    }
  };

  const { data: notes, isLoading: isLoadingNotes, isError: isErrorNotes, error: errorNotes } = useQuery({'''
text = text.replace(target_query, replacement_query)

target_react = '''import { useState } from 'react';'''
replacement_react = '''import React, { useState } from 'react';'''
text = text.replace(target_react, replacement_react)

target_notes = '''          {/* Notes Section */}'''
replacement_notes = '''          {/* Attachments Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <Paperclip className="h-4 w-4 mr-2" /> Attachments / Proposals
              </h4>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="text-sm text-brand-red hover:text-brand-red/80 font-medium flex items-center disabled:opacity-50"
              >
                {uploadingFile ? (
                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Uploading...</>
                ) : (
                  <>+ Add File</>
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>
            
            {isLoadingAttachments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {attachmentsData?.data && attachmentsData.data.length > 0 ? (
                  attachmentsData.data.map((att: any) => (
                    <div key={att.id} className="flex items-center justify-between p-2 hover:bg-gray-50 border border-gray-100 rounded-md group">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 truncate">{att.File_Name}</span>
                        <span className="text-xs text-gray-400">({Math.round((att.Size || 0) / 1024)} KB)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a 
                          href={`/website-demos/excellentzohocrm/api/deals/${deal.id}/attachments/${att.id}`}
                          download={att.File_Name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this attachment?')) {
                                deleteAttachmentMutation.mutate(att.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded border border-dashed border-gray-200">
                    No files attached yet. Drop a proposal here or click Add File.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notes Section */}'''
text = text.replace(target_notes, replacement_notes)

with open(r'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

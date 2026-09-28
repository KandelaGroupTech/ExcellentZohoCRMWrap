import os

with open(r'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "const { data: attachmentsData, isLoading: isLoadingAttachments } = useQuery({",
    "const { data: attachmentsData, isLoading: isLoadingAttachments, isError: isErrorAttachments, error: errorAttachments } = useQuery({"
)

target2 = """            {isLoadingAttachments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : ("""

replacement2 = """            {isLoadingAttachments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : isErrorAttachments ? (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md mb-4 border border-red-200">
                Failed to load attachments: {errorAttachments?.message || 'Unknown error'}
              </div>
            ) : ("""

text = text.replace(target2, replacement2)

with open(r'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ShortPreviewItem, LongPreviewItem, AppMode } from '@/types';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ShortPreviewItem[] | LongPreviewItem[];
  mode: AppMode;
}

export function PreviewModal({ open, onOpenChange, items, mode }: PreviewModalProps) {
  const isShortMode = mode === 'short';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[84rem] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Náhled vygenerovaných popisů ({items.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 flex items-center gap-2">
                <Badge variant="outline">{item.code}</Badge>
                <span className="font-medium text-sm">{item.name}</span>
              </div>

              {isShortMode ? (
                <ShortPreviewContent item={item as ShortPreviewItem} />
              ) : (
                <LongPreviewContent item={item as LongPreviewItem} />
              )}
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Žádné položky k zobrazení
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortPreviewContent({ item }: { item: ShortPreviewItem }) {
  return (
    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
      <div className="p-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          Dlouhý popis (zkráceno)
        </h4>
        <p className="text-sm text-muted-foreground line-clamp-6">
          {stripHtml(item.longDescription)}
        </p>
      </div>
      <div className="p-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          Vygenerovaný krátký popis
        </h4>
        <div
          className="text-sm prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: item.shortDescription }}
        />
      </div>
    </div>
  );
}

function LongPreviewContent({ item }: { item: LongPreviewItem }) {
  return (
    <div className="divide-y">
      <div className="p-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          Původní popis
        </h4>
        {item.originalDescription ? (
          <div
            className="text-sm prose prose-sm dark:prose-invert max-w-none max-h-40 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: item.originalDescription }}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">Prázdný</p>
        )}
      </div>
      <div className="p-4 bg-green-50/50 dark:bg-green-950/20">
        <h4 className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
          Nový vylepšený popis
        </h4>
        <div
          className="text-sm prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: item.newDescription }}
        />
      </div>
    </div>
  );
}

function stripHtml(html: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
  return html.replace(/<[^>]*>/g, '');
}

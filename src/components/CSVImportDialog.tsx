'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSprint } from '@/context/SprintContext';
import { useTaskRefresh } from '@/context/TaskContext';

interface ImportPreviewTask {
  name: string;
  labels: string;
  assignee: string;
  tags: string;
  estimatedHours: number;
}

export function CSVImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewTasks, setPreviewTasks] = useState<ImportPreviewTask[]>([]);
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [assignToSelf, setAssignToSelf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { selectedSprint } = useSprint();
  const { triggerRefresh } = useTaskRefresh();
  const { data: session } = useSession();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      previewCSV(selectedFile);
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file.',
        variant: 'destructive',
      });
    }
  };

  const previewCSV = async (csvFile: File) => {
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: 'Invalid CSV',
          description: 'CSV file must have at least a header and one data row.',
          variant: 'destructive',
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const tasks: ImportPreviewTask[] = [];

      for (let i = 1; i < Math.min(lines.length, 6); i++) { // Preview first 5 rows
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        if (row['Title']) {
          const estimateStr = row['Original Estimate'] || '0';
          const estimatedHours = parseFloat(estimateStr) || 0;

          tasks.push({
            name: row['Title'],
            labels: row['Work Item Type'] || '',
            assignee: row['Assigned To'] || '',
            tags: row['Tags'] || '',
            estimatedHours
          });
        }
      }

      setPreviewTasks(tasks);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: 'Error reading file',
        description: 'Failed to parse CSV file.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    if (!file || !selectedSprint) {
      toast({
        title: 'Missing requirements',
        description: 'Please select a file and ensure a sprint is selected.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sprintId', selectedSprint.id);
      formData.append('overrideAssignee', assignToSelf.toString());

      const response = await fetch('/api/tasks/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Import successful',
          description: result.message,
        });
        
        triggerRefresh();
        setOpen(false);
        resetForm();
      } else {
        toast({
          title: 'Import failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Network error occurred during import.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewTasks([]);
    setShowPreview(false);
    setAssignToSelf(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Tasks from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Column Mapping Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Column Mapping</CardTitle>
              <CardDescription>
                The following CSV columns will be mapped to task fields:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Work Item Type</strong> → Labels</div>
                <div><strong>Title</strong> → Name</div>
                <div><strong>Assigned To</strong> → Assignee</div>
                <div><strong>Tags</strong> → Tags</div>
                <div><strong>Original Estimate</strong> → Estimate</div>
                <div><strong>State</strong> → All tasks will be set to TODO</div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csvFile">Select CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              ref={fileInputRef}
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <FileText className="h-4 w-4" />
                {file.name}
              </div>
            )}
          </div>

          {/* Current Sprint Info */}
          {selectedSprint && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    Tasks will be imported to: <strong>{selectedSprint.name}</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedSprint && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-600">
                    Please select a sprint before importing tasks.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assign to Self Option */}
          {session?.user && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="assignToSelf" 
                    checked={assignToSelf}
                    onCheckedChange={(checked) => setAssignToSelf(checked as boolean)}
                  />
                  <Label htmlFor="assignToSelf" className="text-sm">
                    Assign all tasks to myself ({session.user.name || session.user.email})
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {showPreview && previewTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview (First 5 Tasks)</CardTitle>
                <CardDescription>
                  Review the tasks that will be imported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {previewTasks.map((task, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="font-medium">{task.name}</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {task.labels && <Badge variant="secondary">{task.labels}</Badge>}
                        {task.tags && <Badge variant="outline">{task.tags}</Badge>}
                        {task.assignee && (
                          <Badge variant="default">👤 {task.assignee}</Badge>
                        )}
                        {task.estimatedHours > 0 && (
                          <Badge variant="secondary">⏱️ {task.estimatedHours}h</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleImport}
              disabled={!file || !selectedSprint || importing}
            >
              {importing ? 'Importing...' : 'Import Tasks'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
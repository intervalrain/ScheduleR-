import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import { INITIAL_PRIORITY } from '@/lib/priorityUtils';

interface CSVRow {
  'ID': string;
  'Work Item Type': string;
  'Title': string;
  'Assigned To': string;
  'State': string;
  'Tags': string;
  'Original Estimate': string;
  'Iteration Path': string;
}

interface TaskImportData {
  name: string;
  labels: string;
  assignee: string;
  tags: string;
  estimatedHours: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sprintId = formData.get('sprintId') as string;
    const overrideAssignee = formData.get('overrideAssignee') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!sprintId) {
      return NextResponse.json({ error: 'Sprint ID is required' }, { status: 400 });
    }

    // Verify sprint exists and user has access
    const sprint = await prisma.sprint.findFirst({
      where: {
        id: sprintId,
        team: {
          users: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    });

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint not found or access denied' }, { status: 404 });
    }

    // Parse CSV file
    const csvText = await file.text();
    const parseResult = Papa.parse<CSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ 
        error: 'CSV parsing failed', 
        details: parseResult.errors 
      }, { status: 400 });
    }

    const tasksToImport: TaskImportData[] = [];
    const errors: string[] = [];

    // Process each row with column mapping
    parseResult.data.forEach((row, index) => {
      try {
        // Column mapping as specified:
        // "Work Item Type" = "Labels"
        // "Title" = "Name" 
        // "Assigned To" = "Assignee"
        // "State" = null (all todo)
        // "Tags" = "Tags"
        // "Original Estimate" = "Estimate"

        const name = row['Title']?.trim();
        if (!name) {
          errors.push(`Row ${index + 2}: Title is required`);
          return;
        }

        const labels = row['Work Item Type']?.trim() || '';
        const assignee = row['Assigned To']?.trim() || '';
        const tags = row['Tags']?.trim() || '';
        const estimateStr = row['Original Estimate']?.trim() || '0';
        
        // Parse estimate to number
        let estimatedHours = 0;
        if (estimateStr) {
          const parsed = parseFloat(estimateStr);
          if (!isNaN(parsed)) {
            estimatedHours = parsed;
          }
        }

        tasksToImport.push({
          name,
          labels,
          assignee,
          tags,
          estimatedHours
        });
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: 'Data validation failed', 
        details: errors 
      }, { status: 400 });
    }

    // Get team members for assignee matching
    const teamMembers = await prisma.user.findMany({
      where: {
        teams: {
          some: {
            team: {
              sprints: {
                some: {
                  id: sprintId
                }
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    // Create tasks in database
    const createdTasks = [];
    for (const taskData of tasksToImport) {
      // Find assignee by name or email, or use current user if override is enabled
      let assigneeId = null;
      
      if (overrideAssignee) {
        // Use current user as assignee
        assigneeId = session.user.id;
      } else if (taskData.assignee) {
        // Find assignee by name or email
        const assignee = teamMembers.find(member => 
          member.name?.toLowerCase().includes(taskData.assignee.toLowerCase()) ||
          member.email?.toLowerCase().includes(taskData.assignee.toLowerCase())
        );
        assigneeId = assignee?.id || null;
      }

      const task = await prisma.task.create({
        data: {
          title: taskData.name,
          description: '',
          estimatedHours: taskData.estimatedHours,
          priority: INITIAL_PRIORITY,
          status: 'TODO',
          labels: taskData.labels ? [taskData.labels] : [],
          tags: taskData.tags ? [taskData.tags] : [],
          sprintId: sprintId,
          assigneeId: assigneeId,
          createdById: session.user.id
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      createdTasks.push(task);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdTasks.length} tasks`,
      tasks: createdTasks
    });

  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
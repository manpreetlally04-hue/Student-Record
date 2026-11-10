import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dbService } from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Helper to extract secret key
  const getProvidedSecretKey = (req: Request): string | undefined => {
    return (
      (req.headers['x-secret-key'] as string) ||
      req.body?.secretKey ||
      (req.query?.secretKey as string)
    );
  };

  // --- API Endpoints ---

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'online',
      service: 'Streamlit Student Management Portal',
      timestamp: new Date().toISOString(),
      mysqlTarget: dbService.getMySQLConfig().database,
    });
  });

  // Get all students
  app.get('/api/students', (req: Request, res: Response) => {
    try {
      const { search, department, semester, status, sortBy, sortOrder } = req.query;
      const students = dbService.getAllStudents({
        search: search as string,
        department: department as string,
        semester: semester ? parseInt(semester as string, 10) : undefined,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      res.json({ success: true, count: students.length, students });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get student by ID
  app.get('/api/students/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const student = dbService.getStudentById(id);
      if (!student) {
        return res.status(404).json({ success: false, error: 'Student record not found.' });
      }
      res.json({ success: true, student });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Add new student
  app.post('/api/students', (req: Request, res: Response) => {
    try {
      const result = dbService.addStudent(req.body);
      res.status(201).json({
        success: true,
        message: `Student '${result.student.fullName}' added successfully.`,
        student: result.student,
        sqlQuery: result.sqlQuery,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Modify student (SECRET KEY PROTECTED)
  app.put('/api/students/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const secretKey = getProvidedSecretKey(req);
      const { remark, ...studentData } = req.body;

      const result = dbService.updateStudent(id, studentData, secretKey, remark);
      res.json({
        success: true,
        message: `Student record #${id} updated successfully.`,
        student: result.student,
        sqlQuery: result.sqlQuery,
      });
    } catch (err: any) {
      const isAuthError = err.message.includes('Secret Key');
      res.status(isAuthError ? 403 : 400).json({ success: false, error: err.message });
    }
  });

  // Delete student (SECRET KEY PROTECTED)
  app.delete('/api/students/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const secretKey = getProvidedSecretKey(req);

      const result = dbService.deleteStudent(id, secretKey);
      res.json({
        success: true,
        message: `Student '${result.deleted.fullName}' (#${id}) deleted successfully.`,
        deleted: result.deleted,
        sqlQuery: result.sqlQuery,
      });
    } catch (err: any) {
      const isAuthError = err.message.includes('Secret Key');
      res.status(isAuthError ? 403 : 400).json({ success: false, error: err.message });
    }
  });

  // Bulk delete students (SECRET KEY PROTECTED)
  app.post('/api/students/bulk-delete', (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      const secretKey = getProvidedSecretKey(req);
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'No student IDs specified for deletion.' });
      }

      const result = dbService.bulkDelete(ids, secretKey);
      res.json({
        success: true,
        message: `Successfully deleted ${result.count} student records.`,
        count: result.count,
        sqlQuery: result.sqlQuery,
      });
    } catch (err: any) {
      const isAuthError = err.message.includes('Secret Key');
      res.status(isAuthError ? 403 : 400).json({ success: false, error: err.message });
    }
  });

  // Batch import CSV student records (SECRET KEY PROTECTED)
  app.post('/api/students/batch-import', (req: Request, res: Response) => {
    try {
      const { records, conflictStrategy } = req.body;
      const secretKey = getProvidedSecretKey(req);

      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ success: false, error: 'No student records provided for batch import.' });
      }

      const result = dbService.batchInsertStudents(records, secretKey, conflictStrategy || 'skip');
      res.json(result);
    } catch (err: any) {
      const isAuthError = err.message.includes('Secret Key');
      res.status(isAuthError ? 403 : 400).json({ success: false, error: err.message });
    }
  });

  // Reset database to seed (SECRET KEY PROTECTED)
  app.post('/api/students/reset', (req: Request, res: Response) => {
    try {
      const secretKey = getProvidedSecretKey(req);
      const result = dbService.resetDatabase(secretKey);
      res.json({
        success: true,
        message: 'Database restored to initial seed students.',
        sqlQuery: result.sqlQuery,
      });
    } catch (err: any) {
      const isAuthError = err.message.includes('Secret Key');
      res.status(isAuthError ? 403 : 400).json({ success: false, error: err.message });
    }
  });

  // Secret Key endpoints
  app.post('/api/secret-key/verify', (req: Request, res: Response) => {
    const { key } = req.body;
    const isValid = dbService.verifySecretKey(key);
    res.json({
      success: isValid,
      valid: isValid,
      message: isValid ? 'Secret Key verified successfully!' : 'Invalid Secret Key provided.',
    });
  });

  app.post('/api/secret-key/change', (req: Request, res: Response) => {
    const { oldKey, newKey } = req.body;
    const result = dbService.setSecretKey(oldKey, newKey);
    res.status(result.success ? 200 : 400).json(result);
  });

  app.get('/api/secret-key/info', (_req: Request, res: Response) => {
    res.json({
      configured: true,
      defaultKeyHint: 'ADMIN@2025',
    });
  });

  // MySQL Workbench SQL Dump Export
  app.get('/api/mysql/export', (_req: Request, res: Response) => {
    try {
      const sqlDump = dbService.generateMySQLWorkbenchDump();
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', 'attachment; filename="student_management_workbench.sql"');
      res.send(sqlDump);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // MySQL Workbench Connection Settings
  app.get('/api/mysql/config', (_req: Request, res: Response) => {
    const config = dbService.getMySQLConfig();
    res.json({ success: true, config });
  });

  app.post('/api/mysql/config', (req: Request, res: Response) => {
    const updated = dbService.updateMySQLConfig(req.body);
    res.json({ success: true, config: updated });
  });

  // Live MySQL Connection Test
  app.post('/api/mysql/test-connection', async (req: Request, res: Response) => {
    const result = await dbService.testLiveMySQLConnection(req.body);
    res.json(result);
  });

  // Interactive SQL Query Runner
  app.post('/api/sql/execute', (req: Request, res: Response) => {
    const { query } = req.body;
    const result = dbService.executeSQL(query);

    // Also log query in audit if it modifies data or runs a noteworthy query
    dbService.logAudit({
      action: 'SQL_EXECUTE',
      target: 'SQL Query Console',
      details: `Executed: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`,
      sqlQuery: query,
      secretKeyUsed: false,
      success: result.success,
    });

    res.json(result);
  });

  // Audit Logs
  app.get('/api/audit-logs', (_req: Request, res: Response) => {
    res.json({
      success: true,
      logs: dbService.getAuditLogs(),
    });
  });

  // --- Serve Frontend ---
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Streamlit Portal Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
  process.exit(1);
});

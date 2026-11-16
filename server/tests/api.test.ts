import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { inMemoryStore } from '../src/repositories/in-memory.store';

describe('Collaborative Fraud Console - Backend Integration Test Suite', () => {
  let authToken: string;
  let adminUserId: string;
  let testAccountId: string;
  let testInvestigationId: string;
  let testNoteId: string;
  let testFindingId: string;

  beforeAll(async () => {
    // Ensure in-memory store is initialized
    inMemoryStore.initialize();
  });

  describe('1. System & Health Check', () => {
    it('GET /health returns 200 OK with status and environment', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('2. Authentication & Authorization', () => {
    it('POST /api/auth/login logs in with valid admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@fraudconsole.internal',
          password: 'Admin@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@fraudconsole.internal');

      authToken = res.body.data.accessToken;
      adminUserId = res.body.data.user.id;
    });

    it('POST /api/auth/login rejects invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@fraudconsole.internal',
          password: 'wrong_password_999',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me returns authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('admin@fraudconsole.internal');
      expect(res.body.data.role).toBe('ADMIN');
    });

    it('GET /api/auth/me without token returns 401 Unauthorized', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('POST /api/auth/logout succeeds and clears session', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Accounts APIs', () => {
    it('GET /api/accounts returns paginated accounts list', async () => {
      const res = await request(app)
        .get('/api/accounts?page=1&pageSize=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta.total).toBeGreaterThan(0);

      testAccountId = res.body.data[0].accountId;
    });

    it('GET /api/accounts supports search and risk filter', async () => {
      const res = await request(app)
        .get('/api/accounts?search=CYCLE&minRisk=70')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const acc of res.body.data) {
        expect(acc.riskScore).toBeGreaterThanOrEqual(70);
      }
    });

    it('GET /api/accounts/:id returns single account details and transaction metrics', async () => {
      const res = await request(app)
        .get(`/api/accounts/${testAccountId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.account.accountId).toBe(testAccountId);
      expect(res.body.data.metrics).toBeDefined();
      expect(typeof res.body.data.metrics.incomingCount).toBe('number');
      expect(typeof res.body.data.metrics.outgoingCount).toBe('number');
    });

    it('GET /api/accounts/:id/transactions returns account direct transactions', async () => {
      const res = await request(app)
        .get(`/api/accounts/ACC-CYCLE-01/transactions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/accounts/:id/neighbors returns 1-hop connected subgraph', async () => {
      const res = await request(app)
        .get(`/api/accounts/ACC-CYCLE-01/neighbors?depth=1`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.nodes).toBeDefined();
      expect(res.body.data.edges).toBeDefined();
      expect(res.body.data.nodes.some((n: any) => n.id === 'ACC-CYCLE-01')).toBe(true);
    });

    it('POST /api/accounts creates new account', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId: 'ACC-TEST-NEW-01',
          accountType: 'BUSINESS',
          balance: 75000,
          ownerName: 'Test Corp Global',
          riskScore: 45,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.accountId).toBe('ACC-TEST-NEW-01');
    });

    it('PATCH /api/accounts/:id updates account attributes', async () => {
      const res = await request(app)
        .patch('/api/accounts/ACC-TEST-NEW-01')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'FLAGGED',
          riskScore: 88,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('FLAGGED');
      expect(res.body.data.isFlagged).toBe(true);
    });
  });

  describe('4. Graph & Analysis APIs', () => {
    it('GET /api/graph returns overall network data', async () => {
      const res = await request(app)
        .get('/api/graph?limit=50')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.nodes.length).toBeGreaterThan(0);
      expect(res.body.data.edges.length).toBeGreaterThan(0);
    });

    it('GET /api/graph/statistics returns complete network metrics', async () => {
      const res = await request(app)
        .get('/api/graph/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalAccounts).toBeGreaterThan(0);
      expect(res.body.data.totalTransactions).toBeGreaterThan(0);
      expect(res.body.data.flaggedAccounts).toBeGreaterThan(0);
      expect(res.body.data.networkDensity).toBeDefined();
      expect(res.body.data.averageDegree).toBeDefined();
    });

    it('POST /api/graph/subgraph fetches subgraph around accounts with depth filter', async () => {
      const res = await request(app)
        .post('/api/graph/subgraph')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountIds: ['ACC-CYCLE-01', 'ACC-CYCLE-02'],
          maxDepth: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.nodes.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.edges.length).toBeGreaterThan(0);
    });

    it('POST /api/graph/traverse executes BFS traversal', async () => {
      const res = await request(app)
        .post('/api/graph/traverse')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          algorithm: 'BFS',
          startAccountId: 'ACC-CYCLE-01',
          direction: 'BOTH',
          maxDepth: 3,
          limit: 20,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.algorithm).toBe('BFS');
      expect(res.body.data.reachableAccounts).toBeDefined();
      expect(res.body.data.paths.length).toBeGreaterThan(0);
      expect(res.body.data.metrics.executionTimeMs).toBeDefined();
      expect(res.body.data.metrics.nodesVisitedCount).toBeGreaterThan(0);
    });

    it('POST /api/graph/traverse executes DFS traversal', async () => {
      const res = await request(app)
        .post('/api/graph/traverse')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          algorithm: 'DFS',
          startAccountId: 'ACC-CYCLE-01',
          direction: 'BOTH',
          maxDepth: 4,
          limit: 20,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.algorithm).toBe('DFS');
      expect(res.body.data.paths.length).toBeGreaterThan(0);
      expect(res.body.data.metrics.executionTimeMs).toBeDefined();
    });

    it('POST /api/graph/cycles runs Johnson directed cycle detection', async () => {
      const res = await request(app)
        .post('/api/graph/cycles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          minLength: 3,
          maxLength: 6,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.cycles).toBeDefined();
      expect(res.body.data.cycles.length).toBeGreaterThan(0);
      expect(res.body.data.totalCyclesFound).toBeGreaterThan(0);
      expect(res.body.data.sccs).toBeDefined();

      const cycle = res.body.data.cycles[0];
      expect(cycle.length).toBeGreaterThanOrEqual(3);
      expect(cycle.totalAmount).toBeGreaterThan(0);
      expect(cycle.riskScore).toBeGreaterThan(0);
    });

    it('POST /api/graph/communities runs Louvain community detection', async () => {
      const res = await request(app)
        .post('/api/graph/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resolution: 1.0,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.modularity).toBeDefined();
      expect(res.body.data.communities.length).toBeGreaterThan(0);
      expect(res.body.data.totalCommunities).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.bridgingTransactions)).toBe(true);
    });
  });

  describe('5. Investigations & Findings APIs', () => {
    it('GET /api/investigations returns list of cases', async () => {
      const res = await request(app)
        .get('/api/investigations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      testInvestigationId = res.body.data[0].id;
    });

    it('POST /api/investigations creates new investigation case', async () => {
      const res = await request(app)
        .post('/api/investigations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'INV-2026-999: Automated Test Case Investigation',
          description: 'Created during Supertest integration suite execution.',
          priority: 'CRITICAL',
          initialAccountIds: ['ACC-CYCLE-01', 'ACC-CYCLE-02'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toContain('INV-2026-999');
      testInvestigationId = res.body.data.id;
    });

    it('GET /api/investigations/:id returns full case details with accounts and subgraph', async () => {
      const res = await request(app)
        .get(`/api/investigations/${testInvestigationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testInvestigationId);
      expect(res.body.data.accounts).toBeDefined();
      expect(res.body.data.findings).toBeDefined();
      expect(res.body.data.notes).toBeDefined();
      expect(res.body.data.subgraph).toBeDefined();
    });

    it('PATCH /api/investigations/:id updates status and priority', async () => {
      const res = await request(app)
        .patch(`/api/investigations/${testInvestigationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'UNDER_REVIEW',
          priority: 'HIGH',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('UNDER_REVIEW');
      expect(res.body.data.priority).toBe('HIGH');
    });

    it('POST /api/investigations/:id/findings links finding to case', async () => {
      const res = await request(app)
        .post(`/api/investigations/${testInvestigationId}/findings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Suspicious 3-Hop Cycle Flow',
          description: 'High velocity flow detected by Johnson cycle engine.',
          severity: 'HIGH',
          findingType: 'CYCLE',
          involvedAccounts: ['ACC-CYCLE-01', 'ACC-CYCLE-02', 'ACC-CYCLE-03'],
          rationale: 'Closed loop transaction routing indicates layering.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.investigationId).toBe(testInvestigationId);
      testFindingId = res.body.data.id;
    });

    it('GET /api/investigations/:id/findings returns findings for case', async () => {
      const res = await request(app)
        .get(`/api/investigations/${testInvestigationId}/findings`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((f: any) => f.id === testFindingId)).toBe(true);
    });
  });

  describe('6. Notes & Annotations APIs', () => {
    it('POST /api/investigations/:id/notes creates collaborative note', async () => {
      const res = await request(app)
        .post(`/api/investigations/${testInvestigationId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Confirmed beneficial ownership match for offshore node.',
          targetAccountId: 'ACC-CYCLE-01',
          isPinned: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.content).toContain('Confirmed beneficial ownership');
      testNoteId = res.body.data.id;
    });

    it('GET /api/investigations/:id/notes returns notes list', async () => {
      const res = await request(app)
        .get(`/api/investigations/${testInvestigationId}/notes`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('PATCH /api/notes/:id updates note content', async () => {
      const res = await request(app)
        .patch(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated: Confirmed beneficial ownership match with Interpol Red Notice.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toContain('Interpol Red Notice');
    });

    it('DELETE /api/notes/:id deletes note', async () => {
      const res = await request(app)
        .delete(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('7. Dataset Management APIs', () => {
    it('GET /api/datasets lists past imports', async () => {
      const res = await request(app)
        .get('/api/datasets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('POST /api/datasets/import imports valid CSV transactions', async () => {
      const csvData = [
        'transaction_id,sender_account_id,receiver_account_id,amount,timestamp',
        'TXN-IMP-001,ACC-TEST-A,ACC-TEST-B,14500.50,2026-02-15T10:00:00Z',
        'TXN-IMP-002,ACC-TEST-B,ACC-TEST-C,14200.00,2026-02-15T11:00:00Z',
      ].join('\n');

      const res = await request(app)
        .post('/api/datasets/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          csvData,
          fileName: 'batch_test.csv',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.successCount).toBe(2);
      expect(res.body.data.failureCount).toBe(0);
      expect(res.body.data.newAccountsCount).toBeGreaterThan(0);
    });

    it('POST /api/datasets/import validates rows and reports errors for invalid rows', async () => {
      const invalidCsvData = [
        'transaction_id,sender_account_id,receiver_account_id,amount,timestamp',
        'TXN-BAD-001,ACC-TEST-A,ACC-TEST-A,-500,invalid-date',
      ].join('\n');

      const res = await request(app)
        .post('/api/datasets/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          csvData: invalidCsvData,
          fileName: 'bad_batch.csv',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.failureCount).toBeGreaterThan(0);
      expect(res.body.data.errors.length).toBeGreaterThan(0);
    });
  });

  describe('8. Evaluation APIs', () => {
    it('POST /api/evaluation/run executes benchmark suite and returns metrics', async () => {
      const res = await request(app)
        .post('/api/evaluation/run')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.traversalBenchmark).toBeDefined();
      expect(res.body.data.cycleScalabilityBenchmark).toBeDefined();
      expect(res.body.data.communityBenchmark).toBeDefined();
      expect(res.body.data.classificationMetrics).toBeDefined();

      const metrics = res.body.data.classificationMetrics;
      expect(metrics.precision).toBeGreaterThan(0.7);
      expect(metrics.recall).toBeGreaterThan(0.7);
      expect(metrics.f1Score).toBeGreaterThan(0.7);
    });

    it('GET /api/evaluation/results returns cached benchmark metrics', async () => {
      const res = await request(app)
        .get('/api/evaluation/results')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.classificationMetrics).toBeDefined();
      expect(res.body.data.traversalBenchmark.length).toBeGreaterThan(0);
    });
  });

  describe('9. Cleanup & Teardown', () => {
    it('DELETE /api/investigations/:id removes test case', async () => {
      const res = await request(app)
        .delete(`/api/investigations/${testInvestigationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });
});

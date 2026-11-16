import { Router } from 'express';
import * as graphController from '../controllers/graph.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Overall graph & stats
router.get('/', graphController.getGraph);
router.get('/statistics', graphController.getStatistics);

// Subgraph & neighbors
router.post('/subgraph', graphController.getSubgraph);
router.get('/neighbors/:nodeId', graphController.getNeighbors);

// Traversal (BFS & DFS)
router.post('/traverse', graphController.traverse);
router.post('/bfs', graphController.runBFS);
router.post('/dfs', graphController.runDFS);

// Analysis
router.post('/cycles', graphController.detectCycles);
router.post('/communities', graphController.detectCommunities);

export default router;

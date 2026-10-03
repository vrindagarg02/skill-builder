import { Router } from 'express';
import { z } from 'zod';
import { analyzeGitHubUrl } from '../services/githubAnalyzer.js';

const router = Router();
const bodySchema = z.object({ url: z.string().url().max(300) });

router.post('/analyze/github', async (req, res, next) => {
  try {
    const { url } = bodySchema.parse(req.body);
    const result = await analyzeGitHubUrl(url);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/profile/:username', async (req, res, next) => {
  try {
    const result = await analyzeGitHubUrl(`https://github.com/${req.params.username}`);
    res.json(result);
  } catch (error) { next(error); }
});

export default router;

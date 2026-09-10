import 'dotenv/config';
import { createApp } from './src/app.js';
import { initDb } from './src/db/db.js';

const PORT = Number(process.env.PORT) || 3001;

initDb();
const app = createApp();

app.listen(PORT, () => {
  console.log(`[scamshield] server listening on http://localhost:${PORT}`);
  console.log(`[scamshield] mode: ${process.env.AI_API_KEY ? 'live-AI' : 'DEMO MODE'}`);
});
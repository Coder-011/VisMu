import app from './app';
import { initDB } from './database/db';

const PORT = process.env.PORT || 3000;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`VisMu Backend running on port ${PORT}`);
  });
});

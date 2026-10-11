import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { aiService } from './src/services/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Route API pour l'analyse IA de Flash w
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { matchDetails } = req.body;
    if (!matchDetails) {
      return res.status(400).json({ success: false, error: 'Les détails du match sont requis.' });
    }

    const analysis = await aiService.generateMatchAnalysis(matchDetails);
    res.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Erreur route /api/ai/analyze :', error);
    res.status(500).json({ success: false, error: 'Impossible de générer l\'analyse IA pour le moment.' });
  }
});

// Interface interactive pour Flash w
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Flash w - Interface de Test IA</title>
      <style>
        body { background-color: #0d1b2a; color: #e0e1dd; font-family: sans-serif; padding: 20px; text-align: center; }
        h1 { color: #48cae4; font-size: 24px; }
        .card { background: #1b263b; padding: 20px; border-radius: 12px; max-width: 500px; margin: 0 auto; text-align: left; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        input { width: 100%; padding: 10px; margin-top: 10px; border-radius: 6px; border: 1px solid #415a77; background: #0d1b2a; color: #fff; box-sizing: border-box; }
        button { width: 100%; padding: 12px; margin-top: 15px; border-radius: 6px; border: none; background: #00b4d8; color: #fff; font-weight: bold; font-size: 16px; cursor: pointer; }
        button:hover { background: #90e0ef; color: #0d1b2a; }
        #result { margin-top: 15px; padding: 10px; background: #0d1b2a; border-radius: 6px; border-left: 4px solid #48cae4; display: none; white-space: pre-wrap; word-break: break-word; }
      </style>
    </head>
    <body>
      <h1>⚡ Flash w - Analyseur IA</h1>
      <div class="card">
        <label for="matchInput"><strong>Entrez un match :</strong></label>
        <input type="text" id="matchInput" value="Real Madrid vs FC Barcelone, Finale ce soir">
        <button onclick="testAI()">Lancer l'analyse IA</button>
        <div id="result"></div>
      </div>

      <script>
        async function testAI() {
          const resultDiv = document.getElementById('result');
          const matchDetails = document.getElementById('matchInput').value;
          resultDiv.style.display = 'block';
          resultDiv.innerText = "Analyse en cours par Gemini 3.8 Flash...";

          try {
            const res = await fetch('/api/ai/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ matchDetails })
            });
            const data = await res.json();
            if (data.success) {
              resultDiv.innerText = data.analysis;
            } else {
              resultDiv.innerText = "Erreur: " + data.error;
            }
          } catch (e) {
            resultDiv.innerText = "Erreur de connexion au serveur.";
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Serveur Flash w démarré sur le port ${PORT}`);
});

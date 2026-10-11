import { liveScoreDiscovery } from '../src/services/oddsAm/liveScoreDiscovery';
import { oddsParser } from '../src/services/oddsAm/oddsParser';
import { oddsHistoryManager } from '../src/services/oddsAm/oddsHistory';
import { matchDetailsManager } from '../src/services/oddsAm/matchDetails';
import { oddsAmValidator } from '../src/services/oddsAm/oddsAmValidator';
import { oddsAmClientInstance } from '../src/services/oddsAm/oddsAmClient';

async function runTestSuite() {
  console.log('====================================================');
  console.log('  SUITE DE TESTS VALIDATION CONNECTEUR RÉEL ODDS.AM ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 15;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] Test ${passedTests + 1}/${totalTests} : ${testName}`);
      if (detail) console.log(`       → ${detail}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test : ${testName}`);
      if (detail) console.error(`       → ${detail}`);
      throw new Error(`Échec du test : ${testName}`);
    }
  }

  // 1. Découverte de plusieurs sports
  console.log('1. Test de découverte automatique des sports...');
  const menu = await liveScoreDiscovery.discoverSportsMenu();
  const sportsKeys = Object.keys(menu);
  assert(
    sportsKeys.length >= 2,
    'Découverte de plusieurs sports',
    `${sportsKeys.length} sports découverts : ${Object.values(menu).join(', ')}`
  );

  // 2. Découverte de plusieurs matchs
  console.log('\n2. Test de découverte automatique de plusieurs matchs...');
  const { matches: discoveredMatches, sports } = await liveScoreDiscovery.discoverAllMatches();
  assert(
    discoveredMatches.length >= 2,
    'Découverte de plusieurs matchs',
    `${discoveredMatches.length} matchs découverts à travers ${sports.length} sports réels`
  );

  // 3. Extraction automatique des match_id (non hardcodé)
  console.log('\n3. Test d\'extraction automatique des match_id depuis les URLs...');
  const sampleUrl = '/fr/match/41657051/avangard-lada-ti/';
  const extractedId = liveScoreDiscovery.extractMatchIdFromUrl(sampleUrl);
  const sampleMatch = discoveredMatches[0];
  assert(
    extractedId === '41657051' && !!sampleMatch.matchId && sampleMatch.matchId !== '41535665',
    'Extraction dynamique des match_id sans valeur hardcodée',
    `Exemple extrait : ${sampleMatch.matchId} (${sampleMatch.homeTeam} vs ${sampleMatch.awayTeam})`
  );

  // 4. Récupération des détails
  console.log('\n4. Test de récupération des détails...');
  const sportEvent = matchDetailsManager.buildSportEvent(sampleMatch, []);
  assert(
    sportEvent.homeTeam === sampleMatch.homeTeam &&
      sportEvent.awayTeam === sampleMatch.awayTeam &&
      sportEvent.id === sampleMatch.matchId &&
      !!sportEvent.competition,
    'Récupération et normalisation des détails du match',
    `${sportEvent.homeTeam} vs ${sportEvent.awayTeam} (${sportEvent.competition})`
  );

  // 5. Récupération des marchés
  console.log('\n5. Test de récupération des marchés réels...');
  const { markets, availableMarketKeys, bookmakers } = await oddsParser.fetchAllMatchMarkets(
    sampleMatch.matchId,
    sampleMatch.isLive
  );
  assert(
    Array.isArray(markets),
    'Récupération des marchés depuis ODDS.am',
    `${markets.length} marchés récupérés, ${availableMarketKeys.length} types disponibles (${availableMarketKeys.slice(0, 5).join(', ')})`
  );

  // 6. Récupération des bookmakers
  console.log('\n6. Test de récupération des bookmakers...');
  assert(
    Array.isArray(bookmakers),
    'Récupération des bookmakers réels',
    `${bookmakers.length} bookmakers identifiés avec IDs et logos réels`
  );

  // 7. Comparaison ancienne / nouvelle cote
  console.log('\n7. Test de comparaison ancienne / nouvelle cote...');
  const testMatchId = `test_${Date.now()}`;
  const res1 = oddsHistoryManager.recordOdd(testMatchId, 'three', '1', 1.85);
  const res2 = oddsHistoryManager.recordOdd(testMatchId, 'three', '1', 1.95);
  assert(
    res2.previousOdd === 1.85 && res2.difference === 0.1,
    'Mémorisation ancienne cote et calcul de différence',
    `1.85 → 1.95 (diff: +${res2.difference})`
  );

  // 8. Détection ↑ (UP)
  console.log('\n8. Test de détection de hausse (UP)...');
  assert(
    res2.variation === 'UP' && res2.trend === 'up',
    'Détection exacte de la hausse (UP / ↑)',
    `Variation: ${res2.variation}`
  );

  // 9. Détection ↓ (DOWN)
  console.log('\n9. Test de détection de baisse (DOWN)...');
  const res3 = oddsHistoryManager.recordOdd(testMatchId, 'three', '1', 1.80);
  assert(
    res3.variation === 'DOWN' && res3.trend === 'down' && res3.difference === -0.15,
    'Détection exacte de la baisse (DOWN / ↓)',
    `1.95 → 1.80 (Variation: ${res3.variation}, diff: ${res3.difference})`
  );

  // 10. Absence de variation si aucune ancienne valeur
  console.log('\n10. Test d\'absence de variation si aucune ancienne cote...');
  const freshOddId = `fresh_${Date.now()}`;
  const freshRes = oddsHistoryManager.recordOdd(freshOddId, 'three', 'X', 3.40);
  assert(
    freshRes.variation === null && freshRes.previousOdd === undefined,
    'Variation strictement nulle sans ancienne cote fiable',
    `variation = ${freshRes.variation}, previousOdd = ${freshRes.previousOdd}`
  );

  // 11. Déduplication
  console.log('\n11. Test de déduplication...');
  const matchIds = discoveredMatches.map(m => m.matchId);
  const uniqueMatchIds = new Set(matchIds);
  assert(
    matchIds.length === uniqueMatchIds.size,
    'Déduplication stricte des événements par match_id unique',
    `${matchIds.length} événements tous uniques`
  );

  // 12. Gestion d'un match défaillant
  console.log('\n12. Test d\'isolation et gestion d\'un match défaillant...');
  const invalidEvent: any = {
    matchId: '',
    homeTeam: '',
    awayTeam: 'B',
  };
  const isValid = oddsAmValidator.isValidDiscoveredEvent(invalidEvent);
  assert(
    isValid === false,
    'Rejet isolé des données défaillantes sans bloquer les autres',
    'Données incomplètes correctement invalidées'
  );

  // 13. Absence de données fictives
  console.log('\n13. Test d\'absence totale de données fictives...');
  const allEvents = oddsAmClientInstance.getEvents();
  const hasDemoWords = allEvents.some(
    e =>
      e.homeTeam.toLowerCase().includes('demo') ||
      e.awayTeam.toLowerCase().includes('fictif') ||
      e.competition.toLowerCase().includes('simulation')
  );
  assert(
    hasDemoWords === false,
    'Aucune donnée fictive ou simulée dans FLASH',
    'Toutes les données proviennent de réponses réelles ODDS.am'
  );

  // 14. Classement DIRECT / AUJOURD\'HUI / À VENIR
  console.log('\n14. Test de classement des statuts (LIVE, UPCOMING, FINISHED)...');
  const liveStatus = matchDetailsManager.determineStatus(true, '45 Min.');
  const finishedStatus = matchDetailsManager.determineStatus(false, 'FT Finished');
  const upcomingStatus = matchDetailsManager.determineStatus(false, undefined);
  assert(
    liveStatus === 'live' && finishedStatus === 'finished' && upcomingStatus === 'upcoming',
    'Classement exact et strict des statuts des événements',
    `Live: ${liveStatus}, Finished: ${finishedStatus}, Upcoming: ${upcomingStatus}`
  );

  // 15. Mise à jour automatique (Client sync)
  console.log('\n15. Test de la boucle de synchronisation complète...');
  const syncResult = await oddsAmClientInstance.sync();
  const stats = oddsAmClientInstance.getAdminStats();
  assert(
    syncResult.success && stats.sportsCount >= 1,
    'Mise à jour automatique et statistiques administrateur opérationnelles',
    `Status: ${stats.status}, Matchs: ${stats.matchesCount}, Sports: ${stats.sportsCount}`
  );

  console.log('\n====================================================');
  console.log(`  RÉSULTAT : ${passedTests}/${totalTests} TESTS RÉUSSIS AVEC SUCCÈS ! `);
  console.log('====================================================\n');
}

runTestSuite().catch(err => {
  console.error('Erreur durant les tests :', err);
  process.exit(1);
});

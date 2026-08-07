import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_URL = 'http://localhost:4000/api';
const prisma = new PrismaClient();

const results = {
  passed: [] as string[],
  failed: [] as { test: string, error: any }[]
};

function pass(testName: string) {
  console.log(`✅ [PASS] ${testName}`);
  results.passed.push(testName);
}

function fail(testName: string, error: any) {
  console.error(`❌ [FAIL] ${testName}`);
  if (error) console.error(error);
  results.failed.push({ test: testName, error });
}

async function runAudit() {
  console.log('--- STARTING QA AUDIT ---');
  let adminToken = '';
  
  // 1. Authentication
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@cricrs.com',
      password: 'Admin@123'
    });
    if (res.data.token && res.data.user.role === 'ADMIN') {
      adminToken = res.data.token;
      pass('Admin Authentication');
    } else {
      fail('Admin Authentication', 'No token or wrong role');
    }
  } catch (err: any) {
    fail('Admin Authentication', err.response?.data || err.message);
  }

  const authHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

  // 2. Auth Errors
  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@cricrs.com',
      password: 'WrongPassword'
    });
    fail('Invalid Login Handling', 'Allowed login with wrong password');
  } catch (err: any) {
    if (err.response?.status === 401 || err.response?.status === 400) {
      pass('Invalid Login Handling');
    } else {
      fail('Invalid Login Handling', `Unexpected status: ${err.response?.status}`);
    }
  }

  // 3. Team Management
  let team1, team2;
  const ts = Date.now().toString().slice(-6);
  try {
    // Create Team 1
    const t1Res = await axios.post(`${API_URL}/admin/teams`, {
      name: `QA Team A ${ts}`, shortName: `QTA${ts}`, city: 'QA City'
    }, authHeaders);
    team1 = t1Res.data.team;

    // Create Team 2
    const t2Res = await axios.post(`${API_URL}/admin/teams`, {
      name: `QA Team B ${ts}`, shortName: `QTB${ts}`, city: 'QA City 2'
    }, authHeaders);
    team2 = t2Res.data.team;

    if (team1.id && team2.id) {
      pass('Team Creation');
    } else {
      fail('Team Creation', 'Invalid team response');
    }
  } catch (err: any) {
    fail('Team Creation', err.response?.data || err.message);
  }

  // 4. Player Management
  let p1, p2, p3;
  try {
    const p1Res = await axios.post(`${API_URL}/admin/players`, {
      name: `QA Player 1 ${ts}`, mobileNumber: `90${ts}01`, role: 'BATSMAN', battingStyle: 'RIGHT_HANDED', bowlingStyle: 'NONE', teamId: team1.id
    }, authHeaders);
    const p2Res = await axios.post(`${API_URL}/admin/players`, {
      name: `QA Player 2 ${ts}`, mobileNumber: `90${ts}02`, role: 'BOWLER', battingStyle: 'RIGHT_HANDED', bowlingStyle: 'RIGHT_ARM_FAST', teamId: team1.id
    }, authHeaders);
    const p3Res = await axios.post(`${API_URL}/admin/players`, {
      name: `QA Player 3 ${ts}`, mobileNumber: `90${ts}03`, role: 'BATSMAN', battingStyle: 'LEFT_HANDED', bowlingStyle: 'NONE', teamId: team2.id
    }, authHeaders);

    p1 = p1Res.data.player;
    p2 = p2Res.data.player;
    p3 = p3Res.data.player;

    if (p1.id && p3.id) pass('Player Creation & Team Assignment');
    else fail('Player Creation & Team Assignment', 'Missing IDs');
  } catch (err: any) {
    fail('Player Creation & Team Assignment', err.response?.data || err.message);
  }

  // 5. Match Creation
  let match;
  try {
    const mRes = await axios.post(`${API_URL}/admin/matches`, {
      teamAId: team1.id,
      teamBId: team2.id,
      format: 'T10',
      overs: 2, // Quick test
      venue: 'QA Stadium',
      scheduledAt: new Date().toISOString()
    }, authHeaders);
    match = mRes.data.match;
    if (match.id) pass('Match Creation');
    else fail('Match Creation', 'No match ID');
  } catch (err: any) {
    fail('Match Creation', err.response?.data || err.message);
  }

  // 6. Match Start & Live Scoring
  try {
    // Start Match
    await axios.post(`${API_URL}/admin/matches/${match.id}/start`, {
      tossWinnerId: team1.id,
      tossDecision: 'BAT',
      battingTeamId: team1.id,
      bowlingTeamId: team2.id,
      strikerId: p1.id,
      nonStrikerId: p2.id,
      bowlerId: p3.id
    }, authHeaders);
    pass('Match Start (Toss & Opening Players)');

    // Check Match State to get Innings ID
    const matchState1 = await axios.get(`${API_URL}/matches/${match.id}`);
    const inningsId = matchState1.data.match.innings[0].id;

    // Ball 1: Dot ball
    await axios.post(`${API_URL}/admin/scoring/ball`, {
      inningsId, overNumber: 0, ballNumber: 1, ballType: 'NORMAL', runsScored: 0, extrasRuns: 0, isWicket: false, strikerId: p1.id, nonStrikerId: p2.id, bowlerId: p3.id, batterId: p1.id
    }, authHeaders);

    // Ball 2: 4 runs
    await axios.post(`${API_URL}/admin/scoring/ball`, {
      inningsId, overNumber: 0, ballNumber: 2, ballType: 'NORMAL', runsScored: 4, extrasRuns: 0, isBoundary: true, isWicket: false, strikerId: p1.id, nonStrikerId: p2.id, bowlerId: p3.id, batterId: p1.id
    }, authHeaders);

    // Ball 3: Wide + 1 run (2 extras)
    await axios.post(`${API_URL}/admin/scoring/ball`, {
      inningsId, overNumber: 0, ballNumber: 2, ballType: 'WIDE', runsScored: 0, extrasRuns: 2, isWicket: false, strikerId: p1.id, nonStrikerId: p2.id, bowlerId: p3.id, batterId: p1.id
    }, authHeaders);

    // Check Match State
    const matchState2 = await axios.get(`${API_URL}/matches/${match.id}`);
    const inning = matchState2.data.match.innings[0];
    if (inning.totalRuns === 6 && inning.totalBalls === 2) {
      pass('Scoring Math (Runs & Wides)');
    } else {
      fail('Scoring Math (Runs & Wides)', `Expected 6 runs in 2 balls, got ${inning.totalRuns} in ${inning.totalBalls}`);
    }

    // Ball 4: Wicket (Caught)
    await axios.post(`${API_URL}/admin/scoring/ball`, {
      inningsId, overNumber: 0, ballNumber: 3, ballType: 'NORMAL', runsScored: 0, extrasRuns: 0, isWicket: true, wicketType: 'CAUGHT', dismissedBatterId: p1.id, strikerId: p1.id, nonStrikerId: p2.id, bowlerId: p3.id, batterId: p1.id
    }, authHeaders);
    pass('Wicket Logging');

    // End Innings
    await axios.post(`${API_URL}/admin/matches/${match.id}/end-innings`, {
      inningsId,
      battingTeamId: team2.id,
      bowlingTeamId: team1.id
    }, authHeaders);
    pass('End Innings & Target Calculation');

    const matchState3 = await axios.get(`${API_URL}/matches/${match.id}`);
    const inningsId2 = matchState3.data.match.innings[1].id;

    // Start 2nd Innings (Set players)
    await axios.patch(`${API_URL}/admin/scoring/innings/${inningsId2}/set-players`, {
      strikerId: p3.id,
      nonStrikerId: p3.id,
      bowlerId: p2.id
    }, authHeaders);

    // Hit a 6 in 2nd Innings to win
    await axios.post(`${API_URL}/admin/scoring/ball`, {
      inningsId: inningsId2, overNumber: 0, ballNumber: 1, ballType: 'NORMAL', runsScored: 6, extrasRuns: 0, isBoundary: true, isWicket: false, strikerId: p3.id, nonStrikerId: p3.id, bowlerId: p2.id, batterId: p3.id
    }, authHeaders);

    // End Match
    await axios.post(`${API_URL}/admin/matches/${match.id}/end-match`, {
      resultText: 'QA Team B won by 10 wickets'
    }, authHeaders);
    
    // Fetch Player Stats
    const player3 = await prisma.player.findUnique({ where: { id: p3.id } });
    if (player3 && player3.totalMatches === 1 && player3.totalRuns === 6 && player3.totalSixes === 1) {
      pass('Match Completion & Stats Generation');
    } else {
      fail('Match Completion & Stats Generation', `Expected 1 match, 6 runs, 1 six, got ${JSON.stringify(player3)}`);
    }

  } catch (err: any) {
    fail('Live Scoring & Match State', err.response?.data || err.message);
  }

  console.log('\n--- AUDIT RESULTS ---');
  console.log(`Passed: ${results.passed.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log(JSON.stringify(results.failed, null, 2));
  }
}

runAudit().catch(console.error).finally(() => prisma.$disconnect());

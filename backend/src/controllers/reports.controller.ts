import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

/** GET /api/reports/players */
export const exportPlayersStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const format = req.query.format as string || 'csv';
    const playerIdsParam = req.query.playerIds as string;

    let whereClause: any = { isGuest: false };
    if (playerIdsParam) {
      const ids = playerIdsParam.split(',').map(id => id.trim()).filter(id => id);
      if (ids.length > 0) {
        whereClause.id = { in: ids };
      }
    }

    const players = await prisma.player.findMany({ 
      where: whereClause,
      include: { team: true },
      orderBy: { totalRuns: 'desc' },
    });

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Player Statistics');

      sheet.columns = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Team', key: 'team', width: 20 },
        { header: 'Matches', key: 'matches', width: 10 },
        { header: 'Runs', key: 'runs', width: 10 },
        { header: 'Avg', key: 'avg', width: 10 },
        { header: 'SR', key: 'sr', width: 10 },
        { header: 'Wickets', key: 'wickets', width: 10 },
        { header: 'Economy', key: 'economy', width: 10 },
      ];

      players.forEach(p => {
        sheet.addRow({
          name: p.name,
          team: p.team?.name || 'None',
          matches: p.totalMatches,
          runs: p.totalRuns,
          avg: p.battingAvg,
          sr: p.strikeRate,
          wickets: p.totalWickets,
          economy: p.economy,
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="player_stats.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="player_stats.pdf"');
      doc.pipe(res);

      doc.fontSize(20).text('Player Statistics Report', { align: 'center' });
      doc.moveDown();

      players.forEach((p, i) => {
        doc.fontSize(12).text(`${i + 1}. ${p.name} (${p.team?.name || 'No Team'})`);
        doc.fontSize(10).text(`Matches: ${p.totalMatches} | Runs: ${p.totalRuns} | Avg: ${p.battingAvg} | SR: ${p.strikeRate} | Wickets: ${p.totalWickets} | Eco: ${p.economy}`);
        doc.moveDown(0.5);
      });

      doc.end();
      return;
    }

    // Default: CSV
    let csv = 'Name,Team,Matches,Runs,Avg,SR,Wickets,Economy\n';
    players.forEach(p => {
      csv += `${p.name},${p.team?.name || ''},${p.totalMatches},${p.totalRuns},${p.battingAvg},${p.strikeRate},${p.totalWickets},${p.economy}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="player_stats.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

/** GET /api/reports/match/:id */
export const exportMatchScorecard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const format = req.query.format as string || 'csv';
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        teamA: true, teamB: true, tournament: true,
        innings: {
          include: {
            battingTeam: true, bowlingTeam: true,
            battingCards: { include: { player: true }, orderBy: { battingOrder: 'asc' } },
            bowlingCards: { include: { player: true }, orderBy: { wickets: 'desc' } }
          }
        }
      }
    });

    if (!match) return next(createError('Match not found', 404));

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      
      match.innings.forEach((inning, idx) => {
        const sheet = workbook.addWorksheet(`${inning.battingTeam.shortName} Innings`);
        
        sheet.addRow(['Batting']);
        sheet.addRow(['Batter', 'Runs', 'Balls', '4s', '6s', 'Status']);
        inning.battingCards.forEach(card => {
          sheet.addRow([card.player.name, card.runs, card.balls, card.fours, card.sixes, card.isOut ? 'Out' : 'Not Out']);
        });

        sheet.addRow([]);
        sheet.addRow(['Bowling']);
        sheet.addRow(['Bowler', 'Overs', 'Maidens', 'Runs', 'Wickets']);
        inning.bowlingCards.forEach(card => {
          sheet.addRow([card.player.name, card.overs, card.maidens, card.runs, card.wickets]);
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="match_${match.id}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="match_${match.id}.pdf"`);
      doc.pipe(res);

      doc.fontSize(20).text(`${match.teamA.name} vs ${match.teamB.name}`, { align: 'center' });
      doc.fontSize(12).text(match.resultText || 'Match in progress', { align: 'center' });
      doc.moveDown();

      match.innings.forEach(inning => {
        doc.fontSize(16).text(`${inning.battingTeam.name} Innings - ${inning.totalRuns}/${inning.totalWickets} (${Math.floor(inning.totalBalls/6)}.${inning.totalBalls%6} ov)`, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text('Batting:');
        inning.battingCards.forEach(card => {
          doc.fontSize(10).text(`${card.player.name} - ${card.runs} (${card.balls}) ${card.isOut ? 'Out' : 'Not Out'}`);
        });
        doc.moveDown(0.5);
        doc.fontSize(12).text('Bowling:');
        inning.bowlingCards.forEach(card => {
          doc.fontSize(10).text(`${card.player.name} - ${card.overs} overs, ${card.runs} runs, ${card.wickets} wkts`);
        });
        doc.moveDown();
      });

      doc.end();
      return;
    }

    // Default: CSV
    let csv = `Match,${match.teamA.name} vs ${match.teamB.name}\n`;
    csv += `Result,${match.resultText || 'In Progress'}\n\n`;

    match.innings.forEach(inning => {
      csv += `${inning.battingTeam.name} Batting\n`;
      csv += `Batter,Runs,Balls,4s,6s,Status\n`;
      inning.battingCards.forEach(card => {
        csv += `${card.player.name},${card.runs},${card.balls},${card.fours},${card.sixes},${card.isOut ? 'Out' : 'Not Out'}\n`;
      });
      csv += `\n${inning.bowlingTeam.name} Bowling\n`;
      csv += `Bowler,Overs,Runs,Wickets\n`;
      inning.bowlingCards.forEach(card => {
        csv += `${card.player.name},${card.overs},${card.runs},${card.wickets}\n`;
      });
      csv += `\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="match_${match.id}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

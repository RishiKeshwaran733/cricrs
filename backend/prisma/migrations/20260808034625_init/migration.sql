-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('UPCOMING', 'LIVE', 'PAUSED', 'COMPLETED', 'ABANDONED', 'RAIN_DELAY');

-- CreateEnum
CREATE TYPE "InningsStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'DECLARED');

-- CreateEnum
CREATE TYPE "BallType" AS ENUM ('NORMAL', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'DEAD_BALL', 'PENALTY');

-- CreateEnum
CREATE TYPE "WicketType" AS ENUM ('BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'OBSTRUCTING_FIELD', 'HANDLED_BALL', 'HIT_BALL_TWICE', 'TIMED_OUT', 'RETIRED_HURT');

-- CreateEnum
CREATE TYPE "TossDecision" AS ENUM ('BAT', 'BOWL');

-- CreateEnum
CREATE TYPE "MatchFormat" AS ENUM ('TEST', 'ODI', 'T20', 'T10', 'THE_HUNDRED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER', 'WICKET_KEEPER_BATSMAN');

-- CreateEnum
CREATE TYPE "BattingStyle" AS ENUM ('RIGHT_HANDED', 'LEFT_HANDED');

-- CreateEnum
CREATE TYPE "BowlingStyle" AS ENUM ('RIGHT_ARM_FAST', 'RIGHT_ARM_MEDIUM_FAST', 'RIGHT_ARM_MEDIUM', 'RIGHT_ARM_OFF_SPIN', 'RIGHT_ARM_LEG_SPIN', 'LEFT_ARM_FAST', 'LEFT_ARM_MEDIUM_FAST', 'LEFT_ARM_MEDIUM', 'LEFT_ARM_ORTHODOX', 'LEFT_ARM_CHINAMAN', 'NONE');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1a1a2e',
    "secondaryColor" TEXT NOT NULL DEFAULT '#ffffff',
    "country" TEXT,
    "city" TEXT,
    "foundedYear" INTEGER,
    "homeGround" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "captainId" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "guestMatchId" TEXT,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "photo" TEXT,
    "jerseyNumber" INTEGER,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "battingStyle" "BattingStyle" NOT NULL DEFAULT 'RIGHT_HANDED',
    "bowlingStyle" "BowlingStyle" NOT NULL DEFAULT 'NONE',
    "role" "PlayerRole" NOT NULL DEFAULT 'BATSMAN',
    "bio" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "highestScore" INTEGER NOT NULL DEFAULT 0,
    "totalFours" INTEGER NOT NULL DEFAULT 0,
    "totalSixes" INTEGER NOT NULL DEFAULT 0,
    "totalWickets" INTEGER NOT NULL DEFAULT 0,
    "totalCatches" INTEGER NOT NULL DEFAULT 0,
    "totalStumpings" INTEGER NOT NULL DEFAULT 0,
    "totalRunOuts" INTEGER NOT NULL DEFAULT 0,
    "battingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "strikeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bowlingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "economy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestBowling" TEXT,
    "teamId" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "guestMatchId" TEXT,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "logo" TEXT,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "format" "MatchFormat" NOT NULL DEFAULT 'T20',
    "status" "TournamentStatus" NOT NULL DEFAULT 'UPCOMING',
    "totalTeams" INTEGER NOT NULL DEFAULT 8,
    "venue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_teams" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "teamAId" TEXT NOT NULL,
    "teamBId" TEXT NOT NULL,
    "venue" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'UPCOMING',
    "format" "MatchFormat" NOT NULL DEFAULT 'T20',
    "totalOvers" INTEGER NOT NULL DEFAULT 20,
    "tournamentId" TEXT,
    "tossWinnerId" TEXT,
    "tossDecision" "TossDecision",
    "umpire1" TEXT,
    "umpire2" TEXT,
    "thirdUmpire" TEXT,
    "matchReferee" TEXT,
    "scorer" TEXT,
    "resultText" TEXT,
    "winnerId" TEXT,
    "dlsApplied" BOOLEAN NOT NULL DEFAULT false,
    "dlsTarget" INTEGER,
    "dlsPar" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "innings" (
    "id" TEXT NOT NULL,
    "inningsNumber" INTEGER NOT NULL,
    "matchId" TEXT NOT NULL,
    "battingTeamId" TEXT NOT NULL,
    "bowlingTeamId" TEXT NOT NULL,
    "status" "InningsStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "totalWickets" INTEGER NOT NULL DEFAULT 0,
    "totalBalls" INTEGER NOT NULL DEFAULT 0,
    "extras" INTEGER NOT NULL DEFAULT 0,
    "wides" INTEGER NOT NULL DEFAULT 0,
    "noBalls" INTEGER NOT NULL DEFAULT 0,
    "byes" INTEGER NOT NULL DEFAULT 0,
    "legByes" INTEGER NOT NULL DEFAULT 0,
    "penalty" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER,
    "powerplayRuns" INTEGER NOT NULL DEFAULT 0,
    "powerplayWickets" INTEGER NOT NULL DEFAULT 0,
    "currentBatterId" TEXT,
    "currentNonStrikerId" TEXT,
    "currentBowlerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "innings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balls" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "overNumber" INTEGER NOT NULL,
    "ballNumber" INTEGER NOT NULL,
    "isLegalBall" BOOLEAN NOT NULL DEFAULT true,
    "ballType" "BallType" NOT NULL DEFAULT 'NORMAL',
    "runsScored" INTEGER NOT NULL DEFAULT 0,
    "extrasRuns" INTEGER NOT NULL DEFAULT 0,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "isWicket" BOOLEAN NOT NULL DEFAULT false,
    "wicketType" "WicketType",
    "dismissedBatterId" TEXT,
    "fielderId" TEXT,
    "batterId" TEXT,
    "nonStrikerId" TEXT,
    "bowlerId" TEXT,
    "scoreAfter" INTEGER NOT NULL DEFAULT 0,
    "wicketsAfter" INTEGER NOT NULL DEFAULT 0,
    "commentary" TEXT,
    "wagonAngle" DOUBLE PRECISION,
    "wagonLength" DOUBLE PRECISION,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batting_cards" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "battingOrder" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "fours" INTEGER NOT NULL DEFAULT 0,
    "sixes" INTEGER NOT NULL DEFAULT 0,
    "strikeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isOut" BOOLEAN NOT NULL DEFAULT false,
    "dismissalType" "WicketType",
    "dismissalText" TEXT,
    "bowlerId" TEXT,
    "fielderId" TEXT,
    "didNotBat" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "batting_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bowling_cards" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "overs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "maidens" INTEGER NOT NULL DEFAULT 0,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "wickets" INTEGER NOT NULL DEFAULT 0,
    "economy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wides" INTEGER NOT NULL DEFAULT 0,
    "noBalls" INTEGER NOT NULL DEFAULT 0,
    "dotBalls" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bowling_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fall_of_wickets" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "wicketNumber" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "balls" INTEGER NOT NULL,
    "over" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,

    CONSTRAINT "fall_of_wickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnerships" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "batter1Id" TEXT NOT NULL,
    "batter1Name" TEXT NOT NULL,
    "batter2Id" TEXT NOT NULL,
    "batter2Name" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "wicketNumber" INTEGER NOT NULL,

    CONSTRAINT "partnerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_table" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "tied" INTEGER NOT NULL DEFAULT 0,
    "noResult" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "nrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runsFor" INTEGER NOT NULL DEFAULT 0,
    "oversFor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runsAgainst" INTEGER NOT NULL DEFAULT 0,
    "oversAgainst" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "points_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_shortName_key" ON "teams"("shortName");

-- CreateIndex
CREATE UNIQUE INDEX "players_mobileNumber_key" ON "players"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_teams_tournamentId_teamId_key" ON "tournament_teams"("tournamentId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "innings_matchId_inningsNumber_key" ON "innings"("matchId", "inningsNumber");

-- CreateIndex
CREATE UNIQUE INDEX "batting_cards_inningsId_playerId_key" ON "batting_cards"("inningsId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "bowling_cards_inningsId_playerId_key" ON "bowling_cards"("inningsId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "points_table_tournamentId_teamId_key" ON "points_table"("tournamentId", "teamId");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_guestMatchId_fkey" FOREIGN KEY ("guestMatchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_guestMatchId_fkey" FOREIGN KEY ("guestMatchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tossWinnerId_fkey" FOREIGN KEY ("tossWinnerId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "innings" ADD CONSTRAINT "innings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "innings" ADD CONSTRAINT "innings_battingTeamId_fkey" FOREIGN KEY ("battingTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "innings" ADD CONSTRAINT "innings_bowlingTeamId_fkey" FOREIGN KEY ("bowlingTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batting_cards" ADD CONSTRAINT "batting_cards_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batting_cards" ADD CONSTRAINT "batting_cards_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bowling_cards" ADD CONSTRAINT "bowling_cards_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bowling_cards" ADD CONSTRAINT "bowling_cards_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fall_of_wickets" ADD CONSTRAINT "fall_of_wickets_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_table" ADD CONSTRAINT "points_table_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_table" ADD CONSTRAINT "points_table_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

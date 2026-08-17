// Content pools for the deal bot. GENERATED — do not edit by hand.
//
// Extracted from the two PES Escrow reference artifacts:
//   "100 ways to describe what you are selling"  (account descriptions)
//   "100 reviews worth writing"                  (reviews, both directions)
//
// Both artifacts say plainly that these are examples rather than stock to be
// posted. They are here so that bot-generated deals read like real ones while
// being exercised against a local database — see the guard in run-deal-bot.ts.

export type BotAccount = {
  summary: string;
  game: string;
  platform: string;
  /** True for descriptions where the seller states a limitation upfront. */
  statesACatch: boolean;
};

export type BotReview = {
  rating: number;
  comment: string;
  subjectSide: "seller" | "buyer";
};

/** 100 account descriptions. */
export const ACCOUNTS: BotAccount[] = [
  {
    "summary": "eFootball 2026 mobile, Android and iOS through the same Konami ID. Team Strength 3341. Six Epics: Zidane, Henry, Nedvěd, Cannavaro, Vieira, Ronaldinho. Original Gmail included, no bans or warnings on the account.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Team Strength 3280. Full Legendary front three — R9 Ronaldo, Batistuta, Van Basten — all max level, all progression trees finished. Konami ID transfers with the original email.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile account, squad rating 3195. Four Epics and eleven POTW cards collected across the last three seasons. Nothing bought with real money, so there is no purchase history to charge back.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. 3,412 Team Strength. 22 players at level 30 or above. Squad built around a 4-3-3, full Brazilian national team chemistry. Original email and its recovery address both included.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile, Android. Team Strength 3050. Two Epics (Maldini, Pirlo) plus 8 Big Time cards. 340,000 GP unspent. Account is two years old, opened at launch.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Squad rating 3225. Complete Legendary defence: Maldini, Nesta, Cafu, Roberto Carlos, all trained to max. Goalkeeper is Epic Buffon. Email included and never used elsewhere.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile account with 47 Legendary players in the squad list, 19 of them at max progression. Team Strength 3390. No bans, no warnings, original email handed over at delivery.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Team Strength 3160. Squad is built for competitive play rather than collection — 18 players all above 100 overall, no filler cards taking up slots.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile, iOS. 3,301 Team Strength. Epic Ronaldinho and Epic Zico both at max level with full skill trees. 12 additional Legendary cards. Original Apple-linked Gmail included.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Squad rating 3088. Focus is the midfield: Epic Nedvěd, Legendary Gerrard, Legendary Xavi, all fully trained. Rest of the squad is standard cards.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile account, Team Strength 3244. 9 Epics total. Every one of them has its progression complete, so nothing further needs spending on them. Original email included.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. 3,120 Team Strength, 31 players above level 25. Squad covers three formations without needing substitutions. No purchases ever made on this account.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile, Android and iOS. Team Strength 3355. Argentina national squad completed, including Epic Maradona and Legendary Messi, both at max. Original Gmail with recovery email included.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Squad rating 3210. 5 Epics, 14 Legendary, 21 POTW. Account has never been reported and has no warning history. Email and Konami ID both transfer.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. 1.42 million GP and 4,200 eFootball Coins unspent. Squad is modest at 2,980 Team Strength — the value here is the currency, not the players.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile account holding 860,000 GP, 1,150 Coins, and 6 unopened Nominating Contracts from the current Legendary campaign.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. 2.1 million GP. Team Strength 3020. Every weekly event completed this season, so all event rewards are already claimed and in the inventory.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile with 3,000 Coins and 540,000 GP. 12 unopened packs sitting in the inbox, including two Legendary-guaranteed. Nothing has been drawn from them.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. 1.8 million GP, 2,400 Coins, 9 Nominating Contracts. Squad is deliberately unbuilt so the buyer can pick their own players.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile account, 720,000 GP. All season pass tiers unlocked and claimed for the current season. Team Strength 3105.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. 4,800 eFootball Coins, bought legitimately through the store — receipts available if the admin wants to see them. 1.1 million GP alongside.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile with 2.6 million GP saved and no Coins. Squad rating 2,940. Sold as a currency account for someone who wants to build from scratch.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. 950,000 GP, 1,800 Coins, and every Epic from the current campaign already signed. Team Strength 3268.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile account with 15 unopened Legendary packs and 400,000 GP. Squad currently 2,890 — the packs are the point.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 on PS5, tied to a Konami ID that also works on mobile. Team Strength 3312. 7 Epics. PSN account is included with its original email and no purchase history.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5. Squad rating 3280, Division 1, 640 matches played. Konami ID transfers; the PSN account stays with me, so the buyer links their own PSN.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 on PS4 and PS5, same Konami ID. Team Strength 3195. 5 Epics and 22 Legendary cards. Original Konami account email included at delivery.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5. 3,340 Team Strength. Full Italy national squad including Epic Baggio and Epic Maldini. Konami ID with original Gmail, no bans.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5, Konami ID only — no PSN account included. Squad rating 3220, 4 Epics, 1.3 million GP. Buyer links it to their own PlayStation.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS4. Team Strength 3040. 3 Epics, 18 Legendary. Account created 2022, 1,200 matches played, no disconnect penalties on record.",
    "game": "eFootball",
    "platform": "PS4",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5 with cross-progression to Steam on the same Konami ID. 3,290 Team Strength. Original email and recovery address both handed over.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5. Squad rating 3375, one of the higher-rated accounts I have built. 11 Epics, all max level. 2.4 million GP untouched.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5. Team Strength 3150, Division 2. Squad is Premier League-focused with full chemistry. Konami ID and original email included.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS4, Konami ID included with the original Outlook address. Team Strength 3080, 6 Epics, 780,000 GP. No warnings ever issued.",
    "game": "eFootball",
    "platform": "PS4",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5. 3,260 Team Strength. Every Epic released in the 2025 and 2026 seasons is on the account — 14 in total, all fully progressed.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5, Division 1 with a 71% win rate over 480 online matches. Team Strength 3305. Konami ID transfers with its original email.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5 and mobile on one Konami ID. Squad rating 3235, 8 Epics, 1.9 million GP, 3,100 Coins. Original email included.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS4. Team Strength 2,995. Smaller squad but every card is fully trained — no half-finished progression to spend GP on.",
    "game": "eFootball",
    "platform": "PS4",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 on Xbox Series X|S. Team Strength 3270. 6 Epics, 24 Legendary. Konami ID with original email; buyer links their own Xbox account.",
    "game": "eFootball",
    "platform": "Xbox",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Xbox Series X. Squad rating 3185, 1.4 million GP stockpiled. Account opened at launch, 890 matches played, no penalties.",
    "game": "eFootball",
    "platform": "Xbox",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Xbox One and Series X, same Konami ID. Team Strength 3120. 4 Epics including Epic Cruyff at max level. Original email included.",
    "game": "eFootball",
    "platform": "Xbox",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Xbox Series S. 3,240 Team Strength. Full Spain national squad with Epic Iniesta and Epic Xavi. No bans or warnings.",
    "game": "eFootball",
    "platform": "Xbox",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Xbox. Konami ID only — the Microsoft account is not part of this sale. Squad 3,090, 5 Epics, 620,000 GP.",
    "game": "eFootball",
    "platform": "Xbox",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Xbox Series X. Team Strength 3355. 10 Epics, all fully progressed. 2.2 million GP and 1,900 Coins unspent. Original Gmail included.",
    "game": "eFootball",
    "platform": "Xbox",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Xbox Series X, Division 1, 520 online matches. Squad rating 3215. Konami ID transfers with the original email and recovery address.",
    "game": "eFootball",
    "platform": "Xbox",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Xbox One. Team Strength 2,960. Budget account: no Epics, but 26 Legendary cards and 880,000 GP to build with.",
    "game": "eFootball",
    "platform": "Xbox",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 on Steam. Konami ID included with the original email. Team Strength 3225, 7 Epics. The Steam account itself is not included — link your own.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Steam. Squad rating 3310, 1.7 million GP. Cross-progression enabled to mobile on the same Konami ID, so it plays on both.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Steam, Konami ID with original Gmail. Team Strength 3145. 5 Epics, 19 Legendary, no warnings on the account in three years.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 on Steam. 3,290 Team Strength. Full Germany national squad including Epic Beckenbauer and Epic Matthäus, both max level.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Steam. Team Strength 3060, 940,000 GP, 1,400 Coins. Account is two seasons old with every seasonal reward claimed.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Steam and PS5 on one Konami ID. Squad rating 3260, 9 Epics. Original email included; both platform accounts stay with their owners.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Steam. 3,180 Team Strength, Division 2. 6 Epics and 2.8 million GP. Konami ID transfers with its original email and recovery address.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Steam. Team Strength 3,020. Built for offline and event play rather than ranked — 41 Legendary cards, low online match count.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 on Nintendo Switch. Konami ID included with original email. Team Strength 3010, 3 Epics, 640,000 GP. Nintendo account not included.",
    "game": "eFootball",
    "platform": "Switch",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Switch and mobile on one Konami ID. Squad rating 3095. 4 Epics, 18 Legendary. Original Gmail handed over at delivery.",
    "game": "eFootball",
    "platform": "Switch",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Nintendo Switch. Team Strength 2,930. 1.1 million GP unspent. Account has no bans, no warnings, and 310 matches played.",
    "game": "eFootball",
    "platform": "Switch",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Switch. Squad rating 3140, 5 Epics fully progressed. Konami ID with original email; buyer links their own Nintendo account.",
    "game": "eFootball",
    "platform": "Switch",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile, Division 1 and held there for four consecutive seasons. Team Strength 3285. 1,240 online matches, 68% win rate.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5. Division 1, current season rating 1,940. Squad 3,310. Every Division reward for this season already claimed.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Division 2, 780 matches played, no disconnect penalties. Team Strength 3155. Original email included.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Steam. Division 1 with a top-5,000 finish last season — screenshots of the placement available on request. Squad rating 3340.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Xbox. Division 3, 420 matches. Team Strength 3070. Sold as a playing account rather than a collection — the squad is competitive, not complete.",
    "game": "eFootball",
    "platform": "Xbox",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. eFootball Championship qualifier from the 2025 season, badge visible on the profile. Squad 3,265, 8 Epics.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5. 2,100 total matches across four seasons, Division 1 in three of them. Team Strength 3295, 7 Epics.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Division 1, 91 consecutive daily logins, every login reward claimed. Squad rating 3200, 1.6 million GP.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Steam. Division 2, 66% win rate over 610 matches. Team Strength 3125. No penalties, no reports, no warnings.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Level 87 profile, all Tour events completed for the current and previous season. Squad 3,180, 5 Epics.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5. Division 1, 480 matches this season alone. Squad rating 3350 with 12 Epics. Original Konami email included.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Four years old, opened at the 2022 launch. Every season pass since completed. Team Strength 3230.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Every Epic Konami has released since 2023 — 38 cards, all present, 31 at max progression. Team Strength 3395.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5. Complete Brazil legends set: Pelé, Ronaldinho, R9 Ronaldo, Rivaldo, Romário, Cafu, Roberto Carlos. All Epic, all max.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Full Milan legends squad — Maldini, Nesta, Baresi, Kaká, Shevchenko, Van Basten, Gullit. Team Strength 3310.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Steam. Every Argentina Legendary and Epic in the game, including Maradona and Messi, both fully progressed. Squad 3,325.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Complete Real Madrid galácticos set: Zidane, Figo, R9 Ronaldo, Roberto Carlos, Raúl. All Epic and max level.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5. Goalkeeper collection — every Epic keeper released: Buffon, Casillas, Kahn, Schmeichel, Yashin. Team Strength 3240.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Full Manchester United treble squad from the Legendary campaign, 11 starters all above 105 overall.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Xbox. Every POTW card from the 2026 season kept and levelled — 64 cards. Squad rating 3270, 5 Epics alongside.",
    "game": "eFootball",
    "platform": "Xbox",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Complete Barcelona set: Epic Ronaldinho, Epic Iniesta, Epic Xavi, Epic Puyol, Legendary Messi. Team Strength 3300.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 Steam. All 2026 anniversary Epics, none of them sold or converted. 9 cards, each at max progression. Squad 3,285.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile. Full Netherlands legends line: Cruyff, Van Basten, Gullit, Rijkaard, Bergkamp. All Epic. Team Strength 3255.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 PS5. 52 Epics across every campaign, the largest collection I have built. Squad rating 3410. Original email included.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "PES 2021 Season Update, PS4. myClub account with 340 GP-signed Legends including Maradona, Cruyff and Zico. Original Konami ID email included.",
    "game": "PES 2021",
    "platform": "PS4",
    "statesACatch": false
  },
  {
    "summary": "PES 2021 Season Update on Steam. myClub squad rating 4,180. 1.2 million GP and 6,000 myClub Coins unspent. No bans.",
    "game": "PES 2021",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "PES 2021 PS4. myClub with the full Iconic Moment series for Barcelona and Real Madrid. Original email and recovery address both handed over.",
    "game": "PES 2021",
    "platform": "PS4",
    "statesACatch": false
  },
  {
    "summary": "PES 2020 PS4 myClub account. 96 Legends signed, 2.4 million GP. Servers are closed for online play — this is a local and archive account only.",
    "game": "PES 2020",
    "platform": "PS4",
    "statesACatch": false
  },
  {
    "summary": "PES 2021 Season Update, Xbox One. myClub squad 4,050. Every Iconic Moment released in the final season present and fully trained.",
    "game": "PES 2021",
    "platform": "Xbox",
    "statesACatch": false
  },
  {
    "summary": "PES 2019 Steam account, myClub. Kept as a collection — 210 Legends. Online myClub features are no longer supported by Konami on this title.",
    "game": "PES 2019",
    "platform": "PC",
    "statesACatch": false
  },
  {
    "summary": "PES 2021 Season Update mobile. myClub rating 3,890, 780,000 GP. Konami ID transfers with its original Gmail, no warnings on record.",
    "game": "PES 2021",
    "platform": "Mobile",
    "statesACatch": false
  },
  {
    "summary": "PES 2021 PS5 (backwards compatible). myClub squad 4,220 with 14 Iconic Moments. Original email included at delivery.",
    "game": "PES 2021",
    "platform": "PS5",
    "statesACatch": false
  },
  {
    "summary": "eFootball 2026 mobile, Team Strength 3210, 6 Epics. I no longer have the original email — the Konami ID is linked to a Google account I still control and will hand over, but there is no separate recovery address.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": true
  },
  {
    "summary": "eFootball 2026 PS5. Squad 3,140. The account received a 7-day online suspension in March 2026 for a disconnect pattern. It has been clear since, but the warning is on the record and I am telling you now.",
    "game": "eFootball",
    "platform": "PS5",
    "statesACatch": true
  },
  {
    "summary": "eFootball 2026 mobile, 3,180 Team Strength. Linked to a phone number for two-step verification that I cannot remove from my side. Buyer will need to change it themselves after transfer — I will supply every code needed.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": true
  },
  {
    "summary": "eFootball 2026 Steam. Team Strength 3260. The Konami ID is signed in through Facebook rather than email. I will hand over the Facebook account, but there is no email login to give you.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": true
  },
  {
    "summary": "eFootball 2026 mobile, squad 3,090. Real money was spent on this account — around $400 over two years. Receipts exist, so a chargeback is not possible from my side, but you should know there is purchase history.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": true
  },
  {
    "summary": "eFootball 2026 PS4. Squad rating 3,020. The account is region-locked to Japan and some events may not appear on a European or American Konami ID. Selling it as a Japan-region account.",
    "game": "eFootball",
    "platform": "PS4",
    "statesACatch": true
  },
  {
    "summary": "eFootball 2026 mobile, 3,300 Team Strength, 11 Epics. Bought this account myself eight months ago, so I am the second owner. I do not know its history before that.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": true
  },
  {
    "summary": "eFootball 2026 Xbox. Team Strength 3170. The email on the Konami ID is a work address I will lose access to in about a month, so the transfer needs to complete within the next two weeks.",
    "game": "eFootball",
    "platform": "Xbox",
    "statesACatch": true
  },
  {
    "summary": "eFootball 2026 mobile. Squad 3,240. Two Epics on this account came from an event that has since been re-run, so those specific cards can also be obtained elsewhere — I am not claiming they are exclusive.",
    "game": "eFootball",
    "platform": "Mobile",
    "statesACatch": true
  },
  {
    "summary": "eFootball 2026 Steam, 3,110 Team Strength. Konami ID only. I cannot guarantee Konami will not act on the transfer — their terms prohibit account trading, and neither I nor the escrow can protect you from the publisher.",
    "game": "eFootball",
    "platform": "PC",
    "statesACatch": true
  }
];

/** 52 reviews a buyer leaves about a seller. */
export const SELLER_REVIEWS: BotReview[] = [
  {
    "rating": 5,
    "comment": "Deposited the account the same hour we opened the deal. Nothing to chase, nothing to ask twice.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Squad matched the description card for card. I counted them.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Answered on the deal chat within minutes every time, including once at what must have been 1am for him.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Third deal with him. Same as the first two — deposits first, no drama.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Sent the Konami code before I even asked for it. He knew it was coming and was sitting on his inbox.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Account exactly as listed. Changed the email and password within ten minutes and it has been mine since.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Gave me the recovery address as well as the login, without me having to ask for it.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Told me upfront the account had a warning from last year. It did, it was minor, and being told first is worth more than pretending it was not there.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Everything was in the description. No surprises at all, which is the entire point of doing it this way.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Fast, quiet, professional. Did not send a single unnecessary message and did not need to.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Had screenshots ready for every claim in the listing before the admin even asked for them.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Deposited within the hour and stayed reachable for two days afterwards until I had confirmed.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Squad rating was actually 40 higher than advertised. He undersold his own account.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "No pressure to confirm early. Told me to take my time and check everything worked first.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Second account I have bought from him this year. Would do a third without thinking about it.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Explained exactly which platforms the Konami ID covered before we started, so there was nothing to argue about after.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "The GP total was exact to the thousand. Every number he wrote turned out to be checkable.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Handled a slow verification without a single complaint or chase message.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Sold me an account he had bought himself, and said so in the description rather than letting me find out.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Clean handover. Login, recovery address and the two codes I needed, all inside an hour.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "Account was right and the trade completed. Took him two days to deposit though, and I had to ask twice.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "Everything as described, but he went quiet for most of a day in the middle of the transfer.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "Good account, fair seller. Communication was slow but he always turned up eventually.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "Squad was as listed. One Epic was not at max progression the way the description implied.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "Fine deal overall. He did not mention the account was signed in through Facebook until I asked directly.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "Delivered what he promised. I just wish he had answered the deal chat more than once a day.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "No complaints about the account. He was clearly running several sales at once and it showed in the response times.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "Account matched. The first Konami code took four hours to arrive, which is longer than it should be.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "Solid trade. He described the squad accurately but put the wrong level on the form.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "Would buy again. Only mark down is that he deposited the wrong email first and had to correct it.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "Account was good and he was honest. A bit disorganised — asked me twice for things I had already told him.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "All fine. He apologised for a delay that was not even his, which says something.",
    "subjectSide": "seller"
  },
  {
    "rating": 4,
    "comment": "Everything arrived. He answered questions properly, but only ever in the evenings.",
    "subjectSide": "seller"
  },
  {
    "rating": 3,
    "comment": "Got the account and it works, but the description said six Epics and there were four.",
    "subjectSide": "seller"
  },
  {
    "rating": 3,
    "comment": "Deal completed after a lot of chasing. I sent five messages before he deposited anything.",
    "subjectSide": "seller"
  },
  {
    "rating": 3,
    "comment": "Account is fine now. Getting the second Konami code out of him took two days and a mention of opening a dispute.",
    "subjectSide": "seller"
  },
  {
    "rating": 3,
    "comment": "Squad was weaker than described. Not enough to open a case over, but not what I thought I was paying for.",
    "subjectSide": "seller"
  },
  {
    "rating": 3,
    "comment": "He delivered, eventually. The whole thing took nine days for something that should take one.",
    "subjectSide": "seller"
  },
  {
    "rating": 3,
    "comment": "Account works. He never mentioned the earlier suspension — the admin found it during verification.",
    "subjectSide": "seller"
  },
  {
    "rating": 3,
    "comment": "Fair enough in the end, but he argued about the description instead of just correcting it.",
    "subjectSide": "seller"
  },
  {
    "rating": 3,
    "comment": "Got the account I was promised once the admin stepped in. Would not choose to deal with him again.",
    "subjectSide": "seller"
  },
  {
    "rating": 2,
    "comment": "Stopped answering the moment both accounts were verified. The admin had to chase him for the code.",
    "subjectSide": "seller"
  },
  {
    "rating": 2,
    "comment": "Description claimed no ban history. There was a suspension on record. Refunded, but it cost me a week.",
    "subjectSide": "seller"
  },
  {
    "rating": 1,
    "comment": "Never sent the Konami code. Refunded through the dispute. Do not count on him being reachable after you pay.",
    "subjectSide": "seller"
  },
  {
    "rating": 2,
    "comment": "Account had half the players listed. He blamed a mix-up with another sale and never really explained it.",
    "subjectSide": "seller"
  },
  {
    "rating": 1,
    "comment": "Tried to swap in a weaker account after I had already joined the deal on the agreed terms.",
    "subjectSide": "seller"
  },
  {
    "rating": 1,
    "comment": "Deposited a login that did not work, then went quiet for three days.",
    "subjectSide": "seller"
  },
  {
    "rating": 1,
    "comment": "Asked me to pay him outside the site to save the fee. Refused, reported it, and would report it again.",
    "subjectSide": "seller"
  },
  {
    "rating": 1,
    "comment": "Tried to recover the account two days after I claimed it. The admin reversed the payout.",
    "subjectSide": "seller"
  },
  {
    "rating": 2,
    "comment": "Squad rating was 400 below what was advertised. Refunded, but he never once acknowledged it.",
    "subjectSide": "seller"
  },
  {
    "rating": 5,
    "comment": "Sent every code within minutes of me asking. Four of them in the end, and he never once complained about it.",
    "subjectSide": "seller"
  },
  {
    "rating": 2,
    "comment": "Went quiet for two days on the second code. The account was exactly as described but I could not finish without him.",
    "subjectSide": "seller"
  }
];

/** 48 reviews a seller leaves about a buyer. */
export const BUYER_REVIEWS: BotReview[] = [
  {
    "rating": 5,
    "comment": "Deposited within twenty minutes of joining the deal, and confirmed the same day he got the account.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Asked sensible questions before paying, then got on with it. No mucking about afterwards.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Confirmed as soon as he had changed the email. Did not sit on the window for no reason.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Told me exactly which code he needed and what screen he was on. Made my side of it easy.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Deposited fast and did not ask for anything that was not part of the deal.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Polite the whole way through, and confirmed within an hour of claiming.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Second swap with him. Deposited immediately both times.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Understood how the escrow works without me having to explain any of it.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Waited through the verification without a single chase message.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Confirmed the moment he was in. No trying to squeeze anything extra out of me afterwards.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Deposited straight away, first time, with the recovery address filled in properly.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Sent a message when the transfer completed so I knew where we were without having to ask.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Kept everything on the deal chat instead of trying to move it to Discord.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Straightforward start to finish. Deposited, claimed, confirmed.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Asked before paying whether the email was included, which saved us both a problem later.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Confirmed within two hours of release. Quickest completion I have had here.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Knew what he wanted, deposited, took it. No reopening the terms once they were agreed.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Genuinely easy trade. Would sell to him again tomorrow.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "Deposited promptly and confirmed in the end. Took most of the window to get around to it.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "Good buyer overall. Went quiet for a day between paying and claiming.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "No problems. Asked a lot of questions after paying that were already answered in the description.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "Deposited on time. Confirmed on the last day of the window, which is his right but was a long wait.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "Fine trade. Deposited the right account but left the recovery address blank, so the admin had to chase it.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "All good. Slightly slow to claim, which pushed my payout back a couple of days.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "Completed properly. Kept asking me to confirm things the admin had already verified.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "Deposited quickly. Needed three codes in the end because he kept letting them expire before typing them in.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "No real complaints. Took a while to accept that I could not release the account myself.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "Straightforward, apart from asking to change the account after the terms were already locked in.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "Confirmed without being chased. Would have been five if he had claimed sooner.",
    "subjectSide": "buyer"
  },
  {
    "rating": 4,
    "comment": "Fine buyer. Wanted extra screenshots after paying that were never part of what we agreed.",
    "subjectSide": "buyer"
  },
  {
    "rating": 3,
    "comment": "Deposited, then took the full window plus two reminders from the admin to confirm.",
    "subjectSide": "buyer"
  },
  {
    "rating": 3,
    "comment": "Deal completed, but he questioned the description after paying rather than before.",
    "subjectSide": "buyer"
  },
  {
    "rating": 3,
    "comment": "Got there in the end. A lot of messages about things that were already written down.",
    "subjectSide": "buyer"
  },
  {
    "rating": 3,
    "comment": "Deposited late, claimed late, confirmed late. Nothing went wrong, it just took two weeks.",
    "subjectSide": "buyer"
  },
  {
    "rating": 3,
    "comment": "Kept pushing to downgrade his side after the deal was already open. Went through on the agreed terms.",
    "subjectSide": "buyer"
  },
  {
    "rating": 3,
    "comment": "Confirmed only after the admin chased him. My payout landed a week later than it should have.",
    "subjectSide": "buyer"
  },
  {
    "rating": 3,
    "comment": "Fine in the end, but treated the deal chat like a general help line for the game.",
    "subjectSide": "buyer"
  },
  {
    "rating": 2,
    "comment": "Deposited, claimed the account, then went silent for the whole confirmation window.",
    "subjectSide": "buyer"
  },
  {
    "rating": 2,
    "comment": "Opened a dispute saying the squad was wrong. The admin checked it against my description and it matched.",
    "subjectSide": "buyer"
  },
  {
    "rating": 1,
    "comment": "Tried to get me to send the login directly, outside the escrow, before he had deposited anything.",
    "subjectSide": "buyer"
  },
  {
    "rating": 1,
    "comment": "Never deposited. Left the deal open for four days and stopped replying.",
    "subjectSide": "buyer"
  },
  {
    "rating": 1,
    "comment": "Confirmed, then tried to recover the account he had handed over. The admin sorted it but it took three weeks.",
    "subjectSide": "buyer"
  },
  {
    "rating": 1,
    "comment": "Demanded extras that were never in the deal, then threatened a bad review when I said no.",
    "subjectSide": "buyer"
  },
  {
    "rating": 2,
    "comment": "Claimed the account, then asked to undo the whole swap because he had changed his mind.",
    "subjectSide": "buyer"
  },
  {
    "rating": 1,
    "comment": "Deposited, then disputed immediately without ever trying the login I had handed over.",
    "subjectSide": "buyer"
  },
  {
    "rating": 2,
    "comment": "Froze the deal for a week over a complaint the admin dismissed in a day.",
    "subjectSide": "buyer"
  },
  {
    "rating": 5,
    "comment": "Asked for the code, told me clearly what Konami was showing him, then confirmed straight after.",
    "subjectSide": "buyer"
  },
  {
    "rating": 3,
    "comment": "Asked for three codes across five days without ever saying what step he was stuck on.",
    "subjectSide": "buyer"
  }
];

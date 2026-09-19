import type { StoryNode } from '../types/game.ts';

export const STORY_NODES: Record<string, StoryNode> = {
  // --- SCHOOL & ALLOWANCE STAGE ---
  'START_SCHOOL': {
    id: 'START_SCHOOL',
    stageTitle: 'SCHOOL // FIRST DOSE',
    age: 'Age 16',
    situation: 'Offered a prescription stimulant behind gym bleachers. "Takes exam stress off. Just once."',
    logMessage: 'Took stimulant pill at school.',
    choices: [
      {
        text: 'Take it',
        targetNodeId: 'ALLOWANCE_COVER_1',
        btnClass: 'warning',
      },
    ],
  },

  'ALLOWANCE_COVER_1': {
    id: 'ALLOWANCE_COVER_1',
    stageTitle: 'SCHOOL // ALLOWANCE COVERS',
    age: 'Age 16',
    situation: 'The rush was intense, but cravings return mid-week. Weekly allowance ($25) covers the dealer.',
    logMessage: 'Weekly allowance ($25) covers pills.',
    statEffects: {
      cashDelta: -25,
      addictionDelta: 15,
      healthDelta: -3,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Buy more with allowance',
        targetNodeId: 'ALLOWANCE_COVER_2',
        btnClass: 'default',
      },
    ],
  },

  'ALLOWANCE_COVER_2': {
    id: 'ALLOWANCE_COVER_2',
    stageTitle: 'SCHOOL // TOLERANCE',
    age: 'Age 16',
    situation: 'Tolerance doubles. Allowance drained skipping meals. Trembling in morning classes.',
    logMessage: 'Tolerance rising. Skipping meals.',
    statEffects: {
      cashDelta: -30,
      addictionDelta: 20,
      healthDelta: -5,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Keep taking it',
        targetNodeId: 'SHORTAGE_ASK_PARENT',
        btnClass: 'warning',
      },
    ],
  },

  // --- SHORTAGE & BORROWING BRANCH ---
  'SHORTAGE_ASK_PARENT': {
    id: 'SHORTAGE_ASK_PARENT',
    stageTitle: 'SHORTAGE // WITHDRAWAL',
    age: 'Age 16',
    situation: 'Broke ($0). Chills, sweating, and tremors hit. Dealer cuts you off without cash.',
    logMessage: 'Hit $0 balance. Withdrawal symptoms.',
    statEffects: {
      healthDelta: -8,
      addictionDelta: 10,
    },
    choices: [
      {
        text: 'Ask parents for emergency money',
        targetNodeId: 'PARENT_GIVES_LESS',
        btnClass: 'default',
      },
      {
        text: 'No (Seek street cash)',
        targetNodeId: 'LOAN_SHARK_APPEARS',
        btnClass: 'danger',
      },
    ],
  },

  'PARENT_GIVES_LESS': {
    id: 'PARENT_GIVES_LESS',
    stageTitle: 'FAMILY // SUSPICIONS',
    age: 'Age 16',
    situation: 'Parents notice bloodshot eyes. They refuse $50, but hand over $15 with a strict warning.',
    logMessage: 'Parents gave $15 (less than needed).',
    statEffects: {
      cashDelta: 15,
      addictionDelta: 5,
      healthDelta: -4,
    },
    choices: [
      {
        text: 'Turn to a friend for cash',
        targetNodeId: 'FRIEND_ASK',
        btnClass: 'default',
      },
      {
        text: 'No (Seek street cash)',
        targetNodeId: 'LOAN_SHARK_APPEARS',
        btnClass: 'danger',
      },
    ],
  },

  'FRIEND_ASK': {
    id: 'FRIEND_ASK',
    stageTitle: 'FRIENDS // BEGGING',
    age: 'Age 17',
    situation: 'Parents locked their wallets. Shivering outside cafeteria, begging your best friend for cash.',
    logMessage: 'Turned to friend for money.',
    choices: [
      {
        text: 'Borrow from friend',
        targetNodeId: 'FRIEND_GIVES_LESS',
        btnClass: 'default',
      },
    ],
  },

  'FRIEND_GIVES_LESS': {
    id: 'FRIEND_GIVES_LESS',
    stageTitle: 'FRIENDS // BRIDGES BURNING',
    age: 'Age 17',
    situation: 'Friend lends $10 bus fare: "You look sick, man." Barely covers half a dose.',
    logMessage: 'Friend lent $10. Trust fraying.',
    statEffects: {
      cashDelta: 10,
      addictionDelta: 10,
    },
    choices: [
      {
        text: 'Friend cuts contact (Seek street loan shark)',
        targetNodeId: 'LOAN_SHARK_APPEARS',
        btnClass: 'danger',
      },
    ],
  },

  // --- LOAN SHARK SPIRAL ---
  'LOAN_SHARK_APPEARS': {
    id: 'LOAN_SHARK_APPEARS',
    stageTitle: 'STREETS // THE LOAN SHARK',
    age: 'Age 17',
    situation: 'Shivering outside school. Black car stops: "Heard you need cash, kid. $300 today, weekly interest."',
    logMessage: 'Loan shark offers predatory cash advance.',
    choices: [
      {
        text: 'Take predatory loan ($300)',
        targetNodeId: 'LOAN_COVER_1',
        btnClass: 'warning',
      },
      {
        text: 'No (Refuse loan shark)',
        targetNodeId: 'ENDING_COLLAPSE_EARLY',
        btnClass: 'danger',
      },
    ],
  },

  'ENDING_COLLAPSE_EARLY': {
    id: 'ENDING_COLLAPSE_EARLY',
    stageTitle: 'COLLAPSE // ACUTE WITHDRAWAL',
    age: 'Age 17',
    situation: 'Without money or doses, acute withdrawal seizures strike. You collapse on the concrete. Rushed to ICU.',
    logMessage: 'Seizure collapse from acute withdrawal.',
    isEnding: true,
    endingReason: 'Severe Withdrawal & Neurological Collapse',
    choices: [],
  },

  'LOAN_COVER_1': {
    id: 'LOAN_COVER_1',
    stageTitle: 'DEBT // TEMPORARY FIX',
    age: 'Age 17',
    situation: 'Cash bought a binge. Loan shark texts: "Payment due with interest ($600)."',
    logMessage: 'Binge over. Debt spiked to $600.',
    statEffects: {
      cashDelta: 300,
      debtDelta: 600,
      addictionDelta: 25,
      healthDelta: -10,
      dosesDelta: 2,
    },
    choices: [
      {
        text: 'Borrow more to cover interest',
        targetNodeId: 'LOAN_COVER_2',
        btnClass: 'warning',
      },
    ],
  },

  'LOAN_COVER_2': {
    id: 'LOAN_COVER_2',
    stageTitle: 'DEBT // THE AVALANCHE',
    age: 'Age 17',
    situation: 'Borrowed again. Total debt snowballed to $3,000. Emaciated and hiding from family.',
    logMessage: 'Debt snowballed to $3,000.',
    statEffects: {
      debtDelta: 2400,
      addictionDelta: 15,
      healthDelta: -12,
    },
    choices: [
      {
        text: 'Ask loan shark for more credit',
        targetNodeId: 'LOAN_SHARK_CUTOFF',
        btnClass: 'danger',
      },
    ],
  },

  'LOAN_SHARK_CUTOFF': {
    id: 'LOAN_SHARK_CUTOFF',
    stageTitle: 'THREAT // CUT OFF',
    age: 'Age 18',
    situation: '"No more loans!" Enforcers corner you: "You owe $3,000. Collect debts for us or we break your legs."',
    logMessage: 'Cornered by mob. Forced into debt collection.',
    statEffects: {
      healthDelta: -10,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Join syndicate to work off debt',
        targetNodeId: 'STAGE_FIGHT_1_INTRO',
        btnClass: 'danger',
      },
    ],
  },

  // --- DEBT COLLECTION (SHADOW FIGHTER MINIGAME) ---
  'STAGE_FIGHT_1_INTRO': {
    id: 'STAGE_FIGHT_1_INTRO',
    stageTitle: 'ENFORCER // CORNER GROCERY',
    age: 'Age 18',
    situation: 'Target: Storekeeper behind on protection fee. Syndicate tosses a pill: "Take this and make him pay."',
    logMessage: 'Assigned to collect from Shopkeeper.',
    statEffects: {
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Fight the Shopkeeper',
        action: { type: 'FIGHT', level: 1 },
        btnClass: 'danger',
      },
      {
        text: 'No (Refuse / Back down)',
        targetNodeId: 'KICKED_OUT_TO_THIEVES',
        btnClass: 'warning',
      },
    ],
  },

  'STAGE_FIGHT_2_INTRO': {
    id: 'STAGE_FIGHT_2_INTRO',
    stageTitle: 'ENFORCER // GAMBLING DEN',
    age: 'Age 18',
    situation: 'Target: Underground gambler who owes $1,500. Armed with an iron pipe.',
    logMessage: 'Assigned to Gambler target.',
    statEffects: {
      cashDelta: 400,
      debtDelta: -400,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Fight the Gambler',
        action: { type: 'FIGHT', level: 2 },
        btnClass: 'danger',
      },
      {
        text: 'No (Flee syndicate)',
        targetNodeId: 'KICKED_OUT_TO_THIEVES',
        btnClass: 'warning',
      },
    ],
  },

  'STAGE_FIGHT_3_INTRO': {
    id: 'STAGE_FIGHT_3_INTRO',
    stageTitle: 'ENFORCER // WAREHOUSE',
    age: 'Age 18',
    situation: 'Final target: Towering warehouse bouncer hiding stolen syndicate cash. Heart palpitating.',
    logMessage: 'Assigned to final target: Rogue Bouncer.',
    statEffects: {
      cashDelta: 600,
      debtDelta: -600,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Fight the Bouncer',
        action: { type: 'FIGHT', level: 3 },
        btnClass: 'danger',
      },
      {
        text: 'No (Drop weapon & run)',
        targetNodeId: 'KICKED_OUT_TO_THIEVES',
        btnClass: 'warning',
      },
    ],
  },

  'POLICE_RAID': {
    id: 'POLICE_RAID',
    stageTitle: 'CRISIS // POLICE RAID!',
    age: 'Age 18',
    situation: 'Doors blown open! Flashbangs explode, sirens scream: "POLICE! ON YOUR KNEES!"',
    logMessage: 'Warehouse raided by SWAT narcotics squad!',
    choices: [
      {
        text: 'Run! Leap through fire escape window!',
        targetNodeId: 'THIEVES_STAGE_INTRO',
        btnClass: 'danger',
      },
      {
        text: 'No (Surrender to police)',
        targetNodeId: 'ENDING_ARRESTED',
        btnClass: 'warning',
      },
    ],
  },

  'ENDING_ARRESTED': {
    id: 'ENDING_ARRESTED',
    stageTitle: 'ARRESTED // INCARCERATED',
    age: 'Age 18',
    situation: 'Tackled to the concrete. Sentenced to maximum security for syndicate extortion.',
    logMessage: 'Arrested by Police. Incarcerated.',
    isEnding: true,
    endingReason: 'Arrested & Incarcerated for Syndicate Extortion',
    choices: [],
  },

  'KICKED_OUT_TO_THIEVES': {
    id: 'KICKED_OUT_TO_THIEVES',
    stageTitle: 'EXILE // DUMPED IN ALLEY',
    age: 'Age 18',
    situation: 'Failed the job. Enforcers beat you bloody and dump you in the rain: "Useless junk. Next time you die."',
    logMessage: 'Dumped in rainy alley by syndicate.',
    statEffects: {
      healthDelta: -20,
      cashDelta: -100,
    },
    choices: [
      {
        text: 'Stumble into the night',
        targetNodeId: 'THIEVES_STAGE_INTRO',
        btnClass: 'danger',
      },
    ],
  },

  // --- THIEVES STAGE (PARKOUR RUNNER MINIGAME) ---
  'THIEVES_STAGE_INTRO': {
    id: 'THIEVES_STAGE_INTRO',
    stageTitle: 'DESPERATION // STREET THEFT',
    age: 'Age 19',
    situation: 'Exiled, hunted, and sick. Organs ache from chronic abuse. Only way to survive is snatching bags.',
    logMessage: 'Entered Thieves Stage.',
    statEffects: {
      healthDelta: -10,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Begin Getaway (Alley Sprint)',
        action: { type: 'ROB', level: 1 },
        btnClass: 'danger',
      },
      {
        text: 'No (Surrender to sirens)',
        targetNodeId: 'ENDING_ARRESTED_STREET',
        btnClass: 'warning',
      },
    ],
  },

  'ENDING_ARRESTED_STREET': {
    id: 'ENDING_ARRESTED_STREET',
    stageTitle: 'ARRESTED // STREET APPREHENSION',
    age: 'Age 19',
    situation: 'Squad cars box the alleyway. Cornered against the brick wall, cuffed, and loaded into custody.',
    logMessage: 'Cornered by police during getaway. Arrested.',
    isEnding: true,
    endingReason: 'Arrested & Incarcerated for Street Theft',
    choices: [],
  },

  'STAGE_ROB_2_INTRO': {
    id: 'STAGE_ROB_2_INTRO',
    stageTitle: 'THIEVES // ROOFTOPS',
    age: 'Age 19',
    situation: 'Loot spent on street cuts. Lungs burn and vision tunnels. Target: Penthouse cash box.',
    logMessage: 'Heading to Rooftop Heist.',
    statEffects: {
      cashDelta: 200,
      addictionDelta: 20,
      healthDelta: -15,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Begin Getaway (Rooftop Parkour)',
        action: { type: 'ROB', level: 2 },
        btnClass: 'danger',
      },
      {
        text: 'No (Surrender on roof)',
        targetNodeId: 'ENDING_ARRESTED_STREET',
        btnClass: 'warning',
      },
    ],
  },

  'STAGE_ROB_3_INTRO': {
    id: 'STAGE_ROB_3_INTRO',
    stageTitle: 'CLIMAX // FINAL GETAWAY',
    age: 'Age 19',
    situation: 'Search helicopters illuminate high-rises. Running on pure toxic fumes and adrenaline.',
    logMessage: 'Final rooftop escape under spotlights.',
    statEffects: {
      healthDelta: -15,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Sprint for your life!',
        action: { type: 'ROB', level: 3 },
        btnClass: 'danger',
      },
      {
        text: 'No (Chest gives out)',
        targetNodeId: 'CLIMAX_ESCAPE',
        btnClass: 'warning',
      },
    ],
  },

  'CLIMAX_ESCAPE': {
    id: 'CLIMAX_ESCAPE',
    stageTitle: 'COLLAPSE // FINAL HEARTBEAT',
    age: 'Age 19',
    situation: 'Leaped past fire escape onto water tower. Stolen cash in hand... agonizing pain seizes your chest.',
    logMessage: 'Cardiovascular collapse imminent.',
    choices: [
      {
        text: 'Gasp for breath...',
        action: { type: 'CINEMATIC' },
        btnClass: 'danger',
      },
    ],
  },
};

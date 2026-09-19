import type { StoryNode } from '../types/game';

export const STORY_NODES: Record<string, StoryNode> = {
  // --- SCHOOL & ALLOWANCE STAGE ---
  'START_SCHOOL': {
    id: 'START_SCHOOL',
    stageTitle: 'SCHOOL // THE FIRST STEP',
    age: 'Age 16',
    situation: 'High School, Sophomore Year. A classmate passes you a small red-and-white capsule behind the gym bleachers. "Takes the stress right off exams, makes you feel invincible. Everybody is doing it."',
    logMessage: 'Offered unknown prescription stimulant at school.',
    choices: [
      {
        text: 'Take it ("Just this once to feel good...")',
        targetNodeId: 'ALLOWANCE_COVER_1',
        btnClass: 'warning',
      },
    ],
  },

  'ALLOWANCE_COVER_1': {
    id: 'ALLOWANCE_COVER_1',
    stageTitle: 'SCHOOL // ALLOWANCE COVERS',
    age: 'Age 16',
    situation: 'The initial rush was incredible—energy surged through you. But by Wednesday, the crash leaves you irritable and hollow. You hand over your weekly allowance ($25) to buy another batch from the school dealer. It easily covers it.',
    logMessage: 'Spent weekly allowance ($25) on pills. Tolerance is building.',
    statEffects: {
      cashDelta: -25,
      addictionDelta: 15,
      healthDelta: -3,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Keep taking it (Allowance covers it)',
        targetNodeId: 'ALLOWANCE_COVER_2',
        btnClass: 'default',
      },
    ],
  },

  'ALLOWANCE_COVER_2': {
    id: 'ALLOWANCE_COVER_2',
    stageTitle: 'SCHOOL // TOLERANCE ESCALATION',
    age: 'Age 16',
    situation: 'One pill no longer does anything. You now need three just to stay awake in class. You drain your entire allowance ($30), skipping lunch all week. Your grades are slipping and your hands tremble during morning quizzes.',
    logMessage: 'Allowance completely drained. Tolerance doubled.',
    statEffects: {
      cashDelta: -30,
      addictionDelta: 20,
      healthDelta: -5,
      dosesDelta: 2,
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
    stageTitle: 'SHORTAGE // WITHDRAWAL HITS',
    age: 'Age 16',
    situation: 'You are completely broke ($0). Intense chills, cold sweats, and nausea wrack your body. The dealer refuses to front you another capsule. You need cash immediately. Do you ask your parents?',
    logMessage: 'Hit zero balance. Suffering withdrawal symptoms.',
    statEffects: {
      healthDelta: -8,
      addictionDelta: 10,
    },
    choices: [
      {
        text: 'Ask parents for emergency money ("Yes, I need school fees")',
        targetNodeId: 'PARENT_GIVES_LESS',
        btnClass: 'default',
      },
      {
        text: 'No (Do not ask parents; seek street alternatives)',
        targetNodeId: 'LOAN_SHARK_APPEARS',
        btnClass: 'danger',
      },
    ],
  },

  'PARENT_GIVES_LESS': {
    id: 'PARENT_GIVES_LESS',
    stageTitle: 'FAMILY // GROWING SUSPICIONS',
    age: 'Age 16',
    situation: 'Your parents look at your bloodshot eyes and pale skin. They refuse the $50 you requested, but reluctantly give you $15 for "school lunches", warning that money does not grow on trees.',
    logMessage: 'Parents gave $15 (less than requested). Suspicion growing.',
    statEffects: {
      cashDelta: 15,
      addictionDelta: 5,
      healthDelta: -4,
    },
    choices: [
      {
        text: 'Ask parents again? ("No, $15 is not enough!")',
        targetNodeId: 'FRIEND_ASK',
        btnClass: 'warning',
      },
      {
        text: 'Turn to a close friend instead',
        targetNodeId: 'FRIEND_ASK',
        btnClass: 'default',
      },
    ],
  },

  'FRIEND_ASK': {
    id: 'FRIEND_ASK',
    stageTitle: 'FRIENDS // BEGGING FOR CASH',
    age: 'Age 17',
    situation: 'Parents locked their wallets and threatened drug testing. Shivering and frantic, you corner your best friend outside the cafeteria, making up a story about losing your transport card.',
    logMessage: 'Turned to friend for cash.',
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
    situation: 'Your friend hands you $10—all the bus fare they have left. "You look sick, man. What\'s happening to you?" The $10 barely buys a single cheap adulterated capsule. Do you press them for more?',
    logMessage: 'Friend lent $10 (less). Relationship strained.',
    statEffects: {
      cashDelta: 10,
      addictionDelta: 10,
    },
    choices: [
      {
        text: 'No (Friend notices your erratic behavior and cuts contact)',
        targetNodeId: 'LOAN_SHARK_APPEARS',
        btnClass: 'danger',
      },
      {
        text: 'Beg for more ("Come on, you have savings!")',
        targetNodeId: 'LOAN_SHARK_APPEARS',
        btnClass: 'warning',
      },
    ],
  },

  // --- LOAN SHARK SPIRAL ---
  'LOAN_SHARK_APPEARS': {
    id: 'LOAN_SHARK_APPEARS',
    stageTitle: 'STREETS // THE LOAN SHARK',
    age: 'Age 17',
    situation: 'Alone, sweating, and abandoned outside the school gates. A sleek black car stops at the curb. A scarred man rolls down the window: "Heard you\'re in a bind, kid. I can give you $300 cash right now. Just pay me back next week."',
    logMessage: 'Loan shark offers predatory cash advance.',
    choices: [
      {
        text: 'Accept the loan ($300 advance with high interest)',
        targetNodeId: 'LOAN_COVER_1',
        btnClass: 'warning',
      },
      {
        text: 'No (Refuse the loan shark)',
        targetNodeId: 'ENDING_COLLAPSE_EARLY',
        btnClass: 'danger',
      },
    ],
  },

  'ENDING_COLLAPSE_EARLY': {
    id: 'ENDING_COLLAPSE_EARLY',
    stageTitle: 'COLLAPSE // MEDICAL EMERGENCY',
    age: 'Age 17',
    situation: 'Having refused the loan and unable to secure any relief, acute neurochemical withdrawal triggers severe convulsions. You collapse unconscious on the concrete. An ambulance rushes you to the intensive care unit. Your youth is ruined.',
    logMessage: 'Collapsed in seizures from acute withdrawal. Rushed to ICU.',
    isEnding: true,
    endingReason: 'Severe Withdrawal & Neurological Collapse',
    choices: [],
  },

  'LOAN_COVER_1': {
    id: 'LOAN_COVER_1',
    stageTitle: 'DEBT // TEMPORARY RELIEF',
    age: 'Age 17',
    situation: 'With $300 in your pocket, you go on a 5-day binge. You stop attending school entirely. But the loan shark\'s enforcer knocks on your apartment window: "Interest compounded. You now owe $600."',
    logMessage: 'Binge lasted 5 days. Debt increased to $600.',
    statEffects: {
      cashDelta: 300,
      debtDelta: 600,
      addictionDelta: 25,
      healthDelta: -10,
      dosesDelta: 3,
    },
    choices: [
      {
        text: 'Borrow more to cover the interest (Loan cover)',
        targetNodeId: 'LOAN_COVER_2',
        btnClass: 'warning',
      },
    ],
  },

  'LOAN_COVER_2': {
    id: 'LOAN_COVER_2',
    stageTitle: 'DEBT // THE AVALANCHE',
    age: 'Age 17',
    situation: 'You borrow again to pay off the first enforcer. The trap snaps shut. Your total debt has ballooned to $3,000. You are emaciated, living off convenience store scraps, hiding from your family.',
    logMessage: 'Borrowed again. Debt snowballed to $3,000.',
    statEffects: {
      debtDelta: 2400,
      addictionDelta: 15,
      healthDelta: -12,
    },
    choices: [
      {
        text: 'Ask the loan shark for more credit',
        targetNodeId: 'LOAN_SHARK_CUTOFF',
        btnClass: 'danger',
      },
    ],
  },

  'LOAN_SHARK_CUTOFF': {
    id: 'LOAN_SHARK_CUTOFF',
    stageTitle: 'THREAT // NO MORE LOANS',
    age: 'Age 18',
    situation: '"No more loans, junkie!" Two heavy syndicate enforcers kick down your door and drag you to an underground garage. "You owe $3,000. Since you have no cash, you are going to work as our debt collector muscle. You refuse? We break your legs right now."',
    logMessage: 'Cornered by syndicate enforcers. Forced to collect debts.',
    statEffects: {
      healthDelta: -10,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Join the syndicate to cover debt',
        targetNodeId: 'STAGE_FIGHT_1_INTRO',
        btnClass: 'danger',
      },
    ],
  },

  // --- DEBT COLLECTION (SHADOW FIGHTER MINIGAME) ---
  'STAGE_FIGHT_1_INTRO': {
    id: 'STAGE_FIGHT_1_INTRO',
    stageTitle: 'ENFORCER // CORNER STORE OWNER',
    age: 'Age 18',
    situation: 'Target: A weary corner grocery shopkeeper who missed his protection payment. The enforcers toss you a pill: "Take this dose to boost your reflexes if you get tired, kid. Make sure he pays."',
    logMessage: 'Assigned to collect debt from Shopkeeper. Minigame ready.',
    statEffects: {
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Fight the Shopkeeper (Enter Shadow Combat)',
        action: { type: 'FIGHT', level: 1 },
        btnClass: 'danger',
      },
      {
        text: 'No (Refuse to beat him / Back down)',
        targetNodeId: 'KICKED_OUT_TO_THIEVES',
        btnClass: 'warning',
      },
    ],
  },

  'STAGE_FIGHT_2_INTRO': {
    id: 'STAGE_FIGHT_2_INTRO',
    stageTitle: 'ENFORCER // UNDERGROUND GAMBLER',
    age: 'Age 18',
    situation: 'You squeezed money out of the shopkeeper. The bosses hand you a cut and another dose. Next target: An aggressive underground gambler armed with an iron bar.',
    logMessage: 'Earned syndicate cut. Assigned to Gambler target.',
    statEffects: {
      cashDelta: 400,
      debtDelta: -400,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Fight the Gambler (Enter Shadow Combat)',
        action: { type: 'FIGHT', level: 2 },
        btnClass: 'danger',
      },
      {
        text: 'No (Flee the syndicate)',
        targetNodeId: 'KICKED_OUT_TO_THIEVES',
        btnClass: 'warning',
      },
    ],
  },

  'STAGE_FIGHT_3_INTRO': {
    id: 'STAGE_FIGHT_3_INTRO',
    stageTitle: 'ENFORCER // ROGUE BOUNCER',
    age: 'Age 18',
    situation: 'The gambler fell. Your body aches all over, and your heart is beating with a sickening flutter. Final syndicate target: A towering warehouse bouncer hiding stolen syndicate cash.',
    logMessage: 'Assigned to final target: Rogue Bouncer.',
    statEffects: {
      cashDelta: 600,
      debtDelta: -600,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Fight the Bouncer (Final Debt Collection)',
        action: { type: 'FIGHT', level: 3 },
        btnClass: 'danger',
      },
      {
        text: 'No (Drop your weapon and run)',
        targetNodeId: 'KICKED_OUT_TO_THIEVES',
        btnClass: 'warning',
      },
    ],
  },

  'POLICE_RAID': {
    id: 'POLICE_RAID',
    stageTitle: 'CRISIS // POLICE RAID!',
    age: 'Age 18',
    situation: 'The bouncer crashes to the floor. Suddenly, heavy boots stomp outside! Flashbang grenades detonate, and blue/red strobe lights shatter the darkness! "POLICE! ON YOUR KNEES! DON\'T MOVE!"',
    logMessage: 'Warehouse raided by SWAT and Narcotics division!',
    choices: [
      {
        text: 'Run! Leap through the shattered window!',
        targetNodeId: 'THIEVES_STAGE_INTRO',
        btnClass: 'danger',
      },
      {
        text: 'No (Surrender / Freeze in place)',
        targetNodeId: 'ENDING_ARRESTED',
        btnClass: 'warning',
      },
    ],
  },

  'ENDING_ARRESTED': {
    id: 'ENDING_ARRESTED',
    stageTitle: 'ARRESTED // PRISON ENDING',
    age: 'Age 18',
    situation: 'SWAT tackles you to the concrete. You are charged with aggravated assault, armed racketeering, and distribution of controlled substances. The judge sentences you to maximum security. Your life ends in a sterile concrete cell.',
    logMessage: 'Arrested by Police. Incarcerated in federal prison.',
    isEnding: true,
    endingReason: 'Arrested & Incarcerated for Syndicate Extortion',
    choices: [],
  },

  'KICKED_OUT_TO_THIEVES': {
    id: 'KICKED_OUT_TO_THIEVES',
    stageTitle: 'EXILE // DUMPED IN THE ALLEY',
    age: 'Age 18',
    situation: 'You failed to collect the debt. The syndicate enforcers beat you relentlessly, strip you of your belongings, and dump you in a rainy back alley. "Useless junkie. If you show your face here again, you\'re dead."',
    logMessage: 'Cast out by syndicate enforcers. Stripped of all money.',
    statEffects: {
      healthDelta: -20,
      cashDelta: -100,
    },
    choices: [
      {
        text: 'Stumble into the night (Thieves stage)',
        targetNodeId: 'THIEVES_STAGE_INTRO',
        btnClass: 'danger',
      },
    ],
  },

  // --- THIEVES STAGE (PARKOUR RUNNER MINIGAME) ---
  'THIEVES_STAGE_INTRO': {
    id: 'THIEVES_STAGE_INTRO',
    stageTitle: 'DESPERATION // THIEVES STAGE',
    age: 'Age 19',
    situation: 'Abandoned by family, hunted by police, exiled by the mob. Severe physical addiction has destroyed your body—your organs throb with dull pain. To buy your next dose and survive the night, you have to snatch bags and parkour across alleyways and rooftops.',
    logMessage: 'Entered Thieves Stage. Physical deterioration noticeable.',
    statEffects: {
      healthDelta: -10,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Begin Getaway (Alley Snatch & Sprint)',
        action: { type: 'ROB', level: 1 },
        btnClass: 'danger',
      },
      {
        text: 'No (Refuse to rob, collapse in exhaustion)',
        targetNodeId: 'ENDING_COLLAPSE_STREET',
        btnClass: 'warning',
      },
    ],
  },

  'ENDING_COLLAPSE_STREET': {
    id: 'ENDING_COLLAPSE_STREET',
    stageTitle: 'COLLAPSE // PAVEMENT FATALITY',
    age: 'Age 19',
    situation: 'Unable to run and starved of basic care, your exhausted heart gives out. You collapse beside a dumpster in the freezing rain. By the time street sweepers find you in the morning, your body has gone cold.',
    logMessage: 'Collapsed from acute physical exhaustion on city pavement.',
    isEnding: true,
    endingReason: 'Hypothermia & Cardiovascular Failure',
    choices: [],
  },

  'STAGE_ROB_2_INTRO': {
    id: 'STAGE_ROB_2_INTRO',
    stageTitle: 'THIEVES // PENTHOUSE ROOFTOPS',
    age: 'Age 19',
    situation: 'You got away from the first snatch, but spent the loot immediately on lethal street-grade cuts. Your vision is blurring at the edges. Your lungs burn like fire. Target: Cash box inside a rooftop penthouse office.',
    logMessage: 'First getaway successful. Heading to Rooftop Heist.',
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
        text: 'No (Body gives out, collapse)',
        targetNodeId: 'ENDING_COLLAPSE_OD',
        btnClass: 'warning',
      },
    ],
  },

  'ENDING_COLLAPSE_OD': {
    id: 'ENDING_COLLAPSE_OD',
    stageTitle: 'OVERDOSE // RESPIRATORY FAILURE',
    age: 'Age 19',
    situation: 'The toxic adulterants overwhelm your failing liver and kidneys. You trip on the roof shingles, foaming at the mouth, unable to draw breath. The neon skyline of the city fades into pitch black.',
    logMessage: 'Fatal overdose caused acute respiratory arrest.',
    isEnding: true,
    endingReason: 'Fatal Toxicity & Respiratory Collapse',
    choices: [],
  },

  'STAGE_ROB_3_INTRO': {
    id: 'STAGE_ROB_3_INTRO',
    stageTitle: 'CLIMAX // THE FINAL GETAWAY',
    age: 'Age 19',
    situation: 'Police search helicopters hover overhead, painting the high-rises in stark white spotlights. Sirens scream from every corner. Your body is running on toxic fumes, heart pounding at dangerous extremes. Escape across the city cranes!',
    logMessage: 'High-stakes rooftop getaway under helicopter spotlights.',
    statEffects: {
      healthDelta: -15,
      dosesDelta: 1,
    },
    choices: [
      {
        text: 'Sprint for your life! (Final Parkour Run)',
        action: { type: 'ROB', level: 3 },
        btnClass: 'danger',
      },
      {
        text: 'No (Stop running, let the police catch you)',
        targetNodeId: 'ENDING_ARRESTED',
        btnClass: 'warning',
      },
    ],
  },

  'CLIMAX_ESCAPE': {
    id: 'CLIMAX_ESCAPE',
    stageTitle: 'COLLAPSE // THE FINAL HEARTBEAT',
    age: 'Age 19',
    situation: 'You leap past the final fire escape onto a dark water tower platform. The sirens echo below you. You hold the stolen cash against your trembling chest... but suddenly, an excruciating pain seizes your heart. The entire world starts flickering.',
    logMessage: 'Reached end of final escape. Cardiovascular arrest imminent.',
    choices: [
      {
        text: 'Gasp for breath...',
        action: { type: 'CINEMATIC' },
        btnClass: 'danger',
      },
    ],
  },
};

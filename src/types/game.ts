export type GameMode = 
  | 'STORY'
  | 'SHADOW_FIGHTER'
  | 'PARKOUR_RUNNER'
  | 'ENDING_SEQUENCE';

export interface PlayerStats {
  cash: number;
  debt: number;
  health: number;         // 0 - 100
  stamina: number;        // 0 - 100
  addiction: number;      // 0 - 100
  tolerance: number;      // 0 - 100
  doses: number;
  age: string;
  boostActive: boolean;
  boostTimer: number;
  sluggishTimer: number;
}

export type ActionTrigger = 
  | { type: 'FIGHT'; level: 1 | 2 | 3 }
  | { type: 'ROB'; level: 1 | 2 | 3 }
  | { type: 'CINEMATIC' };

export interface StoryChoice {
  text: string;
  targetNodeId?: string;
  action?: ActionTrigger;
  btnClass?: 'default' | 'danger' | 'warning';
}

export interface StoryLogItem {
  id: string;
  timestamp: string;
  age: string;
  text: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

export interface StoryNode {
  id: string;
  stageTitle: string;
  age: string;
  situation: string;
  logMessage: string;
  statEffects?: {
    cashDelta?: number;
    debtDelta?: number;
    healthDelta?: number;
    addictionDelta?: number;
    dosesDelta?: number;
  };
  choices: StoryChoice[];
  isEnding?: boolean;
  endingReason?: string;
}

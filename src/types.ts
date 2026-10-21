export type BlockType = 'narration' | 'thought' | 'speaker' | 'scene_break' | 'choice' | 'choice_multi' | 'clue';

export interface Effect {
  flag: string;
  op: 'set' | 'add' | 'sub';
  value: boolean | number;
}

export interface ChoiceOption {
  id: string;
  text: string;
  effects: Effect[];
  next: string;
  clueId?: string;
  requires?: Record<string, boolean | number>;
}

export interface ChoiceBlock {
  type: 'choice' | 'choice_multi';
  id: string;
  prompt: string;
  min: number;
  max: number;
  options: ChoiceOption[];
}

export interface NarrationBlock {
  type: 'narration';
  text: string;
}

export interface ThoughtBlock {
  type: 'thought';
  text: string;
}

export interface SpeakerBlock {
  type: 'speaker';
  name: string;
  text: string;
}

export interface SceneBreakBlock {
  type: 'scene_break';
}

export interface ClueBlock {
  type: 'clue';
  clueId: string;
}

export type Block = NarrationBlock | ThoughtBlock | SpeakerBlock | SceneBreakBlock | ChoiceBlock | ClueBlock;

export interface Scene {
  id: string;
  chapter: number;
  blocks: Block[];
  next?: string;
  type?: 'death' | 'continuation';
  title?: string;
  reason?: string;
  hint?: string;
  variant?: 'truth' | 'wrong_accusation';
  header?: string;
  next_chapter_title?: string;
  chapterTitle?: string;
}

export interface Clue {
  id: string;
  text: string;
  type: 'факт' | 'психология' | 'ложь';
  chapter: number;
  payoff: string;
}

export interface GameState {
  currentScene: string;
  flags: Record<string, boolean | number | string>;
  clues: string[];
  intuition: number;
  chapter: number;
  failedAttempts: number;
  deaths: number;
}

export interface SaveData {
  state: GameState;
  timestamp: number;
}

// Матрица улик из файла 2
export const CLUES: Record<string, Clue> = {
  // Глава 1 (19)
  'C1-01': { id: 'C1-01', text: 'Леди Миртл пьёт только из своей чашки — все это знают', type: 'факт', chapter: 1, payoff: '2.7' },
  'C1-02': { id: 'C1-02', text: 'Джулиан врёт о долгах: сумма не сходится с расходами', type: 'ложь', chapter: 1, payoff: '2.2' },
  'C1-03': { id: 'C1-03', text: 'Вера не садится за стол — стоит за спиной леди Миртл', type: 'психология', chapter: 1, payoff: '2.5' },
  'C1-04': { id: 'C1-04', text: 'Список из шести имён под салфеткой леди Миртл', type: 'факт', chapter: 1, payoff: '2.8' },
  'C1-05': { id: 'C1-05', text: 'Мэй не знает, где чёрный ход, хотя работает месяц', type: 'психология', chapter: 1, payoff: 'гл.3' },
  'C1-06': { id: 'C1-06', text: 'Шаги в западном крыле: тяжёлые, ровные, не торопятся', type: 'факт', chapter: 1, payoff: '2.7' },
  'C1-07': { id: 'C1-07', text: 'На подоконнике — свеча, воск ещё мягкий', type: 'факт', chapter: 1, payoff: '2.7' },
  'C1-08': { id: 'C1-08', text: 'Д-р Крайт настаивает: «ей нужен покой» — уже месяц', type: 'ложь', chapter: 1, payoff: '2.6' },
  'C1-09': { id: 'C1-09', text: 'Вера не вздрагивает, когда Джулиан бьёт кулаком по столу', type: 'психология', chapter: 1, payoff: 'ДУ-1, ДУ-2' },
  'C1-10': { id: 'C1-10', text: 'Фотография мальчика ~10 лет, подписана «1921»', type: 'факт', chapter: 2, payoff: '2.5' },
  'C1-11': { id: 'C1-11', text: 'Вера удивилась не тому, что Элинор здесь, а тому, что та заметила свечу', type: 'психология', chapter: 1, payoff: '2.5' },
  'C1-12': { id: 'C1-12', text: 'Вера шла не от лестницы, а к лестнице — от комнаты леди Миртл', type: 'факт', chapter: 1, payoff: '2.7' },
  'C1-13': { id: 'C1-13', text: 'Двадцать лет назад из дома «уехал» мальчик; Прайс получил повышение', type: 'факт', chapter: 1, payoff: 'гл.3' },
  'C1-14': { id: 'C1-14', text: 'Леди Миртл исповедовалась во вторник — и вышла «другой»', type: 'психология', chapter: 1, payoff: '2.6' },
  'C1-15': { id: 'C1-15', text: 'На ночном столике — её собственная чашка. Пустая', type: 'факт', chapter: 1, payoff: '2.7' },
  'C1-16': { id: 'C1-16', text: 'Постель Веры аккуратно застелена. Она не ложилась', type: 'психология', chapter: 1, payoff: '2.7' },
  'C1-17': { id: 'C1-17', text: 'Вера «отпросилась в аптеку», аптека закрыта в 17:00, вернулась в 18:40', type: 'ложь', chapter: 1, payoff: '2.6' },
  'C1-18': { id: 'C1-18', text: '«Семь минут» — единственное точное время в доме', type: 'факт', chapter: 1, payoff: '2.7' },
  'C1-19': { id: 'C1-19', text: 'Страховка на жизнь матери, оформлена 3 недели назад, подпись поддельная', type: 'ложь', chapter: 1, payoff: '2.2, 2.7' },
  
  // Глава 2 (12)
  'C2-01': { id: 'C2-01', text: 'Чашка вымыта, но пахнет миндалём', type: 'факт', chapter: 2, payoff: '2.7' },
  'C2-02': { id: 'C2-02', text: 'Часы остановились в 22:00, отставали на 7 мин → смерть ≈ 22:07', type: 'факт', chapter: 2, payoff: '2.7' },
  'C2-03': { id: 'C2-03', text: 'Джулиан не знал о страховке; лжёт о том, где был (был в западном крыле, слышал шаги, не вышел)', type: 'ложь', chapter: 2, payoff: '2.7' },
  'C2-04': { id: 'C2-04', text: 'Роуз подделала подпись, чтобы спасти брата от долгов. Мотив ≠ выгода', type: 'факт', chapter: 2, payoff: '2.7' },
  'C2-05': { id: 'C2-05', text: 'Письмо в приют Св. Магдалины: Вера ищет сына', type: 'факт', chapter: 2, payoff: '2.7 (ключ к «Признанию»)' },
  'C2-06': { id: 'C2-06', text: 'Вера плачет (при исходе A ДУ-2)', type: 'психология', chapter: 2, payoff: '2.7' },
  'C2-07': { id: 'C2-07', text: 'Вера проверяет Элинор (при исходе B ДУ-2)', type: 'психология', chapter: 2, payoff: '2.8-b' },
  'C2-08': { id: 'C2-08', text: 'Инспектор Хартли склоняется к Джулиану', type: 'ложь', chapter: 2, payoff: '2.7' },
  'C2-09': { id: 'C2-09', text: 'Роуз видела Веру в западном крыле в 21:15', type: 'факт', chapter: 2, payoff: '2.7' },
  'C2-10': { id: 'C2-10', text: 'Прайс боится не Веру, а ЗА Веру', type: 'психология', chapter: 2, payoff: 'гл.3' },
  'C2-11': { id: 'C2-11', text: 'Мэй лжёт инспектору легче, чем Элинор — её кто-то научил', type: 'психология', chapter: 2, payoff: 'гл.3' },
  'C2-13': { id: 'C2-13', text: 'Конверт леди Миртл: седьмое имя + фото с шофёром', type: 'факт', chapter: 2, payoff: 'гл.3 (крючок)' },
};

// Флаги из файла 3
export const DEFAULT_FLAGS: Record<string, boolean | number | string> = {
  vera_open: false,
  vera_closed: false,
  vera_tone: 0,
  vera_ally: false,
  vera_susp: 0,
  vera_betrayed: false,
  julian_susp: 0,
  julian_coward: false,
  rose_ally: false,
  crait_doubt: false,
  stannard_ally: false,
  stannard_closed: false,
  rowe_info: false,
  price_doubt: false,
  price_closed: false,
  saw_figure: false,
  missed_corridor: false,
  intuition_lost: false,
  wrong_accusation: false,
  hartley_skeptic: false,
  _accused_name: '',
  _accused_motive: '',
  _accused_evidence: '',
};

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

export const CLUES: Record<string, Clue> = {
  'C1-01': { id: 'C1-01', text: 'Вера сказала, что не видела мужа с обеда. Но на террасе — два бокала.', type: 'факт', chapter: 1, payoff: 'Вера лжёт о времени последней встречи.' },
  'C1-02': { id: 'C1-02', text: 'Джулиан нервно теребил запонку. Левую. Не свою.', type: 'психология', chapter: 1, payoff: 'Джулиан что-то скрывает, но не убийца.' },
  'C1-03': { id: 'C1-03', text: 'На каминной полке — фото Веры с мальчиком. Надпись: «Моему Т.»', type: 'факт', chapter: 1, payoff: 'У Веры есть сын. Мотив.' },
  'C1-04': { id: 'C1-04', text: 'Роуз покраснела, когда упомянули завещание.', type: 'психология', chapter: 1, payoff: 'Роуз знает о завещании больше, чем говорит.' },
  'C1-05': { id: 'C1-05', text: 'Крейт сказал: «Он сам напросился». О ком?', type: 'факт', chapter: 1, payoff: 'Кто-то приглашал жертву. Не Вера.' },
  'C1-06': { id: 'C1-06', text: 'В коридоре — запах табака. Никто в доме не курит.', type: 'факт', chapter: 1, payoff: 'Посторонний в доме. Или кто-то скрывает привычку.' },
  'C1-07': { id: 'C1-07', text: 'Следы мокрой обуви на паркете. Дождь начался час назад.', type: 'факт', chapter: 1, payoff: 'Кто-то выходил и вернулся.' },
  'C1-08': { id: 'C1-08', text: 'Станнард предложил проводить вас. Слишком любезно.', type: 'психология', chapter: 1, payoff: 'Станнард хочет контролировать перемещения гостей.' },
  'C1-09': { id: 'C1-09', text: 'Вера шепнула: «Не ходите туда tonight». Её рука дрожала.', type: 'психология', chapter: 1, payoff: 'Вера предупреждает. Она не враг.' },
  'C1-10': { id: 'C1-10', text: 'Прайс отказался разговаривать. «Я видел достаточно».', type: 'психология', chapter: 1, payoff: 'Прайс что-то знает, но боится.' },
  'C1-11': { id: 'C1-11', text: 'В библиотеке — книга с закладкой на странице о ядах.', type: 'факт', chapter: 1, payoff: 'Кто-то изучал способы убийства.' },
  'C1-12': { id: 'C1-12', text: 'Роуз упомянула, что хозяин «изменился за последний месяц».', type: 'факт', chapter: 1, payoff: 'У жертвы были враги помимо Веры.' },
  'C1-13': { id: 'C1-13', text: 'Джулиан сказал, что уезжает утром. Но багаж собран.', type: 'факт', chapter: 1, payoff: 'Джулиан планировал уехать заранее.' },
  'C1-14': { id: 'C1-14', text: 'Крейт видел, как Вера выходила в сад в десять. Она вернулась в десять двадцать.', type: 'факт', chapter: 1, payoff: 'Алиби Веры можно проверить.' },
  'C1-15': { id: 'C1-15', text: 'На столе в кабинете — недописанное письмо. Обращение: «Дорогая В...»', type: 'факт', chapter: 1, payoff: 'Жертва писал Вере. О чём?' },
  'C1-16': { id: 'C1-16', text: 'Станнард сказал: «Мистер Хартли был не в духе». Слишком нейтрально.', type: 'психология', chapter: 1, payoff: 'Станнард преуменьшает конфликт.' },
  'C2-01': { id: 'C2-01', text: 'Утром — записка в коридоре: «Последнее предупреждение». Почерк женский.', type: 'факт', chapter: 2, payoff: 'Кто-то угрожал. Не убийца — подражатель.' },
  'C2-02': { id: 'C2-02', text: 'Вера призналась: сын умер три года назад. В больнице Хартли. По его вине.', type: 'психология', chapter: 2, payoff: 'Мотив Веры — месть за сына.' },
  'C2-03': { id: 'C2-03', text: 'Роуз нашла ключ от кабинета. Не свой. Отдала вам молча.', type: 'факт', chapter: 2, payoff: 'Роуз помогает. Она на вашей стороне.' },
  'C2-04': { id: 'C2-04', text: 'Джулиан признался: он должен Хартли деньги. Большие.', type: 'психология', chapter: 2, payoff: 'У Джулиана тоже мотив, но он трус.' },
  'C2-05': { id: 'C2-05', text: 'В письме жертвы: «Вера, я знаю, что ты сделала. Приходи в кабинет.»', type: 'факт', chapter: 2, payoff: 'Жертва вызывал Веру. Она пришла не убивать — она пришла отвечать.' },
  'C2-06': { id: 'C2-06', text: 'Прайс сказал: «Я видел, как она выходила. Но не одна».', type: 'факт', chapter: 2, payoff: 'С Верой был кто-то ещё.' },
  'C2-07': { id: 'C2-07', text: 'Крейт нашёл разбитую склянку в саду. Пустую.', type: 'факт', chapter: 2, payoff: 'Яд был в склянке. Кто-то убрал содержимое.' },
  'C2-08': { id: 'C2-08', text: 'Станнард предложил вам уехать. «Ради вашей безопасности».', type: 'психология', chapter: 2, payoff: 'Станнард хочет убрать свидетеля.' },
  'C2-09': { id: 'C2-09', text: 'Инспектор Хартли (дальний родственник) прислал записку: «Не верьте первому впечатлению».', type: 'факт', chapter: 2, payoff: 'Кто-то из семьи манипулирует расследованием.' },
  'C2-10': { id: 'C2-10', text: 'Роуз плакала. «Он обещал мне. Он обещал, что всё изменится».', type: 'психология', chapter: 2, payoff: 'У Роуз были отношения с жертвой. Личный мотив.' },
  'C2-11': { id: 'C2-11', text: 'Джулиан собрал вещи ночью. Уезжает тайно.', type: 'факт', chapter: 2, payoff: 'Джулиан бежит. Не от вины — от страха.' },
  'C2-12': { id: 'C2-12', text: 'Вера сказала: «Я не убила его. Но я рада, что он мёртв».', type: 'психология', chapter: 2, payoff: 'Честность. Вера не убийца.' },
  'C2-13': { id: 'C2-13', text: 'Прайс передал конверт. Внутри — копия завещания. Вера — единственная наследница.', type: 'факт', chapter: 2, payoff: 'Мотив: наследство. Но Вера не знала?' },
  'C2-14': { id: 'C2-14', text: 'Крейт сказал: «Я не верю, что это она. Но доказательства...»', type: 'психология', chapter: 2, payoff: 'Крейт сомневается. Можно его убедить.' },
  'C2-15': { id: 'C2-15', text: 'На полу кабинета — женский волос. Длинный. Тёмный.', type: 'факт', chapter: 2, payoff: 'Вера была в кабинете. Но когда?' },
  'C2-16': { id: 'C2-16', text: 'Станнард обмолвился: «Мистер Хартли боялся жены». Впервые.', type: 'факт', chapter: 2, payoff: 'Станнард знает больше, чем показывает.' },
};

export const DEFAULT_FLAGS: Record<string, boolean | number | string> = {
  vera_open: false,
  vera_closed: false,
  vera_tone: 0,
  vera_ally: 0,
  vera_susp: 0,
  vera_betrayed: false,
  julian_susp: 0,
  julian_coward: false,
  rose_ally: 0,
  crait_doubt: false,
  stannard_ally: false,
  stannard_closed: false,
  rowe_info: false,
  price_doubt: false,
  price_closed: false,
  saw_figure: false,
  missed_corridor: false,
  intuition_lost: false,
  wrong_accusation: 0,
  hartley_skeptic: false,
  _accused_name: '',
  _accused_motive: '',
};

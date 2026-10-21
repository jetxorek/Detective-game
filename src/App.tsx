import { useState, useEffect, useCallback, useRef } from 'react';
import { SCENES } from './scenes';
import { GameState, SaveData, CLUES, DEFAULT_FLAGS, Block, ChoiceBlock, ChoiceOption } from './types';

const SAVE_KEY = 'hollow_court_save_v1';
const SETTINGS_KEY = 'hollow_court_settings_v1';

type Screen = 'title' | 'settings' | 'chapter_card' | 'game' | 'diary' | 'summary' | 'death' | 'continuation' | 'missed_clues';
type Theme = 'light' | 'dark';

interface Settings {
  theme: Theme;
  fontSize: 'normal' | 'large';
  animations: boolean;
}

const defaultSettings: Settings = { theme: 'light', fontSize: 'normal', animations: true };

function getInitialState(): GameState {
  return {
    currentScene: '1.0',
    flags: { ...DEFAULT_FLAGS },
    clues: [],
    intuition: 2,
    chapter: 1,
    failedAttempts: 0,
    deaths: 0,
  };
}

function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToDisk(state: GameState) {
  const data: SaveData = { state, timestamp: Date.now() };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultSettings;
}

function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [state, setState] = useState<GameState>(getInitialState());
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [choiceSelections, setChoiceSelections] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [deathScene, setDeathScene] = useState<string | null>(null);
  const [deathReason, setDeathReason] = useState('');
  const [deathHint, setDeathHint] = useState('');
  const [continuationData, setContinuationData] = useState<{ header: string; nextTitle: string } | null>(null);
  const [previousScene, setPreviousScene] = useState<string>('');
  const [chapterCardData, setChapterCardData] = useState<{ label: string; title: string } | null>(null);
  const [diaryFilter, setDiaryFilter] = useState<string>('all');
  const [hasDied, setHasDied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Apply settings to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-fontsize', settings.fontSize);
    document.documentElement.setAttribute('data-animations', String(settings.animations));
    saveSettings(settings);
  }, [settings]);

  // Navigate to scene
  const goToScene = useCallback((sceneId: string) => {
    const scene = SCENES[sceneId];
    if (!scene) {
      console.error('Scene not found:', sceneId);
      return;
    }

    // Check for chapter card
    if (scene.chapterTitle) {
      const chapterNum = scene.chapter;
      const labels = ['', 'Глава первая', 'Глава вторая'];
      setChapterCardData({ label: labels[chapterNum] || `Глава ${chapterNum}`, title: scene.chapterTitle });
      setScreen('chapter_card');
      setTimeout(() => {
        // Auto-navigate to next scene after chapter card
        const nextId = scene.next || sceneId;
        const nextScene = SCENES[nextId];
        if (nextScene?.type === 'death') {
          setDeathScene(nextId);
          setDeathReason(nextScene.reason || '');
          setDeathHint(nextScene.hint || '');
          setHasDied(true);
          setScreen('death');
          return;
        }
        if (nextScene?.type === 'continuation') {
          setContinuationData({ header: nextScene.header || '', nextTitle: nextScene.next_chapter_title || '' });
          setScreen('continuation');
          setState(prev => ({ ...prev, currentScene: nextId, chapter: nextScene.chapter }));
          return;
        }
        setScreen('game');
        setState(prev => {
          const newState = { ...prev, currentScene: nextId, chapter: nextScene?.chapter || prev.chapter };
          saveToDisk(newState);
          return newState;
        });
      }, 1500);
      return;
    }

    // Check for death scene
    if (scene.type === 'death') {
      setDeathScene(sceneId);
      setDeathReason(scene.reason || '');
      setDeathHint(scene.hint || '');
      setHasDied(true);
      setScreen('death');
      setState(prev => ({ ...prev, deaths: prev.deaths + 1 }));
      return;
    }

    // Check for continuation scene
    if (scene.type === 'continuation') {
      setContinuationData({
        header: scene.header || '',
        nextTitle: scene.next_chapter_title || '',
      });
      setScreen('continuation');
      return;
    }

    // Normal scene - autosave
    setPreviousScene(state.currentScene);
    setState(prev => {
      // Reset intuition to 2 at chapter start (unless intuition_lost)
      let newIntuition = prev.intuition;
      if (scene.chapter > prev.chapter) {
        // New chapter - reset intuition
        newIntuition = prev.flags.intuition_lost ? 1 : 2;
      }
      
      const newState = { 
        ...prev, 
        currentScene: sceneId, 
        chapter: scene.chapter,
        intuition: newIntuition
      };
      saveToDisk(newState);
      return newState;
    });
    setScreen('game');
    setChoiceSelections([]);
    setShowHint(false);
  }, [state]);

  // Apply effects
  const applyEffects = (effects: { flag: string; op: string; value: boolean | number }[]) => {
    setState(prev => {
      const newFlags = { ...prev.flags };
      for (const e of effects) {
        if (e.op === 'set') {
          newFlags[e.flag] = e.value;
        } else if (e.op === 'add') {
          newFlags[e.flag] = ((newFlags[e.flag] as number) || 0) + (e.value as number);
        } else if (e.op === 'sub') {
          newFlags[e.flag] = ((newFlags[e.flag] as number) || 0) - (e.value as number);
        }
      }
      return { ...prev, flags: newFlags };
    });
  };

  // Handle choice
  const handleChoice = (block: ChoiceBlock, option: ChoiceOption) => {
    if (block.type === 'choice_multi') {
      // Multi-select
      const isSelected = choiceSelections.includes(option.id);
      if (isSelected) {
        setChoiceSelections(prev => prev.filter(id => id !== option.id));
      } else if (choiceSelections.length < block.max) {
        setChoiceSelections(prev => [...prev, option.id]);
      }
    } else {
      // Single select - immediate
      applyEffects(option.effects);
      if (option.clueId && !state.clues.includes(option.clueId)) {
        setState(prev => ({ ...prev, clues: [...prev.clues, option.clueId!] }));
      }
      
      // Check for accusation tracking
      if (block.id === 'c2_accuse_name') {
        setState(prev => ({ ...prev, flags: { ...prev.flags, _accused_name: option.id } as Record<string, boolean | number | string> }));
      }
      if (block.id === 'c2_motive') {
        setState(prev => ({ ...prev, flags: { ...prev.flags, _accused_motive: option.id } as Record<string, boolean | number | string> }));
      }
      
      // Check death conditions for corridor and letter scenes
      if (block.id === 'call') {
        // ДУ-1 Option A: окликнуть
        // Успех если vera_open === true И C1-09 собрана
        const hasVeraOpen = state.flags.vera_open === true;
        const hasC109 = state.clues.includes('C1-09');
        if (hasVeraOpen && hasC109) {
          goToScene('1.3a_success');
        } else {
          goToScene('1.3a');
        }
        return;
      }
      
      if (block.id === 'watch') {
        // ДУ-1 Option B: наблюдать
        // Успех если C1-06 ИЛИ C1-07
        const hasC106 = state.clues.includes('C1-06');
        const hasC107 = state.clues.includes('C1-07');
        if (hasC106 || hasC107) {
          goToScene('1.3b_success');
        } else {
          goToScene('1.3b');
        }
        return;
      }
      
      if (block.id === 'truth' && state.currentScene === '2.5') {
        // ДУ-2 Option A: правда
        // Успех если vera_open === true И C1-09 И C2-05
        const hasVeraOpen = state.flags.vera_open === true;
        const hasC109 = state.clues.includes('C1-09');
        const hasC205 = state.clues.includes('C2-05');
        if (hasVeraOpen && hasC109 && hasC205) {
          goToScene('2.5a_success');
        } else {
          goToScene('2.5a_death');
        }
        return;
      }
      
      if (block.id === 'letter' && state.currentScene === '2.7c') {
        // 2.7 Финальное обвинение
        // Успех если имя = Вера Линд И мотив = сын/месть И улика = C2-05 И C2-02
        const accusedVera = String(state.flags._accused_name) === 'vera';
        const correctMotive = String(state.flags._accused_motive) === 'revenge';
        const hasC205 = state.clues.includes('C2-05');
        const hasC202 = state.clues.includes('C2-02');
        
        if (accusedVera && correctMotive && hasC205 && hasC202) {
          goToScene('2.8_truth');
        } else if (accusedVera) {
          goToScene('2.7_death');
        } else {
          goToScene('2.8b');
        }
        return;
      }
      
      goToScene(option.next);
    }
  };

  // Confirm multi-choice
  const confirmMultiChoice = (block: ChoiceBlock) => {
    const selectedOptions = block.options.filter(o => choiceSelections.includes(o.id));
    for (const opt of selectedOptions) {
      applyEffects(opt.effects);
      if (opt.clueId && !state.clues.includes(opt.clueId)) {
        setState(prev => ({ ...prev, clues: [...prev.clues, opt.clueId!] }));
      }
    }
    // Go to next scene - use scene's next (defined at scene level for multi-choice)
    const scene = SCENES[state.currentScene];
    const nextScene = scene?.next || selectedOptions[0]?.next;
    if (nextScene) goToScene(nextScene);
  };

  // Scroll to top on scene change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [state.currentScene, screen]);

  // Failed attempts tracking
  useEffect(() => {
    if (state.failedAttempts >= 2) {
      setShowHint(true);
    }
  }, [state.failedAttempts]);

  // Handle retry after death
  const handleRetry = () => {
    // Intuition doesn't work in 2.7 and 2.8
    const currentSceneData = SCENES[deathScene || ''];
    const isInFinalScene = deathScene?.startsWith('2.7') || deathScene?.startsWith('2.8');
    
    if (state.intuition > 0 && !isInFinalScene) {
      setState(prev => ({ ...prev, intuition: prev.intuition - 1 }));
      goToScene(previousScene || state.currentScene);
    }
  };

  // Handle new game
  const handleNewGame = () => {
    setState(getInitialState());
    setHasDied(false);
    setDeathScene(null);
    setContinuationData(null);
    goToScene('1.0');
  };

  // Handle continue
  const handleContinue = () => {
    const save = loadSave();
    if (save) {
      setState(save.state);
      goToScene(save.state.currentScene);
    }
  };

  // Render block
  const renderBlock = (block: Block, index: number) => {
    // Special handling for conditional text in scene 2.6
    if (block.type === 'narration' && state.currentScene === '2.6' && block.text.includes('Прайс принёс конверт')) {
      const priceClosed = state.flags.price_closed === true;
      const text = priceClosed 
        ? 'Мэй — горничная — принесла конверт. Прайс не вышел. Он боится.'
        : 'Прайс положил конверт перед вами. Руки дрожали.';
      return <p key={index} className="narration fade-in">{text}</p>;
    }
    
    switch (block.type) {
      case 'narration':
        return <p key={index} className="narration fade-in">{block.text}</p>;
      case 'thought':
        return <p key={index} className="thought fade-in">{block.text}</p>;
      case 'speaker':
        return (
          <div key={index} className="fade-in" style={{ marginBottom: '1.2em' }}>
            <div className="speaker-name">{block.name}</div>
            <div className="speaker-text">{block.text}</div>
          </div>
        );
      case 'scene_break':
        return <div key={index} className="scene-break fade-in" />;
      case 'clue':
        // Register clue silently
        if (!state.clues.includes(block.clueId)) {
          setTimeout(() => {
            setState(prev => {
              if (prev.clues.includes(block.clueId)) return prev;
              return { ...prev, clues: [...prev.clues, block.clueId] };
            });
          }, 0);
        }
        return null;
      case 'choice':
      case 'choice_multi':
        return renderChoice(block as ChoiceBlock, index);
      default:
        return null;
    }
  };

  // Render choice
  const renderChoice = (block: ChoiceBlock, index: number) => {
    const isMulti = block.type === 'choice_multi';
    const canConfirm = isMulti && choiceSelections.length >= block.min && choiceSelections.length <= block.max;

    return (
      <div key={index} className="choice-container fade-in">
        <div className="choice-prompt">{block.prompt}</div>
        {block.options.map((opt, i) => (
          <button
            key={opt.id}
            className={`choice-option ${choiceSelections.includes(opt.id) ? 'selected' : ''}`}
            onClick={() => handleChoice(block, opt)}
          >
            {isMulti ? `${i + 1}. ${opt.text}` : opt.text}
          </button>
        ))}
        {isMulti && (
          <>
            <div className="choice-counter">
              Выбрано: {choiceSelections.length} / {block.min}
              {block.min !== block.max ? `–${block.max}` : ''}
            </div>
            <button
              className="confirm-btn"
              disabled={!canConfirm}
              onClick={() => confirmMultiChoice(block)}
            >
              Подтвердить
            </button>
          </>
        )}
      </div>
    );
  };

  // Render screens
  const renderTitle = () => {
    const hasSave = !!loadSave();
    return (
      <div className="title-screen">
        <h1 className="title-name">Тень над Холлоу-Корт</h1>
        <p className="title-subtitle">Камерный английский детектив. Главы 1–2</p>
        <div className="title-buttons">
          <button className="btn btn-primary" onClick={handleNewGame}>Начать</button>
          {hasSave && <button className="btn" onClick={handleContinue}>Продолжить</button>}
          <button className="btn" onClick={() => setScreen('settings')}>Настройки</button>
        </div>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75em', color: 'var(--muted)', marginTop: '2em', maxWidth: '28em', textAlign: 'center' }}>
          Прогресс сохраняется в браузере. Очистка данных браузера удалит сохранения.
        </p>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="title-screen">
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '2em' }}>Настройки</h2>
      <div style={{ maxWidth: '24em', width: '100%' }}>
        <div className="settings-row">
          <span>Тема</span>
          <div style={{ display: 'flex', gap: '0.5em' }}>
            <button className={`btn ${settings.theme === 'light' ? 'btn-primary' : ''}`} onClick={() => setSettings(s => ({ ...s, theme: 'light' }))}>Светлая</button>
            <button className={`btn ${settings.theme === 'dark' ? 'btn-primary' : ''}`} onClick={() => setSettings(s => ({ ...s, theme: 'dark' }))}>Тёмная</button>
          </div>
        </div>
        <div className="settings-row">
          <span>Размер шрифта</span>
          <div style={{ display: 'flex', gap: '0.5em' }}>
            <button className={`btn ${settings.fontSize === 'normal' ? 'btn-primary' : ''}`} onClick={() => setSettings(s => ({ ...s, fontSize: 'normal' }))}>18px</button>
            <button className={`btn ${settings.fontSize === 'large' ? 'btn-primary' : ''}`} onClick={() => setSettings(s => ({ ...s, fontSize: 'large' }))}>24px</button>
          </div>
        </div>
        <div className="settings-row">
          <span>Анимации</span>
          <div style={{ display: 'flex', gap: '0.5em' }}>
            <button className={`btn ${settings.animations ? 'btn-primary' : ''}`} onClick={() => setSettings(s => ({ ...s, animations: true }))}>Вкл</button>
            <button className={`btn ${!settings.animations ? 'btn-primary' : ''}`} onClick={() => setSettings(s => ({ ...s, animations: false }))}>Выкл</button>
          </div>
        </div>
        <div className="settings-row">
          <span>Сбросить прогресс</span>
          <button className="btn" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => {
            localStorage.removeItem(SAVE_KEY);
            setState(getInitialState());
          }}>Сбросить</button>
        </div>
      </div>
      <button className="btn" style={{ marginTop: '2em' }} onClick={() => setScreen('title')}>Назад</button>
    </div>
  );

  const renderChapterCard = () => (
    <div className="chapter-card">
      <div className="chapter-label">{chapterCardData?.label}</div>
      <div className="chapter-title">{chapterCardData?.title}</div>
    </div>
  );

  const renderGame = () => {
    const scene = SCENES[state.currentScene];
    if (!scene) return <div className="game-column"><p>Сцена не найдена.</p></div>;

    return (
      <div>
        <div className="top-bar">
          <button className="btn" onClick={() => setScreen('diary')}>Дневник</button>
          <button className="btn" onClick={() => setScreen('summary')}>Сводка</button>
          <button className="btn" onClick={() => setScreen('settings')}>⚙</button>
        </div>
        <div className="game-column" ref={contentRef}>
          {scene.blocks.map((block, i) => renderBlock(block, i))}
          {scene.next && scene.blocks.every(b => b.type !== 'choice' && b.type !== 'choice_multi') && (
            <div style={{ textAlign: 'center', marginTop: '2em' }}>
              <button className="btn btn-primary" onClick={() => goToScene(scene.next!)}>Далее →</button>
            </div>
          )}
          {showHint && (
            <div className="hint-box">
              Возможно, стоит перечитать дневник. Или поговорить с кем-то ещё.
            </div>
          )}
        </div>
        <div className="intuition-indicator">
          Интуиция: {'●'.repeat(state.intuition)}{'○'.repeat(Math.max(0, 2 - state.intuition))}
        </div>
      </div>
    );
  };

  const renderDiary = () => {
    const collectedClues = state.clues.map(id => CLUES[id]).filter(Boolean);
    const filteredClues = diaryFilter === 'all' ? collectedClues : collectedClues.filter(c => c.type === diaryFilter);
    const showFilter = hasDied;

    return (
      <div className="modal-overlay" onClick={() => setScreen('game')}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3 className="modal-title">Дневник</h3>
          {showFilter && (
            <div className="filter-tabs">
              <button className={`filter-tab ${diaryFilter === 'all' ? 'active' : ''}`} onClick={() => setDiaryFilter('all')}>Все</button>
              <button className={`filter-tab ${diaryFilter === 'факт' ? 'active' : ''}`} onClick={() => setDiaryFilter('факт')}>Факты</button>
              <button className={`filter-tab ${diaryFilter === 'психология' ? 'active' : ''}`} onClick={() => setDiaryFilter('психология')}>Психология</button>
              <button className={`filter-tab ${diaryFilter === 'ложь' ? 'active' : ''}`} onClick={() => setDiaryFilter('ложь')}>Ложь</button>
            </div>
          )}
          {filteredClues.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Пока пусто.</p>
          ) : (
            filteredClues.map(clue => (
              <div key={clue.id} className="clue-item">
                {!showFilter && <div className="clue-type">{clue.id} · {clue.type}</div>}
                {showFilter && <div className="clue-type">{clue.id}</div>}
                <div className="clue-text">{clue.text}</div>
              </div>
            ))
          )}
          <div style={{ marginTop: '1.5em', textAlign: 'center' }}>
            <button className="btn" onClick={() => setScreen('game')}>Закрыть</button>
          </div>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    const facts = state.clues.map(id => CLUES[id]).filter(c => c?.type === 'факт');
    const psych = state.clues.map(id => CLUES[id]).filter(c => c?.type === 'психология');
    
    const characterNotes: string[] = [];
    if (state.flags.vera_open) characterNotes.push('Вера: открыта, но напугана. Возможно, союзник.');
    if (state.flags.vera_closed) characterNotes.push('Вера: закрыта. Скрывает больше, чем говорит.');
    if (state.flags.julian_susp) characterNotes.push('Джулиан: нервничает, что-то скрывает.');
    if (state.flags.julian_coward) characterNotes.push('Джулиан: трус. Бежит от ответственности.');
    if (state.flags.rose_ally) characterNotes.push('Роуз: помогает. Знает о завещании.');
    if (state.flags.stannard_ally) characterNotes.push('Станнард: лоялен. Но слишком лоялен.');
    if (state.flags.stannard_closed) characterNotes.push('Станнард: закрыт. Что-то скрывает.');
    if (state.flags.crait_doubt) characterNotes.push('Крейт: сомневается. Можно убедить.');
    
    const questions: string[] = [];
    if (!state.clues.includes('C1-09')) questions.push('Что Вера пыталась сказать?');
    if (!state.clues.includes('C2-05')) questions.push('О чём было письмо Хартли?');
    if (!state.clues.includes('C2-02')) questions.push('Почему Вера ненавидит Хартли?');
    if (state.clues.includes('C1-08') && !state.clues.includes('C2-07')) questions.push('Что Станнард унёс из кабинета?');

    return (
      <div className="modal-overlay" onClick={() => setScreen('game')}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3 className="modal-title">Сводка дела</h3>
          <div className="summary-block">
            <h4>Что я знаю точно</h4>
            {facts.length === 0 ? <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Пока ничего.</p> :
              facts.map(f => <p key={f.id}>— {f.text}</p>)}
          </div>
          <div className="summary-block">
            <h4>Что я думаю о людях</h4>
            {characterNotes.length === 0 ? <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Пока ничего.</p> :
              characterNotes.map((n, i) => <p key={i}>— {n}</p>)}
            {psych.length > 0 && psych.map(p => <p key={p.id} style={{ color: 'var(--muted)', fontSize: '0.9em' }}>— {p.text}</p>)}
          </div>
          <div className="summary-block">
            <h4>Чего я не понимаю</h4>
            {questions.length === 0 ? <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Всё ясно.</p> :
              questions.map((q, i) => <p key={i}>— {q}</p>)}
          </div>
          <div style={{ marginTop: '1.5em', textAlign: 'center' }}>
            <button className="btn" onClick={() => setScreen('game')}>Закрыть</button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeath = () => {
    const scene = SCENES[deathScene || ''];
    // Intuition doesn't work in 2.7 and 2.8
    const isInFinalScene = deathScene?.includes('2.7') || deathScene?.includes('2.8');
    const canRetry = state.intuition > 0 && !isInFinalScene;
    
    // Determine if this is a final death (no retry possible)
    const isFinalDeath = !canRetry;

    return (
      <div className="death-screen">
        <h2 className="death-title">{scene?.title || 'Смерть'}</h2>
        <div style={{ maxWidth: '38em', textAlign: 'left' }}>
          {scene?.blocks.map((block, i) => (
            <div key={i}>
              {block.type === 'narration' && <p style={{ marginBottom: '1em' }}>{block.text}</p>}
              {block.type === 'thought' && <p style={{ fontStyle: 'italic', borderLeft: '2px solid rgba(192,80,77,0.3)', paddingLeft: '1em', margin: '1em 0' }}>{block.text}</p>}
            </div>
          ))}
        </div>
        <p className="death-reason">{deathReason}</p>
        <p className="death-hint">{deathHint}</p>
        <div style={{ display: 'flex', gap: '1em', flexWrap: 'wrap', justifyContent: 'center' }}>
          {canRetry && (
            <button className="btn" style={{ borderColor: '#C0504D', color: '#C0504D' }} onClick={handleRetry}>
              Переиграть сцену (интуиция: {state.intuition})
            </button>
          )}
          <button className="btn" style={{ borderColor: '#9A9488', color: '#9A9488' }} onClick={() => setScreen('missed_clues')}>
            Что вы упустили
          </button>
          <button className="btn btn-primary" onClick={() => { setScreen('title'); }}>В меню</button>
          {isFinalDeath && (
            <button className="btn" onClick={handleNewGame}>Начать заново</button>
          )}
        </div>
      </div>
    );
  };

  const renderMissedClues = () => {
    const allClues = Object.values(CLUES).filter(c => c.chapter <= state.chapter);
    const missed = allClues.filter(c => !state.clues.includes(c.id));
    
    return (
      <div className="death-screen">
        <h2 className="death-title" style={{ fontSize: '1.8rem' }}>Что вы упустили</h2>
        <div style={{ maxWidth: '38em', textAlign: 'left', marginBottom: '2em' }}>
          {missed.length === 0 ? (
            <p style={{ fontStyle: 'italic', opacity: 0.8 }}>Вы собрали все улики. Безупречно.</p>
          ) : (
            missed.map(c => (
              <div key={c.id} style={{ padding: '0.8em 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75em', opacity: 0.6 }}>{c.id} · {c.type}</div>
                <div style={{ fontSize: '0.95em', opacity: 0.85 }}>{c.text}</div>
              </div>
            ))
          )}
        </div>
        <button className="btn" onClick={() => setScreen('death')}>Назад</button>
      </div>
    );
  };

  const renderContinuation = () => {
    const scene = SCENES[state.currentScene];
    return (
      <div className="continuation-screen">
        <h2 className="continuation-header">{continuationData?.header}</h2>
        <div className="game-column" style={{ textAlign: 'left', marginBottom: '2em' }}>
          {scene?.blocks.map((block, i) => (
            <div key={i}>
              {block.type === 'narration' && <p className="narration">{block.text}</p>}
              {block.type === 'speaker' && (
                <div style={{ marginBottom: '1em' }}>
                  <div className="speaker-name">{block.name}</div>
                  <div className="speaker-text">{block.text}</div>
                </div>
              )}
              {block.type === 'thought' && <p className="thought">{block.text}</p>}
            </div>
          ))}
        </div>
        <p className="continuation-next">{continuationData?.nextTitle}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1em', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => {
            alert('Спасибо! Мы сообщим вам о выходе продолжения.');
          }}>
            Следить за продолжением
          </button>
          <button className="btn" onClick={() => setScreen('title')}>Вернуться в меню</button>
        </div>
        <p style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', marginTop: '3em', color: 'var(--muted)' }}>
          Спасибо, что дочитали.
        </p>
      </div>
    );
  };

  // Main render
  return (
    <>
      {screen === 'title' && renderTitle()}
      {screen === 'settings' && renderSettings()}
      {screen === 'chapter_card' && renderChapterCard()}
      {screen === 'game' && renderGame()}
      {screen === 'diary' && renderDiary()}
      {screen === 'summary' && renderSummary()}
      {screen === 'death' && renderDeath()}
      {screen === 'missed_clues' && renderMissedClues()}
      {screen === 'continuation' && renderContinuation()}
    </>
  );
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { GameScreen } from './features/gameplay/adapters/inbound/react/GameScreen';
import { createInitialGameScene } from './features/gameplay/application/use-cases/createInitialGameScene';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Palabichos requires a #root element.');
}

const scene = createInitialGameScene(Math.random());

createRoot(rootElement).render(
  <StrictMode>
    <GameScreen scene={scene} />
  </StrictMode>,
);

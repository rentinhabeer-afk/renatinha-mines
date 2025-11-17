import React, { useState, useEffect, useCallback } from 'react';
import { Tile as TileType, GameStatus } from './types';
import Tile from './components/Tile';
import { QuestionMarkCircleIcon, RefreshIcon, PlayIcon, CoinsIcon } from './components/Icons';

const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

const App: React.FC = () => {
  const [board, setBoard] = useState<TileType[][]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Ready);
  const [mineCount, setMineCount] = useState(3);
  const [revealedSafeCount, setRevealedSafeCount] = useState(0);
  const [betAmount, setBetAmount] = useState(1.00);
  const [totalBalance, setTotalBalance] = useState(100.00); // Starting balance

  const createEmptyBoard = () => Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
    }))
  );

  useEffect(() => {
    setBoard(createEmptyBoard());
  }, []);

  const calculateMultiplier = (revealedCount: number) => {
     if (revealedCount === 0) return 1.0;
     // This formula provides a growing multiplier
     const safeTiles = TOTAL_TILES - mineCount;
     let multiplier = 1;
     for (let i = 0; i < revealedCount; i++) {
        multiplier *= (1 - (mineCount / (TOTAL_TILES - i)))**-1;
     }
     return parseFloat(multiplier.toFixed(2));
  };

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setGameStatus(GameStatus.Ready);
    setRevealedSafeCount(0);
  }, []);
  
  const handleStartGame = () => {
    if (betAmount > totalBalance) {
        alert("Saldo insuficiente para esta aposta.");
        return;
    }
    if (betAmount <= 0) {
        alert("O valor da aposta deve ser maior que zero.");
        return;
    }

    setTotalBalance(prev => prev - betAmount);

    const newBoard = createEmptyBoard();
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (!newBoard[row][col].isMine) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }
    setBoard(newBoard);
    setGameStatus(GameStatus.Playing);
    setRevealedSafeCount(0);
  };
  
  const handleTileClick = (row: number, col: number) => {
    if (gameStatus !== GameStatus.Playing || board[row][col].isRevealed) {
      return;
    }

    const newBoard = board.map(r => r.slice());
    newBoard[row][col].isRevealed = true;
    
    if (newBoard[row][col].isMine) {
      setBoard(revealAllMines(newBoard));
      setGameStatus(GameStatus.Lost);
      return;
    }
    
    setBoard(newBoard);
    
    const newRevealedCount = revealedSafeCount + 1;
    setRevealedSafeCount(newRevealedCount);

    if (newRevealedCount === TOTAL_TILES - mineCount) {
      const finalMultiplier = calculateMultiplier(newRevealedCount);
      const finalWinnings = betAmount * finalMultiplier;
      setTotalBalance(prev => prev + finalWinnings);
      setGameStatus(GameStatus.CashedOut); // Auto-cashout on win
    }
  };

  const handleCashOut = () => {
    if (revealedSafeCount === 0) return; // Cannot cash out before first click
    const currentMultiplier = calculateMultiplier(revealedSafeCount);
    const winnings = betAmount * currentMultiplier;
    setTotalBalance(prev => prev + winnings);
    setGameStatus(GameStatus.CashedOut);
    setBoard(revealAllMines(board));
  };

  const revealAllMines = (currentBoard: TileType[][]) => {
    return currentBoard.map(row => row.map(tile => (tile.isMine ? { ...tile, isRevealed: true } : tile)));
  };

  const isGameActive = gameStatus === GameStatus.Playing;
  const isGameOver = gameStatus === GameStatus.Lost || gameStatus === GameStatus.CashedOut;

  // Derived values for rendering
  const currentMultiplier = isGameActive ? calculateMultiplier(revealedSafeCount) : 1.0;
  const nextMultiplier = isGameActive ? calculateMultiplier(revealedSafeCount + 1) : calculateMultiplier(0);
  const currentWinnings = betAmount * currentMultiplier;

  const getButtonAction = () => {
      if(isGameOver) return resetGame;
      if(isGameActive) return handleCashOut;
      return handleStartGame;
  };

  const getButtonText = () => {
      if(isGameOver) return 'JOGAR NOVAMENTE';
      if(isGameActive) {
        if(revealedSafeCount > 0) {
            return `SACAR R$${currentWinnings.toFixed(2)}`;
        }
        return `APOSTA`; // Text remains 'APOSTA' until first click
      }
      return 'APOSTA';
  }

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-2 font-sans">
      <div className="w-full max-w-md mx-auto bg-[#00366d] rounded-2xl shadow-2xl p-4 space-y-2">
        
        <div className="flex justify-between items-center text-sm">
            <button className="flex items-center gap-1 bg-orange-500/80 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-orange-500/100">
                <QuestionMarkCircleIcon className="w-4 h-4" />
                Como jogar?
            </button>
            <div className="flex items-center gap-2">
                <div className="bg-[#002a58] px-3 py-1.5 rounded-full">
                    <label htmlFor="mines-select" className="font-semibold text-xs text-slate-300">Minas: </label>
                    <select
                        id="mines-select"
                        value={mineCount}
                        onChange={e => setMineCount(Number(e.target.value))}
                        disabled={isGameActive}
                        className="bg-transparent text-white font-bold text-xs focus:outline-none disabled:opacity-70"
                    >
                        {[...Array(20)].map((_, i) => <option key={i+1} value={i+1} className="bg-[#00366d]">{i+1}</option>)}
                    </select>
                </div>
                <div className="bg-yellow-400 text-slate-900 px-3 py-1.5 rounded-full font-bold text-xs">
                    Seguinte: {isGameActive && revealedSafeCount < TOTAL_TILES - mineCount ? nextMultiplier.toFixed(2) : '---'}x
                </div>
            </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-5 gap-2 p-2 bg-[#002a58] rounded-xl">
            {board.map((row, rowIndex) =>
                row.map((tile, colIndex) => (
                    <Tile
                        key={`${rowIndex}-${colIndex}`}
                        tile={tile}
                        onClick={() => handleTileClick(rowIndex, colIndex)}
                        gameStatus={gameStatus}
                    />
                ))
            )}
        </div>
         
        {/* Total Balance */}
        <div className="text-center py-1">
            <span className="text-sm font-semibold text-slate-400">SALDO</span>
            <p className="text-3xl font-bold tracking-wider">R$ {totalBalance.toFixed(2)}</p>
        </div>

        {/* Bottom Betting Bar */}
        <div className="bg-[#002a58] p-2 rounded-full flex items-center gap-2">
            <div className="flex-1 flex flex-col items-start pl-2">
                <span className="text-xs text-slate-400 font-semibold">Aposta BRL</span>
                <input 
                    type="number"
                    value={betAmount.toFixed(2)}
                    onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                    disabled={isGameActive}
                    className="bg-transparent text-lg font-bold w-full focus:outline-none disabled:opacity-70"
                />
            </div>
            <div className="flex items-center gap-1">
                <button disabled={isGameActive} onClick={() => setBetAmount(b => Math.max(0.1, b/2))} className="p-2.5 bg-[#004284] rounded-full disabled:opacity-50 hover:enabled:bg-blue-600">-</button>
                <button disabled={isGameActive} onClick={() => setBetAmount(1.00)} className="p-2 bg-[#004284] rounded-full disabled:opacity-50 hover:enabled:bg-blue-600"><CoinsIcon className="w-6 h-6"/></button>
                <button disabled={isGameActive} onClick={() => setBetAmount(b => b * 2)} className="p-2.5 bg-[#004284] rounded-full disabled:opacity-50 hover:enabled:bg-blue-600">+</button>
                <button disabled={isGameActive} onClick={() => setBetAmount(totalBalance)} className="p-2 bg-[#004284] rounded-full disabled:opacity-50 hover:enabled:bg-blue-600 font-bold text-xs">MAX</button>
            </div>
             <button
                onClick={getButtonAction()}
                disabled={isGameActive && revealedSafeCount === 0}
                className={`w-40 flex items-center justify-center gap-2 text-lg font-bold rounded-full px-4 py-4 transition-colors duration-300
                    ${isGameOver ? 'bg-blue-600 hover:bg-blue-500' : ''}
                    ${gameStatus === GameStatus.Ready ? 'bg-green-600 hover:bg-green-500' : ''}
                    ${isGameActive && revealedSafeCount > 0 ? 'bg-orange-500 hover:bg-orange-400' : ''}
                    ${isGameActive && revealedSafeCount === 0 ? 'bg-green-600 opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {!isGameOver && gameStatus !== GameStatus.Playing && <PlayIcon className="w-5 h-5" />}
                {getButtonText()}
            </button>
        </div>
      </div>
    </div>
  );
};

export default App;
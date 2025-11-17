import React from 'react';
import { Tile as TileType, GameStatus } from '../types';
import { StarIcon, DiamondIcon } from './Icons';

interface TileProps {
  tile: TileType;
  onClick: () => void;
  gameStatus: GameStatus;
}

const Tile: React.FC<TileProps> = ({ tile, onClick, gameStatus }) => {
  const getTileContent = () => {
    if (!tile.isRevealed) {
      return <div className="w-10 h-10 rounded-full bg-[#002d5a]"></div>;
    }
    
    if (tile.isMine) {
        return <StarIcon className="w-10 h-10 text-yellow-300" />;
    }
    return <DiamondIcon className="w-10 h-10 text-cyan-300" />;
  };

  const getTileClasses = () => {
    let baseClasses = "w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out transform";
    
    const isPlaying = gameStatus === GameStatus.Playing;

    if (!tile.isRevealed) {
        const interactiveClasses = isPlaying ? "hover:brightness-125 active:scale-95 cursor-pointer" : "cursor-not-allowed";
        return `${baseClasses} bg-[#004284] border-2 border-[#0057ae] shadow-lg ${interactiveClasses}`;
    }

    if (tile.isMine) {
        // Quando o jogo é perdido, as minas reveladas recebem um destaque mais sutil e escuro.
        const lostStyle = "bg-black/20 border-2 border-red-500/50";
        const defaultStyle = "bg-red-800/50 border-2 border-red-500";
        return `${baseClasses} ${gameStatus === GameStatus.Lost ? lostStyle : defaultStyle}`;
    }
    
    return `${baseClasses} bg-[#002d5a] border-2 border-cyan-500`;
  };

  return (
    <button
      onClick={onClick}
      disabled={tile.isRevealed || gameStatus !== GameStatus.Playing}
      className={getTileClasses()}
      aria-label="Game Tile"
    >
      {getTileContent()}
    </button>
  );
};

export default Tile;
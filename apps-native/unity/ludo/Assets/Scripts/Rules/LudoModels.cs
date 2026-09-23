using System;
using System.Collections.Generic;

namespace W3Dev.Ludo
{
    public enum LudoPhase
    {
        Roll,
        Move,
        Finished
    }

    public enum LudoTokenLocation
    {
        Yard,
        Track,
        Home,
        Finished
    }

    [Serializable]
    public struct LudoTokenState
    {
        public int player;
        public int token;
        public LudoTokenLocation location;
        public int position;

        public LudoTokenState(int playerIndex, int tokenIndex)
        {
            player = playerIndex;
            token = tokenIndex;
            location = LudoTokenLocation.Yard;
            position = 0;
        }

        public int TrackIndex()
        {
            if (location != LudoTokenLocation.Track || player < 0 || player >= LudoRules.StartIndices.Length)
                return -1;
            return (LudoRules.StartIndices[player] + position) % LudoRules.TrackLength;
        }
    }

    [Serializable]
    public sealed class LudoGameState
    {
        public int currentPlayer;
        public int playerCount = 4;
        public LudoPhase phase;
        public int consecutiveSixes;
        public int pendingRoll;
        public int version;
        public int winner = -1;
        public List<int> activePlayers = new();
        public List<LudoTokenState> tokens = new();

        public bool IsActivePlayer(int player)
        {
            if (activePlayers.Count == 0)
                return player >= 0 && player < 4;

            for (var index = 0; index < activePlayers.Count; index++)
            {
                if (activePlayers[index] == player)
                    return true;
            }
            return false;
        }
    }

    public readonly struct LudoRollResult
    {
        public readonly bool accepted;
        public readonly bool extraRoll;
        public readonly bool endedByThirdSix;

        public LudoRollResult(bool acceptedRoll, bool grantsExtraRoll, bool thirdSix)
        {
            accepted = acceptedRoll;
            extraRoll = grantsExtraRoll;
            endedByThirdSix = thirdSix;
        }
    }

    public readonly struct LudoMoveResult
    {
        public readonly bool moved;
        public readonly bool captured;
        public readonly int capturedPlayer;
        public readonly int capturedToken;
        public readonly LudoTokenState token;

        public LudoMoveResult(bool didMove, bool didCapture, int capturedPlayerIndex, int capturedTokenIndex, LudoTokenState movedToken)
        {
            moved = didMove;
            captured = didCapture;
            capturedPlayer = capturedPlayerIndex;
            capturedToken = capturedTokenIndex;
            token = movedToken;
        }
    }
}

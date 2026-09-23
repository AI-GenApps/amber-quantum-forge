using System;

namespace W3Dev.Ludo
{
    public static partial class LudoRules
    {
        public const int TrackLength = 52;
        public const int HomeLength = 6;
        public const int TokensPerPlayer = 4;
        public const int MaximumTrackOccupancy = 2;
        public const int MaximumPath = TrackLength + HomeLength;
        public const int RollTimeoutSeconds = 30;
        public const int MoveTimeoutSeconds = 30;
        public const int SeatCount = 4;

        public static readonly int[] StartIndices = { 0, 13, 26, 39 };
        public static readonly int[] SafeIndices = { 0, 4, 12, 13, 21, 26, 30, 38, 39, 47 };

        public static bool IsSupportedPlayerCount(int playerCount)
        {
            return playerCount == 2 || playerCount == 4;
        }

        public static LudoGameState CreateDemoState()
        {
            return CreateState(4, 0);
        }

        public static LudoGameState CreateState(int playerCount, int startingPlayer)
        {
            if (!IsSupportedPlayerCount(playerCount))
                throw new ArgumentOutOfRangeException(nameof(playerCount));
            if (startingPlayer < 0 || startingPlayer >= SeatCount)
                throw new ArgumentOutOfRangeException(nameof(startingPlayer));

            var state = new LudoGameState
            {
                currentPlayer = startingPlayer,
                playerCount = playerCount,
                phase = LudoPhase.Roll
            };
            if (playerCount == 2)
            {
                state.activePlayers.Add(startingPlayer);
                state.activePlayers.Add((startingPlayer + 2) % SeatCount);
            }
            else
                for (var player = 0; player < SeatCount; player++)
                    state.activePlayers.Add(player);

            for (var player = 0; player < SeatCount; player++)
            {
                for (var token = 0; token < TokensPerPlayer; token++)
                    state.tokens.Add(new LudoTokenState(player, token));
            }
            return state;
        }

        public static LudoRollResult ApplyRoll(LudoGameState state, int value)
        {
            if (state == null || state.phase != LudoPhase.Roll || !state.IsActivePlayer(state.currentPlayer) || value < 1 || value > 6)
                return new LudoRollResult(false, false, false);

            if (value == 6)
                state.consecutiveSixes++;
            else
                state.consecutiveSixes = 0;

            if (state.consecutiveSixes == 3)
            {
                state.consecutiveSixes = 0;
                AdvanceTurn(state);
                return new LudoRollResult(false, false, true);
            }

            state.pendingRoll = value;
            state.phase = LudoPhase.Move;
            state.version++;
            return new LudoRollResult(true, value == 6, false);
        }

        public static bool HasLegalMove(LudoGameState state, int player, int roll)
        {
            if (state == null || !state.IsActivePlayer(player))
                return false;
            for (var token = 0; token < TokensPerPlayer; token++)
            {
                if (IsLegalMove(state, player, token, roll))
                    return true;
            }
            return false;
        }

        public static void SkipTurnIfNoMove(LudoGameState state, int roll)
        {
            if (state != null && state.phase == LudoPhase.Move && roll >= 1 && roll <= 6 && state.pendingRoll == roll && !HasLegalMove(state, state.currentPlayer, roll))
            {
                state.pendingRoll = 0;
                if (roll == 6)
                {
                    state.phase = LudoPhase.Roll;
                    state.version++;
                }
                else
                    AdvanceTurn(state);
            }
        }

        private static void AdvanceTurn(LudoGameState state)
        {
            if (state.activePlayers.Count == 0)
            {
                state.currentPlayer = (state.currentPlayer + 1) % SeatCount;
            }
            else
            {
                var currentIndex = -1;
                for (var index = 0; index < state.activePlayers.Count; index++)
                {
                    if (state.activePlayers[index] == state.currentPlayer)
                    {
                        currentIndex = index;
                        break;
                    }
                }
                var nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % state.activePlayers.Count;
                state.currentPlayer = state.activePlayers[nextIndex];
            }
            state.phase = LudoPhase.Roll;
            state.pendingRoll = 0;
            state.consecutiveSixes = 0;
            state.version++;
        }
    }
}

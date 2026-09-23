namespace W3Dev.Ludo
{
    public static partial class LudoRules
    {
        public static bool IsLegalMove(LudoGameState state, int player, int tokenIndex, int roll)
        {
            if (state == null || state.phase != LudoPhase.Move || state.currentPlayer != player || !state.IsActivePlayer(player) || state.pendingRoll != roll || roll < 1 || roll > 6)
                return false;
            var sourceIndex = FindToken(state, player, tokenIndex);
            if (sourceIndex < 0 || !TryGetDestination(state.tokens[sourceIndex], roll, out var destination))
                return false;
            if (ExceedsTrackOccupancy(state, player, destination))
                return false;
            return !CrossesBlockade(state, state.tokens[sourceIndex], destination);
        }

        public static LudoMoveResult ApplyMove(LudoGameState state, int player, int tokenIndex, int roll)
        {
            if (!IsLegalMove(state, player, tokenIndex, roll))
                return new LudoMoveResult(false, false, -1, -1, default);

            var sourceIndex = FindToken(state, player, tokenIndex);
            var source = state.tokens[sourceIndex];
            TryGetDestination(source, roll, out var destination);
            var captureIndex = FindCapture(state, player, destination);
            var capturedPlayer = -1;
            var capturedToken = -1;
            if (captureIndex >= 0)
            {
                var captured = state.tokens[captureIndex];
                capturedPlayer = captured.player;
                capturedToken = captured.token;
                captured.location = LudoTokenLocation.Yard;
                captured.position = 0;
                state.tokens[captureIndex] = captured;
            }

            state.tokens[sourceIndex] = destination;
            state.pendingRoll = 0;
            if (HasWon(state, player))
            {
                state.phase = LudoPhase.Finished;
                state.winner = player;
            }
            else
            {
                state.phase = LudoPhase.Roll;
                if (roll != 6)
                    AdvanceTurn(state);
            }
            state.version++;
            return new LudoMoveResult(true, captureIndex >= 0, capturedPlayer, capturedToken, destination);
        }

        public static bool TryGetDestination(LudoTokenState source, int roll, out LudoTokenState destination)
        {
            destination = source;
            if (roll < 1 || roll > 6 || source.location == LudoTokenLocation.Finished)
                return false;

            if (source.location == LudoTokenLocation.Yard)
            {
                if (roll != 6)
                    return false;
                destination.location = LudoTokenLocation.Track;
                destination.position = 0;
                return true;
            }

            var next = source.position + roll;
            if (source.location == LudoTokenLocation.Track)
            {
                if (next <= TrackLength - 1)
                {
                    destination.position = next;
                    return true;
                }
                next -= TrackLength;
                if (next <= HomeLength - 1)
                {
                    destination.location = LudoTokenLocation.Home;
                    destination.position = next;
                    return true;
                }
                if (next == HomeLength)
                {
                    destination.location = LudoTokenLocation.Finished;
                    destination.position = 0;
                    return true;
                }
                return false;
            }

            if (source.location == LudoTokenLocation.Home)
            {
                if (next <= HomeLength - 1)
                {
                    destination.position = next;
                    return true;
                }
                if (next == HomeLength)
                {
                    destination.location = LudoTokenLocation.Finished;
                    destination.position = 0;
                    return true;
                }
            }
            return false;
        }

        public static bool IsSafe(int trackIndex)
        {
            for (var index = 0; index < SafeIndices.Length; index++)
            {
                if (SafeIndices[index] == trackIndex)
                    return true;
            }
            return false;
        }

        private static bool CrossesBlockade(LudoGameState state, LudoTokenState source, LudoTokenState destination)
        {
            if (destination.location == LudoTokenLocation.Track)
            {
                if (source.location != LudoTokenLocation.Track)
                    return CountOpponents(state, source.player, destination.TrackIndex()) >= 2;
                for (var path = source.position + 1; path <= destination.position; path++)
                {
                    var trackIndex = (StartIndices[source.player] + path) % TrackLength;
                    if (CountOpponents(state, source.player, trackIndex) >= 2)
                        return true;
                }
                return false;
            }
            if (destination.location != LudoTokenLocation.Home || source.location != LudoTokenLocation.Track)
                return false;
            for (var path = source.position + 1; path < TrackLength; path++)
            {
                var trackIndex = (StartIndices[source.player] + path) % TrackLength;
                if (CountOpponents(state, source.player, trackIndex) >= 2)
                    return true;
            }
            return false;
        }

        private static bool ExceedsTrackOccupancy(LudoGameState state, int player, LudoTokenState destination)
        {
            if (destination.location != LudoTokenLocation.Track)
                return false;
            var count = CountAtTrack(state, destination.TrackIndex());
            if (count < MaximumTrackOccupancy)
                return false;
            var opponents = CountOpponents(state, player, destination.TrackIndex());
            return count > MaximumTrackOccupancy || opponents != 1 || IsSafe(destination.TrackIndex());
        }

        private static int FindCapture(LudoGameState state, int player, LudoTokenState destination)
        {
            if (destination.location != LudoTokenLocation.Track || IsSafe(destination.TrackIndex()))
                return -1;
            var trackIndex = destination.TrackIndex();
            var found = -1;
            for (var index = 0; index < state.tokens.Count; index++)
            {
                var token = state.tokens[index];
                if (token.player == player || token.location != LudoTokenLocation.Track || token.TrackIndex() != trackIndex)
                    continue;
                if (found >= 0)
                    return -1;
                found = index;
            }
            return found;
        }

        private static int CountOpponents(LudoGameState state, int player, int trackIndex)
        {
            var count = 0;
            for (var index = 0; index < state.tokens.Count; index++)
            {
                var token = state.tokens[index];
                if (token.player != player && token.location == LudoTokenLocation.Track && token.TrackIndex() == trackIndex)
                    count++;
            }
            return count;
        }

        private static int CountAtTrack(LudoGameState state, int trackIndex)
        {
            var count = 0;
            for (var index = 0; index < state.tokens.Count; index++)
            {
                var token = state.tokens[index];
                if (token.location == LudoTokenLocation.Track && token.TrackIndex() == trackIndex)
                    count++;
            }
            return count;
        }

        private static bool HasWon(LudoGameState state, int player)
        {
            var finished = 0;
            for (var index = 0; index < state.tokens.Count; index++)
            {
                if (state.tokens[index].player == player && state.tokens[index].location == LudoTokenLocation.Finished)
                    finished++;
            }
            return finished == TokensPerPlayer;
        }

        private static int FindToken(LudoGameState state, int player, int tokenIndex)
        {
            for (var index = 0; index < state.tokens.Count; index++)
            {
                if (state.tokens[index].player == player && state.tokens[index].token == tokenIndex)
                    return index;
            }
            return -1;
        }
    }
}

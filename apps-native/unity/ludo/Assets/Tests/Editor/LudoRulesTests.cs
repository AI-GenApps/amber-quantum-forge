using NUnit.Framework;

namespace W3Dev.Ludo.Tests
{
    public sealed class LudoRulesTests
    {
        [Test]
        public void HomeMoveIgnoresPerimeterBlockade()
        {
            var state = CreateMoveState(1);
            SetHome(state, 0, 0, 0);
            SetTrack(state, 1, 0, 10);
            SetTrack(state, 1, 1, 10);

            Assert.That(LudoRules.IsLegalMove(state, 0, 0, 1), Is.True);
        }

        [Test]
        public void TrackToHomeCannotCrossPerimeterBlockade()
        {
            var state = CreateMoveState(2);
            SetTrack(state, 0, 0, 50);
            SetTrackAtGlobalIndex(state, 1, 0, 51);
            SetTrackAtGlobalIndex(state, 1, 1, 51);

            Assert.That(LudoRules.IsLegalMove(state, 0, 0, 2), Is.False);
        }

        [Test]
        public void TrackDestinationCannotExceedMaximumOccupancy()
        {
            var state = CreateMoveState(6);
            SetTrack(state, 0, 1, 0);
            SetTrack(state, 0, 2, 0);

            Assert.That(LudoRules.IsLegalMove(state, 0, 0, 6), Is.False);
        }

        [Test]
        public void OpponentBlockadeCannotBeEntered()
        {
            var state = CreateMoveState(6);
            SetTrackAtGlobalIndex(state, 1, 0, 0);
            SetTrackAtGlobalIndex(state, 1, 1, 0);

            Assert.That(LudoRules.IsLegalMove(state, 0, 0, 6), Is.False);
        }

        [Test]
        public void OpponentBlockadeCannotBeCrossed()
        {
            var state = CreateMoveState(3);
            SetTrack(state, 0, 0, 0);
            SetTrackAtGlobalIndex(state, 1, 0, 1);
            SetTrackAtGlobalIndex(state, 1, 1, 1);

            Assert.That(LudoRules.IsLegalMove(state, 0, 0, 3), Is.False);
        }

        [Test]
        public void SamePlayerMayCrossBlockade()
        {
            var state = CreateMoveState(3);
            SetTrack(state, 0, 0, 0);
            SetTrack(state, 0, 1, 1);
            SetTrack(state, 0, 2, 1);

            Assert.That(LudoRules.IsLegalMove(state, 0, 0, 3), Is.True);
        }

        [Test]
        public void SafeCellPreventsCapture()
        {
            var state = CreateMoveState(1);
            SetTrack(state, 0, 0, 3);
            SetTrackAtGlobalIndex(state, 1, 0, 4);

            var result = LudoRules.ApplyMove(state, 0, 0, 1);

            Assert.That(result.moved, Is.True);
            Assert.That(result.captured, Is.False);
            Assert.That(state.tokens[4].location, Is.EqualTo(LudoTokenLocation.Track));
        }

        [Test]
        public void UnsafeSingleOpponentIsCaptured()
        {
            var state = CreateMoveState(1);
            SetTrack(state, 0, 0, 0);
            SetTrackAtGlobalIndex(state, 1, 0, 1);

            var result = LudoRules.ApplyMove(state, 0, 0, 1);

            Assert.That(result.moved, Is.True);
            Assert.That(result.captured, Is.True);
            Assert.That(result.capturedPlayer, Is.EqualTo(1));
            Assert.That(state.tokens[4].location, Is.EqualTo(LudoTokenLocation.Yard));
        }

        [Test]
        public void UnsafeOpponentCanBeCapturedWhenFriendlyTokenOccupiesCell()
        {
            var state = CreateMoveState(1);
            SetTrack(state, 0, 0, 0);
            SetTrack(state, 0, 1, 1);
            SetTrackAtGlobalIndex(state, 1, 0, 1);

            var result = LudoRules.ApplyMove(state, 0, 0, 1);

            Assert.That(result.moved, Is.True);
            Assert.That(result.captured, Is.True);
            Assert.That(CountAtGlobalIndex(state, 1), Is.EqualTo(2));
        }

        [Test]
        public void OvershootFromHomeIsIllegal()
        {
            var state = CreateMoveState(2);
            SetHome(state, 0, 0, LudoRules.HomeLength - 1);

            Assert.That(LudoRules.IsLegalMove(state, 0, 0, 2), Is.False);
        }

        [Test]
        public void FourthFinishedTokenSetsWinnerAndFinishedPhase()
        {
            var state = CreateMoveState(1);
            for (var token = 0; token < LudoRules.TokensPerPlayer - 1; token++)
                SetFinished(state, 0, token);
            SetHome(state, 0, 3, LudoRules.HomeLength - 1);

            var result = LudoRules.ApplyMove(state, 0, 3, 1);

            Assert.That(result.moved, Is.True);
            Assert.That(result.token.location, Is.EqualTo(LudoTokenLocation.Finished));
            Assert.That(state.phase, Is.EqualTo(LudoPhase.Finished));
            Assert.That(state.winner, Is.EqualTo(0));
            Assert.That(state.currentPlayer, Is.EqualTo(0));
        }

        [Test]
        public void TwoPlayerStateActivatesHumanAndOppositeSeat()
        {
            var state = LudoRules.CreateState(2, 3);

            Assert.That(state.playerCount, Is.EqualTo(2));
            Assert.That(state.activePlayers, Is.EqualTo(new[] { 3, 1 }));
            Assert.That(state.IsActivePlayer(3), Is.True);
            Assert.That(state.IsActivePlayer(0), Is.False);
        }

        [Test]
        public void TwoPlayerTurnAdvancesToActivePartner()
        {
            var state = LudoRules.CreateState(2, 3);
            LudoRules.ApplyRoll(state, 1);
            LudoRules.SkipTurnIfNoMove(state, 1);

            Assert.That(state.currentPlayer, Is.EqualTo(1));
            Assert.That(state.phase, Is.EqualTo(LudoPhase.Roll));
        }

        [Test]
        public void FourPlayerStateKeepsAllSeatsActive()
        {
            var state = LudoRules.CreateState(4, 2);

            Assert.That(state.activePlayers, Is.EqualTo(new[] { 0, 1, 2, 3 }));
            Assert.That(state.IsActivePlayer(0), Is.True);
            Assert.That(state.IsActivePlayer(3), Is.True);
        }

        [Test]
        public void FourPlayerTurnFollowsSeatOrderAfterSelectedStarter()
        {
            var state = LudoRules.CreateState(4, 2);
            LudoRules.ApplyRoll(state, 1);
            LudoRules.SkipTurnIfNoMove(state, 1);

            Assert.That(state.currentPlayer, Is.EqualTo(3));
        }

        [Test]
        public void SixKeepsTurnAfterMoving()
        {
            var state = LudoRules.CreateState(2, 3);
            LudoRules.ApplyRoll(state, 6);
            var result = LudoRules.ApplyMove(state, 3, 0, 6);

            Assert.That(result.moved, Is.True);
            Assert.That(state.currentPlayer, Is.EqualTo(3));
            Assert.That(state.phase, Is.EqualTo(LudoPhase.Roll));
        }

        [Test]
        public void SixWithNoLegalMoveKeepsTurn()
        {
            var state = LudoRules.CreateState(2, 3);
            SetTrackAtGlobalIndex(state, 1, 0, 39);
            SetTrackAtGlobalIndex(state, 1, 1, 39);

            LudoRules.ApplyRoll(state, 6);
            LudoRules.SkipTurnIfNoMove(state, 6);

            Assert.That(state.currentPlayer, Is.EqualTo(3));
            Assert.That(state.phase, Is.EqualTo(LudoPhase.Roll));
        }

        [Test]
        public void ThirdSixForfeitsTurn()
        {
            var state = LudoRules.CreateState(2, 3);
            for (var token = 0; token < 2; token++)
            {
                LudoRules.ApplyRoll(state, 6);
                Assert.That(LudoRules.ApplyMove(state, 3, token, 6).moved, Is.True);
            }

            var result = LudoRules.ApplyRoll(state, 6);

            Assert.That(result.endedByThirdSix, Is.True);
            Assert.That(state.currentPlayer, Is.EqualTo(1));
            Assert.That(state.phase, Is.EqualTo(LudoPhase.Roll));
        }

        [Test]
        public void DeterministicDiceSourceReturnsInjectedSequence()
        {
            var dice = new SequenceLudoDiceSource(new[] { 6, 2, 5 });

            Assert.That(dice.Roll(), Is.EqualTo(6));
            Assert.That(dice.Roll(), Is.EqualTo(2));
            Assert.That(dice.Roll(), Is.EqualTo(5));
        }

        [Test]
        public void RandomDiceSourceProducesValidFaces()
        {
            var dice = new RandomLudoDiceSource(23);

            for (var index = 0; index < 32; index++)
                Assert.That(dice.Roll(), Is.InRange(1, 6));
        }

        private static LudoGameState CreateMoveState(int pendingRoll)
        {
            var state = new LudoGameState { currentPlayer = 0, phase = LudoPhase.Move, pendingRoll = pendingRoll };
            for (var player = 0; player < 4; player++)
            {
                for (var token = 0; token < LudoRules.TokensPerPlayer; token++)
                    state.tokens.Add(new LudoTokenState(player, token));
            }
            return state;
        }

        private static void SetTrack(LudoGameState state, int player, int token, int position)
        {
            SetLocation(state, player, token, LudoTokenLocation.Track, position);
        }

        private static void SetTrackAtGlobalIndex(LudoGameState state, int player, int token, int trackIndex)
        {
            var position = (trackIndex - LudoRules.StartIndices[player] + LudoRules.TrackLength) % LudoRules.TrackLength;
            SetTrack(state, player, token, position);
        }

        private static void SetHome(LudoGameState state, int player, int token, int position)
        {
            SetLocation(state, player, token, LudoTokenLocation.Home, position);
        }

        private static void SetFinished(LudoGameState state, int player, int token)
        {
            SetLocation(state, player, token, LudoTokenLocation.Finished, 0);
        }

        private static void SetLocation(LudoGameState state, int player, int token, LudoTokenLocation location, int position)
        {
            var index = player * LudoRules.TokensPerPlayer + token;
            var value = state.tokens[index];
            value.location = location;
            value.position = position;
            state.tokens[index] = value;
        }

        private static int CountAtGlobalIndex(LudoGameState state, int trackIndex)
        {
            var count = 0;
            for (var index = 0; index < state.tokens.Count; index++)
            {
                if (state.tokens[index].TrackIndex() == trackIndex)
                    count++;
            }
            return count;
        }
    }
}

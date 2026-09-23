using NUnit.Framework;

namespace W3Dev.Ludo.Tests
{
    public sealed class LudoTurnRulesTests
    {
        [Test]
        public void MismatchedPendingRollCannotMoveOrAutoPass()
        {
            var state = LudoRules.CreateState(2, 0);
            LudoRules.ApplyRoll(state, 1);
            var token = state.tokens[0];
            token.location = LudoTokenLocation.Track;
            state.tokens[0] = token;

            var result = LudoRules.ApplyMove(state, 0, 0, 2);
            LudoRules.SkipTurnIfNoMove(state, 2);

            Assert.That(result.moved, Is.False);
            Assert.That(state.currentPlayer, Is.EqualTo(0));
            Assert.That(state.phase, Is.EqualTo(LudoPhase.Move));
            Assert.That(state.pendingRoll, Is.EqualTo(1));
        }

        [Test]
        public void MatchingPendingRollAllowsMoveAndClearsPendingRoll()
        {
            var state = LudoRules.CreateState(2, 0);
            LudoRules.ApplyRoll(state, 1);
            var token = state.tokens[0];
            token.location = LudoTokenLocation.Track;
            state.tokens[0] = token;

            var result = LudoRules.ApplyMove(state, 0, 0, 1);

            Assert.That(result.moved, Is.True);
            Assert.That(state.pendingRoll, Is.EqualTo(0));
        }
    }
}

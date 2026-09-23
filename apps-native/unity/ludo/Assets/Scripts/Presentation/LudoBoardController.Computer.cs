using System.Collections;
using UnityEngine;

namespace W3Dev.Ludo
{
    public sealed partial class LudoBoardController
    {
        private void OnRollPressed()
        {
            if (!CanHumanRoll())
                return;
            busy = true;
            StartCoroutine(RollAndResolve(false));
        }

        private IEnumerator RollAndResolve(bool computer)
        {
            if (!matchStarted || suspended || state == null)
            {
                busy = false;
                yield break;
            }

            var player = state.currentPlayer;
            if (!TryReadRoll(out lastRoll))
            {
                busy = false;
                SetStatus("Test die sequence is exhausted.");
                RefreshViews();
                yield break;
            }
            var result = LudoRules.ApplyRoll(state, lastRoll);
            feedback?.Roll();
            if (dieView != null)
                yield return dieView.PlayRoll(lastRoll, reducedMotion);

            if (result.endedByThirdSix)
            {
                SetStatus("Three sixes pass the turn.");
                busy = false;
                RefreshViews();
                if (!computer)
                    ScheduleComputerTurnIfNeeded();
                yield break;
            }

            if (!result.accepted)
            {
                SetStatus("That roll was not available. Try again.");
                busy = false;
                RefreshViews();
                yield break;
            }

            if (!LudoRules.HasLegalMove(state, player, lastRoll))
            {
                LudoRules.SkipTurnIfNoMove(state, lastRoll);
                SetStatus("No move is available. The turn passes.");
                busy = false;
                RefreshViews();
                if (!computer)
                    ScheduleComputerTurnIfNeeded();
                yield break;
            }

            if (computer)
            {
                yield return ResolveComputerMove();
                yield break;
            }

            SetStatus("Choose a highlighted token.");
            busy = false;
            RefreshViews();
        }

        private IEnumerator ResolveComputerMove()
        {
            var token = SelectComputerToken();
            if (token < 0)
            {
                LudoRules.SkipTurnIfNoMove(state, lastRoll);
                SetStatus("No move is available. The turn passes.");
                busy = false;
                RefreshViews();
                yield break;
            }

            var view = GetTokenView(state.currentPlayer, token);
            var source = FindToken(state.currentPlayer, token);
            var result = LudoRules.ApplyMove(state, state.currentPlayer, token, lastRoll);
            if (result.moved)
                yield return AnimateMove(view, source, result);
            busy = false;
            RefreshViews();
        }

        private void OnTokenClicked(LudoTokenView view)
        {
            if (!CanHumanMove(view))
                return;
            busy = true;
            var source = FindToken(view.Player, view.Token);
            var result = LudoRules.ApplyMove(state, view.Player, view.Token, lastRoll);
            if (!result.moved)
            {
                busy = false;
                return;
            }
            StartCoroutine(ResolveHumanMove(view, source, result));
        }

        private IEnumerator ResolveHumanMove(LudoTokenView view, LudoTokenState source, LudoMoveResult result)
        {
            yield return AnimateMove(view, source, result);
            busy = false;
            RefreshViews();
            ScheduleComputerTurnIfNeeded();
        }

        private IEnumerator RunComputerTurn()
        {
            yield return new WaitForSeconds(reducedMotion ? 0.04f : 0.36f);
            if (!matchStarted || suspended || state == null || !IsComputerSeat(state.currentPlayer) || state.phase == LudoPhase.Finished)
            {
                computerRoutine = null;
                yield break;
            }

            busy = true;
            SetStatus("Computer is thinking.");
            if (state.phase == LudoPhase.Roll)
                yield return RollAndResolve(true);
            else if (state.phase == LudoPhase.Move)
                yield return ResolveComputerMove();
            computerRoutine = null;
            ScheduleComputerTurnIfNeeded();
        }

        private void ScheduleComputerTurnIfNeeded()
        {
            if (!matchStarted || suspended || busy || diceUnavailable || state == null || state.phase == LudoPhase.Finished || !IsComputerSeat(state.currentPlayer) || computerRoutine != null)
                return;
            SetStatus("Computer is thinking.");
            computerRoutine = StartCoroutine(RunComputerTurn());
        }

        private int SelectComputerToken()
        {
            if (state == null)
                return -1;
            for (var token = 0; token < LudoRules.TokensPerPlayer; token++)
            {
                if (LudoRules.IsLegalMove(state, state.currentPlayer, token, lastRoll))
                    return token;
            }
            return -1;
        }

        private bool TryReadRoll(out int roll)
        {
            roll = 0;
            diceSource ??= new RandomLudoDiceSource();
            try
            {
                roll = diceSource.Roll();
            }
            catch (System.InvalidOperationException)
            {
                if (IsInjectedDiceSource())
                {
                    diceUnavailable = true;
                    return false;
                }
                diceSource = new RandomLudoDiceSource();
                roll = diceSource.Roll();
            }
            if (roll >= 1 && roll <= 6)
                return true;
            if (IsInjectedDiceSource())
            {
                diceUnavailable = true;
                return false;
            }
            roll = Random.Range(1, 7);
            return true;
        }

        private bool IsInjectedDiceSource()
        {
            return diceSourceInjected || diceSource is ILudoDeterministicDiceSource;
        }

        private bool CanHumanRoll()
        {
            return matchStarted && !suspended && !busy && !diceUnavailable && state != null && state.phase == LudoPhase.Roll && !IsComputerSeat(state.currentPlayer);
        }

        private bool CanHumanMove(LudoTokenView view)
        {
            return view != null && matchStarted && !suspended && !busy && state != null && state.phase == LudoPhase.Move &&
                   !IsComputerSeat(state.currentPlayer) && view.Player == state.currentPlayer &&
                   LudoRules.IsLegalMove(state, view.Player, view.Token, lastRoll);
        }
    }
}

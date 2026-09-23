using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace W3Dev.Ludo
{
    public sealed partial class LudoBoardController
    {
        private void ConfigureTokenViews()
        {
            if (tokenViews == null)
                return;
            for (var index = 0; index < tokenViews.Length; index++)
            {
                var view = tokenViews[index];
                if (view == null)
                    continue;
                var player = index / LudoRules.TokensPerPlayer;
                var token = index % LudoRules.TokensPerPlayer;
                if (player >= LudoRules.SeatCount)
                    continue;
                view.Configure(player, token, LudoBoardLayout.PlayerColor(player));
                view.Clicked = OnTokenClicked;
            }
        }

        private void ClearPresentation()
        {
            if (tokenViews != null)
            {
                for (var index = 0; index < tokenViews.Length; index++)
                {
                    var view = tokenViews[index];
                    if (view == null)
                        continue;
                    view.SetHighlighted(false);
                    view.gameObject.SetActive(false);
                }
            }
            dieView?.SetFace(1);
            if (rollButton != null)
                rollButton.interactable = false;
            if (restartButton != null)
                restartButton.interactable = false;
            SetText(turnText, string.Empty);
            SetText(phaseText, string.Empty);
            SetText(rollText, "READY TO ROLL");
        }

        private void RefreshViews()
        {
            if (!matchStarted || state == null)
            {
                ClearPresentation();
                return;
            }

            if (tokenViews != null)
            {
                for (var index = 0; index < tokenViews.Length; index++)
                {
                    var view = tokenViews[index];
                    if (view == null)
                        continue;
                    var player = index / LudoRules.TokensPerPlayer;
                    var token = index % LudoRules.TokensPerPlayer;
                    var active = player < LudoRules.SeatCount && state.IsActivePlayer(player);
                    view.gameObject.SetActive(active);
                    if (!active)
                        continue;
                    var model = FindToken(player, token);
                    view.transform.position = LudoBoardLayout.PositionFor(model);
                    view.SetHighlighted(
                        !suspended && !busy && !IsComputerSeat(player) && state.phase == LudoPhase.Move &&
                        player == state.currentPlayer && LudoRules.IsLegalMove(state, player, token, lastRoll));
                }
            }

            var turnName = LudoBoardLayout.PlayerName(state.currentPlayer).ToUpperInvariant();
            SetText(turnText, IsComputerSeat(state.currentPlayer) ? $"{turnName} COMPUTER" : $"{turnName} TURN");
            SetText(phaseText, state.phase switch
            {
                LudoPhase.Roll => "ROLL",
                LudoPhase.Move => "CHOOSE A TOKEN",
                _ => "MATCH COMPLETE"
            });
            SetText(rollText, lastRoll > 0 ? $"LAST ROLL  {lastRoll}" : "READY TO ROLL");
            if (rollButton != null)
                rollButton.interactable = !busy && !suspended && !diceUnavailable && state.phase == LudoPhase.Roll && !IsComputerSeat(state.currentPlayer);
            if (restartButton != null)
                restartButton.interactable = !busy && !suspended && state.phase == LudoPhase.Finished;
        }

        private IEnumerator AnimateMove(LudoTokenView view, LudoTokenState source, LudoMoveResult result)
        {
            feedback?.Move();
            var destination = result.token;
            if (view != null && !reducedMotion && source.location == LudoTokenLocation.Track && destination.location == LudoTokenLocation.Track)
            {
                for (var path = source.position + 1; path <= destination.position; path++)
                {
                    var step = destination;
                    step.position = path;
                    view.transform.position = LudoBoardLayout.PositionFor(step);
                    yield return new WaitForSeconds(0.07f);
                }
            }
            else if (view != null)
            {
                view.transform.position = LudoBoardLayout.PositionFor(destination);
                yield return new WaitForSeconds(reducedMotion ? 0.02f : 0.16f);
            }

            if (state != null && state.phase == LudoPhase.Finished && state.winner >= 0)
            {
                SetStatus($"{LudoBoardLayout.PlayerName(state.winner)} wins! Use the menu to start a new match.");
            }
            else if (result.captured)
            {
                feedback?.Capture();
                SetStatus($"Capture! {LudoBoardLayout.PlayerName(result.capturedPlayer)} token returns to its yard.");
            }
            else if (destination.location == LudoTokenLocation.Finished)
            {
                SetStatus("Token home. Exact roll complete.");
            }
            else
            {
                SetStatus(state != null && IsComputerSeat(state.currentPlayer) ? "Computer is thinking." : "Nice move. Roll again when ready.");
            }
        }

        private LudoTokenState FindToken(int player, int token)
        {
            if (state != null)
            {
                for (var index = 0; index < state.tokens.Count; index++)
                {
                    if (state.tokens[index].player == player && state.tokens[index].token == token)
                        return state.tokens[index];
                }
            }
            return new LudoTokenState(player, token);
        }

        private LudoTokenView GetTokenView(int player, int token)
        {
            var index = player * LudoRules.TokensPerPlayer + token;
            return tokenViews != null && index >= 0 && index < tokenViews.Length ? tokenViews[index] : null;
        }

        private void SetStatus(string message)
        {
            SetText(statusText, message);
        }

        private static void SetText(Text text, string value)
        {
            if (text != null)
                text.text = value;
        }
    }
}

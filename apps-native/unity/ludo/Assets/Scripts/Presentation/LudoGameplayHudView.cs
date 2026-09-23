using UnityEngine;
using UnityEngine.UI;

namespace W3Dev.Ludo
{
    public sealed class LudoGameplayHudView : MonoBehaviour
    {
        [SerializeField] private LudoBoardController board;
        [SerializeField] private LudoFlowController flow;
        [SerializeField] private Button menuButton;
        [SerializeField] private GameObject[] seatCards;
        [SerializeField] private Text[] seatLabels;

        public void Configure(LudoBoardController boardController, Button pauseButton, GameObject[] cards, Text[] labels)
        {
            board = boardController;
            menuButton = pauseButton;
            seatCards = cards;
            seatLabels = labels;
        }

        private void Awake()
        {
            menuButton?.onClick.AddListener(OpenPause);
        }

        private void Start()
        {
            board ??= FindAnyObjectByType<LudoBoardController>();
            flow ??= FindAnyObjectByType<LudoFlowController>();
            RefreshSeats();
        }

        private void Update()
        {
            RefreshSeats();
        }

        private void OnDestroy()
        {
            menuButton?.onClick.RemoveListener(OpenPause);
        }

        private void OpenPause()
        {
            board?.SuspendMatch();
            flow?.PresentPause();
        }

        private void RefreshSeats()
        {
            if (seatCards == null || seatLabels == null)
                return;
            var state = board?.CurrentState;
            for (var player = 0; player < seatCards.Length && player < seatLabels.Length; player++)
            {
                var active = state != null && state.IsActivePlayer(player);
                seatCards[player].SetActive(active);
                seatLabels[player].text = active ? IdentityFor(player, state) : string.Empty;
            }
        }

        private string IdentityFor(int player, LudoGameState state)
        {
            if (board != null && board.VersusComputer)
                return player == board.HumanColor ? "YOU" : "COM";
            if (board != null && player == board.HumanColor)
                return "YOU";
            for (var index = 0; index < state.activePlayers.Count; index++)
            {
                if (state.activePlayers[index] == player)
                    return "P" + (index + 1);
            }
            return "PLAYER";
        }
    }
}

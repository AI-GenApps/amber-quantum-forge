using UnityEngine;

namespace W3Dev.Ludo
{
    public sealed class LudoFlowGameplayBridge : MonoBehaviour
    {
        [SerializeField] private LudoBoardController board;
        private LudoFlowController flow;

        public void Configure(LudoBoardController boardController)
        {
            board = boardController;
        }

        private void Start()
        {
            board ??= FindAnyObjectByType<LudoBoardController>();
            flow = FindAnyObjectByType<LudoFlowController>();
            if (board == null || flow == null)
                return;
            flow.StartMatchRequested += StartMatch;
            flow.PauseRequested += PauseMatch;
            flow.ResumeRequested += ResumeMatch;
            flow.ExitMatchRequested += ExitMatch;
            flow.ReducedMotionChanged += board.SetReducedMotion;
            flow.SoundChanged += board.SetAudioEnabled;
            flow.VibrationChanged += board.SetHapticsEnabled;
            board.ReturnToMenuRequested += ShowHome;
            board.SetReducedMotion(LudoFlowPreferences.Read(LudoFlowPreferences.ReducedMotion, false));
            board.SetAudioEnabled(LudoFlowPreferences.Read(LudoFlowPreferences.Sound, true));
            board.SetHapticsEnabled(LudoFlowPreferences.Read(LudoFlowPreferences.Vibration, true));
        }

        private void OnDestroy()
        {
            if (flow != null)
            {
                flow.StartMatchRequested -= StartMatch;
                flow.PauseRequested -= PauseMatch;
                flow.ResumeRequested -= ResumeMatch;
                flow.ExitMatchRequested -= ExitMatch;
                if (board != null)
                {
                    flow.ReducedMotionChanged -= board.SetReducedMotion;
                    flow.SoundChanged -= board.SetAudioEnabled;
                    flow.VibrationChanged -= board.SetHapticsEnabled;
                }
            }
            if (board != null)
                board.ReturnToMenuRequested -= ShowHome;
        }

        private void StartMatch(LudoMatchSelection selection)
        {
            board.StartMatch(selection.PlayerCount, selection.LocalColor, selection.Mode == LudoMatchMode.Computer);
        }

        private void PauseMatch()
        {
            board.SuspendMatch();
        }

        private void ResumeMatch()
        {
            board.ResumeMatch();
        }

        private void ExitMatch()
        {
            board.RequestReturnToMenu();
        }

        private void ShowHome()
        {
            flow.ShowHome();
        }
    }
}

using UnityEngine.UI;

namespace W3Dev.Ludo
{
    public sealed partial class LudoBoardController
    {
        public void SetReducedMotion(bool value)
        {
            reducedMotion = value;
            if (feedback != null)
                feedback.ReducedMotion = value;
        }

        public void SetAudioEnabled(bool value)
        {
            audioEnabled = value;
            if (feedback != null)
                feedback.AudioEnabled = value;
        }

        public void SetHapticsEnabled(bool value)
        {
            hapticsEnabled = value;
            if (feedback != null)
                feedback.HapticsEnabled = value;
        }

        public void ConfigureSettings(Toggle audio, Toggle haptics)
        {
            if (audioToggle != null)
                audioToggle.onValueChanged.RemoveListener(SetAudioEnabled);
            if (hapticsToggle != null)
                hapticsToggle.onValueChanged.RemoveListener(SetHapticsEnabled);
            audioToggle = audio;
            hapticsToggle = haptics;
            if (audioToggle != null)
            {
                audioEnabled = audioToggle.isOn;
                audioToggle.onValueChanged.AddListener(SetAudioEnabled);
            }
            if (hapticsToggle != null)
            {
                hapticsEnabled = hapticsToggle.isOn;
                hapticsToggle.onValueChanged.AddListener(SetHapticsEnabled);
            }
            feedback?.SetSettings(audioEnabled, hapticsEnabled, reducedMotion);
        }
    }
}

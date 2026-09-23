using UnityEngine;

namespace W3Dev.Ludo
{
    public sealed class LudoFeedback : MonoBehaviour
    {
        [SerializeField] private AudioSource audioSource;
        [SerializeField] private AudioClip rollClip;
        [SerializeField] private AudioClip moveClip;
        [SerializeField] private AudioClip captureClip;

        public bool AudioEnabled { get; set; } = true;
        public bool HapticsEnabled { get; set; } = true;
        public bool ReducedMotion { get; set; }

        private void Awake()
        {
            if (audioSource == null)
                audioSource = GetComponent<AudioSource>();
            rollClip ??= CreateTone("Roll", 520f, 0.09f);
            moveClip ??= CreateTone("Move", 680f, 0.07f);
            captureClip ??= CreateTone("Capture", 220f, 0.16f);
        }

        public void Configure(AudioSource source)
        {
            audioSource = source;
        }

        public void SetSettings(bool audioEnabled, bool hapticsEnabled, bool reducedMotion)
        {
            AudioEnabled = audioEnabled;
            HapticsEnabled = hapticsEnabled;
            ReducedMotion = reducedMotion;
        }

        public void Roll()
        {
            Play(rollClip, false);
        }

        public void Move()
        {
            Play(moveClip, false);
        }

        public void Capture()
        {
            Play(captureClip, true);
        }

        private void Play(AudioClip clip, bool strong)
        {
            if (AudioEnabled && audioSource != null && clip != null)
                audioSource.PlayOneShot(clip);
            if (HapticsEnabled && (strong || clip != null))
                Handheld.Vibrate();
        }

        private static AudioClip CreateTone(string name, float frequency, float duration)
        {
            const int sampleRate = 44100;
            var samples = Mathf.CeilToInt(sampleRate * duration);
            var clip = AudioClip.Create(name, samples, 1, sampleRate, false);
            var data = new float[samples];
            for (var index = 0; index < samples; index++)
                data[index] = Mathf.Sin(2f * Mathf.PI * frequency * index / sampleRate) * 0.18f;
            clip.SetData(data, 0);
            return clip;
        }
    }
}

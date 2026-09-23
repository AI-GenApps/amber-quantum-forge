using UnityEngine;
using UnityEngine.UI;

namespace W3Dev.Ludo
{
    public sealed class LudoFlowToggleVisual : MonoBehaviour
    {
        private Toggle toggle;
        private Image track;
        private Image thumb;
        private Text state;

        public void Configure(Toggle target, Image trackImage, Image thumbImage, Text stateText)
        {
            if (toggle != null)
                toggle.onValueChanged.RemoveListener(UpdateVisual);
            toggle = target;
            track = trackImage;
            thumb = thumbImage;
            state = stateText;
            toggle.onValueChanged.AddListener(UpdateVisual);
            Refresh();
        }

        public void Refresh()
        {
            if (toggle != null)
                UpdateVisual(toggle.isOn);
        }

        private void OnDestroy()
        {
            if (toggle != null)
                toggle.onValueChanged.RemoveListener(UpdateVisual);
        }

        private void UpdateVisual(bool enabled)
        {
            if (track != null)
                track.color = enabled ? new Color(0.129f, 0.714f, 0.451f, 1f) : new Color(0.03f, 0.10f, 0.20f, 1f);
            if (thumb != null)
            {
                var rect = thumb.rectTransform;
                rect.anchorMin = enabled ? new Vector2(0.58f, 0.14f) : new Vector2(0.08f, 0.14f);
                rect.anchorMax = enabled ? new Vector2(0.92f, 0.86f) : new Vector2(0.42f, 0.86f);
                rect.offsetMin = Vector2.zero;
                rect.offsetMax = Vector2.zero;
                thumb.color = enabled ? Color.white : new Color(0.65f, 0.77f, 0.92f, 1f);
            }
            if (state != null)
            {
                state.text = enabled ? "On" : "Off";
                state.color = enabled ? Color.white : new Color(0.65f, 0.77f, 0.92f, 1f);
            }
        }
    }
}

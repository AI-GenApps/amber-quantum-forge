using UnityEngine;

namespace W3Dev.Ludo
{
    [RequireComponent(typeof(RectTransform))]
    public sealed class LudoFlowSafeArea : MonoBehaviour
    {
        private RectTransform rectTransform;
        private Canvas canvas;
        private Rect appliedSafeArea;
        private bool hasApplied;

        private void Awake()
        {
            rectTransform = GetComponent<RectTransform>();
            canvas = GetComponentInParent<Canvas>();
            ApplyIfNeeded();
        }

        private void OnEnable()
        {
            ApplyIfNeeded();
        }

        private void Update()
        {
            ApplyIfNeeded();
        }

        private void ApplyIfNeeded()
        {
            if (canvas == null)
                canvas = GetComponentInParent<Canvas>();
            if (canvas == null || canvas.pixelRect.width <= 0f || canvas.pixelRect.height <= 0f)
                return;

            var safeArea = Screen.safeArea;
            if (hasApplied && safeArea.Equals(appliedSafeArea))
                return;

            var canvasRect = canvas.pixelRect;
            var min = safeArea.position - canvasRect.position;
            var max = min + safeArea.size;
            rectTransform.anchorMin = new Vector2(min.x / canvasRect.width, min.y / canvasRect.height);
            rectTransform.anchorMax = new Vector2(max.x / canvasRect.width, max.y / canvasRect.height);
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;
            appliedSafeArea = safeArea;
            hasApplied = true;
        }
    }
}

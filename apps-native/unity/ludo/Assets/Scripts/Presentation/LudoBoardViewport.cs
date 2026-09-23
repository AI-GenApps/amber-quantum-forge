using UnityEngine;

namespace W3Dev.Ludo
{
    [RequireComponent(typeof(Camera))]
    public sealed class LudoBoardViewport : MonoBehaviour
    {
        [SerializeField, Range(0.8f, 0.98f)] private float boardWidthFraction = 0.92f;
        [SerializeField, Range(0.4f, 0.7f)] private float maximumHeightFraction = 0.55f;

        private Camera targetCamera;
        private Rect appliedSafeArea;
        private Vector2Int appliedScreenSize;

        private void Awake()
        {
            targetCamera = GetComponent<Camera>();
            ApplyViewport();
        }

        private void OnEnable()
        {
            ApplyViewport();
        }

        private void Update()
        {
            if (targetCamera == null)
                targetCamera = GetComponent<Camera>();
            if (appliedScreenSize.x != Screen.width || appliedScreenSize.y != Screen.height || appliedSafeArea != Screen.safeArea)
                ApplyViewport();
        }

        public void ApplyViewport()
        {
            if (targetCamera == null)
                targetCamera = GetComponent<Camera>();
            if (targetCamera == null || Screen.width <= 0 || Screen.height <= 0)
                return;

            var safeArea = Screen.safeArea;
            var side = Mathf.Min(safeArea.width * boardWidthFraction, safeArea.height * maximumHeightFraction);
            var x = safeArea.x + (safeArea.width - side) * 0.5f;
            var y = safeArea.y + (safeArea.height - side) * 0.5f;
            targetCamera.rect = new Rect(x / Screen.width, y / Screen.height, side / Screen.width, side / Screen.height);
            targetCamera.aspect = 1f;
            appliedSafeArea = safeArea;
            appliedScreenSize = new Vector2Int(Screen.width, Screen.height);
        }
    }
}

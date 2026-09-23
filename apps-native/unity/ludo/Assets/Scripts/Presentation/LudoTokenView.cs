using UnityEngine;
using UnityEngine.EventSystems;

namespace W3Dev.Ludo
{
    public sealed class LudoTokenView : MonoBehaviour, IPointerClickHandler
    {
        [SerializeField] private int player;
        [SerializeField] private int token;
        private Renderer[] renderers;
        private Vector3 baseScale;
        private Color baseColor;
        private bool highlighted;

        public int Player => player;
        public int Token => token;
        public bool IsHighlighted => highlighted;
        public System.Action<LudoTokenView> Clicked { get; set; }

        public void Configure(int playerIndex, int tokenIndex, Color color)
        {
            player = playerIndex;
            token = tokenIndex;
            baseColor = color;
            baseScale = transform.localScale;
            renderers = GetComponentsInChildren<Renderer>();
            SetHighlighted(false);
        }

        public void SetHighlighted(bool value)
        {
            highlighted = value;
            transform.localScale = baseScale * (highlighted ? 1.14f : 1f);
            var propertyBlock = new MaterialPropertyBlock();
            foreach (var item in renderers ?? (renderers = GetComponentsInChildren<Renderer>()))
            {
                if (item.gameObject.name == "Pawn base")
                    continue;
                item.GetPropertyBlock(propertyBlock);
                propertyBlock.SetColor("_BaseColor", highlighted ? Color.Lerp(baseColor, Color.white, 0.45f) : baseColor);
                propertyBlock.SetColor("_EmissionColor", highlighted ? Color.white * 0.18f : Color.black);
                item.SetPropertyBlock(propertyBlock);
            }
        }

        public void OnPointerClick(PointerEventData eventData)
        {
            if (highlighted)
                Clicked?.Invoke(this);
        }
    }
}

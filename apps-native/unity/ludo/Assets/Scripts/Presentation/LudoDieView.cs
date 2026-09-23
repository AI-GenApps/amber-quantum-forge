using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace W3Dev.Ludo
{
    public sealed class LudoDieView : MonoBehaviour
    {
        [SerializeField] private Transform dieTransform;
        [SerializeField] private Text faceLabel;
        [SerializeField] private GameObject[] facePips;
        [SerializeField] private bool uiAnimation;

        public void Configure(Transform animatedTransform, Text label, GameObject[] pips = null, bool useUiAnimation = false)
        {
            dieTransform = animatedTransform;
            faceLabel = label;
            facePips = pips;
            uiAnimation = useUiAnimation;
        }

        public IEnumerator PlayRoll(int value, bool reducedMotion)
        {
            value = Mathf.Clamp(value, 1, 6);
            if (dieTransform == null)
            {
                SetFace(value);
                yield break;
            }
            var duration = reducedMotion ? 0.08f : 0.72f;
            var start = dieTransform.localRotation;
            var end = uiAnimation ? Quaternion.Euler(0f, 0f, 720f) : FaceRotation(value) * Quaternion.Euler(720f, 720f, 360f);
            var elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                dieTransform.localRotation = Quaternion.Slerp(start, end, Mathf.Clamp01(elapsed / duration));
                yield return null;
            }
            dieTransform.localRotation = uiAnimation ? Quaternion.identity : FaceRotation(value);
            SetFace(value);
        }

        public void SetFace(int value)
        {
            value = Mathf.Clamp(value, 1, 6);
            if (dieTransform != null && !uiAnimation)
                dieTransform.localRotation = FaceRotation(value);
            if (faceLabel != null)
                faceLabel.text = value.ToString();
            if (facePips == null)
                return;
            for (var index = 0; index < facePips.Length; index++)
            {
                if (facePips[index] != null)
                    facePips[index].SetActive(index == value - 1);
            }
        }

        private static Quaternion FaceRotation(int value)
        {
            return value switch
            {
                2 => Quaternion.Euler(90f, 0f, 0f),
                3 => Quaternion.Euler(0f, 0f, -90f),
                4 => Quaternion.Euler(0f, 0f, 90f),
                5 => Quaternion.Euler(-90f, 0f, 0f),
                6 => Quaternion.Euler(0f, 180f, 0f),
                _ => Quaternion.identity
            };
        }
    }
}

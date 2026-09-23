using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Rendering.Universal;

namespace W3Dev.Ludo.Editor
{
    public static class LudoCameraBuilder
    {
        public static Camera BuildCamera()
        {
            var cameraObject = new GameObject("Main Camera", typeof(Camera), typeof(PhysicsRaycaster), typeof(LudoBoardViewport));
            cameraObject.tag = "MainCamera";
            var target = new Vector3(0f, LudoBoardLayout.BoardY, 0f);
            var position = target + new Vector3(0f, 14f, -4f);
            cameraObject.transform.SetPositionAndRotation(position, Quaternion.LookRotation(target - position, Vector3.up));
            var camera = cameraObject.GetComponent<Camera>();
            camera.orthographic = true;
            camera.orthographicSize = (LudoBoardLayout.BoardWorldSize + 0.34f) / (2f * 0.92f);
            camera.rect = new Rect(0f, 0f, 1f, 1f);
            camera.nearClipPlane = 0.1f;
            camera.farClipPlane = 100f;
            camera.backgroundColor = new Color(0.08f, 0.12f, 0.2f);
            camera.clearFlags = CameraClearFlags.SolidColor;
            var cameraData = cameraObject.GetComponent<UniversalAdditionalCameraData>() ?? cameraObject.AddComponent<UniversalAdditionalCameraData>();
            cameraData.renderPostProcessing = true;
            return camera;
        }
    }
}

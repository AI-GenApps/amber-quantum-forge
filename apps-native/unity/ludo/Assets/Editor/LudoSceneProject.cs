using UnityEditor;
using UnityEditor.Build;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;

namespace W3Dev.Ludo.Editor
{
    public static class LudoSceneProject
    {
        public static void BuildLighting()
        {
            var lightObject = new GameObject("Key Light", typeof(Light));
            lightObject.transform.rotation = Quaternion.Euler(48f, -28f, 0f);
            var light = lightObject.GetComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.35f;
            light.color = new Color(1f, 0.93f, 0.8f);
            light.shadows = LightShadows.Soft;
            light.shadowStrength = 0.25f;
            RenderSettings.ambientLight = new Color(0.28f, 0.3f, 0.34f);
            RenderSettings.fog = false;
            var fill = new GameObject("Fill Light", typeof(Light));
            fill.transform.rotation = Quaternion.Euler(25f, 150f, 0f);
            var fillLight = fill.GetComponent<Light>();
            fillLight.type = LightType.Directional;
            fillLight.intensity = 0.5f;
            fillLight.color = new Color(0.68f, 0.8f, 1f);
        }

        public static void BuildEventSystem()
        {
            var eventSystem = new GameObject("EventSystem", typeof(EventSystem), typeof(InputSystemUIInputModule));
            var module = eventSystem.GetComponent<InputSystemUIInputModule>();
            module.AssignDefaultActions();
            module.deselectOnBackgroundClick = true;
        }

        public static void ConfigureProject(string scenePath)
        {
            PlayerSettings.productName = "Ludo";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, "app.w3dev.ludo.debug");
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.Android.bundleVersionCode = 1;
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.allowedAutorotateToPortrait = true;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
            PlayerSettings.allowedAutorotateToLandscapeLeft = false;
            PlayerSettings.allowedAutorotateToLandscapeRight = false;
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(scenePath, true) };
        }
    }
}

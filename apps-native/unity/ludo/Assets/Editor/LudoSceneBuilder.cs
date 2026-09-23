using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using Unity.Pipeline.Commands;

namespace W3Dev.Ludo.Editor
{
    public static class LudoSceneBuilder
    {
        private const string ScenePath = "Assets/Scenes/LudoBoard.unity";

        [CliCommand("ludo_build_scene", "Create the playable Ludo board scene", MainThreadRequired = true)]
        public static string BuildScene()
        {
            EnsureFolders();
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var materials = LudoBoardSceneBuilder.CreateMaterials();
            LudoBoardSceneBuilder.BuildBoard(materials);
            var hud = LudoGameplayHudBuilder.Build();
            var tokens = LudoTokenSceneBuilder.BuildTokens(materials);
            var controllerObject = new GameObject("LudoAuthority");
            var controller = controllerObject.AddComponent<LudoBoardController>();
            var feedback = controllerObject.AddComponent<LudoFeedback>();
            var audio = controllerObject.AddComponent<AudioSource>();
            feedback.Configure(audio);
            LudoGameplayHudBuilder.Bind(controller, tokens, hud, feedback);
            LudoCameraBuilder.BuildCamera();
            LudoSceneProject.BuildLighting();
            LudoSceneProject.BuildEventSystem();
            LudoFlowSceneBuilder.BuildFlow();
            var flowBridge = controllerObject.AddComponent<LudoFlowGameplayBridge>();
            flowBridge.Configure(controller);
            LudoSceneProject.ConfigureProject(ScenePath);
            EditorSceneManager.SaveScene(EditorSceneManager.GetActiveScene(), ScenePath);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            return ScenePath;
        }

        private static void EnsureFolders()
        {
            foreach (var folder in new[] { "Assets/Prefabs", "Assets/Art", "Assets/Art/Materials", "Assets/Scenes" })
            {
                var parts = folder.Split('/');
                var current = parts[0];
                for (var index = 1; index < parts.Length; index++)
                {
                    var next = current + "/" + parts[index];
                    if (!AssetDatabase.IsValidFolder(next))
                        AssetDatabase.CreateFolder(current, parts[index]);
                    current = next;
                }
            }
        }
    }
}

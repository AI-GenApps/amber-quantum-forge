using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace W3Dev.Ludo.Editor
{
    public static class LudoBuild
    {
        private const string ScenePath = "Assets/Scenes/LudoBoard.unity";
        private const string OutputPath = "build/android/ludo.apk";

        [MenuItem("Ludo/Build Android")]
        public static void BuildAndroid()
        {
            Directory.CreateDirectory("build/android");
            EditorUserBuildSettings.buildAppBundle = false;
            EditorUserBuildSettings.development = false;
            var options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = OutputPath,
                target = BuildTarget.Android,
                options = BuildOptions.None
            };
            var report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result != BuildResult.Succeeded)
                throw new BuildFailedException("Ludo Android build failed with " + report.summary.totalErrors + " errors.");
            Debug.Log("Ludo Android APK: " + report.summary.outputPath + " (" + report.summary.totalSize + " bytes)");
        }
    }
}

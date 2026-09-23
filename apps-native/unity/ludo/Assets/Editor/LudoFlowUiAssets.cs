using UnityEditor;
using UnityEngine;

namespace W3Dev.Ludo.Editor
{
    public static class LudoFlowUiAssets
    {
        private const string FolderPath = "Assets/Art/UI";
        private const string SpritePath = FolderPath + "/LudoRoundedPanel.asset";
        private const string CirclePath = FolderPath + "/LudoCircle.asset";
        private const string FontPath = "Assets/Art/Fonts/Nunito[wght].ttf";

        public static Font FlowFont()
        {
            var font = AssetDatabase.LoadAssetAtPath<Font>(FontPath);
            return font != null ? font : Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        }

        public static Sprite RoundedPanelSprite()
        {
            EnsureFolder();
            var existing = FindSprite(SpritePath);
            if (existing != null)
                return existing;

            var texture = new Texture2D(64, 64, TextureFormat.RGBA32, false) { name = "LudoRoundedPanel" };
            var pixels = new Color32[64 * 64];
            for (var y = 0; y < 64; y++)
            {
                for (var x = 0; x < 64; x++)
                {
                    var inside = IsInsideRoundedRect(x, y, 15f);
                    pixels[y * 64 + x] = inside ? new Color32(255, 255, 255, 255) : new Color32(255, 255, 255, 0);
                }
            }
            texture.SetPixels32(pixels);
            texture.Apply(false, true);
            AssetDatabase.CreateAsset(texture, SpritePath);
            var sprite = Sprite.Create(texture, new Rect(0f, 0f, 64f, 64f), new Vector2(0.5f, 0.5f), 100f, 0u, SpriteMeshType.FullRect, new Vector4(16f, 16f, 16f, 16f));
            sprite.name = "LudoRoundedPanel";
            AssetDatabase.AddObjectToAsset(sprite, texture);
            AssetDatabase.SaveAssets();
            return sprite;
        }

        public static Sprite CircleSprite()
        {
            EnsureFolder();
            var existing = FindSprite(CirclePath);
            if (existing != null)
                return existing;

            var texture = new Texture2D(64, 64, TextureFormat.RGBA32, false) { name = "LudoCircle" };
            var pixels = new Color32[64 * 64];
            for (var y = 0; y < 64; y++)
            {
                for (var x = 0; x < 64; x++)
                {
                    var dx = x - 31.5f;
                    var dy = y - 31.5f;
                    var inside = dx * dx + dy * dy <= 31.5f * 31.5f;
                    pixels[y * 64 + x] = inside ? new Color32(255, 255, 255, 255) : new Color32(255, 255, 255, 0);
                }
            }
            texture.SetPixels32(pixels);
            texture.Apply(false, true);
            AssetDatabase.CreateAsset(texture, CirclePath);
            var sprite = Sprite.Create(texture, new Rect(0f, 0f, 64f, 64f), new Vector2(0.5f, 0.5f), 100f);
            sprite.name = "LudoCircle";
            AssetDatabase.AddObjectToAsset(sprite, texture);
            AssetDatabase.SaveAssets();
            return sprite;
        }

        private static bool IsInsideRoundedRect(int x, int y, float radius)
        {
            var left = radius;
            var right = 63f - radius;
            var bottom = radius;
            var top = 63f - radius;
            if ((x >= left && x <= right) || (y >= bottom && y <= top))
                return true;
            var cornerX = x < left ? left : right;
            var cornerY = y < bottom ? bottom : top;
            var dx = x - cornerX;
            var dy = y - cornerY;
            return dx * dx + dy * dy <= radius * radius;
        }

        private static Sprite FindSprite(string path)
        {
            foreach (var asset in AssetDatabase.LoadAllAssetsAtPath(path))
            {
                if (asset is Sprite sprite)
                    return sprite;
            }
            return null;
        }

        private static void EnsureFolder()
        {
            if (!AssetDatabase.IsValidFolder("Assets/Art"))
                AssetDatabase.CreateFolder("Assets", "Art");
            if (!AssetDatabase.IsValidFolder(FolderPath))
                AssetDatabase.CreateFolder("Assets/Art", "UI");
        }
    }
}

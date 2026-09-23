using UnityEditor;
using UnityEngine;

namespace W3Dev.Ludo.Editor
{
    public sealed class LudoSceneMaterials
    {
        public Material board;
        public Material ivory;
        public Material ruby;
        public Material jade;
        public Material sun;
        public Material azure;
        public Material gold;
        public Material token;
        public Material dark;
    }

    public static class LudoBoardSceneBuilder
    {
        private const string MaterialsPath = "Assets/Art/Materials/";
        private const float TileGap = 0.035f;

        public static LudoSceneMaterials CreateMaterials()
        {
            return new LudoSceneMaterials
            {
                board = CreateMaterial("Board", new Color(0.12f, 0.17f, 0.26f), 0.05f),
                ivory = CreateMaterial("Ivory", new Color(0.94f, 0.92f, 0.84f), 0.02f),
                ruby = CreateMaterial("Ruby", LudoBoardLayout.PlayerColor(0), 0.18f),
                jade = CreateMaterial("Jade", LudoBoardLayout.PlayerColor(1), 0.18f),
                sun = CreateMaterial("Sun", LudoBoardLayout.PlayerColor(2), 0.18f),
                azure = CreateMaterial("Azure", LudoBoardLayout.PlayerColor(3), 0.18f),
                gold = CreateMaterial("SafeMarker", new Color(0.98f, 0.72f, 0.16f), 0.26f),
                token = CreateMaterial("Token", new Color(0.98f, 0.98f, 0.96f), 0.42f),
                dark = CreateMaterial("TokenDark", new Color(0.06f, 0.08f, 0.14f), 0.2f)
            };
        }

        public static void BuildBoard(LudoSceneMaterials materials)
        {
            var root = new GameObject("Board");
            CreateTile(root.transform, "BoardBase", Vector3.zero, materials.board, LudoBoardLayout.BoardWorldSize + 0.34f, 0.24f);
            for (var x = -7; x <= 7; x++)
            {
                for (var z = -7; z <= 7; z++)
                {
                    var cell = new Vector2Int(x, z);
                    if (!LudoBoardLayout.IsCrossCell(cell) || Mathf.Abs(x) <= 1 && Mathf.Abs(z) <= 1)
                        continue;
                    var material = materials.ivory;
                    if (LudoBoardLayout.IsHomeCell(cell, out var homePlayer, out _))
                        material = PlayerMaterial(homePlayer, materials);
                    var trackIndex = FindTrackIndex(cell);
                    if (trackIndex == LudoRules.StartIndices[0] || trackIndex == LudoRules.StartIndices[1] || trackIndex == LudoRules.StartIndices[2] || trackIndex == LudoRules.StartIndices[3])
                        material = PlayerMaterial(PlayerForStart(trackIndex), materials);
                    CreateCell(root.transform, cell, material);
                    if (trackIndex >= 0 && LudoRules.IsSafe(trackIndex))
                        CreateSafeMarker(root.transform, cell, materials.gold);
                }
            }
            BuildYards(root.transform, materials);
            BuildFinish(root.transform, materials);
        }

        private static void BuildYards(Transform parent, LudoSceneMaterials materials)
        {
            for (var player = 0; player < 4; player++)
            {
                var center = LudoBoardLayout.YardCenter(player);
                CreateTile(parent, "Yard " + player, center + Vector3.up * 0.02f, PlayerMaterial(player, materials), 3f, 0.2f);
                CreateTile(parent, "Yard inset " + player, center + Vector3.up * 0.17f, materials.ivory, 2.12f, 0.13f);
                for (var token = 0; token < LudoRules.TokensPerPlayer; token++)
                {
                    var slot = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    slot.name = "Yard slot " + player + " " + token;
                    slot.transform.SetParent(parent, false);
                    slot.transform.position = LudoBoardLayout.YardPosition(player, token) + Vector3.up * 0.26f;
                    slot.transform.localScale = new Vector3(0.22f, 0.025f, 0.22f);
                    slot.GetComponent<Renderer>().sharedMaterial = PlayerMaterial(player, materials);
                }
            }
        }

        private static void BuildFinish(Transform parent, LudoSceneMaterials materials)
        {
            var half = LudoBoardLayout.CellSize * 1.5f;
            CreateTriangle(parent, "Finish Ruby", new Vector3(0f, LudoBoardLayout.BoardY + 0.13f, 0f), new Vector3(-half, LudoBoardLayout.BoardY + 0.13f, -half), new Vector3(-half, LudoBoardLayout.BoardY + 0.13f, half), materials.ruby);
            CreateTriangle(parent, "Finish Jade", new Vector3(0f, LudoBoardLayout.BoardY + 0.14f, 0f), new Vector3(-half, LudoBoardLayout.BoardY + 0.14f, half), new Vector3(half, LudoBoardLayout.BoardY + 0.14f, half), materials.jade);
            CreateTriangle(parent, "Finish Sun", new Vector3(0f, LudoBoardLayout.BoardY + 0.15f, 0f), new Vector3(half, LudoBoardLayout.BoardY + 0.15f, half), new Vector3(half, LudoBoardLayout.BoardY + 0.15f, -half), materials.sun);
            CreateTriangle(parent, "Finish Azure", new Vector3(0f, LudoBoardLayout.BoardY + 0.16f, 0f), new Vector3(half, LudoBoardLayout.BoardY + 0.16f, -half), new Vector3(-half, LudoBoardLayout.BoardY + 0.16f, -half), materials.azure);
        }

        private static GameObject CreateCell(Transform parent, Vector2Int cell, Material material)
        {
            return CreateTile(parent, "Cell " + cell.x + " " + cell.y, new Vector3(cell.x * LudoBoardLayout.CellSize, LudoBoardLayout.BoardY, cell.y * LudoBoardLayout.CellSize), material, LudoBoardLayout.CellSize - TileGap, 0.12f);
        }

        private static void CreateSafeMarker(Transform parent, Vector2Int cell, Material material)
        {
            var marker = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            marker.name = "Safe marker " + cell.x + " " + cell.y;
            marker.transform.SetParent(parent, false);
            marker.transform.position = new Vector3(cell.x * LudoBoardLayout.CellSize, LudoBoardLayout.BoardY + 0.09f, cell.y * LudoBoardLayout.CellSize);
            marker.transform.localScale = new Vector3(0.16f, 0.025f, 0.16f);
            marker.GetComponent<Renderer>().sharedMaterial = material;
        }

        private static GameObject CreateTile(Transform parent, string name, Vector3 position, Material material, float size, float height)
        {
            var tile = GameObject.CreatePrimitive(PrimitiveType.Cube);
            tile.name = name;
            tile.transform.SetParent(parent, false);
            tile.transform.position = position;
            tile.transform.localScale = new Vector3(size, height, size);
            tile.GetComponent<Renderer>().sharedMaterial = material;
            return tile;
        }

        private static void CreateTriangle(Transform parent, string name, Vector3 center, Vector3 first, Vector3 second, Material material)
        {
            var mesh = new Mesh { name = name + " Mesh" };
            mesh.vertices = new[] { center, first, second };
            mesh.triangles = new[] { 0, 1, 2 };
            mesh.RecalculateNormals();
            var path = "Assets/Art/" + name.Replace(" ", "") + ".asset";
            AssetDatabase.DeleteAsset(path);
            AssetDatabase.CreateAsset(mesh, path);
            mesh = AssetDatabase.LoadAssetAtPath<Mesh>(path);
            var triangle = new GameObject(name, typeof(MeshFilter), typeof(MeshRenderer));
            triangle.transform.SetParent(parent, false);
            triangle.GetComponent<MeshFilter>().sharedMesh = mesh;
            triangle.GetComponent<MeshRenderer>().sharedMaterial = material;
        }

        private static int FindTrackIndex(Vector2Int cell)
        {
            for (var index = 0; index < LudoRules.TrackLength; index++)
            {
                if (LudoBoardLayout.TryGetTrackCell(index, out var trackCell) && trackCell == cell)
                    return index;
            }
            return -1;
        }

        private static int PlayerForStart(int index)
        {
            for (var player = 0; player < LudoRules.StartIndices.Length; player++)
            {
                if (LudoRules.StartIndices[player] == index)
                    return player;
            }
            return 0;
        }

        private static Material PlayerMaterial(int player, LudoSceneMaterials materials)
        {
            return player switch
            {
                0 => materials.ruby,
                1 => materials.jade,
                2 => materials.sun,
                _ => materials.azure
            };
        }

        private static Material CreateMaterial(string name, Color color, float metallic)
        {
            var path = MaterialsPath + name + ".mat";
            AssetDatabase.DeleteAsset(path);
            var material = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard")) { name = name };
            material.SetColor("_BaseColor", color);
            material.SetColor("_Color", color);
            material.SetFloat("_Metallic", metallic);
            material.SetFloat("_Smoothness", 0.58f);
            AssetDatabase.CreateAsset(material, path);
            return material;
        }
    }
}

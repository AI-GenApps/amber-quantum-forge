using UnityEditor;
using UnityEngine;

namespace W3Dev.Ludo.Editor
{
    public static class LudoTokenSceneBuilder
    {
        private const string TokenPrefabPath = "Assets/Prefabs/LudoToken.prefab";
        private const string PawnMeshPath = "Assets/Art/TokenPawn.asset";

        public static LudoTokenView[] BuildTokens(LudoSceneMaterials materials)
        {
            var prefabObject = new GameObject("LudoToken", typeof(MeshFilter), typeof(MeshRenderer), typeof(CapsuleCollider), typeof(LudoTokenView));
            var mesh = CreatePawnMesh();
            AssetDatabase.DeleteAsset(PawnMeshPath);
            AssetDatabase.CreateAsset(mesh, PawnMeshPath);
            mesh = AssetDatabase.LoadAssetAtPath<Mesh>(PawnMeshPath);
            prefabObject.GetComponent<MeshFilter>().sharedMesh = mesh;
            var collider = prefabObject.GetComponent<CapsuleCollider>();
            collider.radius = 0.2f;
            collider.height = 0.87f;
            collider.center = new Vector3(0f, 0.435f, 0f);
            prefabObject.GetComponent<MeshRenderer>().sharedMaterial = materials.token;
            AddBaseRing(prefabObject.transform, materials.dark);
            var prefab = PrefabUtility.SaveAsPrefabAsset(prefabObject, TokenPrefabPath);
            Object.DestroyImmediate(prefabObject);

            var views = new LudoTokenView[LudoRules.TokensPerPlayer * 4];
            for (var player = 0; player < 4; player++)
            {
                for (var token = 0; token < LudoRules.TokensPerPlayer; token++)
                {
                    var instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
                    instance.name = "Token " + LudoBoardLayout.PlayerName(player) + " " + (token + 1);
                    instance.transform.position = LudoBoardLayout.YardPosition(player, token);
                    foreach (var renderer in instance.GetComponentsInChildren<Renderer>())
                    {
                        if (renderer.gameObject.name != "Pawn base")
                            renderer.sharedMaterial = PlayerMaterial(player, materials);
                    }
                    views[player * LudoRules.TokensPerPlayer + token] = instance.GetComponent<LudoTokenView>();
                }
            }
            return views;
        }

        private static void AddBaseRing(Transform parent, Material material)
        {
            var ring = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            ring.name = "Pawn base";
            ring.transform.SetParent(parent, false);
            ring.transform.localPosition = new Vector3(0f, 0.035f, 0f);
            ring.transform.localScale = new Vector3(0.25f, 0.035f, 0.25f);
            ring.GetComponent<Renderer>().sharedMaterial = material;
            Object.DestroyImmediate(ring.GetComponent<Collider>());
        }

        private static Mesh CreatePawnMesh()
        {
            var profile = new[]
            {
                new Vector2(0.08f, 0f), new Vector2(0.17f, 0.03f), new Vector2(0.2f, 0.1f),
                new Vector2(0.16f, 0.16f), new Vector2(0.11f, 0.22f), new Vector2(0.1f, 0.4f),
                new Vector2(0.13f, 0.48f), new Vector2(0.18f, 0.55f), new Vector2(0.18f, 0.68f),
                new Vector2(0.14f, 0.77f), new Vector2(0.08f, 0.84f), new Vector2(0f, 0.87f)
            };
            const int segments = 20;
            var vertices = new Vector3[profile.Length * segments];
            for (var ring = 0; ring < profile.Length; ring++)
            {
                for (var segment = 0; segment < segments; segment++)
                {
                    var angle = segment * Mathf.PI * 2f / segments;
                    vertices[ring * segments + segment] = new Vector3(
                        Mathf.Cos(angle) * profile[ring].x,
                        profile[ring].y,
                        Mathf.Sin(angle) * profile[ring].x);
                }
            }
            var triangles = new int[(profile.Length - 1) * segments * 6];
            var cursor = 0;
            for (var ring = 0; ring < profile.Length - 1; ring++)
            {
                for (var segment = 0; segment < segments; segment++)
                {
                    var next = (segment + 1) % segments;
                    var lower = ring * segments + segment;
                    var lowerNext = ring * segments + next;
                    var upper = (ring + 1) * segments + segment;
                    var upperNext = (ring + 1) * segments + next;
                    triangles[cursor++] = lower;
                    triangles[cursor++] = upper;
                    triangles[cursor++] = upperNext;
                    triangles[cursor++] = lower;
                    triangles[cursor++] = upperNext;
                    triangles[cursor++] = lowerNext;
                }
            }
            var mesh = new Mesh { name = "Sculpted Pawn" };
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
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
    }
}

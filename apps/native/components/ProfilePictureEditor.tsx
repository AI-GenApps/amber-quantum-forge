import { useAuth } from "@plugin/expo-auth";
import { Image } from "expo-image";
import type React from "react";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { deleteProfilePicture, pickImage, uploadProfilePicture } from "../services/profilePicture";

interface ProfilePictureEditorProps {
  profilePictureUrl?: string | null;
  onUpdate: (url: string | null) => void;
}

export const ProfilePictureEditor: React.FC<ProfilePictureEditorProps> = ({
  profilePictureUrl,
  onUpdate,
}) => {
  const { getAccessToken } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handlePickAndUpload = async () => {
    try {
      const imageUri = await pickImage();
      if (!imageUri) return;

      setUploading(true);
      const idToken = await getAccessToken();
      if (!idToken) {
        throw new Error("Not authenticated");
      }

      const url = await uploadProfilePicture(imageUri, idToken);
      onUpdate(url);
    } catch (error: unknown) {
      Alert.alert(
        "Upload Error",
        error instanceof Error ? error.message : "Failed to upload profile picture",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      Alert.alert(
        "Delete Profile Picture",
        "Are you sure you want to delete your profile picture?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                setUploading(true);
                const idToken = await getAccessToken();
                if (!idToken) {
                  throw new Error("Not authenticated");
                }

                await deleteProfilePicture(idToken);
                onUpdate(null);
              } catch (error: unknown) {
                Alert.alert(
                  "Delete Error",
                  error instanceof Error ? error.message : "Failed to delete profile picture",
                );
              } finally {
                setUploading(false);
              }
            },
          },
        ],
      );
    } catch (error: unknown) {
      Alert.alert("Error", error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <View style={{ alignItems: "center", marginVertical: 20 }}>
      <View style={{ position: "relative", marginBottom: 20 }}>
        {profilePictureUrl ? (
          <Image
            source={{ uri: profilePictureUrl }}
            style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: "#f0f0f0" }}
          />
        ) : (
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#e0e0e0",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#999", fontSize: 14 }}>No Photo</Text>
          </View>
        )}
        {uploading && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderRadius: 60,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>
      <View style={{ width: "100%", maxWidth: 200 }}>
        <Pressable
          style={{
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            marginVertical: 6,
            alignItems: "center",
            backgroundColor: "#2f80ed",
          }}
          onPress={handlePickAndUpload}
          disabled={uploading}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {profilePictureUrl ? "Change Photo" : "Upload Photo"}
          </Text>
        </Pressable>
        {profilePictureUrl && (
          <Pressable
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              marginVertical: 6,
              alignItems: "center",
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: "#ff4444",
            }}
            onPress={handleDelete}
            disabled={uploading}
          >
            <Text style={{ color: "#ff4444", fontSize: 16, fontWeight: "600" }}>Delete Photo</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

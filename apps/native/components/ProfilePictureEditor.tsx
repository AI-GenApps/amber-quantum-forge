import type React from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { deleteProfilePicture, pickImage, uploadProfilePicture } from "../services/profilePicture";

interface ProfilePictureEditorProps {
  profilePictureUrl?: string | null;
  onUpdate: (url: string | null) => void;
}

export const ProfilePictureEditor: React.FC<ProfilePictureEditorProps> = ({
  profilePictureUrl,
  onUpdate,
}) => {
  const { getIdToken } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handlePickAndUpload = async () => {
    try {
      const imageUri = await pickImage();
      if (!imageUri) return;

      setUploading(true);
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error("Not authenticated");
      }

      const url = await uploadProfilePicture(imageUri, idToken);
      onUpdate(url);
    } catch (error: any) {
      Alert.alert("Upload Error", error.message || "Failed to upload profile picture");
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
                const idToken = await getIdToken();
                if (!idToken) {
                  throw new Error("Not authenticated");
                }

                await deleteProfilePicture(idToken);
                onUpdate(null);
              } catch (error: any) {
                Alert.alert("Delete Error", error.message || "Failed to delete profile picture");
              } finally {
                setUploading(false);
              }
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {profilePictureUrl ? (
          <Image source={{ uri: profilePictureUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Photo</Text>
          </View>
        )}
        {uploading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.uploadButton]}
          onPress={handlePickAndUpload}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>
            {profilePictureUrl ? "Change Photo" : "Upload Photo"}
          </Text>
        </TouchableOpacity>
        {profilePictureUrl && (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
            disabled={uploading}
          >
            <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 20,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#999",
    fontSize: 14,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 200,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: "center",
  },
  uploadButton: {
    backgroundColor: "#2f80ed",
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ff4444",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#ff4444",
  },
});

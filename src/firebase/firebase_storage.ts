// import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

// Initialize Firebase Storage
// const storage = getStorage();

// Create a reference to the "profile pictures" folder
// const profilePicturesRef = ref(storage, "profilePictures");
// const menuItemsRef = ref(storage, "menuItems");

// export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
//   // Create a reference to the file to upload
//   const fileRef = ref(profilePicturesRef, userId);

//   // Upload the file
//   await uploadBytes(fileRef, file);

//   // Get the download URL of the uploaded file
//   const downloadURL = await getDownloadURL(fileRef);

//   return downloadURL;
// };

// export const uploadMenuItemImage = async (
// 	foodId: string,
// 	foodPhoto: File,
// ): Promise<string> => {
// 	// Create a reference to the file to upload
// 	const fileRef = ref(menuItemsRef, foodId);

// 	// Upload the file
// 	await uploadBytes(fileRef, foodPhoto);

// 	// Get the download URL of the uploaded file
// 	const downloadURL = await getDownloadURL(fileRef);

// 	return downloadURL;
// };

export const uploadProfilePicture = async (
  userId: string,
  file: File,
): Promise<string> => {
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/dxvbprkmo/image/upload`
  const uploadPreset = 'CakeCafeMenu'

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('public_id', `profilePictures/${userId}`) // Store inside 'profilePictures' folder

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    if (data.secure_url) {
      return data.secure_url
    } else {
      throw new Error('Upload failed')
    }
  } catch (error) {
    throw error
  }
}

export const uploadMenuItemImage = async (foodId: string, foodPhoto: File) => {
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/dxvbprkmo/image/upload`
  const uploadPreset = 'CakeCafeMenu'

  const formData = new FormData()
  formData.append('file', foodPhoto)
  formData.append('upload_preset', uploadPreset)
  formData.append('public_id', foodId)

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    if (data.secure_url) {
      return data.secure_url // URL of the uploaded image
    } else {
      throw new Error('Upload failed')
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    throw error
  }
}

// export const deleteMenuItemImage = async (foodId: string): Promise<void> => {
//   // Create a reference to the file to delete
//   const fileRef = ref(menuItemsRef, foodId);

//   // Check if the file exists
//   const { items } = await listAll(menuItemsRef);
//   const fileExists = items.some((item) => item.name === foodId);

//   // If the file exists, delete it
//   if (fileExists) {
//     await deleteObject(fileRef);
//   }
// };

export const deleteMenuItemImage = async (foodId: string) => {
  const response = await fetch(
    `https://long-rhino-53.deno.dev/delete?public_id=${foodId}`,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    throw new Error('Failed to delete image')
  }
}
